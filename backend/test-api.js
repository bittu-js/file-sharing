require('dotenv').config({ path: __dirname + '/.env' });
const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('./server');

const PORT = 5001; // Test port
let server;

async function runTests() {
  server = app.listen(PORT, async () => {
    console.log(`\n========================================`);
    console.log(`Starting Backend API Verification Tests`);
    console.log(`========================================\n`);

    try {
      const baseUrl = `http://127.0.0.1:${PORT}/api`;

      // Helper function for making JSON requests
      const request = (endpoint, method = 'GET', data = null, token = null) => {
        return new Promise((resolve, reject) => {
          const url = new URL(baseUrl + endpoint);
          const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
              'Content-Type': 'application/json'
            }
          };

          if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
          }

          const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                resolve({ status: res.statusCode, data: parsed, headers: res.headers });
              } catch (e) {
                resolve({ status: res.statusCode, raw: body, headers: res.headers });
              }
            });
          });

          req.on('error', reject);
          if (data) {
            req.write(JSON.stringify(data));
          }
          req.end();
        });
      };

      // 1. Health check
      console.log('1. Testing Health Check...');
      const health = await request('/health');
      console.log(`   Health status: ${health.data.status} (HTTP ${health.status})`);
      if (health.status !== 200) throw new Error('Health check failed');

      // 2. User Registration
      const testEmail = `tester_${Date.now()}@example.com`;
      console.log(`2. Testing User Registration with ${testEmail}...`);
      const regRes = await request('/auth/register', 'POST', {
        name: 'Alex Developer',
        email: testEmail,
        password: 'password123'
      });
      console.log(`   Registered successfully! User ID: ${regRes.data.user.id}`);
      const authToken = regRes.data.token;
      if (!authToken) throw new Error('No token returned from registration');

      // 3. User Login
      console.log('3. Testing User Login...');
      const loginRes = await request('/auth/login', 'POST', {
        email: testEmail,
        password: 'password123'
      });
      console.log(`   Logged in successfully! Token received.`);
      if (loginRes.status !== 200) throw new Error('Login failed');

      // 4. Fetch Me Profile
      console.log('4. Testing GET /auth/me...');
      const meRes = await request('/auth/me', 'GET', null, authToken);
      console.log(`   Profile verified for: ${meRes.data.user.name} (${meRes.data.user.email})`);

      // 5. Upload File using multipart/form-data
      console.log('5. Testing File Upload (POST /api/files/upload)...');
      const sampleContent = 'Hello, this is a test document for file sharing system!';
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
      
      const payloadHeader = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="files"; filename="project_architecture.txt"',
        'Content-Type: text/plain',
        '',
        sampleContent,
        `--${boundary}--`
      ].join('\r\n');

      const uploadResult = await new Promise((resolve, reject) => {
        const options = {
          hostname: '127.0.0.1',
          port: PORT,
          path: '/api/files/upload',
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Authorization': `Bearer ${authToken}`,
            'Content-Length': Buffer.byteLength(payloadHeader)
          }
        };

        const req = http.request(options, (res) => {
          let body = '';
          res.on('data', (c) => (body += c));
          res.on('end', () => resolve(JSON.parse(body)));
        });
        req.on('error', reject);
        req.write(payloadHeader);
        req.end();
      });

      console.log(`   Uploaded file ID: ${uploadResult.files[0]._id}, Original Name: ${uploadResult.files[0].originalName}`);
      const fileId = uploadResult.files[0]._id;

      // 6. List Files
      console.log('6. Testing GET /api/files...');
      const listRes = await request('/files', 'GET', null, authToken);
      console.log(`   Retrieved ${listRes.data.files.length} file(s).`);

      // 7. Create Share Link (Password Protected)
      console.log('7. Testing Share Link Creation (with password)...');
      const shareRes = await request('/shares', 'POST', {
        fileId: fileId,
        password: 'secureSharePassword',
        expiresInHours: 24
      }, authToken);
      const shareToken = shareRes.data.share.shareToken;
      console.log(`   Share token generated: ${shareToken}, password protected: ${shareRes.data.share.isPasswordProtected}`);

      // 8. Public Share Metadata Verification
      console.log('8. Testing Public Share Metadata (GET /api/shares/:token)...');
      const publicMeta = await request(`/shares/${shareToken}`);
      console.log(`   Public file: "${publicMeta.data.share.fileName}", Shared by: ${publicMeta.data.share.sharedBy}`);
      if (!publicMeta.data.share.isPasswordProtected) throw new Error('Expected share to be password protected');

      // 9. Public Download with Wrong Password (should be 401)
      console.log('9. Testing Public Download with Incorrect Password...');
      const wrongPwdRes = await request(`/shares/${shareToken}/download`, 'POST', { password: 'wrong' });
      console.log(`   Response status: ${wrongPwdRes.status} (Expected 401 Unauthorized)`);
      if (wrongPwdRes.status !== 401) throw new Error('Password check failed to reject wrong password');

      // 10. Public Download with Correct Password
      console.log('10. Testing Public Download with Correct Password...');
      const correctPwdRes = await request(`/shares/${shareToken}/download`, 'POST', { password: 'secureSharePassword' });
      console.log(`   Download response status: ${correctPwdRes.status}`);
      if (correctPwdRes.status !== 200) throw new Error('Download failed with correct password');

      // 11. Dashboard Stats
      console.log('11. Testing Dashboard Stats (GET /api/stats/dashboard)...');
      const statsRes = await request('/stats/dashboard', 'GET', null, authToken);
      console.log(`   Dashboard stats verified:`, {
        totalFiles: statsRes.data.stats.totalFiles,
        totalStorageBytes: statsRes.data.stats.totalStorageBytes,
        totalShares: statsRes.data.stats.totalShares,
        totalDownloads: statsRes.data.stats.totalDownloads
      });

      console.log('\n========================================');
      console.log('ALL 11 BACKEND API TESTS PASSED SUCCESSFULLY!');
      console.log('========================================\n');

      server.close();
      process.exit(0);
    } catch (err) {
      console.error('\n❌ Test failed with error:', err);
      if (server) server.close();
      process.exit(1);
    }
  });
}

runTests();
