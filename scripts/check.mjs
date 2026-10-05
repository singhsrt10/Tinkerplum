import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(item => {
    if (['node_modules', '.next'].includes(item.name)) return [];
    const path = `${dir}/${item.name}`;
    return item.isDirectory() ? walk(path) : [path];
  });
}
for (const path of ['adapter', 'fixtures', 'tests', 'scripts', 'evaluation'].flatMap(walk).filter(p => p.endsWith('.mjs'))) {
  execFileSync(process.execPath, ['--check', path]);
}
for (const file of ['README.md', ...walk('docs'), ...walk('production-readiness')].filter(p => p.endsWith('.md'))) {
  const text = readFileSync(file, 'utf8');
  if (text.includes('\u2014')) throw new Error(`${file}: em dash found`);
  for (const [, link] of text.matchAll(/\]\(([^)]+)\)/g)) {
    if (!link.startsWith('https:') && !link.startsWith('#') && !existsSync(resolve(dirname(file), link.split('#')[0]))) {
      throw new Error(`${file}: missing relative link ${link}`);
    }
  }
}
console.log('JavaScript syntax, documentation links and punctuation checks passed.');
