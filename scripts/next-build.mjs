import { execFileSync } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { root, nextSourceDigest } from '../adapter/snapshot.mjs';
import { nextArtifactDigest } from '../adapter/next-build-state.mjs';
const stamp = join(root, 'fixtures/nextjs/.next/tinkerplum-source.json');
rmSync(stamp, { force: true });
const before = nextSourceDigest();
execFileSync(process.execPath, [join(root, 'fixtures/nextjs/node_modules/next/dist/bin/next'), 'build', '--webpack'], { cwd: join(root, 'fixtures/nextjs'),
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }, stdio: 'inherit' });
if (before !== nextSourceDigest()) throw new Error('Next.js source changed during build; rebuild before testing');
writeFileSync(stamp, JSON.stringify({ source_sha256: before, artifact_sha256: nextArtifactDigest() }));
