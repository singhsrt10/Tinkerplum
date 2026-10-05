import { startFixture } from '../fixtures/server.mjs';
import { probe } from '../adapter/probe.mjs';
// Explicit baseline: route smoke checks, no authorization or caching assertions.
export async function runBaseline(name) {
  const server = await startFixture(name);
  try {
    const response = await probe(server.origin, { method: 'GET', path: '/', actor: 'anonymous' });
    const missing = await probe(server.origin, { method: 'GET', path: '/missing', actor: 'anonymous' });
    const asset = await probe(server.origin, { method: 'GET', path: '/asset.css', actor: 'anonymous' });
    const checks = [
      { id: 'HTTP-01', pass: response.status === 200 && response.headers['content-type'].startsWith('text/html') && response.body.includes('<h1>') },
      { id: 'HTTP-02', pass: missing.status === 404 },
      { id: 'HTTP-03', pass: response.status === 200 && response.body.includes('href="/asset.css"') && asset.status === 200 && asset.headers['content-type'].startsWith('text/css') && asset.body.includes('body') },
    ];
    return { fixture: name, checked_ids: checks.map(c => c.id), failures: checks.filter(c => !c.pass).map(c => c.id), observations: { response, missing, asset } };
  } finally { await server.close(); }
}
