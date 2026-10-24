export interface GridConfig {
  rows: number;
  cols: number;
  start: [number, number];
  end: [number, number];
  initialWalls?: [number, number][];
}

export interface PathResult {
  visitedOrder: [number, number][];
  visitedSet: Set<string>;
  path: [number, number][];
  pathSet: Set<string>;
  costs: Map<string, number>;
  found: boolean;
  totalCost: number;
  reason?: string;
}

export function solveGrid(config: GridConfig, walls: Set<string>, useHeuristic: boolean, diagonal: boolean): PathResult {
  const result: PathResult = { visitedOrder: [], visitedSet: new Set(), path: [], pathSet: new Set(), costs: new Map(), found: false, totalCost: 0 };
  const { rows, cols, start, end } = config;
  const inBounds = ([r, c]: [number, number]) => Number.isInteger(r) && Number.isInteger(c) && r >= 0 && c >= 0 && r < rows && c < cols;
  if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows < 1 || cols < 1 || rows * cols > 2500 || !inBounds(start) || !inBounds(end)) return { ...result, reason: 'Grid dimensions or endpoints outside bounds' };
  const startKey = start.join(',');
  const endKey = end.join(',');
  if (walls.has(startKey) || walls.has(endKey)) return { ...result, reason: 'Endpoint overlaps a wall' };
  const h = ([r, c]: [number, number]) => {
    if (!useHeuristic) return 0;
    const dx = Math.abs(r - end[0]), dy = Math.abs(c - end[1]);
    return diagonal ? Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy) : dx + dy;
  };
  const g = new Map([[startKey, 0]]);
  const previous = new Map<string, [number, number]>();
  const open: [number, number][] = [start];
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1], ...(diagonal ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : [])];
  result.costs.set(startKey, h(start));
  while (open.length) {
    let best = 0;
    for (let i = 1; i < open.length; i++) if (result.costs.get(open[i].join(','))! < result.costs.get(open[best].join(','))!) best = i;
    const current = open.splice(best, 1)[0];
    const key = current.join(',');
    result.visitedSet.add(key);
    result.visitedOrder.push(current);
    if (key === endKey) {
      result.found = true;
      result.totalCost = g.get(key)!;
      let cell: [number, number] | undefined = current;
      while (cell) {
        result.path.unshift(cell);
        result.pathSet.add(cell.join(','));
        cell = previous.get(cell.join(','));
      }
      break;
    }
    for (const [dr, dc] of directions) {
      const next: [number, number] = [current[0] + dr, current[1] + dc];
      const nextKey = next.join(',');
      if (!inBounds(next) || walls.has(nextKey) || result.visitedSet.has(nextKey)) continue;
      // Diagonals cost sqrt(2) and cannot pass between blocked orthogonal neighbors.
      if (dr && dc && (walls.has(`${current[0] + dr},${current[1]}`) || walls.has(`${current[0]},${current[1] + dc}`))) continue;
      const cost = g.get(key)! + (dr && dc ? Math.SQRT2 : 1);
      if (cost >= (g.get(nextKey) ?? Infinity)) continue;
      g.set(nextKey, cost);
      previous.set(nextKey, current);
      result.costs.set(nextKey, cost + h(next));
      if (!open.some((cell) => cell[0] === next[0] && cell[1] === next[1])) open.push(next);
    }
  }
  return result;
}
