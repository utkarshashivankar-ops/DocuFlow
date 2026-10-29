// Route-level checks that need no database: authentication guards, public-link rejection, HTTPS redirect.
process.env.MONGO_URI = 'mongodb://127.0.0.1:1/none';
process.env.JWT_SECRET = 'test-secret-test-secret-123';
process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../src/app');

let server; let base;
test.before(async () => { server = http.createServer(app); await new Promise((r) => server.listen(0, r)); base = `http://127.0.0.1:${server.address().port}`; });
test.after(() => server.close());

const get = (p, opts) => fetch(base + p, opts);

test('new protected endpoints reject requests without a token', async () => {
  for (const p of ['/api/renewals', '/api/notifications', '/api/notifications/unread-count', '/api/admin/overview', '/api/documents/abc/versions', '/api/documents/abc/shares']) {
    const r = await get(p);
    assert.equal(r.status, 401, p);
  }
});
test('malformed share tokens are rejected before touching the database', async () => {
  const r = await get('/api/shared/short');
  assert.equal(r.status, 404);
  assert.equal((await r.json()).code, 'LINK_INVALID');
  const page = await get('/s/not-a-real-token');
  assert.equal(page.status, 404);
  assert.match(await page.text(), /Link unavailable/);
});
test('security headers are set (HSTS, no sniffing)', async () => {
  const r = await get('/api/shared/short');
  assert.match(r.headers.get('strict-transport-security'), /max-age=/);
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
});
