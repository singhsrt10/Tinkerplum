import test from 'node:test';
import assert from 'node:assert/strict';
import { runFixture } from '../adapter/run.mjs';
import { assessFreshness, changedFiles, linkReports, validateLink } from '../adapter/lifecycle.mjs';
import { digest } from '../adapter/snapshot.mjs';

const context = report => ({ fixture: report.fixture, scope: report.scope, candidate: structuredClone(report.candidate), environment: structuredClone(report.environment) });
test('exact clean evidence reusable; changed, dirty, aged, future, scope and tool evidence invalidated', async t => {
  const original = await runFixture('portfolio');
  // Model a clean context explicitly; no claim that this test workspace is clean.
  original.candidate.dirty = false;
  const now = Date.parse(original.finished_at);
  assert.equal(assessFreshness(original, context(original), now).validity, 'REUSABLE');
  const mutations = {
    'different revision': c => { c.candidate.revision = '0'.repeat(40); },
    'dirty tree': c => { c.candidate.dirty = true; },
    'target changed': c => { c.fixture = 'two-user-fixed'; },
    'scope changed': c => { c.scope = 'release-evidence'; },
    'tool changed': c => { c.environment.tools.node = 'v24.0.0-different'; },
    'artifact changed': c => { c.environment.artifact_sha256 = 'a'.repeat(64); },
    'input changed': c => { c.candidate.inputs['README.md'] = 'f'.repeat(64); },
    'input deleted': c => { delete c.candidate.inputs['README.md']; },
    'new input': c => { c.candidate.inputs['new-source.js'] = 'f'.repeat(64); },
  };
  for (const [name, mutate] of Object.entries(mutations)) await t.test(name, () => {
    const current = context(original); mutate(current);
    const result = assessFreshness(original, current, now);
    assert.equal(result.validity, 'STALE'); assert.equal(result.effective_verdict, 'INSUFFICIENT EVIDENCE');
    assert.equal(result.invalidated_checks.length, 14);
  });
  assert.equal(assessFreshness(original, context(original), now + 86400001).validity, 'STALE');
  assert.equal(assessFreshness(original, context(original), now - 1).validity, 'STALE');
  const prior = structuredClone(original); prior.candidate.dirty = true;
  assert.equal(assessFreshness(prior, context(original), now).validity, 'STALE');
  assert.equal(original.verdict, 'READY');
});

test('legacy schema is structurally readable but cannot be reused without a manifest', async () => {
  const { readFileSync } = await import('node:fs');
  const report = JSON.parse(readFileSync(new URL('./fixtures/evidence-v1.json', import.meta.url)));
  const current = context(await runFixture(report.fixture));
  assert.match(assessFreshness(report, current).reasons.join(' '), /Historical schema/);
});

test('manifest digests and changes are checked rather than trusting a declared hash', async () => {
  assert.deepEqual(changedFiles({ a: '1', b: '2' }, { a: '9', c: '3' }), ['a', 'b', 'c']);
  const report = await runFixture('portfolio');
  report.candidate.inputs['README.md'] = digest('tampered');
  assert.throws(() => assessFreshness(report, context(report)), /manifest digest/);
});

test('fix/recheck link resolves observed failures, catches regressions, and rejects tampering', async () => {
  const before = await runFixture('two-user-broken');
  const after = await runFixture('two-user-fixed');
  const link = linkReports(before, after, 'Choose bundled fixed variant');
  assert.deepEqual(link.resolved, ['AUTH-03', 'AUTH-04', 'AUTH-05', 'AUTH-06', 'CACHE-01', 'CACHE-02']);
  assert.equal(link.change.kind, 'fixture-variant');
  assert.deepEqual(validateLink(JSON.parse(JSON.stringify(link))), link);
  for (const mutate of [b => { b.after_hash = 'f'.repeat(64); }, b => { b.resolved = []; }, b => { b.change.kind = 'code-change'; }, b => { b.transitions[0].outcome = 'RESOLVED'; }]) {
    const changed = structuredClone(link); mutate(changed); assert.throws(() => validateLink(changed));
  }
  const regressed = await runFixture('two-user-broken');
  assert.equal(linkReports(after, regressed, 'Reintroduce bundled defects').regressed.length, 6);
  assert.throws(() => linkReports(after, before, 'Wrong order'), /after/);
  const unrelated = await runFixture('portfolio');
  assert.throws(() => linkReports(before, unrelated, 'Different target'), /unrelated/);
  const release = structuredClone(after); release.environment.tools.node = 'other';
  assert.throws(() => linkReports(before, release, 'Tool changed'), /environment/);
});

test('an unperformed check that later passes is newly verified, not a resolved defect', async () => {
  const before = await runFixture('portfolio');
  const check = before.checks[0];
  check.status = 'NOT RUN'; check.error = { request: check.observations[0].request, message: 'Synthetic unavailable environment' };
  check.observations = []; before.verdict = 'INSUFFICIENT EVIDENCE';
  const after = await runFixture('portfolio');
  const link = linkReports(before, after, 'Retry unavailable local check');
  assert.equal(link.transitions[0].outcome, 'NEWLY VERIFIED');
  assert.deepEqual(link.resolved, []);
});

test('historical links keep their semantics and revised links reject mixed check protocols', async () => {
  const { readFileSync } = await import('node:fs');
  const { reportHash } = await import('../adapter/lifecycle.mjs');
  const before = JSON.parse(readFileSync(new URL('./fixtures/evidence-v2.json', import.meta.url)));
  const after = structuredClone(before);
  const offset = Date.parse(before.finished_at) - Date.parse(before.started_at) + 1000;
  const shift = value => new Date(Date.parse(value) + offset).toISOString();
  after.started_at = shift(after.started_at); after.finished_at = shift(after.finished_at);
  for (const check of after.checks) {
    check.started_at = shift(check.started_at); check.finished_at = shift(check.finished_at);
    for (const observation of check.observations) observation.timestamp = shift(observation.timestamp);
  }
  const revised = linkReports(before, after, 'Historical recheck');
  const historical = structuredClone(revised);
  historical.schema_version = 'link-1.0.0'; delete historical.change.artifact_changed;
  assert.deepEqual(validateLink(historical), historical);
  const changed = structuredClone(historical);
  changed.after.environment.artifact_sha256 = 'a'.repeat(64);
  changed.after_hash = reportHash(changed.after);
  assert.throws(() => validateLink(changed), /environment/);
  const current = await runFixture(before.fixture);
  assert.throws(() => linkReports(before, current, 'Different protocols'), /protocol/);
  assert.match(assessFreshness(before, context(before), Date.parse(before.finished_at)).reasons.join(' '), /Historical check protocol/);
});
