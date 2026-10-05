export const dynamic = 'force-dynamic';
const records = { a: { owner: 'a', value: 'A synthetic note' }, b: { owner: 'b', value: 'B synthetic note' } };
const send = (body, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': 'private, no-store' },
});
async function handle(request, context) {
  // A fixture identity, not a login mechanism. Never reuse in a real application.
  const actor = request.headers.get('x-fixture-user');
  if (!Object.hasOwn(records, actor ?? '')) return send({ error: 'unauthenticated' }, 401);
  const { path } = await context.params;
  const owner = path.length === 1 && path[0] === 'me' ? actor
    : path.length === 2 && path[0] === 'records' ? path[1] : undefined;
  if (!Object.hasOwn(records, owner ?? '')) return send({ error: 'not found' }, 404);
  if (owner !== actor) return send({ error: 'forbidden' }, 403);
  if (request.method === 'PATCH') records[owner].value = `updated by ${actor}`;
  return send(records[owner]);
}
export const GET = handle;
export const PATCH = handle;
