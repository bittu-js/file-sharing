const fs = require('fs');
const path = require('path');
const http = require('http');

async function seed() {
  const userPayload = {
    name: 'Alex Harrison',
    email: 'alex@college.edu',
    password: 'password123'
  };

  // Helper for json post
  const post = (urlPath, body, token = null) => {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: 5000,
          path: urlPath,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        },
        (res) => {
          let str = '';
          res.on('data', (c) => (str += c));
          res.on('end', () => resolve(JSON.parse(str)));
        }
      );
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  };

  // Upload helper
  const upload = (filePath, token) => {
    return new Promise((resolve, reject) => {
      const fileName = path.basename(filePath);
      const fileData = fs.readFileSync(filePath);
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

      const mimeType = fileName.endsWith('.pdf')
        ? 'application/pdf'
        : fileName.endsWith('.png')
        ? 'image/png'
        : 'text/plain';

      const header = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`
      );
      const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
      const body = Buffer.concat([header, fileData, footer]);

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: 5000,
          path: '/api/files/upload',
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': body.length,
            Authorization: `Bearer ${token}`
          }
        },
        (res) => {
          let str = '';
          res.on('data', (c) => (str += c));
          res.on('end', () => resolve(JSON.parse(str)));
        }
      );
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  };

  console.log('Seeding initial college demo user...');
  let loginRes = await post('/api/auth/login', {
    email: userPayload.email,
    password: userPayload.password
  });

  let token = loginRes?.token;
  if (!token) {
    const regRes = await post('/api/auth/register', userPayload);
    token = regRes?.token;
  }

  console.log('Token acquired. Uploading sample files...');
  const f1 = await upload('./sample_files/Project_Requirements.txt', token);
  const f2 = await upload('./sample_files/Sample_College_Report.pdf', token);
  const f3 = await upload('./sample_files/Campus_Photo.png', token);

  console.log('Files uploaded:', f1.files?.[0]?.originalName, f2.files?.[0]?.originalName, f3.files?.[0]?.originalName);

  if (f2.files?.[0]) {
    console.log('Creating a password-protected share link for the PDF report...');
    const share = await post(
      '/api/shares',
      {
        fileId: f2.files[0]._id,
        password: 'securePassword2026',
        expiresInHours: 72
      },
      token
    );
    console.log('Generated share link:', `http://localhost:5173/share/${share.share?.shareToken}`);
  }

  console.log('Seed completed successfully!');
}

seed().catch(console.error);
