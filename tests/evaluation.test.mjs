import test from 'node:test';
import assert from 'node:assert/strict';
import { compare, evaluate } from '../evaluation/run.mjs';
test('evaluation measures actual deterministic protocols and leaves model effectiveness unperformed', async () => {
  const report = await evaluate();
  assert.equal(report.model_assisted_evaluation.status, 'NOT RUN');
  assert.equal(report.results.length, 4);
  for (const result of report.results) {
    assert.equal(result.baseline.observations.response.status, 200);
    assert.deepEqual(result.protocol.comparison.missed, []);
    assert.deepEqual(result.protocol.comparison.unexpected, []);
    assert.deepEqual(result.baseline.comparison.missed, result.expected_failures);
  }
  assert.equal(report.results.reduce((sum, r) => sum + r.protocol.comparison.detected.length, 0), 7);
});
test('evaluation counts unexpected findings instead of inflating detection', () => {
  assert.deepEqual(compare(['AUTH-03'], ['API-01']), { detected: [], missed: ['AUTH-03'], unexpected: ['API-01'] });
});

test('an incomplete healthy fixture is not scored as a successful clean evaluation', async () => {
  const { runFixture } = await import('../adapter/run.mjs');
  const { compareReport } = await import('../evaluation/run.mjs');
  const report = await runFixture('portfolio');
  const check = report.checks[0];
  check.status = 'NOT RUN'; check.error = { request: check.observations[0].request, message: 'Synthetic connection failure' };
  check.observations = []; report.verdict = 'INSUFFICIENT EVIDENCE';
  const result = compareReport({ failures: [], verdict: 'READY' }, report);
  assert.deepEqual(result.incomplete, ['HTTP-01']); assert.equal(result.verdict_mismatch, true);
});

const { scoreModelPair, protocolMetadata, conditionInstructions, canonicalJson } = await import('../evaluation/score-model.mjs');
const { digest } = await import('../adapter/snapshot.mjs');
function modelPair() {
  const metadata = protocolMetadata();
  const settings = { tools: ['local-read', 'bounded-loopback'], budget: { tokens: 1000 }, parameters: { temperature: 0 } };
  return ['baseline', 'skill-assisted'].map(condition => ({ schema_version: 'model-record-2.0.0', protocol_version: metadata.protocol_version,
    condition, study_id: 'UNIT TEST ONLY', model_version: 'synthetic-test-data', settings, settings_sha256: digest(canonicalJson(settings)),
    dataset_sha256: metadata.dataset_sha256, run_status: 'COMPLETED', ...metadata.conditions[condition],
    started_at: '2026-10-05T01:00:00Z', finished_at: '2026-10-05T02:00:00Z',
    cases: ['portfolio', 'two-user-broken', 'two-user-fixed', 'integration-failure'].map(fixture => ({ fixture,
      session_id: `${condition}-${fixture}`, session_log: 'Synthetic log, not an actual model session.',
      session_log_sha256: digest('Synthetic log, not an actual model session.'),
      raw_output: 'Synthetic test output, not an actual model response.', findings: [] })) }));
}
test('model comparison validates synthetic records without treating them as real study results', () => {
  const [baseline, assisted] = modelPair();
  assert.equal(baseline.skill_package, null);
  assert.equal(baseline.rendered_instructions.includes('Supplied skill package'), false);
  assert.ok(assisted.skill_package.files['SKILL.md']);
  const result = scoreModelPair(baseline, assisted);
  assert.equal(result.conditions[1].cases[1].missed.length, 6);
  assert.match(result.limits[0], /not authenticated/);
  assisted.cases[0].findings.push({ check_id: 'HTTP-01', citation: 'invented citation' });
  assert.throws(() => scoreModelPair(baseline, assisted), /citation/);
  assisted.cases[0].findings = []; assisted.model_version = 'different';
  assert.throws(() => scoreModelPair(baseline, assisted), /model_version/);
  assisted.model_version = baseline.model_version; assisted.run_status = 'NOT RUN';
  assert.throws(() => scoreModelPair(baseline, assisted), /Unperformed/);
  assisted.run_status = 'COMPLETED'; assisted.dataset_sha256 = 'f'.repeat(64);
  assert.throws(() => scoreModelPair(baseline, assisted), /dataset/);
});
test('identity tampering, missing evidence and historical records cannot be scored', () => {
  const mutations = [
    [r => { r.schema_version = 'model-record-1.0.0'; }, /Version 1 lacks/],
    [r => { delete r.cases[0].session_log; }, /session_log/],
    [r => { r.cases[0].session_log += ' changed'; }, /Session log hash/],
    [r => { r.settings = { different: true }; }, /Settings hash/],
    [r => { r.rendered_instructions += ' changed'; }, /rendered_instructions/],
    [r => { r.prompt_sha256 = 'f'.repeat(64); }, /prompt_sha256/],
    [r => { r.skill_package = null; }, /skill_package/],
    [r => { r.protocol_version = 'unknown'; }, /constant/],
    [r => { r.cases[0].session_id = 'baseline-portfolio'; }, /distinct session/],
  ];
  for (const [mutate, error] of mutations) {
    const [baseline, assisted] = modelPair(); mutate(assisted);
    assert.throws(() => scoreModelPair(baseline, assisted), error);
  }
  const [baseline, assisted] = modelPair(); baseline.skill_package = assisted.skill_package;
  assert.throws(() => scoreModelPair(baseline, assisted), /skill_package/);
});
test('every supplied skill file changes treatment identity and stale records reject', async () => {
  const { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const directory = mkdtempSync(join(tmpdir(), 'tinkerplum-study-'));
  try {
    cpSync(new URL('../tinker-plum/', import.meta.url), directory, { recursive: true });
    const original = conditionInstructions('skill-assisted', directory);
    for (const path of Object.keys(original.skill_package.files)) {
      const file = join(directory, path), before = readFileSync(file);
      writeFileSync(file, Buffer.concat([before, Buffer.from('\nIdentity regression fixture change.\n')]));
      const changed = conditionInstructions('skill-assisted', directory);
      assert.notEqual(changed.skill_package.sha256, original.skill_package.sha256, path);
      assert.notEqual(changed.rendered_instructions_sha256, original.rendered_instructions_sha256, path);
      const [baseline, assisted] = modelPair(); Object.assign(assisted, changed);
      assert.throws(() => scoreModelPair(baseline, assisted), /skill_package/);
      writeFileSync(file, before);
    }
    assert.deepEqual(conditionInstructions('skill-assisted', directory), original);
    assert.deepEqual(conditionInstructions('baseline', '/missing'), conditionInstructions('baseline'));
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
test('scorer and pure comparison imports do not capture Git or start execution', async () => {
  const { execFileSync } = await import('node:child_process');
  const module = new URL('../evaluation/score-model.mjs', import.meta.url).href;
  const output = execFileSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(module)}); console.log('imported');`],
    { env: { ...process.env, GIT: '/nonexistent-git-for-regression' }, encoding: 'utf8' });
  assert.equal(output.trim(), 'imported');
});
