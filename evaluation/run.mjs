import { isDeepStrictEqual } from 'node:util';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { runBaseline } from './baseline.mjs';
import { runFixture } from '../adapter/run.mjs';
import { validateEvidence } from '../adapter/validate.mjs';
import { candidate } from '../adapter/snapshot.mjs';
import { compare } from './compare.mjs';
export { compare } from './compare.mjs';
export function compareReport(expected, report) {
  validateEvidence(report);
  return { ...compare(expected.failures, report.checks.filter(c => c.status === 'FAIL').map(c => c.id)),
    incomplete: report.checks.filter(c => c.critical && c.status === 'NOT RUN').map(c => c.id),
    verdict_mismatch: report.verdict !== expected.verdict };
}
export async function evaluate() {
  const initial = candidate();
  const expected = JSON.parse(readFileSync(new URL('../tests/expected.json', import.meta.url)));
  const results = [];
  for (const [fixture, truth] of Object.entries(expected)) {
    const baseline = await runBaseline(fixture);
    const guided = await runFixture(fixture);
    if (!isDeepStrictEqual(initial, guided.candidate)) throw new Error('Candidate changed between evaluation runs');
    results.push({ fixture, expected_failures: truth.failures, baseline: { ...baseline, comparison: compare(truth.failures, baseline.failures) },
      protocol: { report: guided, comparison: compareReport(truth, guided) } });
  }
  if (!isDeepStrictEqual(initial, candidate())) throw new Error('Candidate changed during evaluation');
  return { schema_version: 'evaluation-1.0.0', candidate: initial, timestamp: new Date().toISOString(),
    baseline: 'Executed three-check HTTP smoke protocol',
    treatment: 'Executed deterministic implementation of evidence and negative-boundary checks described by the skill',
    model_assisted_evaluation: { status: 'NOT RUN', reason: 'No model/API calls authorized. This protocol proxy does not measure skill prompting or model behavior.' },
    limits: ['Known synthetic cases designed with these checks; not a holdout benchmark.', 'Counts are check-level observations, not independent vulnerabilities or a readiness score.'], results };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const report = await evaluate();
    mkdirSync('reports', { recursive: true });
    writeFileSync('reports/evaluation.json', `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
    for (const result of report.results) {
      console.log(`${result.fixture}: expected ${result.expected_failures.length}; smoke detected ${result.baseline.comparison.detected.length}; protocol detected ${result.protocol.comparison.detected.length}`);
      if (result.protocol.comparison.missed.length || result.protocol.comparison.unexpected.length || result.protocol.comparison.incomplete.length || result.protocol.comparison.verdict_mismatch) process.exitCode = 1;
    }
    console.log('Model-assisted effectiveness: NOT RUN. Results measure these deterministic protocols only.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
