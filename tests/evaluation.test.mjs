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

test('model comparison validates synthetic test records without treating them as real study results', async () => {
  const { scoreModelPair, protocolMetadata } = await import('../evaluation/score-model.mjs');
  const { readFileSync } = await import('node:fs');
  const { digest } = await import('../adapter/snapshot.mjs');
  const make = condition => ({ schema_version: 'model-record-1.0.0', condition, study_id: 'UNIT TEST ONLY', model_version: 'synthetic-test-data',
    settings_sha256: '0'.repeat(64), dataset_sha256: protocolMetadata().dataset_sha256, run_status: 'COMPLETED',
    prompt_sha256: digest(readFileSync(new URL(`../evaluation/prompts/${condition}.txt`, import.meta.url))),
    started_at: '2026-10-05T01:00:00Z', finished_at: '2026-10-05T02:00:00Z',
    cases: ['portfolio', 'two-user-broken', 'two-user-fixed', 'integration-failure'].map(fixture => ({ fixture, raw_output: 'Synthetic test output, not an actual model response.', findings: [] })) });
  const baseline = make('baseline'), assisted = make('skill-assisted');
  const result = scoreModelPair(baseline, assisted);
  assert.equal(result.conditions[1].cases[1].missed.length, 6);
  assisted.cases[0].findings.push({ check_id: 'HTTP-01', citation: 'invented citation' });
  assert.throws(() => scoreModelPair(baseline, assisted), /citation/);
  assisted.cases[0].findings = []; assisted.model_version = 'different';
  assert.throws(() => scoreModelPair(baseline, assisted), /model_version/);
  assisted.model_version = baseline.model_version; assisted.run_status = 'NOT RUN';
  assert.throws(() => scoreModelPair(baseline, assisted), /Unperformed/);
  assisted.run_status = 'COMPLETED'; assisted.dataset_sha256 = 'f'.repeat(64);
  assert.throws(() => scoreModelPair(baseline, assisted), /dataset/);
});
