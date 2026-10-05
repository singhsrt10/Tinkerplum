import { cpSync, lstatSync, mkdirSync, realpathSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const usage = 'Usage: node scripts/install-skill.mjs --user | --project <existing-directory> | --dest <skills-directory>';
const source = fileURLToPath(new URL('../production-readiness', import.meta.url));
try {
  const [mode, path, ...extra] = process.argv.slice(2);
  if (mode === '--help' && !path) { console.log(usage); }
  else {
    if (extra.length || !['--user', '--project', '--dest'].includes(mode)
      || (mode === '--user' ? path !== undefined : !path || path.startsWith('--'))) throw new Error(usage);
    if (mode === '--project' && !lstatSync(resolve(path)).isDirectory()) throw new Error('Project must be an existing directory');
    const parent = mode === '--user' ? join(homedir(), '.agents', 'skills')
      : mode === '--project' ? resolve(path, '.agents', 'skills') : resolve(path);
    const destination = join(parent, 'production-readiness');
    // Resolve the existing ancestor too, so a symlink cannot direct a recursive copy into its source.
    let ancestor = destination;
    while (true) {
      try { lstatSync(ancestor); break; }
      catch (error) { if (error.code !== 'ENOENT') throw error; ancestor = dirname(ancestor); }
    }
    const resolvedDestination = resolve(realpathSync(ancestor), relative(ancestor, destination));
    const inside = relative(realpathSync(source), resolvedDestination);
    if (!inside || (!isAbsolute(inside) && inside !== '..' && !inside.startsWith(`..${sep}`))) {
      throw new Error('Installation destination must be outside the source skill folder');
    }
    mkdirSync(parent, { recursive: true });
    // Exclusive creation refuses existing files, directories and dangling symlinks.
    mkdirSync(destination);
    try { cpSync(source, destination, { recursive: true, force: false, errorOnExist: true }); }
    catch (error) { rmSync(destination, { recursive: true, force: true }); throw error; }
    console.log(`Installed: ${destination}`);
    console.log('Select production-readiness in the destination Codex environment; restart if it is not discovered.');
  }
} catch (error) {
  console.error(error.code === 'EEXIST' ? 'Destination already exists. Preserve it and review updates before replacing it.' : error.message);
  process.exitCode = 1;
}
