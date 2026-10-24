import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeSnapshots, makeTrace, replay, screenAiProposal, validateSnapshots, validateTrace } from './poc-core.mjs';

const { cases } = JSON.parse(readFileSync(new URL('../phase1/cases.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(cases.map((item) => [item.id, item]));

for (const id of ['A1', 'F1']) {
  const trace = makeTrace(byId[id]);
  assert.equal(validateTrace(trace).ok, true, id);
  const frames = replay(trace);
  assert.equal(frames.length, byId[id].frames.length, id);
  for (let index = 0; index < frames.length; index++) {
    const expected = byId[id].frames[index];
    assert.equal(frames[index].event, expected.event, `${id}:${index}`);
    if (id === 'A1') assert.deepEqual(frames[index], expected, `${id}:${index}`);
    else assert.equal(frames[index].at[expected.request], expected.at, `${id}:${index}`);
  }
  assert.deepEqual(replay(trace), replay(trace), `${id}: deterministic replay`);
  assert.deepEqual(replay(trace)[1], frames[1], `${id}: seek`);
  const snapshots = makeSnapshots(byId[id]);
  assert.equal(validateSnapshots(byId[id], snapshots).ok, true, `${id}: snapshots`);
  assert.deepEqual(snapshots, frames, `${id}: candidate parity`);
}

const a1 = makeTrace(byId.A1);
assert.equal(validateTrace({ ...a1, events: [{ type: 'swap', indices: [0, 7] }] }).ok, false);
assert.equal(validateTrace({ ...a1, events: [{ type: 'swap', indices: [0, 1] }] }).ok, false);
assert.equal(validateTrace({ ...a1, events: [{ type: 'compare', indices: [1, 2] }, { type: 'swap', indices: [0, 1] }] }).ok, false);
assert.equal(validateSnapshots(byId.A1, [{ event: 'initial', array: [9, 9, 9] }]).ok, false);
assert.equal(validateTrace({ ...a1, source: '' }).ok, false);
assert.equal(validateTrace({ ...a1, annotations: [{ eventIndex: 99, entityId: 'cell-0', text: 'bad' }] }).ok, false);
assert.equal(validateTrace({ ...a1, events: [{ type: 'compare', indices: [0, 1], result: [9, 9, 9] }] }).ok, false);
assert.equal(validateTrace({ scenarioVersion: 1, topic: 'unknown', status: 'verified-simulation', entities: [], events: [] }).ok, false);
for (const malformed of [null, {}, { ...a1, entities: [null] }, { ...a1, relations: [null] }, { ...a1, events: [null] }]) {
  assert.equal(validateTrace(malformed).ok, false, 'malformed input must reject without throwing');
}
const f1 = makeTrace(byId.F1);
assert.equal(validateTrace({ ...f1, events: [f1.events[1], f1.events[0]] }).ok, false);
assert.equal(validateTrace({ ...f1, events: [...f1.events.slice(0, -1), { ...f1.events.at(-1), to: 'a' }] }).ok, false);
assert.equal(validateSnapshots(byId.F1, makeSnapshots(byId.F1).map((frame, index) => index === 3 ? { ...frame, at: { ...frame.at, r2: 'a' } } : frame)).ok, false);
assert.equal(validateTrace({ ...f1, relations: [{ from: 'lb', to: 'missing' }] }).ok, false);
assert.deepEqual(replay(makeTrace(byId.U1)), []);
assert.equal(validateTrace(makeTrace(byId.U1)).ok, true);
assert.equal(validateTrace({ ...makeTrace(byId.U1), entities: [{ id: 'invented' }] }).ok, false);
for (const proposal of [null, { topic: 'Unknown algorithm', events: [{ type: 'swap' }] }, { ...a1, source: 'AI claim' }]) {
  const screened = screenAiProposal(proposal);
  assert.equal(screened.status, 'unsupported');
  assert.deepEqual(replay(screened), []);
}
console.log('P2 POC: A1/F1 oracle, replay, seek and negative cases pass');
