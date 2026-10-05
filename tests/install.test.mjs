import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, readFileSync, writeFileSync, mkdtempSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = fileURLToPath(new URL('../', import.meta.url));
function files(dir) { return readdirSync(dir, { recursive: true, withFileTypes: true }).filter(f => f.isFile()).map(f => relative(dir, join(f.parentPath, f.name))).sort(); }
function setup(t) {
  const temp = mkdtempSync(join(tmpdir(), 'tinkerplum-install-'));
  t.after(() => rmSync(temp, { recursive: true, force: true }));
  // An extracted distribution has no Git metadata or installed npm packages.
  const archive = join(temp, 'extracted source');
  mkdirSync(join(archive, 'scripts'), { recursive: true });
  cpSync(join(root, 'scripts/install-skill.mjs'), join(archive, 'scripts/install-skill.mjs'));
  cpSync(join(root, 'tinker-plum'), join(archive, 'tinker-plum'), { recursive: true });
  const run = (...args) => spawnSync(process.execPath, [join(archive, 'scripts/install-skill.mjs'), ...args],
    { cwd: temp, encoding: 'utf8', timeout: 10000 });
  return { temp, archive, run };
}
for (const mode of ['--project', '--dest']) {
  test(`portable installer ${mode} copies the complete skill and preserves an existing installation`, t => {
    const { temp, archive, run } = setup(t);
    const target = join(temp, 'destination with spaces');
    if (mode === '--project') mkdirSync(target);
    const dest = join(target, ...(mode === '--project' ? ['.agents', 'skills'] : []), 'tinker-plum');
    const result = run(mode, target);
    assert.equal(result.status, 0, result.stderr);
    const source = join(archive, 'tinker-plum');
    assert.deepEqual(files(dest), files(source));
    for (const path of files(source)) assert.deepEqual(readFileSync(join(dest, path)), readFileSync(join(source, path)));
    writeFileSync(join(dest, 'SKILL.md'), 'local customization');
    assert.equal(run(mode, target).status, 1);
    assert.equal(readFileSync(join(dest, 'SKILL.md'), 'utf8'), 'local customization');
  });
}
test('installer rejects invalid arguments and a missing project without creating it', t => {
  const { temp, run } = setup(t);
  const missing = join(temp, 'missing project');
  for (const args of [[], ['--unknown'], ['--project'], ['--dest'], ['--user', 'extra'], ['--project', missing], ['--dest', missing, 'extra']]) {
    assert.equal(run(...args).status, 1, args.join(' '));
  }
  assert.equal(existsSync(missing), false);
  assert.equal(run('--help').status, 0);
});
test('installer refuses recursive destinations and existing files', t => {
  const { temp, archive, run } = setup(t);
  const source = join(archive, 'tinker-plum');
  const before = files(source);
  assert.equal(run('--dest', source).status, 1);
  assert.equal(run('--dest', join(source, 'nested')).status, 1);
  assert.deepEqual(files(source), before);
  const dest = join(temp, 'tinker-plum');
  writeFileSync(dest, 'keep');
  assert.equal(run('--dest', temp).status, 1);
  assert.equal(readFileSync(dest, 'utf8'), 'keep');
});

test('rename refuses a legacy installation without touching customizations or creating duplicates', t => {
  const { temp, run } = setup(t);
  const legacy = join(temp, 'production-readiness');
  mkdirSync(legacy);
  writeFileSync(join(legacy, 'SKILL.md'), 'local customization');
  const result = run('--dest', temp);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Legacy production-readiness installation/);
  assert.equal(readFileSync(join(legacy, 'SKILL.md'), 'utf8'), 'local customization');
  assert.equal(existsSync(join(temp, 'tinker-plum')), false);
});
