import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { twoUser } from './targets/two-user/app.mjs';
import { failingIntegration } from './targets/integration/app.mjs';

export const fixtures = ['portfolio', 'two-user-broken', 'two-user-fixed', 'integration-failure'];
export async function startFixture(name) {
  if (!fixtures.includes(name)) throw new Error('Only bundled synthetic fixtures are supported');
  const app = name.startsWith('two-user') ? twoUser({ broken: name.endsWith('broken') })
    : name === 'integration-failure' ? failingIntegration() : null;
  const html = readFileSync(new URL('./targets/portfolio/index.html', import.meta.url), 'utf8');
  const css = readFileSync(new URL('./targets/portfolio/asset.css', import.meta.url), 'utf8');
  const server = createServer((req, res) => {
    const send = (status, body, headers = {}) => {
      res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers });
      res.end(typeof body === 'string' ? body : JSON.stringify(body));
    };
    if (req.method === 'GET' && req.url === '/') return send(200, html, { 'content-type': 'text/html; charset=utf-8' });
    if (req.method === 'GET' && req.url === '/asset.css') return send(200, css, { 'content-type': 'text/css' });
    if (req.url.startsWith('/api/') && app) return app(req, res, send);
    return send(404, { error: 'not found' });
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve, reject) => {
      server.closeAllConnections();
      server.close(error => error ? reject(error) : resolve());
    }),
  };
}
