import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { root } from './snapshot.mjs';
// Ignore runtime cache/diagnostics, but bind evidence to executable/server/client build output.
export function nextArtifactDigest() {
  const base = join(root, 'fixtures/nextjs/.next');
  const hash = createHash('sha256');
  function include(dir, relative = '') {
    for (const item of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : 1)) {
      if (!relative && ['cache', 'diagnostics', 'trace', 'trace-build', 'tinkerplum-source.json'].includes(item.name)) continue;
      if (relative === 'server' && item.name === 'route-cache') continue;
      const name = relative ? `${relative}/${item.name}` : item.name;
      if (item.isDirectory()) include(join(dir, item.name), name);
      else if (item.isFile()) hash.update(name).update('\0').update(readFileSync(join(dir, item.name))).update('\0');
      else throw new Error('Non-regular Next.js build input');
    }
  }
  include(base);
  return hash.digest('hex');
}
