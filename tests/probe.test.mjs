import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { probe } from '../adapter/probe.mjs';

const request = { method: 'GET', path: '/', actor: 'anonymous' };
const origin = 'http://127.0.0.1:1234';

test('probe accepts exactly the byte limit and decodes split UTF-8', async t => {
  const bytes = new TextEncoder().encode('é'.repeat(8192));
  t.mock.method(globalThis, 'fetch', async () => new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(bytes.slice(0, 1));
      controller.enqueue(bytes.slice(1));
      controller.close();
    },
  })));
  assert.equal((await probe(origin, request)).body, 'é'.repeat(8192));
});

for (const chunks of [
  [new TextEncoder().encode('é'.repeat(8193))],
  [new Uint8Array(8192), new Uint8Array(8192), new Uint8Array(1)],
]) {
  test(`probe cancels oversized ${chunks.length === 1 ? 'multibyte' : 'chunked'} bodies`, async t => {
    let cancelled = false;
    t.mock.method(globalThis, 'fetch', async () => new Response(new ReadableStream({
      start(controller) { for (const chunk of chunks) controller.enqueue(chunk); },
      cancel() { cancelled = true; },
    })));
    await assert.rejects(probe(origin, request), /exceeds evidence limit/);
    assert.equal(cancelled, true);
  });
}

test('probe times out while reading an unfinished body and rejects redirects', async () => {
  const server = createServer((req, res) => {
    if (req.url === '/redirect') res.writeHead(302, { location: '/' }).end();
    else { res.writeHead(200); res.write('partial'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const localOrigin = `http://127.0.0.1:${server.address().port}`;
  try {
    await assert.rejects(probe(localOrigin, { ...request, path: '/redirect' }));
    await assert.rejects(probe(localOrigin, request), error => ['TimeoutError', 'AbortError'].includes(error.name));
  } finally {
    server.closeAllConnections();
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test('oversized responses yield NOT RUN evidence rather than partial PASS claims', async t => {
  const { runFixture } = await import('../adapter/run.mjs');
  t.mock.method(globalThis, 'fetch', async () => new Response(new Uint8Array(16385)));
  const report = await runFixture('portfolio');
  assert.equal(report.verdict, 'INSUFFICIENT EVIDENCE');
  for (const id of ['HTTP-01', 'HTTP-02', 'HTTP-03']) {
    const check = report.checks.find(item => item.id === id);
    assert.equal(check.status, 'NOT RUN');
    assert.deepEqual(check.observations, []);
    assert.match(check.error.message, /exceeds evidence limit/);
  }
});
