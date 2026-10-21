import { SimulationScenario } from '../types/simulation';

export const DEFAULT_GRID_CONFIG = {
  rows: 12,
  cols: 22,
  start: [5, 2] as [number, number],
  end: [5, 19] as [number, number],
  initialWalls: [
    [2, 10], [3, 10], [4, 10], [5, 10], [6, 10], [7, 10], [8, 10],
    [8, 11], [8, 12], [8, 13],
    [2, 14], [3, 14], [4, 14], [5, 14], [6, 14],
  ] as [number, number][],
};

export const pathfindingScenario: SimulationScenario = {
  id: 'astar-dijkstra-grid',
  title: 'A* & Dijkstra Pathfinding (Duyệt sóng & Tìm đường tối ưu)',
  subtitle: 'Trực quan hóa luồng tìm đường Heuristic h(n) và tương tác vẽ vật cản trên lưới 2D',
  category: 'Graph & Pathfinding',
  tags: ['A* Algorithm', 'Dijkstra', 'Heuristic h(n)', 'Grid Pathfinding', 'Shortest Path', 'Realtime Interactive'],
  academicOverview: {
    mentalModel: 'La bàn thông minh dẫn lối: Dijkstra lan truyền sóng tròn 360 độ mù quáng để tìm đường. A* kết hợp chi phí thực tế đã đi g(n) với một hàm la bàn ước lượng khoảng cách h(n) hướng thẳng về phía đích (Heuristic), giúp tập trung sóng tìm kiếm như đèn pha rọi đường.',
    complexityOrPrinciple: 'Hàm đánh giá chi phí f(n) = g(n) + h(n). Nếu hàm heuristic h(n) chấp nhận được (Admissible: không bao giờ đánh giá quá cao chi phí thực tế), A* đảm bảo tìm ra đường đi ngắn nhất tuyệt đối. Độ phức tạp thời gian: O(E log V) với hàng đợi ưu tiên Min-Heap.',
    useCases: [
      'Tìm đường bản đồ số Google Maps, Grab, Apple Maps',
      'Điều hướng di chuyển của nhân vật (NPC Navigation Mesh) trong game 3D',
      'Robot tự hành AGV tránh vật cản trong kho vận thông minh',
    ],
  },
  rendererType: 'grid-path',
  laneTitles: [
    'Hàm lượng giá Heuristic',
    'Hướng di chuyển Lưới',
    'Bản đồ Trọng số Ô',
    'Truy vết Đường ngắn nhất',
  ],
  description:
    'Mô phỏng thuật toán tìm đường tối ưu A* và Dijkstra trên không gian lưới 2D tương tác. Người dùng có thể kéo thả chuột vẽ tường chắn thời gian thực, bật/tắt hàm lượng giá Heuristic, di chuyển 8 hướng và truy vết đường đi ngắn nhất phát sáng rực rỡ mang phong cách Techcombank.',
  defaultGridConfig: DEFAULT_GRID_CONFIG,
  nodes: [
    {
      id: 'useHeuristic',
      name: 'Hàm lượng giá Heuristic h(n)',
      role: 'A* (BẬT) vs Dijkstra (TẮT)',
      layer: 'compute',
      status: 'active',
      icon: 'Compass',
      description:
        'Khi BẬT (A*), thuật toán dùng hàm khoảng cách h(n) để hướng luồng tìm kiếm trực diện về phía đích. Khi TẮT (Dijkstra), sóng lan truyền tròn 360 độ.',
    },
    {
      id: 'allowDiagonal',
      name: 'Di chuyển chéo 8 hướng',
      role: '8 Hướng (BẬT) vs 4 Hướng (TẮT)',
      layer: 'ingress',
      status: 'active',
      icon: 'Move',
      description:
        'Cho phép di chuyển chéo các góc với chi phí căn bậc 2 (~1.414). Đường đi mượt hơn và tối ưu quãng đường so với 4 hướng Manhattan truyền thống.',
    },
    {
      id: 'showWeights',
      name: 'Hiển thị trọng số chi phí f(n)',
      role: 'f(n) = g(n) + h(n)',
      layer: 'storage',
      status: 'active',
      icon: 'Hash',
      description:
        'Hiển thị trực quan chỉ số chi phí f(n) hoặc khoảng cách g(n) tại từng ô đã được duyệt, giúp hiểu rõ cách hàng đợi ưu tiên lựa chọn ô kế tiếp.',
    },
    {
      id: 'autoTracePath',
      name: 'Truy vết đường ngắn nhất',
      role: 'Backtracking Shortest Path',
      layer: 'egress',
      status: 'active',
      icon: 'Navigation',
      description:
        'Tự động kích hoạt cơ chế Backtracking từ Đích về Nguồn, vẽ dải đường đi tối ưu màu đỏ #E31B23 phát sáng rực rỡ.',
    },
  ],
  steps: [
    {
      stepIndex: 1,
      title: 'Bước 1: Khởi tạo Start (S) và Target (T)',
      explanation:
        'Xác định tọa độ xuất phát Start (ô xanh lá [5, 2]) và điểm Đích Target (ô đỏ Techcombank [5, 19]). Thuật toán khởi tạo tập mở Open Set với nút Start, đặt g(S) = 0 và đánh giá khoảng cách Manhattan/Euclidean ban đầu h(S) đến đích.',
      activeHighlights: ['useHeuristic'],
      packets: [],
      gridData: {
        start: [5, 2],
        end: [5, 19],
        current: [5, 2],
        visited: [[5, 2]],
        path: [],
        heuristic: 'manhattan',
      },
    },
    {
      stepIndex: 2,
      title: 'Bước 2: Lan truyền tập mở (Open Set Expansion)',
      explanation:
        'Thuật toán liên tục lấy phần tử có hàm chi phí f(n) = g(n) + h(n) nhỏ nhất từ hàng đợi ưu tiên. Luồng sóng tìm kiếm lan tỏa sang các ô lân cận (4 hướng hoặc 8 hướng), liên tục cập nhật chi phí và mở rộng biên tìm kiếm tiến về phía đích.',
      activeHighlights: ['useHeuristic', 'allowDiagonal'],
      packets: [],
      gridData: {
        start: [5, 2],
        end: [5, 19],
        current: [5, 8],
        visited: [
          [5, 2], [5, 3], [4, 2], [6, 2], [5, 1], [5, 4], [4, 3], [6, 3],
          [3, 2], [7, 2], [4, 1], [6, 1], [5, 5], [4, 4], [6, 4], [3, 3],
          [7, 3], [2, 2], [8, 2], [5, 6], [4, 5], [6, 5], [3, 4], [7, 4],
          [5, 7], [4, 6], [6, 6], [3, 5], [7, 5], [5, 8], [4, 7], [6, 7]
        ],
        path: [],
        heuristic: 'manhattan',
      },
    },
    {
      stepIndex: 3,
      title: 'Bước 3: Gặp vật cản (Walls) & Bẻ hướng sóng qua khe hở',
      explanation:
        'Khi gặp tường chắn (màu xám than #1F2937), thuật toán tự động bỏ qua các ô này. Luồng sóng tìm kiếm phân tách và bẻ hướng vòng qua khe hở phía trên (hàng 0 - 1) và khe phía dưới để tiếp tục hành trình hướng về phía đích.',
      activeHighlights: ['useHeuristic', 'showWeights'],
      packets: [],
      gridData: {
        start: [5, 2],
        end: [5, 19],
        current: [1, 12],
        visited: [
          [5, 2], [5, 3], [4, 2], [6, 2], [5, 1], [5, 4], [4, 3], [6, 3],
          [3, 2], [7, 2], [4, 1], [6, 1], [5, 5], [4, 4], [6, 4], [3, 3],
          [7, 3], [2, 2], [8, 2], [5, 6], [4, 5], [6, 5], [3, 4], [7, 4],
          [5, 7], [4, 6], [6, 6], [3, 5], [7, 5], [5, 8], [4, 7], [6, 7],
          [5, 9], [4, 8], [6, 8], [3, 6], [7, 6], [4, 9], [3, 8], [7, 8],
          [3, 9], [2, 9], [1, 9], [0, 9], [1, 10], [0, 10], [1, 11], [0, 11],
          [1, 12], [0, 12], [1, 13], [0, 13], [9, 8], [9, 9], [9, 10], [10, 8],
          [10, 9], [11, 8]
        ],
        path: [],
        heuristic: 'manhattan',
      },
    },
    {
      stepIndex: 4,
      title: 'Bước 4: Chạm đích & Truy vết ngược đường đi ngắn nhất (Backtracking)',
      explanation:
        'Ô Target [5, 19] chính thức được duyệt. Thuật toán kích hoạt quy trình Backtracking từ Target lần ngược theo các nút cha (cameFrom) về điểm Start. Dải đường đi ngắn nhất màu đỏ Techcombank #E31B23 rực rỡ phát sáng nổi bật toàn bộ ma trận lưới!',
      activeHighlights: ['autoTracePath', 'showWeights'],
      packets: [],
      gridData: {
        start: [5, 2],
        end: [5, 19],
        current: [5, 19],
        visited: [
          [5, 2], [5, 3], [4, 2], [6, 2], [5, 1], [5, 4], [4, 3], [6, 3],
          [3, 2], [7, 2], [4, 1], [6, 1], [5, 5], [4, 4], [6, 4], [3, 3],
          [7, 3], [2, 2], [8, 2], [5, 6], [4, 5], [6, 5], [3, 4], [7, 4],
          [5, 7], [4, 6], [6, 6], [3, 5], [7, 5], [5, 8], [4, 7], [6, 7],
          [5, 9], [4, 8], [6, 8], [3, 6], [7, 6], [4, 9], [3, 8], [7, 8],
          [3, 9], [2, 9], [1, 9], [0, 9], [1, 10], [0, 10], [1, 11], [0, 11],
          [1, 12], [0, 12], [1, 13], [0, 13], [1, 14], [0, 14], [1, 15], [0, 15],
          [2, 15], [3, 15], [4, 15], [5, 15], [5, 16], [4, 16], [6, 16],
          [5, 17], [4, 17], [6, 17], [5, 18], [4, 18], [6, 18], [5, 19]
        ],
        path: [
          [5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [5, 7], [5, 8], [5, 9],
          [4, 9], [3, 9], [2, 9], [1, 9], [1, 10], [1, 11], [1, 12], [1, 13],
          [1, 14], [1, 15], [2, 15], [3, 15], [4, 15], [5, 15], [5, 16], [5, 17],
          [5, 18], [5, 19]
        ],
        heuristic: 'manhattan',
      },
    },
  ],
};
