const http = require('http');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'assets', 'images', 'logo1.png.jpeg');
const boundary = '----GroupeNewlineBoundary' + Date.now();

function postJson(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3001,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
        catch (e) { resolve({ status: res.statusCode, body }); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function postMultipart(route, fields, fileField, token) {
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    const parts = [];
    for (const [name, value] of Object.entries(fields)) {
      parts.push(Buffer.from(`--${boundary}\r\n`));
      parts.push(Buffer.from(`Content-Disposition: form-data; name="${name}"\r\n\r\n`));
      parts.push(Buffer.from(`${value}\r\n`));
    }

    parts.push(Buffer.from(`--${boundary}\r\n`));
    parts.push(Buffer.from(`Content-Disposition: form-data; name="${fileField.name}"; filename="${fileName}"\r\n`));
    parts.push(Buffer.from(`Content-Type: ${fileField.contentType}\r\n\r\n`));
    parts.push(fileContent);
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const body = Buffer.concat(parts);

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: route,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
        Authorization: `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let resp = '';
      res.on('data', (chunk) => resp += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(resp) }); }
        catch (e) { resolve({ status: res.statusCode, body: resp }); }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    console.log('Login...');
    const login = await postJson('/api/admin/login', { email: 'admin@groupenewline.ci', password: 'Admin2025!' });
    console.log('login', login.status, login.body);
    if (!login.body || !login.body.token) throw new Error('Login failed');

    const token = login.body.token;
    console.log('Posting multipart upload...');
    const upload = await postMultipart(
      '/api/admin/galerie',
      { titre: 'Test Upload File', cat: 'Automated', media_type: 'image' },
      { name: 'file', contentType: 'image/jpeg' },
      token
    );
    console.log('upload', upload.status, upload.body);

    console.log('Fetching gallery items...');
    const latest = await new Promise((resolve, reject) => {
      http.get('http://localhost:3001/api/galerie?limit=5', (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
          catch (e) { resolve({ status: res.statusCode, body }); }
        });
      }).on('error', reject);
    });

    console.log('gallery', latest.status, latest.body && latest.body.data ? latest.body.data.map((g) => `${g.id}:${g.titre}:${g.url}`).join('\n') : latest.body);
    process.exit(0);
  } catch (e) {
    console.error('error:', e.message || e);
    process.exit(1);
  }
})();
