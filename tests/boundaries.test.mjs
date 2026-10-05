import test from 'node:test';
import assert from 'node:assert/strict';
import { startFixture } from '../fixtures/server.mjs';
import { probe, sharedCache } from '../adapter/probe.mjs';

// Independent HTTP assertions, not the catalog's pass predicates.
for (const mode of ['broken', 'fixed']) {
  test(`two-user ${mode}: both directions, denied writes cannot persist, positive control`, async () => {
    const server = await startFixture(`two-user-${mode}`);
    const request = (method, owner, actor) => probe(server.origin, { method, path: `/api/records/${owner}`, actor });
    try {
      for (const [actor, other] of [['a', 'b'], ['b', 'a']]) {
        const own = await request('GET', actor, actor);
        assert.equal(JSON.parse(own.body).owner, actor);
        const before = await request('GET', other, other);
        const read = await request('GET', other, actor);
        const write = await request('PATCH', other, actor);
        const after = await request('GET', other, other);
        if (mode === 'fixed') {
          assert.equal(read.status, 403); assert.equal(write.status, 403);
          assert.equal(after.body, before.body);
          assert.equal(read.body.includes('synthetic note'), false);
        } else {
          assert.equal(read.status, 200); assert.equal(write.status, 200);
          assert.equal(JSON.parse(read.body).owner, other);
          assert.equal(JSON.parse(after.body).value, `updated by ${actor}`);
        }
        const updated = await request('PATCH', actor, actor);
        assert.equal(updated.status, 200);
        assert.equal(JSON.parse((await request('GET', actor, actor)).body).value, `updated by ${actor}`);
      }
      for (const method of ['GET', 'PATCH']) assert.equal((await request(method, 'a', 'anonymous')).status, 401);
    } finally { await server.close(); }
  });
}

test('shared cache demonstrates leak before fix and isolation after fix', async () => {
  for (const mode of ['broken', 'fixed']) {
    const server = await startFixture(`two-user-${mode}`);
    try {
      const cache = sharedCache(request => probe(server.origin, request));
      const a = await cache({ method: 'GET', path: '/api/me', actor: 'a' });
      const b = await cache({ method: 'GET', path: '/api/me', actor: 'b' });
      assert.equal(JSON.parse(a.response.body).owner, 'a');
      assert.equal(JSON.parse(b.response.body).owner, mode === 'broken' ? 'a' : 'b');
      assert.equal(b.source, mode === 'broken' ? 'synthetic-cache' : 'origin');
      if (mode === 'fixed') assert.match(b.response.headers['cache-control'], /no-store/);
    } finally { await server.close(); }
  }
});

test('fixture runner rejects URLs and unknown targets before opening a server', async () => {
  await assert.rejects(startFixture('https://example.com'));
  await assert.rejects(startFixture('nextjs'));
  await assert.rejects(probe('https://example.com', { method: 'GET', path: '/', actor: 'anonymous' }), /Loopback/);
  await assert.rejects(probe('http://127.0.0.1:1', { method: 'GET', path: '//example.com', actor: 'anonymous' }), /Loopback/);
});
