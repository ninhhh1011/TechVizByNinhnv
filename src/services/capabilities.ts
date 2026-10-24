import type { SimulationScenario, SimulationStep } from '../types/simulation';
import { adaptPreset, validateBubbleTrace, type ScenarioResult } from './scenarioContract';

const labels: Record<string, string> = {
  'apache-kafka': 'Kafka', 'redis-cache': 'Redis Cache', 'rag-pipeline': 'RAG Pipeline',
  'quick-sort': 'QuickSort', 'binary-search': 'Binary Search', 'astar-dijkstra-grid': 'A* / Dijkstra',
  'genetic-algorithm-ga': 'PSO / Swarm 2D', 'merge-sort': 'MergeSort (Tree)',
  'bubble-sort': 'BubbleSort', 'load-balancer': 'Load Balancer', 'token-bucket': 'Rate Limiter',
};
export const getShortChipName = (scenario: SimulationScenario): string => labels[scenario.id] ?? scenario.title;

export function resolveQuery(query: string, presets: SimulationScenario[]): ScenarioResult | null {
  const normalized = query.trim().toLowerCase();
  const clean = normalized.replace(/^(thuật toán|giải thuật|công nghệ|hệ thống|mô hình)\s+/i, '');
  const preset = presets.find((scenario) => [scenario.title, scenario.id, getShortChipName(scenario)].some((name) => [normalized, clean].includes(name.toLowerCase())));
  if (preset) return adaptPreset(preset);
  const match = query.trim().match(/^bubble pass\s+(\[.*\])$/i);
  if (!match) return null;
  let input: unknown;
  try { input = JSON.parse(match[1]); } catch { return { status: 'error', reason: 'Mảng phải là JSON hợp lệ, ví dụ Bubble pass [3,1,2].' }; }
  if (!Array.isArray(input) || input.length < 2 || input.length > 20 || input.some((value) => typeof value !== 'number' || !Number.isFinite(value))) return { status: 'error', reason: 'Một lượt Bubble Sort nhận 2–20 số hữu hạn.' };
  const array = [...input] as number[];
  const trace = [{ event: 'initial', array: [...array], sortedIndices: [] as number[] }];
  const steps: SimulationStep[] = [{ stepIndex: 1, title: 'Trạng thái ban đầu', explanation: 'Một lượt so sánh các cặp kề nhau từ trái sang phải.', arrayData: { array: [...array], pointers: [] } }];
  for (let i = 0; i < array.length - 1; i++) {
    trace.push({ event: `compare(${i},${i + 1})`, array: [...array], sortedIndices: [] });
    steps.push({ stepIndex: steps.length + 1, title: `So sánh vị trí ${i} và ${i + 1}`, explanation: `So sánh ${array[i]} với ${array[i + 1]}; chỉ đổi chỗ nếu phần tử bên trái lớn hơn.`, arrayData: { array: [...array], pointers: [], comparingIndices: [i, i + 1] } });
    if (array[i] > array[i + 1]) {
      [array[i], array[i + 1]] = [array[i + 1], array[i]];
      trace.push({ event: `swap(${i},${i + 1})`, array: [...array], sortedIndices: [] });
      steps.push({ stepIndex: steps.length + 1, title: `Đổi chỗ vị trí ${i} và ${i + 1}`, explanation: 'Giá trị lớn hơn tiến sang phải; các giá trị còn lại giữ nguyên.', arrayData: { array: [...array], pointers: [], swappedIndices: [i, i + 1] } });
    }
  }
  trace[trace.length - 1].sortedIndices = [array.length - 1];
  steps[steps.length - 1].arrayData!.sortedIndices = [array.length - 1];
  const validation = validateBubbleTrace(input, trace);
  if (!validation.ok) return { status: 'error', reason: validation.reason! };
  const scenario: SimulationScenario = {
    id: `reference-bubble-pass-${JSON.stringify(input)}`, title: 'Bubble Sort — một lượt', category: 'Algorithms', rendererType: 'array-pointer', nodes: [], steps,
    evidence: { status: 'verified-simulation', source: 'Reference runner bubble-pass/v1; oracle P1 A1; invariant compare/swap.', limit: 'Chỉ một lượt; phần tử lớn nhất về cuối. Không kết luận toàn bộ mảng đã được sắp xếp.' },
    academicOverview: { mentalModel: 'So sánh từng cặp kề nhau để đưa phần tử lớn nhất sang cuối.', complexityOrPrinciple: 'Một lượt thực hiện n−1 phép so sánh. Không mô tả độ phức tạp của toàn bộ thuật toán.', useCases: [] },
  };
  return { status: 'accepted', scenarioVersion: 1, scenario, frames: steps, source: 'reference-runner' };
}
