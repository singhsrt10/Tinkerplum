import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateEvidence } from './validate.mjs';

try {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'validate') {
    if (args.length === 0) throw new Error('Usage: npm run validate -- reports/file.json [reports/other.json]');
    for (const path of args) {
      const report = validateEvidence(JSON.parse(readFileSync(path, 'utf8')));
      console.log(`${path}: valid ${report.schema_version}, ${report.verdict} (${report.scope})`);
    }
  } else {
    const { fixtures, supportedFixtures } = await import('../fixtures/server.mjs');
    if (!['all', ...supportedFixtures].includes(command) || args.length > 1 || (args.length && args[0] !== '--release')) {
      throw new Error('Usage: node adapter/cli.mjs <all|portfolio|two-user-broken|two-user-fixed|integration-failure|nextjs-fixed> [--release]');
    }
    const { runFixture } = await import('./run.mjs');
    mkdirSync('reports', { recursive: true });
    for (const name of command === 'all' ? fixtures : [command]) {
      const report = await runFixture(name, args[0] === '--release' ? 'release-evidence' : 'local-fixture');
      const path = resolve('reports', `${name}${args[0] ? '-release' : ''}.json`);
      writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
      console.log(`${name}: ${report.verdict} (${report.scope}); ${path}`);
    }
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
