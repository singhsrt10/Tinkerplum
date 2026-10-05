// Known request plans make the evidence contract reviewable and bounded.
const get = (path, actor = 'anonymous') => ({ method: 'GET', path, actor });
const patch = (owner, actor) => ({ method: 'PATCH', path: `/api/records/${owner}`, actor });
const record = (owner, actor = owner) => get(`/api/records/${owner}`, actor);
const json = response => { try { return JSON.parse(response.body); } catch { return {}; } };
const own = (r, actor) => r.status === 200 && json(r).owner === actor && typeof json(r).value === 'string';
const denied = r => [401, 403].includes(r.status) && Object.keys(json(r)).join(',') === 'error'
  && ['unauthenticated', 'forbidden'].includes(json(r).error);
const unchanged = owner => r => denied(r[1]) && own(r[0], owner) && own(r[2], owner) && r[0].body === r[2].body;
const noStore = r => /(?:^|,)\s*no-store\s*(?:,|$)/i.test(r.headers['cache-control'] ?? '')
  && !/(?:^|,)\s*public\s*(?:,|$)/i.test(r.headers['cache-control'] ?? '');

export const catalog = [
  { id: 'HTTP-01', criterion: 'Homepage serves HTML', group: 'all', plan: [get('/')], pass: r => r[0].status === 200 && r[0].headers['content-type'].startsWith('text/html') && r[0].body.includes('<h1>') },
  { id: 'HTTP-02', criterion: 'Missing route returns 404', group: 'all', plan: [get('/missing')], pass: r => r[0].status === 404 },
  { id: 'HTTP-03', criterion: 'Referenced stylesheet serves CSS', group: 'all', plan: [get('/'), get('/asset.css')], pass: r => r[0].status === 200 && r[0].body.includes('href="/asset.css"') && r[1].status === 200 && r[1].headers['content-type'].startsWith('text/css') && r[1].body.includes('body') },
  { id: 'AUTH-01', criterion: 'Anonymous read and mutation denied', group: 'users', plan: [record('a', 'anonymous'), patch('a', 'anonymous')], pass: r => r.every(denied) },
  { id: 'AUTH-02', criterion: 'Both users can read their own record', group: 'users', plan: [record('a'), record('b')], pass: r => own(r[0], 'a') && own(r[1], 'b') },
  { id: 'AUTH-03', criterion: 'A cannot read B record', group: 'users', plan: [record('b', 'a')], pass: r => denied(r[0]) },
  { id: 'AUTH-04', criterion: 'B cannot read A record', group: 'users', plan: [record('a', 'b')], pass: r => denied(r[0]) },
  { id: 'AUTH-05', criterion: 'A cannot mutate B record; owner readback unchanged', group: 'users', plan: [record('b'), patch('b', 'a'), record('b')], pass: unchanged('b') },
  { id: 'AUTH-06', criterion: 'B cannot mutate A record; owner readback unchanged', group: 'users', plan: [record('a'), patch('a', 'b'), record('a')], pass: unchanged('a') },
  { id: 'AUTH-07', criterion: 'Both owners can mutate and read back their record', group: 'users', plan: [patch('a', 'a'), record('a'), patch('b', 'b'), record('b')], pass: r => own(r[0], 'a') && own(r[2], 'b') && r.every((x, i) => json(x).value === `updated by ${i < 2 ? 'a' : 'b'}`) && r[0].body === r[1].body && r[2].body === r[3].body && r[1].status === 200 && r[3].status === 200 },
  { id: 'CACHE-01', criterion: 'Both personalized responses prohibit storage', group: 'users', plan: [get('/api/me', 'a'), get('/api/me', 'b')], pass: r => own(r[0], 'a') && own(r[1], 'b') && r.every(noStore) },
  { id: 'CACHE-02', criterion: 'A then B remain isolated through synthetic shared cache', group: 'users', cache: true, plan: [get('/api/me', 'a'), get('/api/me', 'b')], pass: r => own(r[0], 'a') && own(r[1], 'b') },
  { id: 'API-01', criterion: 'Unavailable dependency produces explicit unsuccessful response', group: 'integration', plan: [get('/api/integration')], pass: r => r[0].status === 503 && json(r[0]).ok === false && typeof json(r[0]).error === 'string' },
  { id: 'DEPLOY-01', criterion: 'Deployment evidence available for candidate', group: 'deployment', plan: [], pass: () => false },
];
export function applicable(check, fixture) {
  return check.group === 'all' || check.group === 'deployment'
    || (check.group === 'users' && fixture.startsWith('two-user-'))
    || (check.group === 'integration' && fixture === 'integration-failure');
}
export const critical = (check, scope) => check.group !== 'deployment' || scope === 'release-evidence';
export function verdict(checks) {
  if (checks.some(c => c.critical && c.status === 'FAIL')) return 'NOT READY';
  if (checks.some(c => c.critical && c.status === 'NOT RUN')) return 'INSUFFICIENT EVIDENCE';
  return 'READY';
}
