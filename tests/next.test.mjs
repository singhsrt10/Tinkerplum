import test from 'node:test';
import assert from 'node:assert/strict';
import { runFixture } from '../adapter/run.mjs';
import { startFixture } from '../fixtures/server.mjs';
import { probe } from '../adapter/probe.mjs';
import { assessFreshness, linkReports, validateLink } from '../adapter/lifecycle.mjs';
import { execFileSync } from 'node:child_process';
import { root } from '../adapter/snapshot.mjs';
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

test('two genuine Next.js builds can be linked while prior artifact evidence remains stale', async () => {
  const before = await runFixture('nextjs-fixed');
  execFileSync(process.execPath, ['scripts/next-build.mjs'], { cwd: root, env: process.env, timeout: 120000, stdio: 'pipe' });
  const after = await runFixture('nextjs-fixed');
  assert.notEqual(before.environment.artifact_sha256, after.environment.artifact_sha256);
  const link = linkReports(before, after, 'Rebuild the same source; no defect resolution or causal claim');
  assert.equal(link.change.kind, 'artifact-change');
  assert.equal(link.change.artifact_changed, true);
  assert.equal(link.before.environment.artifact_sha256, before.environment.artifact_sha256);
  assert.equal(link.after.environment.artifact_sha256, after.environment.artifact_sha256);
  assert.deepEqual(validateLink(link), link);
  assert.deepEqual(link.resolved, []);
  const prior = structuredClone(before); prior.candidate.dirty = false;
  const current = { fixture: prior.fixture, scope: prior.scope, candidate: prior.candidate, environment: after.environment };
  assert.match(assessFreshness(prior, current, Date.parse(after.finished_at)).reasons.join(' '), /Environment/);
  const tampered = structuredClone(link); tampered.change.artifact_changed = false;
  assert.throws(() => validateLink(tampered), /metadata/);
});
