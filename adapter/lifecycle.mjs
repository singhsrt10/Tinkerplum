import { isDeepStrictEqual } from 'node:util';
import { validateEvidence } from './validate.mjs';
import { digest } from './snapshot.mjs';

export const freshnessPolicy = { version: '2.0.0', max_age_ms: 24 * 60 * 60 * 1000 };
const sorted = value => Array.isArray(value) ? value.map(sorted)
  : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key])])) : value;
export const reportHash = report => digest(JSON.stringify(sorted(report)));
export function changedFiles(before, after) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].sort().filter(path => before[path] !== after[path]);
}

// No old report is edited or silently promoted to evidence for a different candidate.
export function assessFreshness(report, current, now = Date.now()) {
  validateEvidence(report);
  const reasons = [], changes = ['2.0.0', '3.0.0'].includes(report.schema_version)
    ? changedFiles(report.candidate.inputs, current.candidate.inputs) : [];
  if (report.schema_version === '1.0.0') reasons.push('Historical schema has no complete input manifest; rerun');
  else if (report.schema_version !== '3.0.0') reasons.push('Historical check protocol; rerun with the current protocol');
  if (report.fixture !== current.fixture) reasons.push('Target variant changed');
  if (report.scope !== current.scope) reasons.push('Assessment scope changed');
  if (report.candidate.revision !== current.candidate.revision) reasons.push('Git revision changed');
  if (report.candidate.dirty || current.candidate.dirty) reasons.push('Dirty candidate; clean and rerun before reuse');
  if (changes.length || report.candidate.source_sha256 !== current.candidate.source_sha256) reasons.push('Repository inputs changed');
  if (!isDeepStrictEqual(report.environment, current.environment)) reasons.push('Environment or tool versions changed');
  const age = now - Date.parse(report.finished_at);
  if (age < 0) reasons.push('Evidence timestamp is in the future');
  if (age > freshnessPolicy.max_age_ms) reasons.push('Evidence exceeds 24-hour reuse window');
  return { policy_version: freshnessPolicy.version, validity: reasons.length ? 'STALE' : 'REUSABLE',
    reasons, changed_files: changes, invalidated_checks: reasons.length ? report.checks.map(c => c.id) : [],
    effective_verdict: reasons.length ? 'INSUFFICIENT EVIDENCE' : report.verdict };
}
const family = name => name.startsWith('two-user-') ? 'core-two-user' : name;
export function linkReports(before, after, note) {
  return buildLink(before, after, note, 'link-2.0.0');
}
function buildLink(before, after, note, version) {
  validateEvidence(before); validateEvidence(after);
  const supported = version === 'link-1.0.0' ? ['2.0.0'] : ['2.0.0', '3.0.0'];
  if (!supported.includes(before.schema_version) || !supported.includes(after.schema_version)) throw new Error('Linkage requires evidence with complete input manifests');
  if (before.schema_version !== after.schema_version) throw new Error('Cannot compare different check protocols; rerun both candidates with the same protocol');
  if (typeof note !== 'string' || !note.trim() || note.length > 1000) throw new Error('A bounded change note is required');
  if (family(before.fixture) !== family(after.fixture) || before.scope !== after.scope) throw new Error('Cannot link unrelated targets or scopes');
  const comparableEnvironment = environment => {
    const { artifact_sha256, ...context } = environment;
    return version === 'link-1.0.0' ? environment : context;
  };
  if (!isDeepStrictEqual(comparableEnvironment(before.environment), comparableEnvironment(after.environment))) throw new Error('Cannot compare different environments or tools');
  if (Date.parse(after.started_at) < Date.parse(before.finished_at)) throw new Error('Recheck must start after the prior run finishes');
  const transitions = before.checks.map(check => {
    const next = after.checks.find(c => c.id === check.id);
    const outcome = check.status === 'FAIL' && next.status === 'PASS' ? 'RESOLVED'
      : check.status === 'PASS' && next.status === 'FAIL' ? 'REGRESSED'
      : next.status === 'NOT RUN' || (check.status === 'FAIL' && next.status === 'N/A') ? 'INCONCLUSIVE'
      : next.status === 'FAIL' ? 'STILL FAILING'
      : check.status !== 'PASS' && next.status === 'PASS' ? 'NEWLY VERIFIED' : 'UNCHANGED';
    return { id: check.id, before: check.status, after: next.status, outcome };
  });
  const paths = changedFiles(before.candidate.inputs, after.candidate.inputs);
  const artifactChanged = before.environment.artifact_sha256 !== after.environment.artifact_sha256;
  return { schema_version: version, before_hash: reportHash(before), after_hash: reportHash(after),
    before, after, change: { kind: before.fixture !== after.fixture ? 'fixture-variant'
      : paths.length || before.candidate.revision !== after.candidate.revision ? 'code-change'
        : version !== 'link-1.0.0' && artifactChanged ? 'artifact-change' : 'recheck',
      note, changed_files: paths,
      ...(version === 'link-1.0.0' ? {} : { artifact_changed: artifactChanged }) }, transitions,
    resolved: transitions.filter(t => t.outcome === 'RESOLVED').map(t => t.id),
    regressed: transitions.filter(t => t.outcome === 'REGRESSED').map(t => t.id),
    limits: ['Historical comparison only, not freshness approval or causal proof.', 'A fixture-variant change selects bundled code behavior; it is not a patch applied to a real application.'] };
}
export function validateLink(bundle) {
  if (!bundle || !['link-1.0.0', 'link-2.0.0'].includes(bundle.schema_version)) throw new Error('Unsupported linkage version');
  const expected = buildLink(bundle.before, bundle.after, bundle.change?.note, bundle.schema_version);
  if (!isDeepStrictEqual(bundle, expected)) throw new Error('Linkage hashes, transitions or change metadata do not match embedded evidence');
  return bundle;
}
