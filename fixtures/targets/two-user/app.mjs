// Deliberately synthetic identities. This is NOT a deployable authentication system.
export function twoUser({ broken }) {
  const records = { a: { owner: 'a', value: 'A synthetic note' }, b: { owner: 'b', value: 'B synthetic note' } };
  return (req, res, send) => {
    const actor = req.headers['x-fixture-user'];
    if (!Object.hasOwn(records, actor ?? '')) return send(401, { error: 'unauthenticated' });
    const owner = req.url === '/api/me' ? actor : req.url.split('/')[3];
    if (!Object.hasOwn(records, owner ?? '')) return send(404, { error: 'not found' });
    if (!broken && owner !== actor) return send(403, { error: 'forbidden' });
    if (req.method === 'PATCH' && req.url.startsWith('/api/records/')) {
      // Fixed synthetic mutation avoids arbitrary request payloads or persistent writes.
      records[owner].value = `updated by ${actor}`;
    } else if (req.method !== 'GET') return send(405, { error: 'method not allowed' });
    return send(200, records[owner], {
      'cache-control': broken ? 'public, max-age=60' : 'private, no-store',
    });
  };
}
