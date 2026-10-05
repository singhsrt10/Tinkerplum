import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
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
