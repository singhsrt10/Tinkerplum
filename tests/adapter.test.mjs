import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runFixture } from '../adapter/run.mjs';
import { validateEvidence } from '../adapter/validate.mjs';
import { verdict } from '../adapter/catalog.mjs';

const expected = JSON.parse(readFileSync(new URL('./expected.json', import.meta.url)));
for (const [fixture, outcome] of Object.entries(expected)) {
  test(`observed findings: ${fixture}`, async () => {
    const report = await runFixture(fixture);
    assert.equal(report.verdict, outcome.verdict);
    assert.deepEqual(report.checks.filter(c => c.status === 'FAIL').map(c => c.id), outcome.failures);
    assert.deepEqual(report.checks.filter(c => c.status === 'NOT RUN').map(c => c.id), outcome.not_run);
    assert.equal(report.checks.length, 14);
    assert.deepEqual(validateEvidence(JSON.parse(JSON.stringify(report))), report);
  });
}

test('release scope requires deployment evidence even with healthy local observations', async () => {
  const report = await runFixture('portfolio', 'release-evidence');
  assert.equal(report.verdict, 'INSUFFICIENT EVIDENCE');
  assert.equal(report.checks.find(c => c.id === 'DEPLOY-01').critical, true);
});

test('semantic validator rejects inconsistent and unsupported claims', async t => {
  const original = await runFixture('two-user-broken');
  const mutations = {
    'forged access PASS': r => { r.checks.find(c => c.id === 'AUTH-03').status = 'PASS'; },
    'forged cache PASS': r => { r.checks.find(c => c.id === 'CACHE-02').status = 'PASS'; },
    'missing observations': r => { r.checks[0].observations = []; },
    'unperformed PASS': r => { r.checks.at(-1).status = 'PASS'; },
    'unsupported N/A': r => { r.checks[0].status = 'N/A'; r.checks[0].observations = []; },
    'unperformed without error': r => { r.checks[0].status = 'NOT RUN'; r.checks[0].observations = []; },
    'completed work relabeled unperformed': r => { r.checks[0].status = 'NOT RUN'; },
    'unknown ID': r => { r.checks[0].id = 'UNKNOWN'; },
    'duplicate ID': r => { r.checks[1].id = r.checks[0].id; },
    'missing check': r => { r.checks.pop(); },
    'missing limit': r => { r.checks[0].limits = []; },
    'wrong actor': r => { r.checks[0].observations[0].request.actor = 'a'; },
    'wrong request path': r => { r.checks[0].observations[0].request.path = '/elsewhere'; },
    'wrong criterion': r => { r.checks[0].criterion = 'Invented'; },
    'downgraded criticality': r => { r.checks[0].critical = false; },
    'wrong verdict': r => { r.verdict = 'READY'; },
    'missing candidate': r => { delete r.candidate; },
    'invented numeric score': r => { r.score = 100; },
    'unknown schema version': r => { r.schema_version = '99.0.0'; },
    'invalid timestamp': r => { r.started_at = 'yesterday'; },
    'out of range timestamp': r => { r.checks[0].observations[0].timestamp = '2000-01-01T00:00:00Z'; },
    'contradictory cache provenance': r => { r.checks.find(c => c.id === 'CACHE-02').observations[1].source = 'origin'; },
  };
  for (const [name, mutate] of Object.entries(mutations)) {
    await t.test(name, () => { const report = structuredClone(original); mutate(report); assert.throws(() => validateEvidence(report)); });
  }
});

test('incomplete probe evidence produces NOT RUN and insufficient evidence, not a defect', async () => {
  const report = await runFixture('portfolio');
  const check = report.checks[0], request = check.observations[0].request;
  check.observations = []; check.status = 'NOT RUN';
  check.error = { request, message: 'Synthetic connection refusal' };
  check.reason = 'Environment unavailable'; report.verdict = verdict(report.checks);
  assert.equal(validateEvidence(report).verdict, 'INSUFFICIENT EVIDENCE');
});

test('non-applicable capability cannot acquire fabricated PASS evidence', async () => {
  const report = await runFixture('portfolio');
  report.checks.find(c => c.id === 'AUTH-02').status = 'PASS';
  assert.throws(() => validateEvidence(report));
});

for (const version of ['1', '2']) {
  test(`historical evidence v${version} preserves its original catalog semantics`, () => {
    const report = JSON.parse(readFileSync(new URL(`./fixtures/evidence-v${version}.json`, import.meta.url)));
    assert.equal(validateEvidence(report), report);
    const auth = report.checks.find(c => c.id === 'AUTH-01');
    assert.equal(auth.observations.length, 2);
    assert.equal(auth.status, 'PASS');
    const forged = structuredClone(report);
    forged.checks.find(c => c.id === 'AUTH-01').observations[0].response.status = 200;
    assert.throws(() => validateEvidence(forged), /unsupported PASS/);
    report.schema_version = '3.0.0';
    report.environment.tools.adapter = '0.3.0';
    assert.throws(() => validateEvidence(report));
  });
}

test('new evidence binds the revised anonymous-write protocol', async () => {
  const report = await runFixture('two-user-fixed');
  assert.equal(report.schema_version, '3.0.0');
  assert.equal(report.environment.tools.adapter, '0.3.0');
  const auth = report.checks.find(c => c.id === 'AUTH-01');
  assert.equal(auth.observations.length, 4);
  assert.equal(auth.observations[0].response.body, auth.observations[3].response.body);
  auth.observations[3].response.body = JSON.stringify({ owner: 'a', value: 'unauthorized mutation' });
  assert.throws(() => validateEvidence(report), /AUTH-01: unsupported PASS/);
  auth.status = 'FAIL';
  report.verdict = verdict(report.checks);
  assert.equal(validateEvidence(report).verdict, 'NOT READY');
});
