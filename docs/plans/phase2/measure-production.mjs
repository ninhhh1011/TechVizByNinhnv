import { mkdtemp, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { build, preview } from 'vite';

const output = await mkdtemp(join(tmpdir(), 'techviz-poc-'));
let server;
try {
  await build({ build: { outDir: output, emptyOutDir: true, rollupOptions: { input: fileURLToPath(new URL('./poc.html', import.meta.url)) } } });
  const route = '/docs/plans/phase2/poc.html';
  await access(join(output, route.slice(1)));
  server = await preview({ build: { outDir: output }, preview: { host: '127.0.0.1', port: 0 } });
  const port = server.httpServer.address().port;
  for (const script of ['browser-check.mjs', 'measure.mjs']) {
    const child = spawn(process.execPath, [fileURLToPath(new URL(`./${script}`, import.meta.url))], {
      stdio: 'inherit',
      env: { ...process.env, TECHVIZ_POC_URL: `http://127.0.0.1:${port}${route}`, TECHVIZ_MEASURE_OUTPUT: fileURLToPath(new URL('./measure-production-results.json', import.meta.url)) },
    });
    const code = await new Promise((done) => child.on('exit', done));
    if (code !== 0) { process.exitCode = code || 1; break; }
  }
} finally {
  if (server) {
    server.httpServer.closeAllConnections();
    await new Promise((done) => server.httpServer.close(done));
  }
  if (dirname(resolve(output)) !== resolve(tmpdir()) || !basename(output).startsWith('techviz-poc-')) throw new Error('Unexpected temporary build path');
  await rm(output, { recursive: true, force: true });
}
