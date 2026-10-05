import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
function files(dir) { return readdirSync(dir, { recursive: true, withFileTypes: true }).filter(f => f.isFile()).map(f => join(f.parentPath, f.name).slice(dir.length + 1)).sort(); }
test('README personal/project installation copies the complete skill and refuses overwrite', () => {
  const root = process.cwd(), temp = mkdtempSync(join(tmpdir(), 'tinkerplum-install-'));
  try {
    const personal = join(temp, 'personal space'), project = join(temp, 'website space');
    mkdirSync(personal); mkdirSync(project);
    const text = readFileSync('README.md', 'utf8');
    const blocks = [...text.matchAll(/```sh\n([\s\S]*?)```/g)].map(m => m[1]);
    const installs = blocks.filter(b => b.includes('dest=') && b.includes('cp -R production-readiness'));
    assert.equal(installs.length, 2);
    for (const block of installs) {
      const dest = join(block.includes('$HOME') ? personal : project, '.agents/skills/production-readiness');
      const script = block.replaceAll('$HOME', personal).replaceAll('/absolute/path/to/your-website-repository', project);
      const run = () => spawnSync('/bin/sh', [], { cwd: root, input: script, encoding: 'utf8' });
      assert.equal(run().status, 0); assert.equal(run().status, 1);
      const source = join(root, 'production-readiness');
      assert.deepEqual(files(dest), files(source));
      for (const path of files(source)) assert.deepEqual(readFileSync(join(dest, path)), readFileSync(join(source, path)));
    }
  } finally { rmSync(temp, { recursive: true, force: true }); }
});
