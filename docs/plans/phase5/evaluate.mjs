import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { parseCandidate } from '../../../src/services/scenarioContract.ts';

const fixtures = JSON.parse(await readFile(new URL('./proposals.json', import.meta.url), 'utf8'));
const rows = fixtures.cases.map(({ id, proposal, expected }) => {
  const result = parseCandidate(proposal);
  return { id, expected, actual: result.status, pass: result.status === expected };
});
const counts = Object.fromEntries(['accepted', 'unsupported', 'error'].map((status) => [status, rows.filter((row) => row.actual === status).length]));
const report = { source: fixtures.source, date: '2026-10-22', promptVersion: 'proposal-v1', model: 'llama-3.3-70b-versatile', counts, falseAccepted: counts.accepted, rows };
await writeFile(new URL('./evaluation-results.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
assert.equal(report.falseAccepted, 0);
assert.ok(rows.every((row) => row.pass));
console.log('PASS fixed proposal corpus: ' + JSON.stringify(counts) + ', false-accepted=0');
