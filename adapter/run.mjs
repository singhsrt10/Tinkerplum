import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { startFixture } from '../fixtures/server.mjs';
import { catalog, applicable, critical, verdict } from './catalog.mjs';
import { probe, sharedCache } from './probe.mjs';
import { validateEvidence } from './validate.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
export function candidate() {
  const git = (...args) => execFileSync(process.env.GIT ?? 'git', args, { cwd: root, encoding: 'utf8' }).trim();
  const hash = createHash('sha256');
  function include(path) {
    for (const item of readdirSync(join(root, path), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const name = join(path, item.name);
      if (item.isDirectory()) include(name);
      else if (item.isFile()) hash.update(name).update('\0').update(readFileSync(join(root, name))).update('\0');
    }
  }
  for (const path of ['adapter', 'fixtures', 'schema']) include(path);
  for (const path of ['package.json', 'package-lock.json']) hash.update(path).update('\0').update(readFileSync(join(root, path))).update('\0');
  return { revision: git('rev-parse', 'HEAD'), dirty: git('status', '--porcelain').length > 0, source_sha256: hash.digest('hex') };
}
export async function runFixture(name, scope = 'local-fixture') {
  if (!['local-fixture', 'release-evidence'].includes(scope)) throw new Error('Unsupported assessment scope');
  const report = {
    schema_version: '1.0.0', fixture: name, scope, candidate: candidate(),
    environment: { kind: 'isolated-loopback', platform: process.platform, arch: process.arch,
      tools: { node: process.version, adapter: '0.1.0', ajv: require('ajv/package.json').version } },
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
  report.finished_at = new Date().toISOString();
  report.verdict = verdict(report.checks);
  return validateEvidence(report);
}
