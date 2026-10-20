const http = require('http');

const data = JSON.stringify({ email: 'admin@groupenewline.ci', password: 'Admin2025!' });

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/admin/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('status:', res.statusCode);
    try { console.log('body:', JSON.parse(body)); } catch (e) { console.log('body:', body); }
  });
});
req.on('error', (e) => console.error('error:', e.message));
req.write(data);
req.end();
