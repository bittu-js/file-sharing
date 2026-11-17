const http = require('http');

async function testUploaderTracking() {
  console.log('\n======================================================');
  console.log('Testing File Request Uploader Tracking');
  console.log('======================================================\n');

  const request = (endpoint, method = 'GET', data = null, token = null, isMultipart = false, boundary = null) => {
    return new Promise((resolve, reject) => {
      const url = new URL(`http://127.0.0.1:5000/api${endpoint}`);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {}
      };

      if (isMultipart) {
        options.headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
      } else {
        options.headers['Content-Type'] = 'application/json';
      }

      if (data) {
        options.headers['Content-Length'] = Buffer.byteLength(data);
      }

      if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
      }

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      });

      req.on('error', reject);
      if (data) {
        req.write(data);
      }
      req.end();
    });
  };

  try {
    // 1. Login user
    const loginRes = await request('/auth/login', 'POST', JSON.stringify({
      email: 'alex@college.edu',
      password: 'password123'
    }));
    console.log('loginRes:', loginRes.data);
    const token = loginRes.data.token;
    console.log('✓ 1. Authenticated as alex@college.edu');

    // 2. Create File Request
    const reqRes = await request('/file-requests', 'POST', JSON.stringify({
      title: 'Lab Experiments Submissions',
      description: 'Upload your lab logs and raw data'
    }), token);
    console.log('reqRes status:', reqRes.status, 'data:', reqRes.data);
    const fileRequest = reqRes.data.fileRequest;
    console.log(`✓ 2. Created File Request: "${fileRequest.title}" (${fileRequest.requestToken})`);

    // Helper to build multipart body
    const buildMultipart = (fields, files) => {
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
      let payload = '';

      for (const [k, v] of Object.entries(fields)) {
        payload += `--${boundary}\r\n`;
        payload += `Content-Disposition: form-data; name="${k}"\r\n\r\n`;
        payload += `${v}\r\n`;
      }

      for (const f of files) {
        payload += `--${boundary}\r\n`;
        payload += `Content-Disposition: form-data; name="files"; filename="${f.filename}"\r\n`;
        payload += `Content-Type: ${f.mime || 'application/octet-stream'}\r\n\r\n`;
        payload += `${f.content}\r\n`;
      }

      payload += `--${boundary}--\r\n`;
      return { payload, boundary };
    };

    // 3. Test: Reject upload without uploader details
    const missingDetails = buildMultipart({}, [{ filename: 'test.txt', content: 'test content' }]);
    const reject1 = await request(`/file-requests/public/${fileRequest.requestToken}/upload`, 'POST', missingDetails.payload, null, true, missingDetails.boundary);
    if (reject1.status === 400) {
      console.log(`✓ 3. Validation PASS: Missing uploader details rejected (400): "${reject1.data.message}"`);
    } else {
      throw new Error(`Expected 400, got ${reject1.status}`);
    }

    // 4. Test: Reject upload with invalid email
    const invalidEmail = buildMultipart({
      uploaderName: 'Dr. Evelyn Reed',
      uploaderEmail: 'notanemail'
    }, [{ filename: 'test.txt', content: 'test content' }]);
    const reject2 = await request(`/file-requests/public/${fileRequest.requestToken}/upload`, 'POST', invalidEmail.payload, null, true, invalidEmail.boundary);
    if (reject2.status === 400) {
      console.log(`✓ 4. Validation PASS: Invalid email rejected (400): "${reject2.data.message}"`);
    } else {
      throw new Error(`Expected 400, got ${reject2.status}`);
    }

    // 5. Test: Successful upload with valid name & email
    const validUpload = buildMultipart({
      uploaderName: 'Dr. Evelyn Reed',
      uploaderEmail: 'evelyn.reed@lab.org'
    }, [
      { filename: 'Experiment_Report_A.pdf', mime: 'application/pdf', content: 'PDF content for Experiment A' },
      { filename: 'Dataset_Raw.csv', mime: 'text/csv', content: 'col1,col2,col3\n1,2,3' }
    ]);
    const successUpload = await request(`/file-requests/public/${fileRequest.requestToken}/upload`, 'POST', validUpload.payload, null, true, validUpload.boundary);
    if (successUpload.status === 201) {
      console.log(`✓ 5. Upload PASS: 2 files uploaded successfully. Uploader: ${successUpload.data.uploader.name} (${successUpload.data.uploader.email})`);
    } else {
      throw new Error(`Upload failed: ${JSON.stringify(successUpload)}`);
    }

    // 6. Test: Retrieve submissions as request creator
    const subsRes = await request(`/file-requests/${fileRequest._id}/submissions`, 'GET', null, token);
    if (subsRes.status === 200 && subsRes.data.count === 2) {
      console.log(`✓ 6. Submissions Retrieval PASS: Found ${subsRes.data.count} submissions.`);
      subsRes.data.submissions.forEach((sub, idx) => {
        console.log(`   - Submission ${idx + 1}: File="${sub.originalName}" (${sub.fileSize} B), Uploader="${sub.uploaderName}" <${sub.uploaderEmail}> at ${sub.uploadedAt}`);
      });
    } else {
      throw new Error(`Submissions check failed: ${JSON.stringify(subsRes)}`);
    }

    // 7. Test: Verify File document has uploaderName & uploaderEmail
    const firstSubFile = subsRes.data.submissions[0].file;
    const fileId = firstSubFile._id || firstSubFile;
    const fileRes = await request(`/files/${fileId}`, 'GET', null, token);
    if (fileRes.data.file.uploaderName === 'Dr. Evelyn Reed' && fileRes.data.file.uploaderEmail === 'evelyn.reed@lab.org') {
      console.log(`✓ 7. File Document Metadata PASS: File has uploaderName="${fileRes.data.file.uploaderName}" and uploaderEmail="${fileRes.data.file.uploaderEmail}"`);
    } else {
      throw new Error(`File document missing uploader info: ${JSON.stringify(fileRes.data.file)}`);
    }

    console.log('\n======================================================');
    console.log('ALL BACKEND UPLOADER TRACKING TESTS PASSED!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  }
}

testUploaderTracking();
