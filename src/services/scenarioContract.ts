import type { SimulationScenario, SimulationStep, RendererType } from '../types/simulation';

export type ScenarioResult =
  | { status: 'accepted'; scenarioVersion: 1; scenario: SimulationScenario; frames: SimulationStep[]; source: 'legacy-preset' | 'reference-runner' }
  | { status: 'partial' | 'unsupported' | 'error'; reason: string };

const renderers: RendererType[] = ['flow-graph', 'array-pointer', 'grid-path', 'swarm-2d', 'tree-graph'];
const record = (value: unknown): value is Record<string, any> => value !== null && typeof value === 'object' && !Array.isArray(value);
const string = (value: unknown, max = 500) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const index = (value: unknown, size: number) => Number.isInteger(value) && (value as number) >= 0 && (value as number) < size;
const number = (value: unknown) => typeof value === 'number' && Number.isFinite(value);
const error = (path: string, reason: string): ScenarioResult => ({ status: 'error', reason: `${path}: ${reason}` });

// AI proposals have no reviewed capability in P3, so structural validity never grants simulation status.
export function parseCandidate(value: unknown): ScenarioResult {
  if (!record(value)) return error('$', 'expected object');
  if (value.scenarioVersion !== 1) return error('scenarioVersion', 'expected 1');
  if (!string(value.title, 120)) return error('title', 'expected nonempty string up to 120 characters');
  if (!renderers.includes(value.rendererType)) return error('rendererType', 'unknown renderer');
  if (!Array.isArray(value.steps) || value.steps.length < 1 || value.steps.length > 80) return error('steps', 'expected 1–80 steps');
  if (!Array.isArray(value.nodes) || value.nodes.length > 80) return error('nodes', 'expected at most 80 nodes');
  const ids = new Set<string>();
  for (let i = 0; i < value.nodes.length; i++) {
    const node = value.nodes[i];
    if (!record(node) || !string(node.id, 80) || ids.has(node.id)) return error(`nodes[${i}].id`, 'missing or duplicate ID');
    ids.add(node.id);
  }
  if (value.rendererType === 'flow-graph' && ids.size < 2) return error('nodes', 'flow needs at least two nodes');
  const gridConfig = value.defaultGridConfig;
  const cell = (point: unknown) => Array.isArray(point) && point.length === 2 && index(point[0], gridConfig.rows) && index(point[1], gridConfig.cols);
  if (value.rendererType === 'grid-path') {
    if (!record(gridConfig) || !Number.isInteger(gridConfig.rows) || !Number.isInteger(gridConfig.cols) || gridConfig.rows < 1 || gridConfig.cols < 1 || gridConfig.rows * gridConfig.cols > 2500) return error('defaultGridConfig', 'invalid grid dimensions');
    if (!cell(gridConfig.start) || !cell(gridConfig.end) || (gridConfig.initialWalls !== undefined && (!Array.isArray(gridConfig.initialWalls) || gridConfig.initialWalls.some((point: unknown) => !cell(point))))) return error('defaultGridConfig', 'cell outside grid');
  }
  for (let i = 0; i < value.steps.length; i++) {
    const step = value.steps[i];
    const path = `steps[${i}]`;
    if (!record(step) || !string(step.title, 120) || !string(step.explanation, 2000)) return error(path, 'title and explanation required');
    if (step.stepIndex !== i + 1) return error(`${path}.stepIndex`, 'steps must be ordered from 1');
    if (value.rendererType === 'array-pointer') {
      const data = step.arrayData ?? step.visualData;
      const array = data?.array;
      if (!Array.isArray(array) || !array.length || array.length > 100 || array.some((n: unknown) => !number(n))) return error(`${path}.array`, 'expected 1–100 finite numbers');
      const pointers = data?.pointers;
      if (pointers !== undefined && (!Array.isArray(pointers) || pointers.some((p: unknown) => !record(p) || !string(p.name, 80) || !index(p.index, array.length)))) return error(`${path}.pointers`, 'invalid index');
      for (const key of ['comparingIndices', 'swappedIndices', 'sortedIndices']) {
        if (data?.[key] !== undefined && (!Array.isArray(data[key]) || data[key].some((n: unknown) => !index(n, array.length)))) return error(`${path}.${key}`, 'invalid index');
      }
    } else if (value.rendererType === 'flow-graph') {
      if (!Array.isArray(step.packets) || step.packets.length > 200) return error(`${path}.packets`, 'expected at most 200 packets');
      const packetIds = new Set<string>();
      for (let j = 0; j < step.packets.length; j++) {
        const packet = step.packets[j];
        if (!record(packet) || !string(packet.id, 80) || packetIds.has(packet.id) || !ids.has(packet.fromNodeId) || !ids.has(packet.toNodeId) || (packet.fallbackToNodeId !== undefined && !ids.has(packet.fallbackToNodeId))) return error(`${path}.packets[${j}]`, 'duplicate ID or unknown endpoint');
        packetIds.add(packet.id);
      }
    } else if (value.rendererType === 'tree-graph') {
      const nodes = step.treeData?.treeNodes ?? step.visualData?.treeNodes;
      if (!Array.isArray(nodes) || !nodes.length || nodes.length > 100) return error(`${path}.treeNodes`, 'expected 1–100 nodes');
      const treeIds = new Set(nodes.map((n: any) => n?.id));
      if (treeIds.size !== nodes.length || nodes.some((n: any) => !record(n) || !string(n.id, 80) || (n.parentId && !treeIds.has(n.parentId)))) return error(`${path}.treeNodes`, 'duplicate ID or unknown parent');
      for (const node of nodes) {
        const seen = new Set<string>();
        let parent = node;
        while (parent?.parentId) {
          if (seen.has(parent.id)) return error(`${path}.treeNodes`, 'parent cycle');
          seen.add(parent.id);
          parent = nodes.find((candidate: any) => candidate.id === parent.parentId);
        }
      }
    } else if (value.rendererType === 'swarm-2d') {
      const particles = step.swarmData?.particles ?? step.visualData?.particles;
      if (!Array.isArray(particles) || !particles.length || particles.length > 100 || particles.some((p: any) => !record(p) || !string(p.id, 80) || !number(p.x) || !number(p.y)) || new Set(particles.map((p: any) => p.id)).size !== particles.length) return error(`${path}.particles`, 'expected 1–100 unique finite positions');
    } else {
      const grid = step.gridData ?? step.visualData;
      if (!record(grid) || !cell(grid.current) || (grid.path !== undefined && (!Array.isArray(grid.path) || grid.path.some((point: unknown) => !cell(point))))) return error(`${path}.current`, 'cell outside grid');
    }
  }
  return { status: 'unsupported', reason: 'Đề xuất AI chưa có nguồn và invariant được duyệt cho chủ đề này.' };
}

export function adaptPreset(scenario: SimulationScenario): Extract<ScenarioResult, { status: 'accepted' }> {
  return { status: 'accepted', scenarioVersion: 1, scenario, frames: scenario.steps, source: 'legacy-preset' };
}

export function bubblePass(input: number[]): number[][] {
  const array = [...input];
  const frames = [[...array]];
  for (let i = 0; i < array.length - 1; i++) {
    frames.push([...array]);
    if (array[i] > array[i + 1]) {
      [array[i], array[i + 1]] = [array[i + 1], array[i]];
      frames.push([...array]);
    }
  }
  return frames;
}

export function validateBubbleTrace(input: number[], frames: { event: string; array: number[]; sortedIndices?: number[] }[]): { ok: boolean; reason?: string } {
  if (!Array.isArray(input) || input.length < 2 || input.length > 100 || input.some((value) => !number(value))) return { ok: false, reason: 'input: expected 2–100 finite numbers' };
  const state = [...input];
  const expected = [{ event: 'initial', array: [...state] }];
  for (let i = 0; i < state.length - 1; i++) {
    expected.push({ event: `compare(${i},${i + 1})`, array: [...state] });
    if (state[i] > state[i + 1]) {
      [state[i], state[i + 1]] = [state[i + 1], state[i]];
      expected.push({ event: `swap(${i},${i + 1})`, array: [...state] });
    }
  }
  if (!Array.isArray(frames) || frames.length !== expected.length) return { ok: false, reason: 'frames: wrong count' };
  for (let i = 0; i < expected.length; i++) {
    const frame = frames[i];
    if (!frame || frame.event !== expected[i].event || !Array.isArray(frame.array) || frame.array.length !== state.length || frame.array.some((value, j) => value !== expected[i].array[j])) return { ok: false, reason: `frames[${i}]: event or array mismatch` };
    const sorted = i === frames.length - 1 ? [state.length - 1] : [];
    if (JSON.stringify(frame.sortedIndices ?? []) !== JSON.stringify(sorted)) return { ok: false, reason: `frames[${i}].sortedIndices: mismatch` };
  }
  return { ok: true };
}
