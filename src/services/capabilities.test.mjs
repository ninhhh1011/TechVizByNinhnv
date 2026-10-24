import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { createServer } from 'vite';
const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
after(() => vite.close());
const { resolveQuery } = await vite.ssrLoadModule('/src/services/capabilities.ts');

test('catalog matches complete preset names and leaves negative queries outside playback', () => {
  const preset = { id: 'redis-cache', title: 'Redis Cache', nodes: [], steps: [] };
  assert.strictEqual(resolveQuery('công nghệ Redis Cache', [preset]).scenario, preset);
  assert.equal(resolveQuery('Do not simulate Redis Cache', [preset]), null);
});

test('one-pass bubble input produces deterministic, validated snapshots with explicit provenance', () => {
  const result = resolveQuery('Bubble pass [3,1,2]', []);
  assert.equal(result.status, 'accepted');
  assert.equal(result.source, 'reference-runner');
  assert.equal(result.scenario.evidence.status, 'verified-simulation');
  assert.deepEqual(result.frames.map((frame) => frame.arrayData.array), [[3, 1, 2], [3, 1, 2], [1, 3, 2], [1, 3, 2], [1, 2, 3]]);
  assert.deepEqual(result.frames.at(-1).arrayData.sortedIndices, [2]);
  assert.match(result.scenario.evidence.limit, /một lượt/i);
  for (const query of ['Bubble pass []', 'Bubble pass [1]', 'Bubble pass [3,"1"]', 'Bubble pass [null,1]', 'Bubble pass [1,]']) {
    assert.equal(resolveQuery(query, []).status, 'error', query);
  }
});
