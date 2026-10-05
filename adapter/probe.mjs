export async function probe(origin, request) {
  const url = new URL(request.path, origin);
  if (url.origin !== origin || url.hostname !== '127.0.0.1' || url.protocol !== 'http:') throw new Error('Loopback fixture requests only');
  const response = await fetch(url, {
    method: request.method,
    headers: request.actor === 'anonymous' ? {} : { 'x-fixture-user': request.actor },
    redirect: 'error', signal: AbortSignal.timeout(2000),
  });
  const reader = response.body?.getReader();
  const chunks = [];
  let bytes = 0;
  if (reader) {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 16384) {
          await reader.cancel();
          throw new Error('Fixture response exceeds evidence limit');
        }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
  }
  const body = new TextDecoder().decode(Buffer.concat(chunks, bytes));
  return { status: response.status, body, headers: {
    'content-type': response.headers.get('content-type') ?? '',
    'cache-control': response.headers.get('cache-control') ?? '',
  } };
}

// Intentionally small model, not an RFC-complete proxy or browser/CDN emulator.
export function sharedCache(fetchResponse) {
  const entries = new Map();
  return async request => {
    if (entries.has(request.path)) return { response: structuredClone(entries.get(request.path)), source: 'synthetic-cache' };
    const response = await fetchResponse(request);
    const control = response.headers['cache-control'];
    if (request.method === 'GET' && response.status === 200 && /\bpublic\b/i.test(control)
      && /\bmax-age=[1-9][0-9]*\b/i.test(control) && !/\b(no-store|private)\b/i.test(control)) {
      entries.set(request.path, structuredClone(response));
    }
    return { response, source: 'origin' };
  };
}
