import { readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
for (const dir of ['adapter', 'fixtures', 'tests', 'scripts']) {
  for (const path of readdirSync(dir, { recursive: true }).filter(p => p.endsWith('.mjs'))) {
    execFileSync(process.execPath, ['--check', `${dir}/${path}`]);
  }
}
for (const file of ['README.md', ...readdirSync('docs').filter(p => p.endsWith('.md')).map(p => `docs/${p}`)]) {
  if (readFileSync(file, 'utf8').includes('\u2014')) throw new Error(`${file}: em dash found`);
}
console.log('JavaScript syntax and documentation punctuation checks passed.');
