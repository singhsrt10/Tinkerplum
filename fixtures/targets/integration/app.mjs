export function failingIntegration() {
  // In-process dependency stub: no provider, credentials, or outgoing network call.
  const dependency = () => { throw new Error('Synthetic dependency unavailable'); };
  return (req, res, send) => {
    if (req.url !== '/api/integration') return send(404, { error: 'not found' });
    try {
      return send(200, { ok: true, value: dependency() });
    } catch {
      // Intentional defect: reports success while losing the integration result.
      return send(200, { ok: true, value: null });
    }
  };
}
