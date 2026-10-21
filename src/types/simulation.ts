export type NodeLayer = 'ingress' | 'compute' | 'storage' | 'egress' | string;

export interface SimulationNode {
  id: string;
  name: string;
  role: string;
  layer: NodeLayer;
  status: 'active' | 'inactive';
  icon: string;
  description: string;
}

export type PacketStatus = 'normal' | 'rerouted' | 'failed';

export interface SimulationPacket {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label: string;
  type?: PacketStatus;
  fallbackToNodeId?: string;
  detail?: string;
}

export interface ArrayPointer {
  name: string;
  index: number;
  color?: string;
  label?: string;
}

export interface ArrayStepData {
  array: number[];
  pointers: ArrayPointer[];
  comparingIndices?: number[];
  swappedIndices?: number[];
  sortedIndices?: number[];
  soundFrequencyIndex?: number;
}

export interface GridStepData {
  start?: [number, number];
  end?: [number, number];
  visited?: [number, number][];
  current?: [number, number];
  path?: [number, number][];
  heuristic?: 'manhattan' | 'euclidean' | 'none';
}

export interface SwarmParticle {
  id: string;
  label?: string;
  x: number; // Tọa độ x (chuẩn hóa 0-100 hoặc tỷ lệ)
  y: number; // Tọa độ y (chuẩn hóa 0-100 hoặc tỷ lệ)
  vx?: number; // Vector vận tốc theo x
  vy?: number; // Vector vận tốc theo y
  fitness?: number; // Điểm thích nghi
  isBest?: boolean; // Hạt tối ưu toàn cục (gBest)
}

export interface SwarmStepData {
  target?: { x: number; y: number; label?: string; value?: number };
  particles: SwarmParticle[];
  iteration?: number;
  bestFitness?: number;
  gBest?: { x: number; y: number; fitness?: number };
  domainBounds?: { xMin: number; xMax: number; yMin: number; yMax: number };
}

export interface TreeNodeItem {
  id: string;
  label: string;
  value?: string | number;
  level: number; // Tầng của cây: 0 là root, 1, 2...
  parentId?: string; // ID node cha
  status?: 'default' | 'visiting' | 'visited' | 'highlight';
  details?: string;
}

export interface TreeStepData {
  treeNodes: TreeNodeItem[];
  activeNodeId?: string;
  comparingNodeIds?: string[];
  highlightPathIds?: string[];
  explanationDetail?: string;
}

export interface AcademicOverview {
  mentalModel: string; // Bản chất & ví dụ thực tế trực quan cho người mới
  complexityOrPrinciple: string; // Độ phức tạp Time/Space (Big-O) hoặc Nguyên lý hệ thống / Đánh đổi Trade-offs
  useCases: string[]; // Các ứng dụng thực tiễn trong công nghiệp
}

export interface SimulationStep {
  stepIndex: number;
  title: string;
  explanation: string;
  packets?: SimulationPacket[];
  activeHighlights?: string[];
  arrayData?: ArrayStepData;
  gridData?: GridStepData;
  swarmData?: SwarmStepData;
  treeData?: TreeStepData;

  // Flexible visualData for direct visualizer mappings
  visualData?: {
    // Array
    array?: number[];
    pivotIndex?: number;
    activeIndices?: number[];
    pointers?: Record<string, number> | ArrayPointer[];
    comparing?: number[];
    swapped?: number[];
    sorted?: number[];
    // Grid
    start?: [number, number];
    end?: [number, number];
    visited?: [number, number][];
    current?: [number, number];
    path?: [number, number][];
    // Swarm
    particles?: SwarmParticle[];
    gBest?: { x: number; y: number; fitness?: number };
    target?: { x: number; y: number; label?: string };
    iteration?: number;
    // Tree
    treeNodes?: TreeNodeItem[];
    activeNodeId?: string;
    // Generic
    [key: string]: any;
  };

  // Rich pedagogical inspection data
  logicCode?: string;
  payloadSample?: Record<string, any> | string;
  stateMutation?: Record<string, any>;
  stateVariables?: Record<string, any>;
}

export type RendererType = 'flow-graph' | 'array-pointer' | 'grid-path' | 'swarm-2d' | 'tree-graph';

export interface SimulationScenario {
  id: string;
  title: string;
  subtitle?: string;
  summary?: string;
  category: string;
  tags?: string[];
  description?: string;
  rendererType?: RendererType;
  visualizationType?: RendererType;
  laneTitles?: string[];
  nodes: SimulationNode[];
  steps: SimulationStep[];
  academicOverview?: AcademicOverview;
  defaultGridConfig?: {
    rows: number;
    cols: number;
    start: [number, number];
    end: [number, number];
    initialWalls?: [number, number][];
  };
}
