const http = require('http');

function postJson(path, data, token) {
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
    if (token) options.headers.Authorization = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
        catch (e) { resolve({ status: res.statusCode, body: body }); }
      });
    });
    req.on('error', (e) => reject(e));
    req.write(payload);
    req.end();
  });
}

function getJson(path) {
  return new Promise((resolve, reject) => {
    const options = { hostname: 'localhost', port: 3001, path, method: 'GET' };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
        catch (e) { resolve({ status: res.statusCode, body: body }); }
      });
    });
    req.on('error', (e) => reject(e));
    req.end();
  });
}

(async () => {
  try {
    console.log('Logging in...');
    const login = await postJson('/api/admin/login', { email: 'admin@groupenewline.ci', password: 'Admin2025!' });
    console.log('login ->', login.status, login.body && (login.body.ok ? 'ok' : JSON.stringify(login.body)));
    if (!login.body || !login.body.token) throw new Error('no_token');
    const token = login.body.token;

    console.log('Posting gallery item (URL-based)...');
    const post = await postJson('/api/admin/galerie', { titre: 'Test Upload Script', cat: 'Automated', media_type: 'image', url: '/assets/images/logo1.png.jpeg' }, token);
    console.log('post ->', post.status, post.body);

    console.log('Fetching latest gallery items...');
    const list = await getJson('/api/galerie?limit=5');
    console.log('gallery ->', list.status);
    if (Array.isArray(list.body.data)) {
      list.body.data.forEach((g, i) => console.log(` - [${g.id}] ${g.titre} ${g.url}`));
    } else { console.log(list.body); }

    process.exit(0);
  } catch (e) {
    console.error('error:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
