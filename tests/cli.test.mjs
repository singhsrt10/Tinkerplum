import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const cli = fileURLToPath(new URL('../adapter/cli.mjs', import.meta.url));
test('CLI validates evidence, distinguishes target defects from command failure, rejects real URLs', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'tinkerplum-cli-'));
  const run = (...args) => spawnSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8', timeout: 10000 });
  try {
    const result = run('two-user-broken');
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /NOT READY/);
    const path = join(cwd, 'reports/two-user-broken.json');
    assert.equal(run('validate', path).status, 0);
    const report = JSON.parse(readFileSync(path));
    report.checks.find(c => c.id === 'AUTH-03').status = 'PASS';
    writeFileSync(path, JSON.stringify(report));
    assert.equal(run('validate', path).status, 1);
    assert.equal(run('https://example.com').status, 1);
    assert.equal(run('portfolio', '--unknown').status, 1);
    assert.equal(run('validate').status, 1);
  } finally { rmSync(cwd, { recursive: true, force: true }); }
});


test('historical CLI validation and linkage work in an archive without Git or fixture executors', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'tinkerplum-archive-'));
  const root = fileURLToPath(new URL('../', import.meta.url));
  const run = (file, ...args) => spawnSync(process.execPath, [join(cwd, 'adapter', file), ...args], {
    cwd, encoding: 'utf8', timeout: 10000, env: { ...process.env, GIT: join(cwd, 'no-git') },
  });
  try {
    cpSync(join(root, 'adapter'), join(cwd, 'adapter'), { recursive: true });
    cpSync(join(root, 'schema'), join(cwd, 'schema'), { recursive: true });
    cpSync(join(root, 'node_modules'), join(cwd, 'node_modules'), { recursive: true });
    // Intentionally omit .git, fixtures and runner: stored evidence must stand alone.
    rmSync(join(cwd, 'adapter', 'run.mjs'));
    for (const version of [1, 2]) {
      const path = join(cwd, `v${version}.json`);
      cpSync(join(root, 'tests', 'fixtures', `evidence-v${version}.json`), path);
      const result = run('cli.mjs', 'validate', path);
      assert.equal(result.status, 0, result.stderr);
    }
    const before = JSON.parse(readFileSync(join(cwd, 'v2.json')));
    const after = JSON.parse(JSON.stringify(before), (key, value) =>
      ['started_at', 'finished_at', 'timestamp'].includes(key) ? new Date(Date.parse(value) + 60000).toISOString() : value);
    writeFileSync(join(cwd, 'after.json'), JSON.stringify(after));
    const linked = run('lifecycle-cli.mjs', 'link', 'v2.json', 'after.json', 'link.json', 'Archived repeat run');
    assert.equal(linked.status, 0, linked.stderr);
    const checked = run('lifecycle-cli.mjs', 'validate-link', 'link.json');
    assert.equal(checked.status, 0, checked.stderr);
    before.verdict = 'unsupported verdict';
    writeFileSync(join(cwd, 'invalid.json'), JSON.stringify(before));
    assert.equal(run('cli.mjs', 'validate', 'invalid.json').status, 1);
    assert.equal(run('lifecycle-cli.mjs', 'current', 'v2.json', 'portfolio').status, 1);
  } finally { rmSync(cwd, { recursive: true, force: true }); }
});
