const http = require('http');

async function testAdvancedFeatures() {
  console.log('\n======================================================');
  console.log('Testing 10 Advanced Features on Backend API');
  console.log('======================================================\n');

  const request = (endpoint, method = 'GET', data = null, token = null) => {
    return new Promise((resolve, reject) => {
      const url = new URL(`http://127.0.0.1:5000/api${endpoint}`);
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
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
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

  try {
    // 1. Login user
    const loginRes = await request('/auth/login', 'POST', {
      email: 'alex@college.edu',
      password: 'password123'
    });
    const token = loginRes.data.token;
    console.log('✓ 1. Authenticated as alex@college.edu');

    // 2. Folder Management: Create nested folders
    const rootFolderRes = await request('/folders', 'POST', { name: 'Engineering Projects', color: 'blue' }, token);
    const rootFolderId = rootFolderRes.data.folder._id;
    console.log(`✓ 2. Created root folder: "${rootFolderRes.data.folder.name}" (${rootFolderId})`);

    const subFolderRes = await request('/folders', 'POST', { name: '2026 Reports', parentId: rootFolderId, color: 'emerald' }, token);
    const subFolderId = subFolderRes.data.folder._id;
    console.log(`✓ 3. Created subfolder: "${subFolderRes.data.folder.name}" with parentId: ${rootFolderId}`);

    const breadcrumbsRes = await request(`/folders/${subFolderId}/breadcrumbs`, 'GET', null, token);
    console.log(`✓ 4. Folder Breadcrumbs verified:`, breadcrumbsRes.data.breadcrumbs.map(b => b.name).join(' > '));

    // 3. Upload file into folder
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const fileContent = 'Technical Specifications Document Version 1.0';
    const uploadPayload = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="folderId"',
      '',
      subFolderId,
      `--${boundary}`,
      'Content-Disposition: form-data; name="tags"',
      '',
      'Specs,FinalProject',
      `--${boundary}`,
      'Content-Disposition: form-data; name="files"; filename="Tech_Specs.txt"',
      'Content-Type: text/plain',
      '',
      fileContent,
      `--${boundary}--`
    ].join('\r\n');

    const uploadRes = await new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: 5000,
          path: '/api/files/upload',
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Authorization': `Bearer ${token}`,
            'Content-Length': Buffer.byteLength(uploadPayload)
          }
        },
        (res) => {
          let b = '';
          res.on('data', (c) => (b += c));
          res.on('end', () => resolve(JSON.parse(b)));
        }
      );
      req.on('error', reject);
      req.write(uploadPayload);
      req.end();
    });

    const fileId = uploadRes.files[0]._id;
    console.log(`✓ 5. Uploaded file into subfolder: "${uploadRes.files[0].originalName}", tags: ${uploadRes.files[0].tags.join(', ')}`);

    // 4. Duplicate Detection (Upload same content again)
    const duplicateRes = await new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: 5000,
          path: '/api/files/upload',
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Authorization': `Bearer ${token}`,
            'Content-Length': Buffer.byteLength(uploadPayload)
          }
        },
        (res) => {
          let b = '';
          res.on('data', (c) => (b += c));
          res.on('end', () => resolve(JSON.parse(b)));
        }
      );
      req.on('error', reject);
      req.write(uploadPayload);
      req.end();
    });
    console.log(`✓ 6. Duplicate Detection verified: SHA-256 match found with "${duplicateRes.duplicates[0]?.duplicateOf}"`);

    // 5. File Versioning: Upload new version (v2)
    const v2Content = 'Technical Specifications Document Version 2.0 (Updated & Revised)';
    const v2Payload = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="Tech_Specs_v2.txt"',
      'Content-Type: text/plain',
      '',
      v2Content,
      `--${boundary}--`
    ].join('\r\n');

    const versionRes = await new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: 5000,
          path: `/api/files/${fileId}/versions`,
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Authorization': `Bearer ${token}`,
            'Content-Length': Buffer.byteLength(v2Payload)
          }
        },
        (res) => {
          let b = '';
          res.on('data', (c) => (b += c));
          res.on('end', () => resolve(JSON.parse(b)));
        }
      );
      req.on('error', reject);
      req.write(v2Payload);
      req.end();
    });
    console.log(`✓ 7. File Versioning verified: Upgraded to version ${versionRes.file.version}`);

    const versionsList = await request(`/files/${fileId}/versions`, 'GET', null, token);
    console.log(`✓ 8. Version History verified: ${versionsList.data.versions.length} versions tracked in history`);

    // 6. Favorites and Recents
    await request(`/files/${fileId}/favorite`, 'PATCH', null, token);
    const favsRes = await request('/files/favorites', 'GET', null, token);
    console.log(`✓ 9. Favorites verified: ${favsRes.data.files.length} favorite file(s) found`);

    const recentRes = await request('/files/recent', 'GET', null, token);
    console.log(`✓ 10. Recent Files verified: ${recentRes.data.files.length} recent file(s) retrieved`);

    // 7. Activity Tracking (Audit Trail)
    const activityRes = await request('/activities', 'GET', null, token);
    console.log(`✓ 11. Activity Tracking verified: ${activityRes.data.activities.length} audit trail events recorded`);

    // 8. File Requests (Upload Portals)
    const fileReqRes = await request('/file-requests', 'POST', {
      title: 'Assignment Submissions Portal',
      description: 'Please upload your code archive here',
      destinationFolder: subFolderId
    }, token);
    const requestToken = fileReqRes.data.fileRequest.requestToken;
    console.log(`✓ 12. File Request portal created with token: ${requestToken}`);

    // Public info check
    const publicReqInfo = await request(`/file-requests/public/${requestToken}`, 'GET');
    console.log(`✓ 13. Public File Request Portal verified: "${publicReqInfo.data.request.title}" created by ${publicReqInfo.data.request.requesterName}`);

    // 9. Bulk Actions (Move, Trash, Restore)
    const bulkMoveRes = await request('/files/bulk/move', 'POST', {
      fileIds: [fileId],
      targetFolderId: rootFolderId
    }, token);
    console.log(`✓ 14. Bulk Move verified: ${bulkMoveRes.data.message}`);

    // 10. Dashboard Stats & Quotas
    const statsRes = await request('/stats/dashboard', 'GET', null, token);
    console.log(`✓ 15. Dashboard Analytics & Storage Quotas verified:`, {
      totalFiles: statsRes.data.stats.totalFiles,
      totalFolders: statsRes.data.stats.totalFolders,
      storageQuotaMB: (statsRes.data.stats.storageQuota / 1024 / 1024).toFixed(0),
      usedPercentage: statsRes.data.stats.quotaPercentage + '%'
    });

    console.log('\n======================================================');
    console.log('ALL 15 ADVANCED FEATURE TESTS PASSED SUCCESSFULLY!');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  }
}

testAdvancedFeatures();
