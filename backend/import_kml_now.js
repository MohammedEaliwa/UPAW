// Direct KML import without external dependencies
// Reads the KML file and sends to the server using only Node.js built-ins

const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');

const kmlPath = 'C:\\Users\\User\\Desktop\\KML\\kml.kmz';

if (!fs.existsSync(kmlPath)) {
  console.error('KML file not found:', kmlPath);
  process.exit(1);
}

const fileBuffer = fs.readFileSync(kmlPath);
const boundary = '----FormBoundary' + crypto.randomBytes(8).toString('hex');

const filename = 'kml.kmz';
const contentType = 'application/octet-stream';

// Build multipart body manually
const preamble = Buffer.from(
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
  `Content-Type: ${contentType}\r\n\r\n`
);
const epilogue = Buffer.from(`\r\n--${boundary}--\r\n`);

const body = Buffer.concat([preamble, fileBuffer, epilogue]);

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/kml/upload?editor_username=Admin',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': body.length
  }
};

console.log('Uploading KML file:', kmlPath, `(${(fileBuffer.length / 1024).toFixed(1)} KB)`);

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const json = JSON.parse(data);
      if (json.success) {
        console.log(`✅ Successfully imported ${json.count} KML features!`);
      } else {
        console.error('❌ Error:', json.error);
      }
    } catch(e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', err => {
  console.error('Request error:', err.message);
});

req.write(body);
req.end();
