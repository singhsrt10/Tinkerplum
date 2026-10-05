import { createRequire } from 'node:module';
import { isDeepStrictEqual } from 'node:util';
import { startFixture } from '../fixtures/server.mjs';
import { catalog, applicable, critical, verdict } from './catalog.mjs';
import { probe, sharedCache } from './probe.mjs';
import { validateEvidence } from './validate.mjs';
import { nextArtifactDigest } from './next-build-state.mjs';
import { candidate } from './snapshot.mjs';
export { candidate } from './snapshot.mjs';
const require = createRequire(import.meta.url);
// Refuse to label cached imported modules with later on-disk source revisions.
const loadedSource = candidate().source_sha256;
export function toolsFor(name) {
  return { node: process.version, adapter: '0.2.0', ajv: require('ajv/package.json').version,
    next: name === 'nextjs-fixed' ? require('../fixtures/nextjs/node_modules/next/package.json').version : 'not-used' };
}
export function environmentFor(name) {
  return { kind: 'isolated-loopback', platform: process.platform, arch: process.arch, tools: toolsFor(name),
    artifact_sha256: name === 'nextjs-fixed' ? nextArtifactDigest() : 'not-used' };
}
export async function runFixture(name, scope = 'local-fixture') {
  if (candidate().source_sha256 !== loadedSource) throw new Error('Source changed since module load; start a fresh process');
  if (!['local-fixture', 'release-evidence'].includes(scope)) throw new Error('Unsupported assessment scope');
  const report = {
    schema_version: '2.0.0', fixture: name, scope, candidate: candidate(),
    environment: environmentFor(name),
    started_at: new Date().toISOString(), finished_at: '',
    limits: ['Synthetic local HTTP contract only; no production security claim.', 'No browser, TLS, real identity provider, database, CDN, or deployment tested.'],
    checks: [], verdict: 'INSUFFICIENT EVIDENCE',
  };
  const server = await startFixture(name);
  try {
    for (const rule of catalog) {
      const check = {
        id: rule.id, criterion: rule.criterion, critical: critical(rule, scope), status: 'NOT RUN',
        reason: '', limits: ['Only the listed requests and synthetic identities are covered.'],
        started_at: new Date().toISOString(), finished_at: '', observations: [], error: null,
      };
      if (!applicable(rule, name)) {
        check.status = 'N/A'; check.reason = `Bundled ${name} fixture has no ${rule.group} capability.`;
      } else if (rule.group === 'deployment') {
        check.reason = 'No deployment exists or is contacted by this adapter.';
        check.limits = ['A release decision requires separate candidate-specific deployment evidence.'];
      } else {
        const direct = request => probe(server.origin, request);
        const requestResponse = rule.cache ? sharedCache(direct) : async request => ({ response: await direct(request), source: 'origin' });
        if (rule.cache) check.limits.push('URL-keyed cache model only; not an RFC-complete CDN or browser.');
        for (const request of rule.plan) {
          try {
            const result = await requestResponse(request);
            check.observations.push({ request, ...result, timestamp: new Date().toISOString() });
          } catch (error) {
            check.error = { request, message: error.message };
            check.reason = 'Probe did not complete; environment or transport failure is not a product failure.';
            break;
          }
        }
        if (!check.error) {
          check.status = rule.pass(check.observations.map(o => o.response)) ? 'PASS' : 'FAIL';
          check.reason = check.status === 'PASS' ? 'Observed responses meet this bounded criterion.' : 'Observed responses contradict this criterion.';
        }
      }
      check.finished_at = new Date().toISOString(); report.checks.push(check);
    }
  } finally { await server.close(); }
  if (!isDeepStrictEqual(report.candidate, candidate())) throw new Error('Source changed during execution; rerun evidence collection');
  if (!isDeepStrictEqual(report.environment, environmentFor(name))) throw new Error('Environment or build changed during execution; rerun');
  report.finished_at = new Date().toISOString();
  report.verdict = verdict(report.checks);
  return validateEvidence(report);
}
