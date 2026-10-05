import { fork } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { nextArtifactDigest } from '../adapter/next-build-state.mjs';
import { root, nextSourceDigest } from '../adapter/snapshot.mjs';
export async function startNextFixture() {
  const stamp = JSON.parse(readFileSync(join(root, 'fixtures/nextjs/.next/tinkerplum-source.json'), 'utf8'));
  if (stamp.source_sha256 !== nextSourceDigest()) throw new Error('Next.js build is stale; run npm run next:build');
  if (stamp.artifact_sha256 !== nextArtifactDigest()) throw new Error('Next.js build output changed; run npm run next:build');
  const child = fork(join(root, 'fixtures/nextjs/server.mjs'), [], {
    execArgv: [], stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    env: { PATH: process.env.PATH, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1' },
  });
  let logs = '';
  child.stdout.on('data', data => { logs = (logs + data).slice(-4000); });
  child.stderr.on('data', data => { logs = (logs + data).slice(-4000); });
  let exited = false;
  const exit = new Promise(resolve => child.once('exit', () => { exited = true; resolve(); }));
  const stop = async () => {
    if (exited) return;
    if (child.connected) child.send('close');
    const timer = setTimeout(() => child.kill('SIGKILL'), 3000);
    try { await exit; } finally { clearTimeout(timer); }
  };
  try {
    const origin = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Next.js startup timed out: ${logs}`)), 15000);
      child.once('error', error => { clearTimeout(timer); reject(error); });
      child.once('exit', () => { clearTimeout(timer); reject(new Error(`Next.js exited during startup: ${logs}`)); });
      child.once('message', message => {
        clearTimeout(timer);
        if (message.type !== 'ready' || !/^http:\/\/127\.0\.0\.1:[0-9]+$/.test(message.origin)) return reject(new Error('Invalid Next.js fixture origin'));
        resolve(message.origin);
      });
    });
    return { origin, close: stop };
  } catch (error) { await stop(); throw error; }
}
