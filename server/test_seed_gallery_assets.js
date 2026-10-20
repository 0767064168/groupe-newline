// Dev helper: call the seed endpoint.
// Run with: node server/test_seed_gallery_assets.js

const fetch = global.fetch || require('node-fetch');

(async () => {
  try {
    const res = await fetch('http://localhost:3001/api/admin/galerie/seed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // NOTE: you must pass Authorization token if required by your auth setup
        // Example:
        // 'Authorization': 'Bearer YOUR_TOKEN'
      },
      body: JSON.stringify({ source: 'all', overwrite: false }),
    });

    const json = await res.json();
    console.log('status:', res.status);
    console.log(JSON.stringify(json, null, 2));
  } catch (e) {
    console.error(e);
  }
})();

