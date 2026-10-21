import { SimulationScenario } from '../types/simulation';

/**
 * Kịch bản 1: QuickSort (Phân hoạch Hoare/Lomuto & Đổi chỗ)
 */
export const quickSortScenario: SimulationScenario = {
  id: 'quick-sort',
  title: 'QuickSort (Phân hoạch Lomuto & Đổi chỗ)',
  subtitle: 'Thuật toán chia để trị kinh điển với Hai con trỏ (Two Pointers)',
  category: 'Algorithms',
  tags: ['Divide & Conquer', 'Two Pointers', 'Sorting', 'O(N log N)'],
  description:
    'Mô phỏng từng bước thuật toán QuickSort theo phân hoạch Lomuto: chọn phần tử chốt (Pivot), duyệt cặp con trỏ i và j, so sánh độ lớn, hoán đổi (Swap) với hiệu ứng động và chốt vị trí chính xác.',
  academicOverview: {
    mentalModel: 'Chọn một phần tử chốt (Pivot) làm ranh giới, sau đó dùng 2 con trỏ quét toàn bộ mảng để dồn tất cả các số nhỏ hơn Pivot sang bên trái và các số lớn hơn sang bên phải. Lặp lại đệ quy cho hai nửa mảng con.',
    complexityOrPrinciple: 'Độ phức tạp thời gian: O(N log N) trung bình và tốt nhất; O(N^2) xấu nhất (khi mảng đã có thứ tự và luôn chọn phần tử đầu/cuối làm pivot). Không gian bộ nhớ: O(log N) do ngăn xếp đệ quy. Sắp xếp tại chỗ (In-place).',
    useCases: [
      'Thuật toán sắp xếp mặc định trong thư viện chuẩn C qsort() và C++ std::sort (kết hợp Introsort)',
      'Hệ thống cơ sở dữ liệu sắp xếp chỉ mục trên bộ nhớ RAM',
    ],
  },
  rendererType: 'array-pointer',
  laneTitles: [
    'Âm thanh Web Audio',
    'Màu sắc So sánh',
    'Hiển thị Cột cao độ',
    'Con trỏ & Pivot',
  ],
  nodes: [
    {
      id: 'audio',
      name: 'Âm thanh Web Audio Bíp',
      role: 'Tần số động 240Hz - 880Hz',
      layer: 'ingress',
      status: 'active',
      icon: 'Volume2',
      description: 'Phát âm thanh tần số tỉ lệ thuận với độ lớn phần tử mảng qua Web Audio API thuần.',
    },
    {
      id: 'highlight',
      name: 'Đổi màu So sánh',
      role: 'Đỏ Techcombank #E31B23 & Pulse',
      layer: 'compute',
      status: 'active',
      icon: 'Eye',
      description: 'Làm nổi bật các phần tử đang được đối chiếu với Pivot bằng sắc đỏ đặc trưng.',
    },
    {
      id: 'bar-view',
      name: 'Chế độ Cột cao độ',
      role: 'Dạng Cột (Bars) / Ô số (Boxes)',
      layer: 'storage',
      status: 'active',
      icon: 'BarChart3',
      description: 'Biểu diễn trực quan giá trị số qua chiều cao cột tương ứng.',
    },
    {
      id: 'pointers',
      name: 'Huy hiệu Con trỏ',
      role: 'Con trỏ i, j & Pivot',
      layer: 'egress',
      status: 'active',
      icon: 'ArrowDown',
      description: 'Hiển thị huy hiệu và mũi tên động cho con trỏ quét i, j và phần tử Pivot.',
    },
  ],
  steps: [
    {
      stepIndex: 1,
      title: 'Khởi tạo phân hoạch (Chọn Pivot)',
      explanation:
        'Chọn phần tử cuối cùng làm Pivot (arr[6] = 35, màu đỏ Techcombank). Con trỏ j bắt đầu duyệt từ chỉ số 0 để tìm các phần tử nhỏ hơn hoặc bằng Pivot.',
      packets: [],
      arrayData: {
        array: [48, 15, 76, 23, 89, 60, 35],
        pointers: [
          { name: 'j', index: 0, label: 'Con trỏ quét j = 0' },
          { name: 'pivot', index: 6, label: 'Pivot = 35' },
        ],
        comparingIndices: [],
        swappedIndices: [],
        sortedIndices: [],
        soundFrequencyIndex: 6,
      },
    },
    {
      stepIndex: 2,
      title: 'So sánh arr[0] (48) với Pivot (35)',
      explanation:
        'Con trỏ j = 0. So sánh 48 với Pivot 35: Vì 48 > 35, phần tử này thuộc về nửa bên phải Pivot. Con trỏ i giữ nguyên ngoài mảng, j tiếp tục tiến.',
      packets: [],
      arrayData: {
        array: [48, 15, 76, 23, 89, 60, 35],
        pointers: [
          { name: 'j', index: 0, label: 'j = 0' },
          { name: 'pivot', index: 6, label: 'Pivot = 35' },
        ],
        comparingIndices: [0, 6],
        swappedIndices: [],
        sortedIndices: [],
        soundFrequencyIndex: 0,
      },
    },
    {
      stepIndex: 3,
      title: 'So sánh arr[1] (15) với Pivot (35) -> Phát hiện phần tử nhỏ hơn',
      explanation:
        'Con trỏ j = 1. So sánh 15 với Pivot 35: Vì 15 <= 35, tăng con trỏ i lên vị trí 0. Chuẩn bị hoán đổi arr[i=0] (48) và arr[j=1] (15).',
      packets: [],
      arrayData: {
        array: [48, 15, 76, 23, 89, 60, 35],
        pointers: [
          { name: 'i', index: 0, label: 'i = 0' },
          { name: 'j', index: 1, label: 'j = 1' },
          { name: 'pivot', index: 6, label: 'Pivot = 35' },
        ],
        comparingIndices: [1, 6],
        swappedIndices: [],
        sortedIndices: [],
        soundFrequencyIndex: 1,
      },
    },
    {
      stepIndex: 4,
      title: 'Hoán đổi (Swap) arr[0] và arr[1] để dồn số nhỏ về trước',
      explanation:
        'Hoán đổi giá trị 48 và 15! Phần tử 15 nhỏ hơn Pivot được đưa vào vùng an toàn bên trái.',
      packets: [],
      arrayData: {
        array: [15, 48, 76, 23, 89, 60, 35],
        pointers: [
          { name: 'i', index: 0, label: 'i = 0' },
          { name: 'j', index: 1, label: 'j = 1' },
          { name: 'pivot', index: 6, label: 'Pivot = 35' },
        ],
        comparingIndices: [],
        swappedIndices: [0, 1],
        sortedIndices: [],
        soundFrequencyIndex: 0,
      },
    },
    {
      stepIndex: 5,
      title: 'So sánh arr[2] (76) với Pivot (35)',
      explanation:
        'Con trỏ j tăng lên 2. So sánh arr[2] = 76 với Pivot 35: Vì 76 > 35, bỏ qua và không tăng i.',
      packets: [],
      arrayData: {
        array: [15, 48, 76, 23, 89, 60, 35],
        pointers: [
          { name: 'i', index: 0, label: 'i = 0' },
          { name: 'j', index: 2, label: 'j = 2' },
          { name: 'pivot', index: 6, label: 'Pivot = 35' },
        ],
        comparingIndices: [2, 6],
        swappedIndices: [],
        sortedIndices: [],
        soundFrequencyIndex: 2,
      },
    },
    {
      stepIndex: 6,
      title: 'So sánh arr[3] (23) với Pivot (35) -> Tìm thấy 23 <= 35',
      explanation:
        'Con trỏ j tăng lên 3. So sánh 23 với 35: 23 <= 35 thỏa mãn điều kiện! Tăng con trỏ i lên 1. Chuẩn bị hoán đổi arr[i=1] (48) với arr[j=3] (23).',
      packets: [],
      arrayData: {
        array: [15, 48, 76, 23, 89, 60, 35],
        pointers: [
          { name: 'i', index: 1, label: 'i = 1' },
          { name: 'j', index: 3, label: 'j = 3' },
          { name: 'pivot', index: 6, label: 'Pivot = 35' },
        ],
        comparingIndices: [3, 6],
        swappedIndices: [],
        sortedIndices: [],
        soundFrequencyIndex: 3,
      },
    },
    {
      stepIndex: 7,
      title: 'Hoán đổi arr[1] (48) và arr[3] (23)',
      explanation:
        'Hoán đổi 48 và 23! Vùng bên trái giờ đây chứa [15, 23] đều nhỏ hơn Pivot 35.',
      packets: [],
      arrayData: {
        array: [15, 23, 76, 48, 89, 60, 35],
        pointers: [
          { name: 'i', index: 1, label: 'i = 1' },
          { name: 'j', index: 3, label: 'j = 3' },
          { name: 'pivot', index: 6, label: 'Pivot = 35' },
        ],
        comparingIndices: [],
        swappedIndices: [1, 3],
        sortedIndices: [],
        soundFrequencyIndex: 1,
      },
    },
    {
      stepIndex: 8,
      title: 'Duyệt các phần tử còn lại (89 và 60)',
      explanation:
        'Con trỏ j lần lượt duyệt qua arr[4] = 89 và arr[5] = 60. Cả hai đều lớn hơn 35. Con trỏ i dừng lại cố định ở chỉ số 1.',
      packets: [],
      arrayData: {
        array: [15, 23, 76, 48, 89, 60, 35],
        pointers: [
          { name: 'i', index: 1, label: 'i = 1' },
          { name: 'j', index: 5, label: 'j = 5' },
          { name: 'pivot', index: 6, label: 'Pivot = 35' },
        ],
        comparingIndices: [5, 6],
        swappedIndices: [],
        sortedIndices: [],
        soundFrequencyIndex: 5,
      },
    },
    {
      stepIndex: 9,
      title: 'Đưa Pivot về vị trí chính xác (Hoán đổi arr[i+1] và arr[pivot])',
      explanation:
        'Hoán đổi arr[2] (76) với Pivot arr[6] (35)! Số 35 được đưa vào đúng vị trí chỉ số 2: bên trái toàn số nhỏ hơn, bên phải toàn số lớn hơn.',
      packets: [],
      arrayData: {
        array: [15, 23, 35, 48, 89, 60, 76],
        pointers: [
          { name: 'pivot', index: 2, label: 'Pivot chốt tại [2]' },
        ],
        comparingIndices: [],
        swappedIndices: [2, 6],
        sortedIndices: [2],
        soundFrequencyIndex: 2,
      },
    },
    {
      stepIndex: 10,
      title: 'Hoàn tất phân hoạch & Toàn bộ mảng đã sắp xếp',
      explanation:
        'Thuật toán QuickSort đệ quy trên hai nửa mảng con. Toàn bộ mảng [15, 23, 35, 48, 60, 76, 89] đã được sắp xếp tăng dần hoàn chỉnh (màu xanh ngọc lục bảo).',
      packets: [],
      arrayData: {
        array: [15, 23, 35, 48, 60, 76, 89],
        pointers: [],
        comparingIndices: [],
        swappedIndices: [],
        sortedIndices: [0, 1, 2, 3, 4, 5, 6],
        soundFrequencyIndex: 3,
      },
    },
  ],
};

/**
 * Kịch bản 2: Binary Search / Two Pointers (Thu hẹp không gian tìm kiếm)
 */
export const binarySearchScenario: SimulationScenario = {
  id: 'binary-search',
  title: 'Binary Search (Tìm kiếm nhị phân & Hai con trỏ)',
  subtitle: 'Thu hẹp không gian tìm kiếm với độ phức tạp tối ưu O(log N)',
  category: 'Algorithms',
  tags: ['Binary Search', 'Two Pointers', 'Search Space', 'O(log N)'],
  description:
    'Mô phỏng thuật toán tìm kiếm nhị phân trên mảng tăng dần: sử dụng hai con trỏ left và right để xác định không gian tìm kiếm, tính điểm giữa mid, đối chiếu với giá trị mục tiêu (Target = 67) và chia đôi mảng sau mỗi bước.',
  academicOverview: {
    mentalModel: 'Mở danh bạ điện thoại hoặc từ điển: Mở chính giữa, so sánh từ cần tìm với trang hiện tại. Nếu từ cần tìm đứng sau trong bảng chữ cái, ta bỏ hẳn nửa trước và lặp lại với nửa sau. Cứ mỗi lần lật sách, lượng trang cần đọc giảm đi một nửa.',
    complexityOrPrinciple: 'Độ phức tạp thời gian: O(log N) trong mọi trường hợp tìm kiếm. Không gian bộ nhớ: O(1) lặp (Iterative) hoặc O(log N) đệ quy. Điều kiện tiên quyết bắt buộc: Dữ liệu phải được sắp xếp trước.',
    useCases: [
      'Tìm kiếm bản ghi trong B-Tree Index của MySQL InnoDB / PostgreSQL',
      'Tìm kiếm điểm gãy trong bài toán tối ưu (Binary Search on Answer) và Git Bisect truy vết commit lỗi',
    ],
  },
  rendererType: 'array-pointer',
  laneTitles: [
    'Âm thanh Web Audio',
    'Màu sắc So sánh',
    'Hiển thị Cột cao độ',
    'Con trỏ & Pivot',
  ],
  nodes: [
    {
      id: 'audio',
      name: 'Âm thanh Web Audio Bíp',
      role: 'Tần số động 240Hz - 880Hz',
      layer: 'ingress',
      status: 'active',
      icon: 'Volume2',
      description: 'Phát âm thanh tần số tỉ lệ với giá trị phần tử tại vị trí con trỏ mid.',
    },
    {
      id: 'highlight',
      name: 'Đổi màu So sánh',
      role: 'Đỏ Techcombank #E31B23',
      layer: 'compute',
      status: 'active',
      icon: 'Eye',
      description: 'Tô màu đỏ Techcombank phần tử mid đang đối chiếu với Target.',
    },
    {
      id: 'bar-view',
      name: 'Chế độ Cột cao độ',
      role: 'Dạng Cột (Bars) / Ô số (Boxes)',
      layer: 'storage',
      status: 'active',
      icon: 'BarChart3',
      description: 'Biểu diễn độ dốc tăng dần của mảng đã sắp xếp.',
    },
    {
      id: 'pointers',
      name: 'Huy hiệu Con trỏ',
      role: 'left, right, mid',
      layer: 'egress',
      status: 'active',
      icon: 'ArrowDown',
      description: 'Hiển thị huy hiệu các con trỏ giới hạn [left, right] và điểm giữa mid.',
    },
  ],
  steps: [
    {
      stepIndex: 1,
      title: 'Khởi tạo không gian tìm kiếm (Target = 67)',
      explanation:
        'Mảng đã được sắp xếp gồm 8 phần tử: [14, 25, 38, 49, 67, 76, 88, 95]. Đặt con trỏ left = 0, right = 7. Mục tiêu cần tìm kiếm là Target = 67.',
      packets: [],
      arrayData: {
        array: [14, 25, 38, 49, 67, 76, 88, 95],
        pointers: [
          { name: 'left', index: 0, label: 'left = 0' },
          { name: 'right', index: 7, label: 'right = 7' },
        ],
        comparingIndices: [],
        swappedIndices: [],
        sortedIndices: [],
        soundFrequencyIndex: 0,
      },
    },
    {
      stepIndex: 2,
      title: 'Tính điểm giữa mid lần 1 (mid = 3, arr[3] = 49)',
      explanation:
        'Tính chỉ số giữa: mid = Math.floor((0 + 7) / 2) = 3. Giá trị phần tử tại mid là arr[3] = 49. So sánh 49 với Target = 67.',
      packets: [],
      arrayData: {
        array: [14, 25, 38, 49, 67, 76, 88, 95],
        pointers: [
          { name: 'left', index: 0, label: 'left = 0' },
          { name: 'mid', index: 3, label: 'mid = 3 (arr=49)' },
          { name: 'right', index: 7, label: 'right = 7' },
        ],
        comparingIndices: [3],
        swappedIndices: [],
        sortedIndices: [],
        soundFrequencyIndex: 3,
      },
    },
    {
      stepIndex: 3,
      title: 'Thu hẹp không gian tìm kiếm: arr[mid] < Target (49 < 67)',
      explanation:
        'Vì 49 < 67, phần tử mục tiêu chắc chắn nằm bên phải mid! Ta loại bỏ toàn bộ nửa trái [0..3], cập nhật left = mid + 1 = 4.',
      packets: [],
      arrayData: {
        array: [14, 25, 38, 49, 67, 76, 88, 95],
        pointers: [
          { name: 'left', index: 4, label: 'left = 4' },
          { name: 'right', index: 7, label: 'right = 7' },
        ],
        comparingIndices: [],
        swappedIndices: [],
        sortedIndices: [],
        soundFrequencyIndex: 4,
      },
    },
    {
      stepIndex: 4,
      title: 'Tính điểm giữa mid lần 2 (mid = 5, arr[5] = 76)',
      explanation:
        'Không gian tìm kiếm mới là [4..7]. Tính mid = Math.floor((4 + 7) / 2) = 5. Giá trị arr[5] = 76. So sánh 76 với Target = 67.',
      packets: [],
      arrayData: {
        array: [14, 25, 38, 49, 67, 76, 88, 95],
        pointers: [
          { name: 'left', index: 4, label: 'left = 4' },
          { name: 'mid', index: 5, label: 'mid = 5 (arr=76)' },
          { name: 'right', index: 7, label: 'right = 7' },
        ],
        comparingIndices: [5],
        swappedIndices: [],
        sortedIndices: [],
        soundFrequencyIndex: 5,
      },
    },
    {
      stepIndex: 5,
      title: 'Thu hẹp không gian tìm kiếm: arr[mid] > Target (76 > 67)',
      explanation:
        'Vì 76 > 67, phần tử mục tiêu nằm bên trái mid! Cập nhật right = mid - 1 = 4. Không gian tìm kiếm lúc này chỉ còn 1 phần tử tại chỉ mục 4.',
      packets: [],
      arrayData: {
        array: [14, 25, 38, 49, 67, 76, 88, 95],
        pointers: [
          { name: 'left', index: 4, label: 'left = 4' },
          { name: 'right', index: 4, label: 'right = 4' },
        ],
        comparingIndices: [],
        swappedIndices: [],
        sortedIndices: [],
        soundFrequencyIndex: 4,
      },
    },
    {
      stepIndex: 6,
      title: 'Hội tụ con trỏ: mid = 4, arr[4] === Target (67 === 67)',
      explanation:
        'Hai con trỏ hội tụ: left = right = 4 -> mid = 4. Giá trị arr[4] = 67 khớp chính xác với Target 67! Tìm kiếm thành công.',
      packets: [],
      arrayData: {
        array: [14, 25, 38, 49, 67, 76, 88, 95],
        pointers: [
          { name: 'left', index: 4, label: 'left = 4' },
          { name: 'mid', index: 4, label: 'mid = 4' },
          { name: 'right', index: 4, label: 'right = 4' },
        ],
        comparingIndices: [4],
        swappedIndices: [],
        sortedIndices: [4],
        soundFrequencyIndex: 4,
      },
    },
    {
      stepIndex: 7,
      title: 'Hoàn tất tìm kiếm nhị phân & Chốt vị trí',
      explanation:
        'Phần tử 67 đã được tìm thấy tại chỉ mục [4] chỉ sau 3 lần so sánh! Độ phức tạp O(log N) đem lại hiệu năng vượt trội so với tìm kiếm tuyến tính O(N).',
      packets: [],
      arrayData: {
        array: [14, 25, 38, 49, 67, 76, 88, 95],
        pointers: [
          { name: 'mid', index: 4, label: 'FOUND [4] = 67' },
        ],
        comparingIndices: [],
        swappedIndices: [],
        sortedIndices: [4],
        soundFrequencyIndex: 4,
      },
    },
  ],
};
