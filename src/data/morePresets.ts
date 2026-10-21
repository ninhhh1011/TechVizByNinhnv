import { SimulationScenario } from '../types/simulation';

/**
 * 1. MergeSort (Cây đệ quy Chia để trị) - Tree Graph Engine
 */
export const mergeSortScenario: SimulationScenario = {
  id: 'merge-sort',
  title: 'MergeSort (Cây Đệ quy Chia để Trị)',
  subtitle: 'Trực quan hóa cấu trúc cây phân rã và hòa trộn mảng con',
  summary: 'Mô phỏng cây đệ quy chia đôi mảng O(log N) tầng và quá trình hòa trộn hai danh sách con có thứ tự theo nguyên lý chia để trị kinh điển.',
  category: 'Algorithms',
  visualizationType: 'tree-graph',
  rendererType: 'tree-graph',
  tags: ['MergeSort', 'Divide and Conquer', 'Recursion Tree', 'Sorting', 'O(N log N)', 'Stable Sort'],
  description: 'Trực quan hóa cây đệ quy MergeSort từ mảng gốc 8 phần tử phân rã xuống các mảng con 1 phần tử rồi hợp nhất ngược lên gốc.',
  academicOverview: {
    mentalModel: 'Chiến lược Chia để Trị (Divide & Conquer): Chia một bài toán lớn thành các bài toán con cùng dạng cho đến khi chúng đủ nhỏ để giải trực tiếp (mảng 1 phần tử luôn có thứ tự), sau đó hòa trộn kết quả của các bài toán con lại với nhau.',
    complexityOrPrinciple: 'Độ phức tạp thời gian: O(N log N) trong mọi trường hợp (Tốt nhất, Trung bình, Xấu nhất). Không gian bộ nhớ phụ trợ: O(N) do cần mảng đệm khi trộn. Tính ổn định (Stable Sort): CÓ bảo toàn thứ tự ban đầu.',
    useCases: [
      'Sắp xếp ngoài (External Sorting) cho tập dữ liệu khổng lồ không vừa RAM',
      'Sắp xếp danh sách liên kết đơn (Singly Linked List) với O(1) bộ nhớ phụ',
      'Được dùng làm thuật toán nền tảng trong Timsort (Python sorted, Java Arrays.sort)',
    ],
  },
  nodes: [],
  steps: [
    {
      stepIndex: 1,
      title: 'Khởi tạo Mảng gốc (Root Node Level 0)',
      explanation: 'Mảng ban đầu [38, 27, 43, 3, 9, 82, 10, 19] tại gốc đệ quy. Thuật toán chuẩn bị chia đôi tại chỉ số giữa mid = 3 thành 2 bài toán con.',
      logicCode: 'void mergeSort(int arr[], int l, int r) {\n  if (l < r) {\n    int m = l + (r - l) / 2;\n    mergeSort(arr, l, m);\n    mergeSort(arr, m + 1, r);\n    merge(arr, l, m, r);\n  }\n}',
      stateVariables: {
        'Tầng cây (Level)': '0 (Root)',
        'Độ dài mảng': '8 phần tử',
        'Điểm chia (mid)': 'Chỉ số 3',
        'Trạng thái': 'BẮT ĐẦU PHÂN RÃ',
      },
      treeData: {
        activeNodeId: 'node-root',
        explanationDetail: 'Gốc cây: Mảng chưa sắp xếp',
        treeNodes: [
          { id: 'node-root', label: 'Gốc [8]', value: '[38, 27, 43, 3, 9, 82, 10, 19]', level: 0, status: 'visiting', details: 'N = 8' },
        ],
      },
    },
    {
      stepIndex: 2,
      title: 'Phân rã Tầng 1: Chia đôi thành 2 Nửa độc lập',
      explanation: 'Mảng gốc được tách thành 2 mảng con cấp 1: Nửa trái [38, 27, 43, 3] và Nửa phải [9, 82, 10, 19]. Cả hai tiếp tục được xử lý đệ quy.',
      logicCode: 'leftSubtree = mergeSort(arr, 0, 3);\nrightSubtree = mergeSort(arr, 4, 7);',
      stateVariables: {
        'Nửa trái': '[38, 27, 43, 3]',
        'Nửa phải': '[9, 82, 10, 19]',
        'Độ sâu đệ quy': 'Tầng 1 (h = 1)',
        'Số bài toán con': '2 bài toán',
      },
      treeData: {
        activeNodeId: 'node-l1-left',
        explanationDetail: 'Tầng 1: Chia thành 2 nửa kích thước 4',
        treeNodes: [
          { id: 'node-root', label: 'Gốc [8]', value: '[38, 27, 43, 3, 9, 82, 10, 19]', level: 0, status: 'visited', details: 'N = 8' },
          { id: 'node-l1-left', label: 'Trái [4]', value: '[38, 27, 43, 3]', level: 1, parentId: 'node-root', status: 'visiting', details: 'Trái' },
          { id: 'node-l1-right', label: 'Phải [4]', value: '[9, 82, 10, 19]', level: 1, parentId: 'node-root', status: 'default', details: 'Phải' },
        ],
      },
    },
    {
      stepIndex: 3,
      title: 'Phân rã Tầng 2: Chia thành các cặp 2 phần tử',
      explanation: 'Tiếp tục chia đôi xuống tầng 2: sinh ra 4 mảng con [38, 27], [43, 3], [9, 82] và [10, 19]. Cấu trúc cây đệ quy mở rộng đều sang hai nhánh.',
      logicCode: 'splitPairs(leftSubtree);\nsplitPairs(rightSubtree);',
      stateVariables: {
        'Cặp 1': '[38, 27]',
        'Cặp 2': '[43, 3]',
        'Cặp 3': '[9, 82]',
        'Cặp 4': '[10, 19]',
      },
      treeData: {
        activeNodeId: 'node-l2-1',
        explanationDetail: 'Tầng 2: 4 mảng con kích thước 2',
        treeNodes: [
          { id: 'node-root', label: 'Gốc [8]', value: '[...]', level: 0, status: 'visited' },
          { id: 'node-l1-left', label: 'Trái [4]', value: '[38, 27, 43, 3]', level: 1, parentId: 'node-root', status: 'visited' },
          { id: 'node-l1-right', label: 'Phải [4]', value: '[9, 82, 10, 19]', level: 1, parentId: 'node-root', status: 'visited' },
          { id: 'node-l2-1', label: 'Cặp 1', value: '[38, 27]', level: 2, parentId: 'node-l1-left', status: 'visiting' },
          { id: 'node-l2-2', label: 'Cặp 2', value: '[43, 3]', level: 2, parentId: 'node-l1-left', status: 'default' },
          { id: 'node-l2-3', label: 'Cặp 3', value: '[9, 82]', level: 2, parentId: 'node-l1-right', status: 'default' },
          { id: 'node-l2-4', label: 'Cặp 4', value: '[10, 19]', level: 2, parentId: 'node-l1-right', status: 'default' },
        ],
      },
    },
    {
      stepIndex: 4,
      title: 'Hòa trộn Cặp Lá (Conquer & Merge Leaves)',
      explanation: 'Các cặp mảng kích thước 2 được hòa trộn có thứ tự: [38, 27] &rarr; [27, 38]; [43, 3] &rarr; [3, 43]; [9, 82] &rarr; [9, 82]; [10, 19] &rarr; [10, 19].',
      logicCode: 'merge(arr, l, m, r); // Two pointers i, j so sánh và ghép có thứ tự',
      stateVariables: {
        'Cặp 1 đã sắp': '[27, 38]',
        'Cặp 2 đã sắp': '[3, 43]',
        'Cặp 3 đã sắp': '[9, 82]',
        'Cặp 4 đã sắp': '[10, 19]',
      },
      treeData: {
        activeNodeId: 'node-l2-1',
        explanationDetail: 'Hòa trộn đáy cây: các nút lá đổi sang trạng thái hoàn tất',
        treeNodes: [
          { id: 'node-root', label: 'Gốc [8]', value: '[...]', level: 0, status: 'visited' },
          { id: 'node-l1-left', label: 'Trái [4]', value: '[3, 27, 38, 43]', level: 1, parentId: 'node-root', status: 'visiting' },
          { id: 'node-l1-right', label: 'Phải [4]', value: '[9, 10, 19, 82]', level: 1, parentId: 'node-root', status: 'default' },
          { id: 'node-l2-1', label: 'Cặp 1', value: '[27, 38]', level: 2, parentId: 'node-l1-left', status: 'visited' },
          { id: 'node-l2-2', label: 'Cặp 2', value: '[3, 43]', level: 2, parentId: 'node-l1-left', status: 'visited' },
          { id: 'node-l2-3', label: 'Cặp 3', value: '[9, 82]', level: 2, parentId: 'node-l1-right', status: 'visited' },
          { id: 'node-l2-4', label: 'Cặp 4', value: '[10, 19]', level: 2, parentId: 'node-l1-right', status: 'visited' },
        ],
      },
    },
    {
      stepIndex: 5,
      title: 'Hòa trộn Hoàn tất về Gốc (Final Merge at Root)',
      explanation: 'Hai mảng con [3, 27, 38, 43] và [9, 10, 19, 82] được con trỏ hai đầu so sánh lần cuối, tạo thành mảng hoàn chỉnh có thứ tự tuyệt đối tại nút gốc.',
      logicCode: 'finalSortedArray = merge(leftSorted, rightSorted);\nreturn finalSortedArray;',
      stateVariables: {
        'Mảng đích hoàn chỉnh': '[3, 9, 10, 19, 27, 38, 43, 82]',
        'Tổng số phép so sánh': 'N * log2(N) ~ 24',
        'Trạng thái': 'HOÀN TẤT THÀNH CÔNG',
      },
      treeData: {
        activeNodeId: 'node-root',
        explanationDetail: 'Gốc cây: Mảng sắp xếp hoàn chỉnh',
        treeNodes: [
          { id: 'node-root', label: 'Gốc [8]', value: '[3, 9, 10, 19, 27, 38, 43, 82]', level: 0, status: 'visiting', details: 'Sorted!' },
          { id: 'node-l1-left', label: 'Trái [4]', value: '[3, 27, 38, 43]', level: 1, parentId: 'node-root', status: 'visited' },
          { id: 'node-l1-right', label: 'Phải [4]', value: '[9, 10, 19, 82]', level: 1, parentId: 'node-root', status: 'visited' },
          { id: 'node-l2-1', label: 'Cặp 1', value: '[27, 38]', level: 2, parentId: 'node-l1-left', status: 'visited' },
          { id: 'node-l2-2', label: 'Cặp 2', value: '[3, 43]', level: 2, parentId: 'node-l1-left', status: 'visited' },
          { id: 'node-l2-3', label: 'Cặp 3', value: '[9, 82]', level: 2, parentId: 'node-l1-right', status: 'visited' },
          { id: 'node-l2-4', label: 'Cặp 4', value: '[10, 19]', level: 2, parentId: 'node-l1-right', status: 'visited' },
        ],
      },
    },
  ],
};

/**
 * 2. BubbleSort (Sắp xếp Nổi bọt) - Array Pointer
 */
export const bubbleSortScenario: SimulationScenario = {
  id: 'bubble-sort',
  title: 'BubbleSort (Sắp xếp Nổi bọt)',
  subtitle: 'So sánh cặp kề nhau và đẩy phần tử lớn nhất về cuối mảng',
  summary: 'Duyệt nhiều lượt qua mảng, liên tục so sánh hai phần tử kề nhau và đổi chỗ nếu chúng đứng sai thứ tự.',
  category: 'Algorithms',
  visualizationType: 'array-pointer',
  rendererType: 'array-pointer',
  tags: ['BubbleSort', 'Sort', 'Brute Force', 'O(N^2)', 'Elementary'],
  description: 'Trực quan hóa thuật toán BubbleSort so sánh từng cặp liền kề.',
  academicOverview: {
    mentalModel: 'Hình tượng các bọt khí nổi lên mặt nước: các phần tử có giá trị lớn hơn sẽ nhẹ hơn và "nổi" dần về phía cuối mảng sau mỗi vòng quét.',
    complexityOrPrinciple: 'Độ phức tạp: O(N^2) xấu nhất và trung bình, O(N) tốt nhất (nếu mảng đã sắp xếp và có cờ kiểm tra swapped). Không gian bộ nhớ: O(1) tại chỗ (In-place).',
    useCases: [
      'Giảng dạy trực quan khái niệm thuật toán sắp xếp sơ cấp trong đại học',
      'Kiểm tra tính có thứ tự của mảng với chi phí O(N)',
    ],
  },
  nodes: [],
  steps: [
    {
      stepIndex: 1,
      title: 'Khởi tạo mảng ban đầu',
      explanation: 'Mảng gồm 6 số nguyên chưa có thứ tự [64, 34, 25, 12, 22, 11]. Con trỏ i = 0 bắt đầu quét.',
      logicCode: 'for (int i = 0; i < n - 1; i++) {\n  for (int j = 0; j < n - i - 1; j++) {\n    if (arr[j] > arr[j + 1]) swap(arr[j], arr[j + 1]);\n  }\n}',
      stateVariables: { 'Vòng lặp ngoài i': '0', 'Con trỏ j': '0', 'Số phép đổi': '0' },
      arrayData: {
        array: [64, 34, 25, 12, 22, 11],
        pointers: [{ name: 'j', index: 0, label: 'j = 0' }],
        comparingIndices: [0, 1],
        sortedIndices: [],
      },
    },
    {
      stepIndex: 2,
      title: 'So sánh & Đổi chỗ arr[0]=64 với arr[1]=34',
      explanation: 'Vì 64 > 34, hai phần tử hoán đổi vị trí. Phần tử 64 bắt đầu nổi dần về phía sau.',
      logicCode: 'if (arr[0] > arr[1]) swap(arr[0], arr[1]);',
      stateVariables: { 'Hoán đổi': '64 <-> 34', 'Vị trí j': '0', 'Trạng thái': 'SWAPPED' },
      arrayData: {
        array: [34, 64, 25, 12, 22, 11],
        pointers: [{ name: 'j', index: 1, label: 'j = 1' }],
        swappedIndices: [0, 1],
        sortedIndices: [],
      },
    },
    {
      stepIndex: 3,
      title: 'Đẩy phần tử lớn nhất 64 về cuối mảng',
      explanation: 'Số 64 liên tục thắng các cặp so sánh tiếp theo và chốt vị trí tại chỉ số cuối cùng.',
      logicCode: 'arr[n - 1] = 64; // Phần tử lớn nhất đã chốt',
      stateVariables: { 'Đã chốt': 'arr[5] = 64', 'Vòng hoàn tất': 'Lượt 1', 'Độ dài chưa chốt': '5' },
      arrayData: {
        array: [34, 25, 12, 22, 11, 64],
        pointers: [{ name: 'sorted', index: 5, label: 'Chốt 64' }],
        comparingIndices: [4, 5],
        sortedIndices: [5],
      },
    },
    {
      stepIndex: 4,
      title: 'Lượt quét tiếp theo: Chốt số 34',
      explanation: 'Lượt quét thứ hai đưa phần tử lớn nhì (34) về vị trí kề cuối arr[4].',
      logicCode: 'arr[n - 2] = 34; // Chốt phần tử lớn thứ nhì',
      stateVariables: { 'Đã chốt': 'arr[4] = 34', 'Vòng hoàn tất': 'Lượt 2' },
      arrayData: {
        array: [25, 12, 22, 11, 34, 64],
        pointers: [{ name: 'sorted', index: 4, label: 'Chốt 34' }],
        sortedIndices: [4, 5],
      },
    },
    {
      stepIndex: 5,
      title: 'Hoàn tất Sắp xếp Nổi bọt',
      explanation: 'Tất cả các phần tử đã nổi về đúng vị trí có thứ tự tăng dần [11, 12, 22, 25, 34, 64].',
      logicCode: 'return sortedArray; // O(N^2) complexity',
      stateVariables: { 'Mảng hoàn chỉnh': '[11, 12, 22, 25, 34, 64]', 'Trạng thái': 'SORTED_OPTIMAL' },
      arrayData: {
        array: [11, 12, 22, 25, 34, 64],
        pointers: [{ name: 'done', index: 0, label: 'Hoàn tất' }],
        sortedIndices: [0, 1, 2, 3, 4, 5],
      },
    },
  ],
};

/**
 * 3. Load Balancer (Bộ cân bằng tải) - Flow Graph
 */
export const loadBalancerScenario: SimulationScenario = {
  id: 'load-balancer',
  title: 'Layer 7 Load Balancer (Cân bằng tải Round-Robin)',
  subtitle: 'Phân phối lưu lượng HTTP thông minh và điều hướng khi Server quá tải',
  summary: 'Mô phỏng bộ cân bằng tải phân phối các yêu cầu HTTP từ hàng ngàn Client đến cụm máy chủ phía sau theo giải thuật Round-Robin và Health Check.',
  category: 'Distributed Systems',
  visualizationType: 'flow-graph',
  rendererType: 'flow-graph',
  tags: ['Load Balancer', 'Round-Robin', 'High Availability', 'Reverse Proxy', 'Failover'],
  description: 'Mô phỏng cân bằng tải ứng dụng L7 với phát hiện lỗi và tự động reroute.',
  academicOverview: {
    mentalModel: 'Người tiếp tân thông minh điều hướng khách: khi khách hàng dồn dập kéo đến, người tiếp tân lần lượt chỉ khách sang Quầy 1, Quầy 2, Quầy 3. Nếu Quầy 2 bất ngờ bận hoặc hỏng máy, người tiếp tân tự động chuyển khách sang quầy dự phòng ngay lập tức.',
    complexityOrPrinciple: 'Thuật toán: Weighted Round-Robin hoặc Least Connections. Nguyên lý: Giữ độ trễ P99 thấp, chống nghẽn đơn điểm (Single Point of Failure), bảo vệ backend bằng Rate Limiting và Circuit Breaker.',
    useCases: [
      'Reverse Proxy NGINX / HAProxy / AWS ALB trong kiến trúc Web vĩ mô',
      'Gateway điều hướng API tài chính ngân hàng chịu tải triệu TPS',
    ],
  },
  laneTitles: ['Người dùng (Clients)', 'Điều phối (Load Balancer)', 'Máy chủ (Server Cluster)'],
  nodes: [
    { id: 'lb-client', name: 'Clients Gateway', role: 'Traffic Source', layer: 'ingress', status: 'active', icon: 'Send', description: 'Hàng ngàn yêu cầu truy cập đồng thời' },
    { id: 'lb-balancer', name: 'L7 Load Balancer', role: 'Reverse Proxy', layer: 'compute', status: 'active', icon: 'Layers', description: 'Phân phối tải & kiểm tra Health Check' },
    { id: 'lb-server-1', name: 'Backend Server A', role: 'Worker 1', layer: 'storage', status: 'active', icon: 'Server', description: 'Máy chủ xử lý ứng dụng số 1' },
    { id: 'lb-server-2', name: 'Backend Server B', role: 'Worker 2', layer: 'storage', status: 'active', icon: 'Server', description: 'Máy chủ xử lý ứng dụng số 2' },
  ],
  steps: [
    {
      stepIndex: 1,
      title: 'Tiếp nhận luồng Request đầu vào',
      explanation: 'Client gửi yêu cầu HTTP GET /transactions đến địa chỉ IP công khai của Load Balancer.',
      logicCode: 'Request req = parseHttpRequest(socket);\nServer target = selectServer(RoundRobin);',
      stateVariables: { 'Request ID': 'REQ_8819', 'Giao thức': 'HTTP/2 TLS 1.3', 'Thời gian': '0.15ms' },
      packets: [{ id: 'pkt-lb-1', fromNodeId: 'lb-client', toNodeId: 'lb-balancer', label: 'HTTP GET /tx' }],
    },
    {
      stepIndex: 2,
      title: 'Điều phối tới Server A theo Round-Robin',
      explanation: 'Load Balancer chọn Server A cho yêu cầu đầu tiên và chuyển tiếp gói tin qua mạng nội bộ.',
      logicCode: 'proxy_pass http://backend_server_a:8080;',
      stateVariables: { 'Máy chủ được chọn': 'Server A', 'Tải CPU Server A': '28%', 'Thuật toán': 'Round-Robin' },
      packets: [{ id: 'pkt-lb-2', fromNodeId: 'lb-balancer', toNodeId: 'lb-server-1', label: 'Proxy GET -> Srv A' }],
    },
    {
      stepIndex: 3,
      title: 'Điều phối yêu cầu kế tiếp tới Server B',
      explanation: 'Yêu cầu tiếp theo được gán cho Server B để chia sẻ tải đều đặn, không để máy nào bị quá tải.',
      logicCode: 'nextServerIndex = (currentIndex + 1) % serverCount;',
      stateVariables: { 'Máy chủ được chọn': 'Server B', 'Tải CPU Server B': '32%', 'Cân bằng tải': '1:1' },
      packets: [{ id: 'pkt-lb-3', fromNodeId: 'lb-balancer', toNodeId: 'lb-server-2', label: 'Proxy GET -> Srv B' }],
    },
    {
      stepIndex: 4,
      title: 'Health Check & Phát hiện lỗi nút',
      explanation: 'Load Balancer liên tục phát tín hiệu Health Check probe để đảm bảo các máy chủ luôn phản hồi tốt.',
      logicCode: 'if (!healthCheck(srv)) markOffline(srv);',
      stateVariables: { 'Health Probe': 'PASS 200 OK', 'Chu kỳ kiểm tra': '5000ms', 'Sẵn sàng': '100%' },
      packets: [{ id: 'pkt-lb-4', fromNodeId: 'lb-balancer', toNodeId: 'lb-server-1', label: 'Health Probe 200 OK' }],
    },
    {
      stepIndex: 5,
      title: 'Phản hồi kết quả về phía Client',
      explanation: 'Server xử lý xong logic nghiệp vụ, Load Balancer gửi gói tin phản hồi HTTP 200 OK về Client an toàn.',
      logicCode: 'clientSocket.send(httpResponse200);',
      stateVariables: { 'Mã trạng thái': 'HTTP 200 OK', 'Độ trễ toàn trình': '1.2ms', 'Thông lượng': '12.000 RPS' },
      packets: [{ id: 'pkt-lb-5', fromNodeId: 'lb-server-1', toNodeId: 'lb-client', label: 'HTTP 200 OK (Data)' }],
    },
  ],
};

/**
 * 4. Token Bucket (Kiểm soát Tốc độ) - Flow Graph
 */
export const tokenBucketScenario: SimulationScenario = {
  id: 'token-bucket',
  title: 'Token Bucket Rate Limiter (Kiểm soát Tốc độ Yêu cầu)',
  subtitle: 'Cơ chế làm đầy xô token để chống nghẽn và ngăn chặn tấn công DoS',
  summary: 'Mô phỏng thuật toán Token Bucket: các token được thêm vào xô với tốc độ cố định; mỗi yêu cầu phải lấy được token mới được phép đi qua, nếu hết token yêu cầu sẽ bị từ chối 429 Too Many Requests.',
  category: 'Distributed Systems',
  visualizationType: 'flow-graph',
  rendererType: 'flow-graph',
  tags: ['Rate Limiting', 'Token Bucket', 'Security', 'DoS Protection', 'API Gateway'],
  description: 'Trực quan hóa cơ chế cấp phát token chống quá tải hệ thống.',
  academicOverview: {
    mentalModel: 'Xô nước có vòi nước nhỏ giọt đều: nước nhỏ từng giọt vào xô với tốc độ cố định. Mỗi khách hàng muốn mua vé phải múc một gáo nước từ xô. Nếu khách đến ồ ạt làm cạn xô, những người đến sau phải xếp hàng đợi nước đầy lại hoặc bị mời quay lại sau.',
    complexityOrPrinciple: 'Độ phức tạp O(1) cả thời gian và bộ nhớ. Cho phép chịu đột biến lưu lượng (Burst Capacity) bằng dung lượng tối đa của xô B, trong khi tốc độ trung bình bị kẹp chặt ở mức r token/giây.',
    useCases: [
      'Bảo vệ Gateway ngân hàng chống tấn công cào dữ liệu và DDoS',
      'Giới hạn hạn mức API theo gói cước (Tier Rate Limits) của Stripe, GitHub, OpenAI',
    ],
  },
  laneTitles: ['Yêu cầu (Traffic)', 'Bộ điều tiết (Token Bucket)', 'Dịch vụ xử lý (Backend API)'],
  nodes: [
    { id: 'tb-client', name: 'API Consumers', role: 'Traffic Origin', layer: 'ingress', status: 'active', icon: 'Send', description: 'Nguồn phát sinh request từ client' },
    { id: 'tb-bucket', name: 'Bucket Limiter', role: 'Token Manager', layer: 'compute', status: 'active', icon: 'Layers', description: 'Lưu trữ token và cấp phát theo nhịp' },
    { id: 'tb-backend', name: 'Protected API', role: 'Resource Service', layer: 'storage', status: 'active', icon: 'Cpu', description: 'Dịch vụ bảo vệ an toàn' },
  ],
  steps: [
    {
      stepIndex: 1,
      title: 'Làm đầy Token vào Xô với tốc độ cố định (Refill)',
      explanation: 'Theo chu kỳ mỗi giây, bộ tạo sinh tự động cấp 10 token vào xô (Bucket Capacity = 10 token).',
      logicCode: 'long now = System.currentTimeMillis();\ntokens = min(capacity, tokens + (now - lastRefill) * refillRate);',
      stateVariables: { 'Số Token hiện tại': '10 / 10', 'Tốc độ nạp (r)': '10 token/s', 'Dung tích xô': '10' },
      packets: [{ id: 'pkt-tb-1', fromNodeId: 'tb-bucket', toNodeId: 'tb-bucket', label: 'Refill +10 Tokens' }],
    },
    {
      stepIndex: 2,
      title: 'Yêu cầu hợp lệ tiêu thụ Token thành công',
      explanation: 'Một Request từ Client đến, lấy đi 1 token từ xô (còn lại 9 token) và được chuyển tiếp sang Backend.',
      logicCode: 'if (tokens >= 1) {\n  tokens -= 1;\n  forwardRequest();\n}',
      stateVariables: { 'Token còn lại': '9', 'Phán quyết': 'ALLOW', 'HTTP Status': '200 OK' },
      packets: [{ id: 'pkt-tb-2', fromNodeId: 'tb-client', toNodeId: 'tb-backend', label: 'Consume Token -> Forward' }],
    },
    {
      stepIndex: 3,
      title: 'Lưu lượng đột biến (Traffic Burst)',
      explanation: 'Client gửi đồng loạt 9 yêu cầu. Toàn bộ 9 token còn lại bị tiêu thụ cạn kiệt, xô về mức 0.',
      logicCode: 'tokens = max(0, tokens - burstRequestsCount);',
      stateVariables: { 'Token còn lại': '0 / 10', 'Trạng thái xô': 'EMPTY_EXHAUSTED', 'Cảnh báo': 'BURST_PEAK' },
      packets: [{ id: 'pkt-tb-3', fromNodeId: 'tb-client', toNodeId: 'tb-bucket', label: 'Burst Traffic (9 reqs)' }],
    },
    {
      stepIndex: 4,
      title: 'Từ chối yêu cầu quá hạn ngạch (429 Rate Limit)',
      explanation: 'Yêu cầu thứ 11 đến khi xô đã hết token. Yêu cầu bị Load Balancer chặn đứng ngay lập tức với mã HTTP 429.',
      logicCode: 'else {\n  return httpResponse(429, "Too Many Requests. Retry-After: 1s");\n}',
      stateVariables: { 'Mã trạng thái': 'HTTP 429 Too Many Requests', 'Token': '0', 'Hành động': 'DROP_AND_RETRY' },
      packets: [{ id: 'pkt-tb-4', fromNodeId: 'tb-bucket', toNodeId: 'tb-client', label: 'HTTP 429 Too Many Reqs' }],
    },
  ],
};
