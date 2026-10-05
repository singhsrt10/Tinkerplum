import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import next from 'next';
const app = next({ dev: false, dir: fileURLToPath(new URL('.', import.meta.url)), hostname: '127.0.0.1' });
await app.prepare();
const server = createServer(app.getRequestHandler());
server.listen(0, '127.0.0.1', () => process.send({ type: 'ready', origin: `http://127.0.0.1:${server.address().port}` }));
async function close() {
  server.closeAllConnections();
  server.close();
  await app.close();
  process.exit(0);
}
process.on('message', message => { if (message === 'close') void close(); });
process.on('disconnect', () => void close());
