import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { solveGrid } from './pathfinding.ts';

test('four-neighbor grid agrees with locked G1/G2 oracle costs and walls', () => {
  const cases = JSON.parse(readFileSync(new URL('../../docs/plans/phase1/cases.json', import.meta.url))).cases;
  for (const fixture of cases.filter((c) => ['G1', 'G2'].includes(c.id))) {
    const input = fixture.input;
    const walls = new Set(input.walls.map((cell) => cell.join(',')));
    const config = { rows: input.rows, cols: input.cols, start: input.start, end: input.end };
    const dijkstra = solveGrid(config, walls, false, false);
    const astar = solveGrid(config, walls, true, false);
    const last = fixture.frames.at(-1);
    assert.equal(astar.found, last.event === 'found', fixture.id);
    assert.equal(astar.totalCost, last.cost ?? 0, fixture.id);
    assert.equal(astar.totalCost, dijkstra.totalCost);
    for (let i = 1; i < astar.path.length; i++) {
      assert.equal(walls.has(astar.path[i].join(',')), false);
      assert.equal(Math.abs(astar.path[i][0] - astar.path[i - 1][0]) + Math.abs(astar.path[i][1] - astar.path[i - 1][1]), 1);
    }
  }
});

test('diagonal paths cannot cut blocked corners; invalid endpoints are distinct from no path', () => {
  const config = { rows: 2, cols: 2, start: [0, 0], end: [1, 1] };
  assert.equal(solveGrid(config, new Set(), true, true).totalCost, Math.SQRT2);
  assert.equal(solveGrid(config, new Set(['0,1', '1,0']), true, true).found, false);
  assert.match(solveGrid(config, new Set(['0,0']), true, true).reason, /wall/);
  assert.match(solveGrid({ ...config, start: [-1, 0] }, new Set(), true, true).reason, /bounds/);
  const same = solveGrid({ ...config, end: [0, 0] }, new Set(), true, true);
  assert.equal(same.found, true);
  assert.equal(same.totalCost, 0);
  assert.deepEqual(same.path, [[0, 0]]);
});
