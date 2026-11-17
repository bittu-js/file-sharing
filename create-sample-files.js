const fs = require('fs');
const path = require('path');

const sampleDir = path.resolve(__dirname, 'sample_files');
if (!fs.existsSync(sampleDir)) {
  fs.mkdirSync(sampleDir, { recursive: true });
}

// 1. Sample document
fs.writeFileSync(
  path.join(sampleDir, 'Project_Requirements.txt'),
  `BTech Computer Science Final Project
Project: Secure MongoDB File Sharing System (MERN Stack)
Author: Student Developer
Date: November 2026

1. Architecture Overview:
- React + Vite + Tailwind CSS Frontend
- Node.js + Express.js Backend
- MongoDB Atlas / Local MongoDB with Mongoose Schemas
- Multer for local disk storage (never binary in DB)
- JWT + Bcrypt for Authentication and Link Encryption
`
);

// 2. Minimal valid 1-page PDF
const minimalPdf = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources <<>>>> endobj
4 0 obj <</Length 51>> stream
BT
/F1 24 Tf
100 700 Td
(VaultDrop Sample PDF Document) Tj
ET
endstream endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000056 00000 n 
0000000111 00000 n 
0000000212 00000 n 
trailer <</Size 5 /Root 1 0 R>>
startxref
313
%%EOF`;
fs.writeFileSync(path.join(sampleDir, 'Sample_College_Report.pdf'), minimalPdf);

// 3. Minimal 1x1 transparent PNG
const minimalPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);
fs.writeFileSync(path.join(sampleDir, 'Campus_Photo.png'), minimalPng);

console.log('Sample test files created successfully in ./sample_files');
