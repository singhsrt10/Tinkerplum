import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { digest, inputFiles } from '../adapter/snapshot.mjs';
import { compare } from './run.mjs';
const ajv = new Ajv({ allErrors: true }); addFormats(ajv);
const shape = ajv.compile(JSON.parse(readFileSync(new URL('../schema/model-record-v1.schema.json', import.meta.url))));
const truth = JSON.parse(readFileSync(new URL('../tests/expected.json', import.meta.url)));
export function protocolMetadata() {
  const inputs = Object.fromEntries(Object.entries(inputFiles()).filter(([path]) => path === 'fixtures/server.mjs' || path.startsWith('fixtures/targets/') || path === 'tests/expected.json'));
  return { dataset_sha256: digest(JSON.stringify(inputs)), prompts: Object.fromEntries(['baseline', 'skill-assisted'].map(condition => [condition, digest(readFileSync(new URL(`./prompts/${condition}.txt`, import.meta.url)))])) };
}
export function scoreModelPair(baseline, assisted) {
  for (const [record, condition] of [[baseline, 'baseline'], [assisted, 'skill-assisted']]) {
    if (!shape(record)) throw new Error(ajv.errorsText(shape.errors));
    if (record.run_status !== 'COMPLETED') throw new Error('Unperformed or failed model runs cannot be scored as completed');
    if (record.dataset_sha256 !== protocolMetadata().dataset_sha256) throw new Error('Recorded dataset does not match the current fixtures and expected findings');
    if (record.condition !== condition) throw new Error('Expected baseline and skill-assisted conditions in order');
    const prompt = readFileSync(new URL(`./prompts/${condition}.txt`, import.meta.url));
    if (record.prompt_sha256 !== digest(prompt)) throw new Error('Prompt hash does not match the published protocol');
    if (Date.parse(record.started_at) > Date.parse(record.finished_at)) throw new Error('Run timestamps reversed');
    const names = record.cases.map(c => c.fixture);
    if (!isDeepStrictEqual([...names].sort(), Object.keys(truth).sort())) throw new Error('Each fixture must appear exactly once');
    for (const item of record.cases) {
      if (new Set(item.findings.map(f => f.check_id)).size !== item.findings.length) throw new Error('Duplicate finding ID');
      for (const finding of item.findings) {
        if (!item.raw_output.includes(finding.citation)) throw new Error('Adjudicated finding citation must occur in the recorded raw output');
      }
    }
  }
  for (const key of ['study_id', 'model_version', 'settings_sha256', 'dataset_sha256']) {
    if (baseline[key] !== assisted[key]) throw new Error(`Paired runs differ: ${key}`);
  }
  return { schema_version: 'model-comparison-1.0.0', study_id: baseline.study_id,
    status: 'RECORDED RESULTS SCORED', limits: ['Imported records are not authenticated model runs.', 'Known synthetic cases; human adjudication and no general effectiveness claim.'],
    conditions: [baseline, assisted].map(record => ({ condition: record.condition, cases: record.cases.map(item => ({ fixture: item.fixture,
      ...compare(truth[item.fixture].failures, item.findings.map(f => f.check_id)) })) })) };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length === 3 && process.argv[2] === 'protocol') {
      console.log(JSON.stringify(protocolMetadata(), null, 2));
    } else {
    if (process.argv.length !== 4) throw new Error('Usage: node evaluation/score-model.mjs BASELINE.json SKILL-ASSISTED.json');
    console.log(JSON.stringify(scoreModelPair(...process.argv.slice(2).map(p => JSON.parse(readFileSync(p, 'utf8')))), null, 2));
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
