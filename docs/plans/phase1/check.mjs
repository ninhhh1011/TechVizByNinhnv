import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const { cases } = JSON.parse(readFileSync(new URL('./cases.json', import.meta.url), 'utf8'));
const families = ['array-pointer', 'grid-path', 'flow-graph', 'swarm-2d', 'tree-graph'];
assert.equal(cases.length, 11);
assert.equal(new Set(cases.map(({ id }) => id)).size, cases.length);

for (const family of families) assert.equal(cases.filter((item) => item.family === family).length, 2);
assert.equal(cases.filter((item) => item.status === 'unsupported').length, 1);

for (const item of cases) {
  assert.ok(item.input && item.source && item.limit && item.learnerQuestion && item.expectedAnswer, item.id);
  assert.ok(Array.isArray(item.frames), item.id);
  assert.ok(item.frames.every(({ event }) => typeof event === 'string' && event), item.id);
  if (item.status === 'unsupported') assert.equal(item.frames.length, 0);
  else assert.ok(item.frames.length >= 2, item.id);
  for (const frame of item.frames) {
    if (!frame.nodes) continue;
    const ids = frame.nodes.map(({ id }) => id);
    assert.equal(new Set(ids).size, ids.length, `${item.id}: duplicate node ID`);
    for (const node of frame.nodes) assert.ok(node.parentId === null || ids.includes(node.parentId), `${item.id}: missing parent`);
  }
}

const byId = Object.fromEntries(cases.map((item) => [item.id, item]));
assert.deepEqual(byId.A1.frames.at(-1).array, [1, 2, 3]);
for (let i = 1; i < byId.A1.frames.length; i++) {
  const before = byId.A1.frames[i - 1].array;
  const frame = byId.A1.frames[i];
  if (frame.event.startsWith('compare')) assert.deepEqual(frame.array, before);
  if (frame.event.startsWith('swap')) assert.deepEqual([...frame.array].sort(), [...before].sort());
}
assert.equal(byId.A2.frames.at(-1).result, -1);
assert.equal(byId.G1.frames.at(-1).cost, byId.G1.frames.at(-1).path.length - 1);
for (const id of ['G1', 'G2']) {
  const { rows, cols, walls } = byId[id].input;
  for (const frame of byId[id].frames) {
    for (const [index, cell] of (frame.path ?? []).entries()) {
      assert.ok(cell[0] >= 0 && cell[0] < rows && cell[1] >= 0 && cell[1] < cols, id);
      assert.ok(!walls.some((wall) => wall[0] === cell[0] && wall[1] === cell[1]), id);
      if (index) {
        const previous = frame.path[index - 1];
        assert.equal(Math.abs(previous[0] - cell[0]) + Math.abs(previous[1] - cell[1]), 1, id);
      }
    }
  }
}
assert.equal(byId.G2.frames.at(-1).result, 'no-path');
for (const id of ['S1', 'S2']) {
  const { objective, particles, scoreUpdates } = byId[id].input;
  const scoresFromInput = Object.fromEntries(particles.map(({ id, fitness }) => [id, fitness]));
  assert.deepEqual(byId[id].frames[0].fitness, scoresFromInput, `${id}: initial scores`);
  assert.equal(scoreUpdates?.length, byId[id].frames.filter(({ event }) => event === 'update').length, `${id}: declared updates`);
  let updateIndex = 0;
  for (const frame of byId[id].frames) {
    if (frame.event === 'update') {
      const { particleId, fitness } = scoreUpdates[updateIndex++];
      scoresFromInput[particleId] = fitness;
      assert.deepEqual(frame.fitness, scoresFromInput, `${id}: update from input`);
    }
    const scores = Object.entries(frame.fitness);
    const best = scores.reduce((a, b) => (objective === 'maximize' ? b[1] > a[1] : b[1] < a[1]) ? b : a);
    assert.equal(frame.bestId, best[0], id);
    assert.equal(frame.bestFitness, best[1], id);
  }
}
assert.deepEqual(byId.T1.frames.at(-1).nodes[0].value, [1, 2, 3]);
assert.equal(byId.T2.frames.at(-1).nodes.find(({ id }) => id === 'n3').parentId, 'n2');
console.log('P1 fixture structure and selected arithmetic: 11/11 cases pass');
