import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { createServer } from 'vite';
import { parseCandidate, adaptPreset, bubblePass, validateBubbleTrace } from './scenarioContract.ts';

const source = { scenarioVersion: 1, title: 'Sort', category: 'Algorithms', rendererType: 'array-pointer', nodes: [], steps: [
  { stepIndex: 1, title: 'Compare', explanation: 'Compare neighbors', arrayData: { array: [3, 1], pointers: [] } },
] };

test('rejects malformed input with a path and does not invent steps', () => {
  assert.deepEqual(parseCandidate({ ...source, steps: [] }).status, 'error');
  assert.match(parseCandidate({ ...source, steps: [] }).reason, /steps/);
  assert.equal(parseCandidate({ ...source, steps: [{ ...source.steps[0], arrayData: { array: [3, 'x'], pointers: [] } }] }).status, 'error');
});

test('valid but unreviewed AI remains unsupported', () => {
  assert.equal(parseCandidate(source).status, 'unsupported');
});

test('Groq response cannot enter playback without review', async () => {
  const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  const { generateScenarioWithGroq } = await vite.ssrLoadModule('/src/services/groq.ts');
  const fetchBefore = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    assert.deepEqual(JSON.parse(options.body), { query: 'Sort' });
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(source) } }] }), { status: 200 });
  };
  try {
    assert.equal((await generateScenarioWithGroq('Sort')).status, 'unsupported');
    globalThis.fetch = async () => new Response('not json', { status: 200 });
    assert.match((await generateScenarioWithGroq('Sort')).reason, /JSON/);
    globalThis.fetch = async () => new Response('x'.repeat(131073), { status: 200 });
    assert.match((await generateScenarioWithGroq('Sort')).reason, /quá lớn/);
  } finally {
    globalThis.fetch = fetchBefore;
    await vite.close();
  }
});

test('rejects broken references and bounds across renderer families', () => {
  const step = source.steps[0];
  const flow = { ...source, rendererType: 'flow-graph', nodes: [{ id: 'a' }, { id: 'b' }], steps: [{ ...step, packets: [{ fromNodeId: 'a', toNodeId: 'missing' }] }] };
  assert.match(parseCandidate(flow).reason, /packets\[0\]/);
  const grid = { ...source, rendererType: 'grid-path', defaultGridConfig: { rows: 2, cols: 2, start: [0, 0], end: [1, 1] }, steps: [{ ...step, gridData: { current: [2, 0] } }] };
  assert.match(parseCandidate(grid).reason, /current/);
  const tree = { ...source, rendererType: 'tree-graph', steps: [{ ...step, treeData: { treeNodes: [{ id: 'a', parentId: 'b' }, { id: 'b', parentId: 'a' }] } }] };
  assert.match(parseCandidate(tree).reason, /cycle/);
  const swarm = { ...source, rendererType: 'swarm-2d', steps: [{ ...step, swarmData: { particles: [{ id: 'a', x: 1, y: 2 }, { id: 'a', x: 3, y: 4 }] } }] };
  assert.match(parseCandidate(swarm).reason, /particles/);
});

test('malformed JSON-shaped proposals never throw', () => {
  const bad = [null, false, 0, '', [], {}, [1], { x: 1 }, [{ id: 'x' }]];
  const keys = ['scenarioVersion', 'title', 'rendererType', 'nodes', 'steps', 'defaultGridConfig'];
  for (const key of keys) for (const value of bad) {
    assert.doesNotThrow(() => parseCandidate({ ...source, [key]: value }), `${key}=${JSON.stringify(value)}`);
  }
  for (const rendererType of ['flow-graph', 'array-pointer', 'grid-path', 'swarm-2d', 'tree-graph']) {
    for (const value of bad) assert.doesNotThrow(() => parseCandidate({ ...source, rendererType, steps: [value] }), rendererType);
  }
});

test('preset adapter preserves all 11 existing scenarios and snapshots', async () => {
  const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { PRESET_SCENARIOS } = await vite.ssrLoadModule('/src/data/presets.ts');
    const golden = JSON.parse(readFileSync(new URL('../../docs/plans/phase3/preset-golden.json', import.meta.url)));
    assert.equal(PRESET_SCENARIOS.length, 11);
    for (const [index, scenario] of PRESET_SCENARIOS.entries()) {
      const before = JSON.stringify(scenario);
      assert.equal(scenario.id, golden[index].id);
      assert.equal(createHash('sha256').update(before).digest('hex'), golden[index].sha256, scenario.id);
      const adapted = adaptPreset(scenario);
      assert.equal(adapted.status, 'accepted');
      assert.strictEqual(adapted.scenario, scenario);
      assert.strictEqual(adapted.frames, scenario.steps);
      assert.equal(JSON.stringify(adapted.scenario), before);
      assert.equal(JSON.stringify(adapted.frames), JSON.stringify(scenario.steps));
    }
  } finally {
    await vite.close();
  }
});

test('bubble pass matches A1 oracle without claiming complexity', () => {
  const a1 = JSON.parse(readFileSync(new URL('../../docs/plans/phase1/cases.json', import.meta.url))).cases.find((item) => item.id === 'A1');
  assert.deepEqual(bubblePass(a1.input.array), a1.frames.map((frame) => frame.array));
});

test('bubble pass preserves values and moves the maximum to the end', () => {
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < 3; c++) {
    const input = [a, b, c];
    const frames = bubblePass(input);
    assert.deepEqual([...frames.at(-1)].sort(), [...input].sort());
    assert.equal(frames.at(-1).at(-1), Math.max(...input));
  }
});

test('A1 validator rejects event order and state corruption', () => {
  const a1 = JSON.parse(readFileSync(new URL('../../docs/plans/phase1/cases.json', import.meta.url))).cases.find((item) => item.id === 'A1');
  assert.equal(validateBubbleTrace(a1.input.array, a1.frames).ok, true);
  for (const wrong of [
    a1.frames.map((frame, i) => i === 1 ? { ...frame, array: [9, 1, 2] } : frame),
    a1.frames.map((frame, i) => i === 2 ? { ...frame, array: [1, 3, 3] } : frame),
    [a1.frames[0], a1.frames[2], a1.frames[1], ...a1.frames.slice(3)],
    a1.frames.slice(0, -1),
  ]) assert.equal(validateBubbleTrace(a1.input.array, wrong).ok, false);
});
