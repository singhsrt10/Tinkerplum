import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { catalog, applicable, critical, verdict } from './catalog.mjs';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const shape = ajv.compile(JSON.parse(readFileSync(new URL('../schema/evidence-v1.schema.json', import.meta.url))));
const requireThat = (condition, message) => { if (!condition) throw new Error(message); };
export function validateEvidence(report) {
  requireThat(shape(report), `Schema: ${ajv.errorsText(shape.errors)}`);
  const start = Date.parse(report.started_at), end = Date.parse(report.finished_at);
  requireThat(start <= end, 'Run timestamps reversed');
  const ids = report.checks.map(c => c.id);
  requireThat(new Set(ids).size === catalog.length && catalog.every(c => ids.includes(c.id)), 'Missing, duplicate, or unknown check ID');
  for (const check of report.checks) {
    const rule = catalog.find(c => c.id === check.id);
    const fail = message => `${check.id}: ${message}`;
    requireThat(check.criterion === rule.criterion, fail('criterion mismatch'));
    requireThat(check.critical === critical(rule, report.scope), fail('criticality mismatch'));
    const begin = Date.parse(check.started_at), finish = Date.parse(check.finished_at);
    requireThat(start <= begin && begin <= finish && finish <= end, fail('timestamp outside run'));
    let previous = begin;
    for (const [i, observation] of check.observations.entries()) {
      requireThat(isDeepStrictEqual(observation.request, rule.plan[i]), fail('request sequence mismatch'));
      const at = Date.parse(observation.timestamp);
      requireThat(previous <= at && at <= finish, fail('observation timestamp outside check'));
      previous = at;
      requireThat(rule.cache || observation.source === 'origin', fail('unsupported cache evidence'));
    }
    if (!applicable(rule, report.fixture)) {
      requireThat(check.status === 'N/A' && check.observations.length === 0 && check.error === null, fail('non-applicable check must be N/A without probes'));
      continue;
    }
    requireThat(check.status !== 'N/A', fail('applicable check cannot be N/A'));
    if (rule.group === 'deployment') {
      requireThat(check.status === 'NOT RUN' && check.observations.length === 0 && check.error === null, fail('deployment is unsupported; PASS forbidden'));
      continue;
    }
    if (check.status === 'NOT RUN') {
      requireThat(check.observations.length < rule.plan.length && check.error !== null, fail('unperformed check requires incomplete probes and an error'));
      requireThat(isDeepStrictEqual(check.error.request, rule.plan[check.observations.length]), fail('error must identify next uncompleted request'));
      continue;
    }
    requireThat(check.error === null && check.observations.length === rule.plan.length, fail('PASS/FAIL requires complete observed evidence'));
    if (rule.cache) {
      const [first, second] = check.observations;
      const control = first.response.headers['cache-control'];
      const stored = first.response.status === 200 && /\bpublic\b/i.test(control) && /\bmax-age=[1-9][0-9]*\b/i.test(control) && !/\b(no-store|private)\b/i.test(control);
      requireThat(first.source === 'origin', fail('cache must start empty'));
      requireThat(second.source === (stored ? 'synthetic-cache' : 'origin'), fail('cache source contradicts response policy'));
      if (stored) requireThat(isDeepStrictEqual(first.response, second.response), fail('cached response mismatch'));
    }
    const expected = rule.pass(check.observations.map(o => o.response)) ? 'PASS' : 'FAIL';
    requireThat(check.status === expected, fail(`unsupported ${check.status} claim; observations imply ${expected}`));
  }
  requireThat(report.verdict === verdict(report.checks), 'Verdict contradicts check evidence');
  return report;
}
