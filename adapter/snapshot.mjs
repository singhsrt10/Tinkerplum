import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, lstatSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
export const root = fileURLToPath(new URL('../', import.meta.url));
export const digest = value => createHash('sha256').update(value).digest('hex');
export function inputFiles(base = root) {
  const names = execFileSync(process.env.GIT ?? 'git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: base }).toString().split('\0').filter(Boolean);
  const files = {};
  for (const name of [...new Set(names)].sort()) {
    const path = join(base, name);
    try {
      if (!lstatSync(path).isFile()) throw new Error(`Evidence inputs must be regular files: ${name}`);
      files[name] = digest(readFileSync(path));
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return files;
}
export function candidate() {
  const git = (...args) => execFileSync(process.env.GIT ?? 'git', args, { cwd: root, encoding: 'utf8' }).trim();
  const inputs = inputFiles();
  return { revision: git('rev-parse', 'HEAD'), dirty: git('status', '--porcelain').length > 0,
    source_sha256: digest(JSON.stringify(inputs)), inputs };
}
export function nextSourceDigest() {
  return digest(JSON.stringify(Object.fromEntries(Object.entries(inputFiles()).filter(([path]) => path.startsWith('fixtures/nextjs/')))));
}
