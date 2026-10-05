import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { assessFreshness, linkReports, validateLink } from './lifecycle.mjs';
const read = path => JSON.parse(readFileSync(path, 'utf8'));
const save = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
try {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'example' && !args.length) {
    const { runFixture } = await import('./run.mjs');
    mkdirSync('reports', { recursive: true });
    const before = await runFixture('two-user-broken');
    const after = await runFixture('two-user-fixed');
    const link = linkReports(before, after, 'Select the bundled ownership-check and private/no-store fixed variant; no real app was patched.');
    validateLink(link);
    save('reports/before.json', before); save('reports/after.json', after); save('reports/fix-recheck.json', link);
    console.log(`Resolved in this fixture comparison: ${link.resolved.join(', ')}. No production claim.`);
  } else if (command === 'link' && args.length === 4) {
    const [before, after, output, note] = args;
    save(output, validateLink(linkReports(read(before), read(after), note)));
    console.log(`Linked evidence written to ${output}`);
  } else if (command === 'validate-link' && args.length === 1) {
    validateLink(read(args[0])); console.log('Linkage validated against embedded before/after evidence');
  } else if (command === 'current' && [2, 3].includes(args.length) && (!args[2] || args[2] === '--release')) {
    const { supportedFixtures } = await import('../fixtures/server.mjs');
    if (!supportedFixtures.includes(args[1])) throw new Error('Only bundled synthetic fixtures are supported');
    const { environmentFor } = await import('./run.mjs');
    const { candidate } = await import('./snapshot.mjs');
    const current = { candidate: candidate(), fixture: args[1], scope: args[2] ? 'release-evidence' : 'local-fixture',
      environment: environmentFor(args[1]) };
    const result = assessFreshness(read(args[0]), current);
    console.log(JSON.stringify(result, null, 2));
    if (result.validity !== 'REUSABLE') process.exitCode = 2;
  } else throw new Error('Usage: lifecycle-cli.mjs example | link BEFORE AFTER OUTPUT NOTE | validate-link FILE | current REPORT FIXTURE [--release]');
} catch (error) { console.error(error.message); process.exitCode = 1; }
