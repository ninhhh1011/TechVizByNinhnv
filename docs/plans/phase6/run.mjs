import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';

const server = await preview({ preview: { host: '127.0.0.1', port: 0, open: false } });
try {
  for (const relative of ['../baseline/smoke.mjs', '../phase3/preset-smoke.mjs', '../phase3/browser-check.mjs', '../phase4/check.mjs', '../phase5/check.mjs', './matrix.mjs', './renderer-fixes.mjs']) {
    const child = spawn(process.execPath, [fileURLToPath(new URL(relative, import.meta.url))], {
      stdio: 'inherit',
      env: { ...process.env, TECHVIZ_URL: 'http://127.0.0.1:' + server.httpServer.address().port + '/', TECHVIZ_SMOKE_OUTPUT: fileURLToPath(new URL('./', import.meta.url)) },
    });
    const code = await new Promise((resolve, reject) => { child.once('exit', resolve); child.once('error', reject); });
    if (code !== 0) { process.exitCode = code || 1; break; }
  }
} finally {
  server.httpServer.closeAllConnections();
  await new Promise((done) => server.httpServer.close(done));
}
