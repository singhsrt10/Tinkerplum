import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { digest, inputFiles } from '../adapter/snapshot.mjs';
import { compare } from './compare.mjs';
const ajv = new Ajv({ allErrors: true }); addFormats(ajv);
const shape = ajv.compile(JSON.parse(readFileSync(new URL('../schema/model-record-v2.schema.json', import.meta.url))));
const truth = JSON.parse(readFileSync(new URL('../tests/expected.json', import.meta.url)));
const skillRoot = fileURLToPath(new URL('../tinker-plum/', import.meta.url));
export const protocolVersion = 'model-protocol-2.0.0';
export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
export function conditionInstructions(condition, skillDirectory = skillRoot) {
  if (!['baseline', 'skill-assisted'].includes(condition)) throw new Error('Unknown study condition');
  const prompt = readFileSync(new URL(`./prompts/${condition}.txt`, import.meta.url), 'utf8');
  let skill_package = null;
  let rendered_instructions = prompt;
  if (condition === 'skill-assisted') {
    const contents = {};
    function walk(directory, prefix = '') {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const name = `${prefix}${entry.name}`;
        if (entry.isDirectory()) walk(join(directory, entry.name), `${name}/`);
        else if (entry.isFile()) contents[name] = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(readFileSync(join(directory, entry.name)));
        else throw new Error(`Skill package requires regular files: ${name}`);
      }
    }
    walk(skillDirectory);
    if (!contents['SKILL.md']) throw new Error('Skill package requires SKILL.md');
    const files = Object.fromEntries(Object.keys(contents).sort().map(path => [path, digest(contents[path])]));
    skill_package = { files, sha256: digest(canonicalJson(files)) };
    rendered_instructions += `\nSupplied skill package, as a JSON mapping of relative file paths to exact UTF-8 contents:\n${canonicalJson(contents)}\n`;
  }
  return { prompt_sha256: digest(prompt), skill_package, rendered_instructions,
    rendered_instructions_sha256: digest(rendered_instructions) };
}
export function protocolMetadata() {
  const inputs = Object.fromEntries(Object.entries(inputFiles()).filter(([path]) => path === 'fixtures/server.mjs' || path.startsWith('fixtures/targets/') || path === 'tests/expected.json'));
  return { protocol_version: protocolVersion, dataset_sha256: digest(JSON.stringify(inputs)),
    conditions: Object.fromEntries(['baseline', 'skill-assisted'].map(condition => [condition, conditionInstructions(condition)])) };
}
export function scoreModelPair(baseline, assisted) {
  for (const record of [baseline, assisted]) {
    if (record?.schema_version !== 'model-record-2.0.0') throw new Error('Unsupported model record version. Version 1 lacks exact skill/instruction/log identity; retain it as historical evidence and collect a version 2 run, do not relabel it.');
    if (!shape(record)) throw new Error(ajv.errorsText(shape.errors));
    if (record.run_status !== 'COMPLETED') throw new Error('Unperformed or failed model runs cannot be scored as completed');
  }
  const metadata = protocolMetadata();
  const sessions = new Set();
  for (const [record, condition] of [[baseline, 'baseline'], [assisted, 'skill-assisted']]) {
    if (record.dataset_sha256 !== metadata.dataset_sha256) throw new Error('Recorded dataset does not match the current fixtures and expected findings');
    if (record.condition !== condition) throw new Error('Expected baseline and skill-assisted conditions in order');
    for (const [key, expected] of Object.entries(metadata.conditions[condition])) {
      if (!isDeepStrictEqual(record[key], expected)) throw new Error(`Recorded ${key} does not match the published protocol`);
    }
    if (record.settings_sha256 !== digest(canonicalJson(record.settings))) throw new Error('Settings hash does not match recorded settings');
    if (Date.parse(record.started_at) > Date.parse(record.finished_at)) throw new Error('Run timestamps reversed');
    const names = record.cases.map(c => c.fixture);
    if (!isDeepStrictEqual([...names].sort(), Object.keys(truth).sort())) throw new Error('Each fixture must appear exactly once');
    for (const item of record.cases) {
      if (sessions.has(item.session_id)) throw new Error('Each case and condition requires a distinct session ID');
      sessions.add(item.session_id);
      if (item.session_log_sha256 !== digest(item.session_log)) throw new Error('Session log hash does not match recorded log');
      if (new Set(item.findings.map(f => f.check_id)).size !== item.findings.length) throw new Error('Duplicate finding ID');
      for (const finding of item.findings) {
        if (!item.raw_output.includes(finding.citation)) throw new Error('Adjudicated finding citation must occur in the recorded raw output');
      }
    }
  }
  for (const key of ['study_id', 'model_version', 'settings_sha256', 'dataset_sha256', 'protocol_version']) {
    if (baseline[key] !== assisted[key]) throw new Error(`Paired runs differ: ${key}`);
  }
  return { schema_version: 'model-comparison-2.0.0', protocol_version: metadata.protocol_version, study_id: baseline.study_id,
    dataset_sha256: metadata.dataset_sha256, model_version: baseline.model_version, settings_sha256: baseline.settings_sha256,
    status: 'RECORDED RESULTS SCORED', limits: ['Imported records are not authenticated model runs.', 'Known synthetic cases; human adjudication and no general effectiveness claim.'],
    conditions: [baseline, assisted].map(record => ({ condition: record.condition, record_sha256: digest(canonicalJson(record)), skill_package: record.skill_package,
      rendered_instructions_sha256: record.rendered_instructions_sha256, cases: record.cases.map(item => ({ fixture: item.fixture,
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
