import test from 'node:test';
import assert from 'node:assert/strict';
import { runFixture } from '../adapter/run.mjs';
import { startFixture } from '../fixtures/server.mjs';
import { probe } from '../adapter/probe.mjs';
test('production-built Next.js route handlers satisfy the fixed synthetic contract', async () => {
  const report = await runFixture('nextjs-fixed');
  assert.equal(report.environment.tools.next, '16.3.8');
  assert.deepEqual(report.checks.filter(c => c.status === 'FAIL'), []);
  assert.equal(report.verdict, 'READY');
  assert.equal(report.checks.find(c => c.id === 'DEPLOY-01').status, 'NOT RUN');
});
test('Next.js actual response denies both cross-user writes and does not persist them', async () => {
  const server = await startFixture('nextjs-fixed');
  try {
    for (const [actor, owner] of [['a', 'b'], ['b', 'a']]) {
      const request = (method, identity) => probe(server.origin, { method, actor: identity, path: `/api/records/${owner}` });
      const before = await request('GET', owner);
      assert.equal((await request('GET', actor)).status, 403);
      assert.equal((await request('PATCH', actor)).status, 403);
      const after = await request('GET', owner);
      assert.equal(after.body, before.body);
      assert.match(after.headers['cache-control'], /no-store/);
    }
  } finally { await server.close(); }
});

test('Next.js rejects modified compiled output and stale source stamps', async () => {
  const { writeFileSync, readFileSync, rmSync } = await import('node:fs');
  const marker = new URL('../fixtures/nextjs/.next/server/tinkerplum-test-marker.txt', import.meta.url);
  const stamp = new URL('../fixtures/nextjs/.next/tinkerplum-source.json', import.meta.url);
  const original = readFileSync(stamp);
  try {
    writeFileSync(marker, 'Synthetic artifact modification');
    await assert.rejects(startFixture('nextjs-fixed'), /build output changed/);
    rmSync(marker);
    const changed = JSON.parse(original); changed.source_sha256 = '0'.repeat(64);
    writeFileSync(stamp, JSON.stringify(changed));
    await assert.rejects(startFixture('nextjs-fixed'), /build is stale/);
  } finally { rmSync(marker, { force: true }); writeFileSync(stamp, original); }
});
