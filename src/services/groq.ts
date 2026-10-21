import {
  SimulationScenario,
  SimulationNode,
  SimulationStep,
  RendererType,
  AcademicOverview,
  SwarmParticle,
  TreeNodeItem,
} from '../types/simulation';

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODELS_ENDPOINT = 'https://api.groq.com/openai/v1/models';

/**
 * Danh sách model ưu tiên theo thứ tự độ phổ biến và tính sẵn sàng trên Groq Cloud:
 */
export const CANDIDATE_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'llama-3.1-70b-versatile',
  'allam-2-7b',
];

/**
 * Lấy danh sách các model khả dụng cho API Key hiện tại từ /v1/models
 */
async function getAccessibleGroqModels(apiKey: string): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(GROQ_MODELS_ENDPOINT, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return [];
    const json = await res.json();
    if (Array.isArray(json?.data)) {
      return json.data.map((m: any) => String(m.id || ''));
    }
  } catch {
    // Bỏ qua lỗi timeout hoặc mạng khi lấy danh sách model
  }
  return [];
}

const SYSTEM_PROMPT = `Bạn là Giáo sư Khoa học Máy tính & Kiến trúc sư Trưởng Hệ thống của TechViz Sandbox (kết hợp tri thức học thuật từ CLRS "Introduction to Algorithms", "Designing Data-Intensive Applications" và trực quan hóa VisuAlgo).

Nhiệm vụ của bạn:
1. Tiếp nhận tên thuật toán, công nghệ, hoặc kiến trúc hệ thống từ người dùng.
2. Phân loại chính xác vào đúng 1 trong 5 loại hình hiển thị trực quan (visualizationType).
3. Cung cấp nền tảng học thuật sâu sắc (academicOverview) gồm mô hình tư duy trực quan (mentalModel), độ phức tạp / nguyên lý thiết kế (complexityOrPrinciple), và ứng dụng thực tế (useCases).
4. Xây dựng kịch bản mô phỏng từ 5 đến 8 bước thực thi chân thực, mỗi bước có diễn giải nguyên nhân, mã giả / công thức toán (logicCode), bảng biến số trực tiếp (stateVariables) và cấu trúc dữ liệu thị giác chuẩn xác (visualData).

HƯỚNG DẪN 5 LOẠI HÌNH VISUALIZATION (visualizationType):

1. "array-pointer":
   - Dành cho: Thuật toán sắp xếp (QuickSort, MergeSort, BubbleSort, InsertionSort, HeapSort), tìm kiếm (Binary Search), Hai con trỏ (Two Pointers), Cửa sổ trượt (Sliding Window).
   - visualData trong mỗi step:
     "visualData": {
       "array": [15, 23, 35, 48, 60, 76, 89], // Mảng 6-8 số nguyên
       "pivotIndex": 3,
       "pointers": { "i": 1, "j": 4, "pivot": 3 },
       "comparing": [1, 4],
       "swapped": [1, 4],
       "sorted": [0, 6]
     }

2. "grid-path":
   - Dành cho: Tìm đường trên đồ thị lưới 2D, mê cung (A*, Dijkstra, BFS/DFS Grid, Flood Fill, Bàn cờ động).
   - visualData trong mỗi step:
     "visualData": {
       "start": [5, 2],
       "end": [5, 19],
       "visited": [[5, 2], [5, 3], [6, 2]],
       "current": [5, 3],
       "path": [[5, 2], [5, 3]]
     }

3. "swarm-2d":
   - Dành cho: PSO (Particle Swarm Optimization), Thuật toán Bầy đàn, K-Means Clustering, Gradient Descent, Giải thuật Di truyền GA trong không gian 2D, Tối ưu hóa cực trị.
   - visualData trong mỗi step:
     "visualData": {
       "target": { "x": 65, "y": 45, "label": "Cực trị toàn cục (gBest)" },
       "gBest": { "x": 65, "y": 45, "fitness": 98.5 },
       "particles": [
         { "id": "p1", "label": "Hạt 1", "x": 25, "y": 30, "vx": 3.2, "vy": 1.1, "fitness": 62.0 },
         { "id": "p2", "label": "Hạt 2", "x": 60, "y": 42, "vx": 0.8, "vy": 0.4, "fitness": 95.2, "isBest": true },
         { "id": "p3", "label": "Hạt 3", "x": 80, "y": 70, "vx": -2.1, "vy": -1.8, "fitness": 48.0 }
       ],
       "iteration": 1
     }

4. "tree-graph":
   - Dành cho: Cây nhị phân (Binary Search Tree, AVL, Red-Black, Heap, Trie), Cây đệ quy Chia để trị (MergeSort recursion tree), Duyệt đồ thị theo phân tầng, Kiến trúc Neural Network.
   - visualData trong mỗi step:
     "visualData": {
       "activeNodeId": "node-root",
       "treeNodes": [
         { "id": "node-1", "label": "Root", "value": 50, "level": 0, "status": "visited", "details": "Gốc cây" },
         { "id": "node-2", "label": "Trái", "value": 30, "level": 1, "parentId": "node-1", "status": "visiting", "details": "Khóa < 50" },
         { "id": "node-3", "label": "Phải", "value": 70, "level": 1, "parentId": "node-1", "status": "default", "details": "Khóa > 50" }
       ]
     }

5. "flow-graph":
   - Dành cho: Kiến trúc hệ thống phân tán, Microservices, Caching, Message Queue, AI Pipeline (Kafka, Redis, RAG, Load Balancer, OAuth2, WebSocket, CDC, RabbitMQ).
   - "nodes": 2 đến 6 nodes đại diện các dịch vụ.
   - "laneTitles": Tên 2 đến 6 cột phân tầng.
   - "packets": Danh sách gói tin di chuyển giữa các nodes trong bước đó.

YÊU CẦU ĐỊNH DẠNG JSON DUY NHẤT:
{
  "title": "Tên chuẩn của thuật toán hoặc công nghệ",
  "summary": "1 câu tóm tắt cốt lõi nguyên lý hoạt động",
  "category": "Algorithms" | "Distributed Systems" | "Optimization & AI" | "Data Structures",
  "visualizationType": "array-pointer" | "grid-path" | "swarm-2d" | "tree-graph" | "flow-graph",
  "laneTitles": ["Tầng 1", "Tầng 2", "Tầng 3"], // Dành cho flow-graph
  "academicOverview": {
    "mentalModel": "Giải thích trực quan, dễ hiểu bản chất thông qua hình tượng thực tế để người mới nắm bắt ngay.",
    "complexityOrPrinciple": "Đối với Thuật toán: Độ phức tạp Thời gian/Không gian (Big-O chuẩn, VD: O(N log N) trung bình, O(1) không gian) và công thức cốt lõi. Đối với Hệ thống: Định lý CAP, ACID, cơ chế chịu lỗi, hoặc đánh đổi hiệu năng (Trade-offs).",
    "useCases": ["Ứng dụng thực tế 1", "Ứng dụng thực tế 2", "Ứng dụng thực tế 3"]
  },
  "nodes": [ // Dành cho flow-graph (2 đến 6 nodes)
    { "id": "node-1", "name": "Client Gateway", "role": "Tiếp nhận", "layer": "ingress", "icon": "Send", "description": "Mô tả vai trò" }
  ],
  "steps": [
    {
      "stepIndex": 1,
      "title": "Tên bước hành động cụ thể",
      "explanation": "Giải thích chi tiết chuyện gì đang xảy ra trong bước này và TẠI SAO thuật toán/hệ thống lại xử lý như vậy (2-3 câu sâu sắc).",
      "logicCode": "Mã giả (pseudocode) hoặc công thức toán học ngắn gọn (2-4 dòng) thể hiện bước này.",
      "stateVariables": {
        "Biến A": "Giá trị",
        "Biến B": "Giá trị"
      },
      "visualData": {
        // Cấu trúc visualData khớp chính xác với visualizationType đã chọn ở trên
      },
      "packets": [ // Dành cho flow-graph
        { "id": "pkt-1", "fromNodeId": "node-1", "toNodeId": "node-2", "label": "Payload / Command" }
      ]
    }
  ]
}

QUY TẮC CỐT LÕI:
1. Chuẩn mực học thuật: Không viết qua loa. Cung cấp kiến thức chính xác, có cơ sở lý thuyết rõ ràng.
2. Số bước: Sinh từ 5 đến 8 bước mô phỏng liền mạch, phản ánh đúng diễn tiến thật của thuật toán/công nghệ.
3. Chỉ xuất chuỗi JSON thuần túy, tuyệt đối không dùng code block (\`\`\`json) hay thêm lời bình.`;

/**
 * Chuẩn hóa và làm sạch kịch bản sinh ra từ LLM
 */
export function sanitizeScenario(raw: any, query: string): SimulationScenario {
  const validRenderers: RendererType[] = ['flow-graph', 'array-pointer', 'grid-path', 'swarm-2d', 'tree-graph'];

  // 1. Chuẩn hóa visualizationType / rendererType
  const rawType = raw?.visualizationType || raw?.rendererType;
  let rendererType: RendererType = 'flow-graph';
  if (rawType && validRenderers.includes(rawType)) {
    rendererType = rawType;
  }

  // 2. Chuẩn hóa Academic Overview
  const academicOverview: AcademicOverview = {
    mentalModel: String(
      raw?.academicOverview?.mentalModel ||
      raw?.summary ||
      raw?.description ||
      `Mô hình trực quan và bản chất vận hành của ${query}.`
    ),
    complexityOrPrinciple: String(
      raw?.academicOverview?.complexityOrPrinciple ||
      (rendererType === 'array-pointer' || rendererType === 'tree-graph'
        ? 'Độ phức tạp: O(N log N) trung bình, O(1) hoặc O(N) không gian bộ nhớ phụ trợ.'
        : rendererType === 'swarm-2d'
        ? 'Hội tụ bầy đàn: Cập nhật vận tốc v_i(t+1) = w*v_i + c1*r1*(pBest - x_i) + c2*r2*(gBest - x_i).'
        : 'Nguyên lý: Khả năng mở rộng ngang (Horizontal Scalability), chịu lỗi phân tán và giảm độ trễ.')
    ),
    useCases: Array.isArray(raw?.academicOverview?.useCases) && raw.academicOverview.useCases.length > 0
      ? raw.academicOverview.useCases.map((u: any) => String(u))
      : [query, 'Kỹ thuật phần mềm', 'Hệ thống hiệu năng cao'],
  };

  // 3. Chuẩn hóa nodes (cho flow-graph)
  let rawNodes: any[] = Array.isArray(raw?.nodes) ? raw.nodes : [];
  let nodes: SimulationNode[] = [];

  if (rendererType === 'flow-graph') {
    if (rawNodes.length < 2) {
      nodes = [
        { id: 'node-client', name: 'Client Ingress', role: 'Khởi tạo Yêu cầu', layer: 'ingress', status: 'active', icon: 'Send', description: 'Giao diện phát sinh request' },
        { id: 'node-service', name: 'Core Service', role: 'Xử lý logic', layer: 'compute', status: 'active', icon: 'Cpu', description: 'Bộ xử lý trung tâm' },
        { id: 'node-storage', name: 'Primary Store', role: 'Lưu trữ trạng thái', layer: 'storage', status: 'active', icon: 'Database', description: 'Lưu trữ dữ liệu bền vững' },
      ];
    } else {
      nodes = rawNodes.slice(0, 6).map((n, idx) => ({
        id: String(n.id || `node-${idx + 1}`).toLowerCase().replace(/\s+/g, '-'),
        name: String(n.name || `Thành phần ${idx + 1}`),
        role: String(n.role || 'Thành phần hệ thống'),
        layer: String(n.layer || (idx === 0 ? 'ingress' : idx === rawNodes.length - 1 ? 'storage' : 'compute')).toLowerCase(),
        status: 'active',
        icon: String(n.icon || (idx === 0 ? 'Send' : 'Cpu')),
        description: String(n.description || n.role || ''),
      }));
    }
  } else {
    nodes = [];
  }

  const nodeIds = new Set(nodes.map((n) => n.id));
  const firstId = nodes[0]?.id || 'node-1';
  const secondId = nodes[1]?.id || nodes[0]?.id || 'node-2';
  const thirdId = nodes[2]?.id || nodes[1]?.id || 'node-3';

  // 4. Chuẩn hóa steps
  let rawSteps: any[] = Array.isArray(raw?.steps) ? raw.steps : [];
  let steps: SimulationStep[] = [];

  if (rawSteps.length === 0) {
    rawSteps = [
      {
        stepIndex: 1,
        title: 'Khởi tạo luồng xử lý',
        explanation: `Khởi tạo trạng thái ban đầu của kịch bản ${query}.`,
        logicCode: `initScenario("${query}");`,
        stateVariables: { Status: 'INITIALIZED' },
      },
    ];
  }

  steps = rawSteps.map((s, idx) => {
    let visualData = s.visualData || {};
    let arrayData = s.arrayData;
    let gridData = s.gridData;
    let swarmData = s.swarmData;
    let treeData = s.treeData;

    // 4.1 Ánh xạ Array Data
    if (rendererType === 'array-pointer') {
      const arr = visualData?.array || arrayData?.array;
      if (Array.isArray(arr) && arr.length > 0) {
        const generatedPointers: any[] = [];
        if (Array.isArray(visualData.pointers)) {
          generatedPointers.push(...visualData.pointers);
        } else if (visualData.pointers && typeof visualData.pointers === 'object') {
          Object.entries(visualData.pointers).forEach(([name, pIdx]) => {
            generatedPointers.push({ name, index: Number(pIdx), label: `Con trỏ ${name}` });
          });
        }
        if (visualData.pivotIndex !== undefined && !generatedPointers.some((p) => p.name === 'pivot')) {
          generatedPointers.push({ name: 'pivot', index: Number(visualData.pivotIndex), label: 'Pivot' });
        }
        arrayData = {
          array: arr,
          pointers: generatedPointers,
          comparingIndices: visualData.comparingIndices || visualData.comparing || visualData.activeIndices || [],
          swappedIndices: visualData.swappedIndices || visualData.swapped || visualData.swapping || [],
          sortedIndices: visualData.sortedIndices || visualData.sorted || [],
        };
      } else {
        // Fallback default array
        const defaultArray = [24, 15, 68, 35, 82, 49, 90];
        arrayData = {
          array: defaultArray,
          pointers: [{ name: 'i', index: idx % defaultArray.length, label: 'Quét i' }],
          comparingIndices: [idx % defaultArray.length, (idx + 1) % defaultArray.length],
          swappedIndices: [],
          sortedIndices: idx === rawSteps.length - 1 ? [0, 1, 2, 3, 4, 5, 6] : [],
        };
        visualData.array = defaultArray;
      }
    }

    // 4.2 Ánh xạ Grid Data
    if (rendererType === 'grid-path') {
      gridData = gridData || {
        start: visualData.start || [5, 2],
        end: visualData.end || [5, 19],
        visited: visualData.visited || [[5, 2]],
        current: visualData.current || [5, 2],
        path: visualData.path || [],
        heuristic: visualData.heuristic || 'manhattan',
      };
    }

    // 4.3 Ánh xạ Swarm Data
    if (rendererType === 'swarm-2d') {
      const particles = visualData.particles || swarmData?.particles;
      if (Array.isArray(particles) && particles.length > 0) {
        swarmData = {
          target: visualData.target || swarmData?.target || { x: 65, y: 45 },
          gBest: visualData.gBest || swarmData?.gBest || { x: 65, y: 45, fitness: 95 },
          particles,
          iteration: visualData.iteration ?? idx + 1,
          bestFitness: visualData.gBest?.fitness ?? 95,
        };
      } else {
        // Fallback particles
        const fallbackParticles: SwarmParticle[] = [
          { id: 'p1', label: 'Hạt 1', x: Math.max(10, 30 + idx * 6), y: Math.max(15, 25 + idx * 4), vx: 2, vy: 1, fitness: 50 + idx * 8 },
          { id: 'p2', label: 'Hạt 2', x: Math.min(80, 55 + idx * 2), y: Math.min(75, 45 + idx * 2), vx: 0.5, vy: 0.5, fitness: 70 + idx * 5, isBest: true },
          { id: 'p3', label: 'Hạt 3', x: Math.max(15, 75 - idx * 7), y: Math.max(20, 65 - idx * 5), vx: -2, vy: -1, fitness: 40 + idx * 9 },
        ];
        swarmData = {
          target: { x: 65, y: 45 },
          gBest: { x: 65, y: 45, fitness: 95 },
          particles: fallbackParticles,
          iteration: idx + 1,
          bestFitness: 95,
        };
        visualData.particles = fallbackParticles;
      }
    }

    // 4.4 Ánh xạ Tree Data
    if (rendererType === 'tree-graph') {
      const treeNodes = visualData.treeNodes || treeData?.treeNodes;
      if (Array.isArray(treeNodes) && treeNodes.length > 0) {
        treeData = {
          treeNodes,
          activeNodeId: visualData.activeNodeId || treeData?.activeNodeId,
          explanationDetail: visualData.explanationDetail,
        };
      } else {
        // Fallback binary tree
        const defaultTree: TreeNodeItem[] = [
          { id: 't-1', label: 'Root (50)', value: 50, level: 0, status: idx === 0 ? 'visiting' : 'visited' },
          { id: 't-2', label: 'Left (30)', value: 30, level: 1, parentId: 't-1', status: idx === 1 ? 'visiting' : 'default' },
          { id: 't-3', label: 'Right (70)', value: 70, level: 1, parentId: 't-1', status: idx === 2 ? 'visiting' : 'default' },
          { id: 't-4', label: 'L-Left (20)', value: 20, level: 2, parentId: 't-2', status: idx === 3 ? 'visiting' : 'default' },
          { id: 't-5', label: 'L-Right (40)', value: 40, level: 2, parentId: 't-2', status: idx >= 4 ? 'visiting' : 'default' },
        ];
        treeData = {
          treeNodes: defaultTree,
          activeNodeId: defaultTree[Math.min(idx, defaultTree.length - 1)].id,
        };
        visualData.treeNodes = defaultTree;
      }
    }

    // 4.5 Chuẩn hóa Packets cho Flow Graph
    let packets = (Array.isArray(s.packets) ? s.packets : []).map((p: any, pIdx: number) => {
      const fromNodeId = nodeIds.has(p.fromNodeId) ? p.fromNodeId : firstId;
      let toNodeId = nodeIds.has(p.toNodeId) ? p.toNodeId : secondId;
      if (toNodeId === fromNodeId) {
        toNodeId = nodes.find((n) => n.id !== fromNodeId)?.id || secondId;
      }

      return {
        id: String(p.id || `pkt-${idx + 1}-${pIdx + 1}`),
        fromNodeId,
        toNodeId,
        label: String(p.label || 'Data Message'),
        type: 'normal' as const,
        detail: String(p.detail || ''),
      };
    });

    if (packets.length === 0 && rendererType === 'flow-graph' && nodes.length >= 2) {
      const fromIdx = idx % (nodes.length - 1);
      const toIdx = (fromIdx + 1) % nodes.length;
      packets = [
        {
          id: `pkt-${idx + 1}-auto`,
          fromNodeId: nodes[fromIdx].id,
          toNodeId: nodes[toIdx].id,
          label: s.title || `Tiến trình bước ${idx + 1}`,
          type: 'normal',
          detail: s.explanation || 'Chuyển giao trạng thái tiến trình',
        },
      ];
    }

    // Logic code & State Variables
    const logicCode = typeof s.logicCode === 'string' && s.logicCode.trim()
      ? s.logicCode.trim()
      : `// Bước ${idx + 1}: ${s.title || 'Execute step'}\nexecuteStep(${idx + 1});`;

    const stateVariables = (s.stateVariables && typeof s.stateVariables === 'object')
      ? s.stateVariables
      : (s.stateMutation && typeof s.stateMutation === 'object')
      ? s.stateMutation
      : {
          'Bước': `${idx + 1} / ${rawSteps.length}`,
          'Trạng thái': 'PROCESSING',
          'Độ trễ': '0.5ms',
        };

    return {
      stepIndex: idx + 1,
      title: String(s.title || `Bước ${idx + 1}`),
      explanation: String(s.explanation || `Thực thi bước ${idx + 1} trong tiến trình.`),
      visualData,
      arrayData,
      gridData,
      swarmData,
      treeData,
      logicCode,
      stateVariables,
      stateMutation: stateVariables,
      payloadSample: s.payloadSample || stateVariables,
      activeHighlights: Array.isArray(s.activeHighlights) ? s.activeHighlights : undefined,
      packets: packets.length > 0 ? packets : undefined,
    };
  });

  // 5. Chuẩn hóa laneTitles
  let laneTitles: string[] | undefined = undefined;
  if (Array.isArray(raw?.laneTitles) && raw.laneTitles.length >= 2) {
    laneTitles = raw.laneTitles.map((t: any) => String(t));
  } else if (nodes.length > 0) {
    laneTitles = nodes.map((n) => n.name);
  }

  const summary = String(
    raw?.summary || academicOverview.mentalModel
  );

  return {
    id: String(raw?.id || `ai-${Date.now()}`),
    title: String(raw?.title || query),
    summary,
    subtitle: summary,
    category: String(raw?.category || (rendererType === 'flow-graph' ? 'Distributed Systems' : 'Algorithms')),
    rendererType,
    visualizationType: rendererType,
    laneTitles,
    tags: Array.isArray(raw?.tags) && raw.tags.length > 0 ? raw.tags : [query, 'TechViz Sandbox'],
    description: summary,
    academicOverview,
    nodes,
    steps,
  };
}

/**
 * Tự động gọi Groq AI Pipeline:
 * 1. Môi trường Cloudflare Pages: Tự động gọi qua Cloudflare Pages Function `/api/groq`
 *    (hàm serverless bảo mật đọc trực tiếp key từ mục Variables and secrets của Cloudflare).
 * 2. Môi trường phát triển cục bộ (Local): Nếu có biến `import.meta.env.VITE_GROQ_API_KEY`,
 *    gọi trực tiếp Groq Cloud API.
 */
export async function generateScenarioWithGroq(
  userQuery: string
): Promise<SimulationScenario> {
  const localEnvKey = (import.meta.env.VITE_GROQ_API_KEY || '').trim();
  const hasValidLocalKey = Boolean(
    localEnvKey &&
    !localEnvKey.includes('your_actual_groq_api_key_here')
  );

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 28000); // 28s timeout
  let rawJsonContent: string | null = null;
  let lastErrorMsg = '';

  try {
    // A. Ưu tiên gọi Cloudflare Pages Function `/api/groq` (lấy tự động từ Variables and secrets)
    try {
      const response = await fetch('/api/groq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: `Hãy phân tích học thuật và tạo kịch bản mô phỏng trực quan tương tác hoàn chỉnh cho công nghệ/thuật toán sau: "${userQuery}"`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        rawJsonContent = data?.choices?.[0]?.message?.content || null;
      } else {
        const errJson: any = await response.json().catch(() => ({}));
        lastErrorMsg = errJson?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (funcErr: any) {
      lastErrorMsg = funcErr?.message || String(funcErr);
    }

    // B. Nếu gọi `/api/groq` không có kết quả (ví dụ đang chạy `npm run dev` ở local không có Cloudflare Function)
    // và có local key trong file .env, gọi trực tiếp Groq Cloud API
    if (!rawJsonContent && hasValidLocalKey) {
      for (const model of CANDIDATE_MODELS) {
        try {
          const directRes = await fetch(GROQ_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localEnvKey}`,
            },
            signal: controller.signal,
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                {
                  role: 'user',
                  content: `Hãy phân tích học thuật và tạo kịch bản mô phỏng trực quan tương tác hoàn chỉnh cho công nghệ/thuật toán sau: "${userQuery}"`,
                },
              ],
              response_format: { type: 'json_object' },
              temperature: 0.2,
            }),
          });

          if (directRes.ok) {
            const data = await directRes.json();
            rawJsonContent = data?.choices?.[0]?.message?.content || null;
            if (rawJsonContent) break;
          } else {
            const errJson: any = await directRes.json().catch(() => ({}));
            lastErrorMsg = errJson?.error?.message || `HTTP ${directRes.status}`;
          }
        } catch (dirErr: any) {
          lastErrorMsg = dirErr?.message || String(dirErr);
        }
      }
    }

    if (!rawJsonContent) {
      throw new Error(
        lastErrorMsg || 'Không thể kết nối Groq AI. Vui lòng kiểm tra biến môi trường VITE_GROQ_API_KEY hoặc GROQ_API_KEY trên Cloudflare.'
      );
    }

    const cleanedJson = rawJsonContent.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsedJson = JSON.parse(cleanedJson);
    return sanitizeScenario(parsedJson, userQuery);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('TIMEOUT: Quá thời gian chờ (28 giây) khi kết nối Groq Cloud AI.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
