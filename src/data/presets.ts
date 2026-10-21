import { SimulationScenario } from '../types/simulation';
import { quickSortScenario, binarySearchScenario } from './arrayPresets';
import { pathfindingScenario } from './gridPresets';
import { gaScenario } from './geneticAlgorithmPreset';
import {
  mergeSortScenario,
  bubbleSortScenario,
  loadBalancerScenario,
  tokenBucketScenario,
} from './morePresets';

export { quickSortScenario, binarySearchScenario } from './arrayPresets';
export { pathfindingScenario } from './gridPresets';
export { gaScenario } from './geneticAlgorithmPreset';
export {
  mergeSortScenario,
  bubbleSortScenario,
  loadBalancerScenario,
  tokenBucketScenario,
} from './morePresets';

export const kafkaScenario: SimulationScenario = {
  id: 'apache-kafka',
  title: 'Apache Kafka',
  subtitle: 'Consumer Group & Dynamic Rebalancing Protocol',
  category: 'Distributed Systems',
  tags: ['Event-Driven', 'Pub/Sub', 'High Throughput', 'Fault Tolerance'],
  description:
    'Mô phỏng cơ chế phân phối tải trên các Partition và quy trình Rebalance tự động khi một Consumer gặp sự cố sập nút.',
  academicOverview: {
    mentalModel: 'Nhật ký phân tán bất biến (Distributed Commit Log): Message được ghi tuần tự nối đuôi vào các phân vùng (Partition) trên đĩa cứng, cho phép hàng ngàn Producer đẩy vào và Consumer Group đọc song song với tốc độ đĩa tuần tự cực nhanh.',
    complexityOrPrinciple: 'Ghi đĩa tuần tự O(1) nhờ Zero-Copy (sendfile) và OS PageCache. Tính nhất quán: Định lý PACELC - trong trường hợp phân vùng mạng (Partition), hệ thống đánh đổi tính khả dụng để bảo toàn tính nhất quán (CP) với ack=all.',
    useCases: [
      'Xương sống luân chuyển dữ liệu sự kiện thời gian thực (Event-Driven Architecture) tại Uber, Netflix, LinkedIn',
      'Đồng bộ dữ liệu biến đổi cơ sở dữ liệu CDC (Change Data Capture) với Debezium',
      'Xử lý luồng giao dịch ngân hàng thời gian thực chống gian lận (Fraud Detection)',
    ],
  },
  laneTitles: [
    'Phát sinh (Producer)',
    'Điều phối (Broker Cluster)',
    'Phân vùng (Partition Logs)',
    'Tiêu thụ (Consumer Workers)',
  ],
  nodes: [
    {
      id: 'kafka-producer',
      name: 'Producer Gateway',
      role: 'Message Generator',
      layer: 'ingress',
      status: 'active',
      icon: 'Send',
      description: 'Dịch vụ phát sinh hàng ngàn giao dịch/giây và đẩy theo đợt vào Kafka Topic.',
    },
    {
      id: 'kafka-broker',
      name: 'Kafka Broker Cluster',
      role: 'Partition Coordinator',
      layer: 'compute',
      status: 'active',
      icon: 'Layers',
      description: 'Quản lý Partition Log, gán Partition cho Consumer Group và điều phối Rebalance.',
    },
    {
      id: 'kafka-consumer-a',
      name: 'Consumer Worker A',
      role: 'Group Member 1',
      layer: 'egress',
      status: 'active',
      icon: 'Cpu',
      description: 'Thành viên Consumer Group, phụ trách xử lý thông điệp từ Partition 0.',
    },
    {
      id: 'kafka-consumer-b',
      name: 'Consumer Worker B',
      role: 'Group Member 2',
      layer: 'egress',
      status: 'active',
      icon: 'Cpu',
      description: 'Thành viên Consumer Group, phụ trách xử lý thông điệp từ Partition 1.',
    },
  ],
  steps: [
    {
      stepIndex: 1,
      title: 'Phát sinh thông điệp (Publish Message)',
      explanation:
        'Producer Service đóng gói luồng giao dịch tài chính liên tục và gửi vào Kafka Topic được chia làm 2 Partition (P0 & P1) để xử lý song song.',
      logicCode:
        'ProducerRecord<String, byte[]> record =\n  new ProducerRecord<>("tcb-txns", key, payload);\nproducer.send(record, (metadata, err) -> callback(metadata));',
      payloadSample: {
        batchId: 'batch_9921',
        topic: 'tcb-transactions',
        eventsCount: 500,
        partitions: ['P0', 'P1'],
        sampleTxn: { id: 'tx_09182', amount: 5000000, currency: 'VND', fromAcc: '19008888' },
        compression: 'snappy',
      },
      stateMutation: {
        'Producer Status': 'STREAMING',
        'Target Topic': 'tcb-transactions',
        'Batch Size': '500 msgs',
        'Ack Level': 'all (-1)',
        'Network Roundtrip': '0.35ms',
      },
      activeHighlights: ['kafka-producer', 'kafka-broker'],
      packets: [
        {
          id: 'pkt-1-1',
          fromNodeId: 'kafka-producer',
          toNodeId: 'kafka-broker',
          label: 'Batch Txn [P0, P1]',
          fallbackToNodeId: 'kafka-broker',
          detail: 'Batch 500 events gửi qua giao thức TCP nhị phân',
        },
      ],
    },
    {
      stepIndex: 2,
      title: 'Cân bằng tải Consumer Group song song',
      explanation:
        'Kafka Broker phân phối Partition P0 cho Consumer Worker A và Partition P1 cho Consumer Worker B. Cả 2 worker kéo dữ liệu (Pull model) độc lập với thông lượng tối đa.',
      logicCode:
        '// Consumer Group Pull Protocol\nConsumerRecords<K, V> records = consumer.poll(Duration.ofMillis(100));\nprocessRecords(records);\nconsumer.commitSync();',
      payloadSample: {
        pollRequest: {
          maxBytes: 1048576,
          assignments: [
            { worker: 'consumer-a', partition: 'P0', startOffset: 1040, batch: 50 },
            { worker: 'consumer-b', partition: 'P1', startOffset: 2010, batch: 50 },
          ],
        },
      },
      stateMutation: {
        'Worker A Offset': 1040,
        'Worker B Offset': 2010,
        'Consumer Group State': 'STABLE',
        'Active Members': '2 workers',
        'Consumer Lag': '0 msgs',
      },
      activeHighlights: ['kafka-broker', 'kafka-consumer-a', 'kafka-consumer-b'],
      packets: [
        {
          id: 'pkt-2-1',
          fromNodeId: 'kafka-broker',
          toNodeId: 'kafka-consumer-a',
          label: 'Fetch P0 Events',
          fallbackToNodeId: 'kafka-consumer-b',
          detail: 'Offset #1040 - #1090',
        },
        {
          id: 'pkt-2-2',
          fromNodeId: 'kafka-broker',
          toNodeId: 'kafka-consumer-b',
          label: 'Fetch P1 Events',
          fallbackToNodeId: 'kafka-consumer-a',
          detail: 'Offset #2010 - #2060',
        },
      ],
    },
    {
      stepIndex: 3,
      title: 'Giả lập sự cố Node (Consumer B Offline)',
      explanation:
        'Thử gạt tắt Consumer Worker B ở cột bên trái! Khi Consumer B mất tín hiệu Heartbeat quá session timeout, Coordinator phát hiện Node sập và lập tức khóa partition.',
      logicCode:
        'if (currentTime - lastHeartbeat[workerB] > sessionTimeoutMs) {\n  coordinator.markDead(workerB);\n  coordinator.initiateRebalance("MEMBER_DOWN");\n}',
      payloadSample: {
        heartbeatCheck: {
          memberId: 'kafka-consumer-b',
          status: 'TIMEOUT_NO_RESPONSE',
          thresholdMs: 45000,
          elapsedMs: 47200,
          action: 'REVOKE_PARTITIONS',
        },
      },
      stateMutation: {
        'Worker B State': 'OFFLINE (CRASHED)',
        'Coordinator Action': 'REVOKING_P1',
        'Rebalance Status': 'TRIGGERED',
        'Group Generation': 42,
      },
      activeHighlights: ['kafka-broker'],
      packets: [
        {
          id: 'pkt-3-1',
          fromNodeId: 'kafka-broker',
          toNodeId: 'kafka-consumer-b',
          label: 'Heartbeat Ping (Failed)',
          type: 'failed',
          fallbackToNodeId: 'kafka-consumer-a',
          detail: 'Timeout 45s: Không nhận được response',
        },
      ],
    },
    {
      stepIndex: 4,
      title: 'Tái cân bằng tự động (Dynamic Rebalance)',
      explanation:
        'Quy trình Rebalance hoàn tất: Kafka Broker chuyển quyền sở hữu toàn bộ Partition (P0 + P1) sang Consumer Worker A còn hoạt động. Không có giao dịch nào bị thất thoát!',
      logicCode:
        '// Cooperative Rebalance Execution\nreassignPartitions({\n  remainingMembers: ["kafka-consumer-a"],\n  assignedPartitions: ["P0", "P1"]\n});\nresumeProcessing();',
      payloadSample: {
        rebalanceAssignment: {
          generationId: 43,
          leaderId: 'kafka-consumer-a',
          assignedPartitions: ['P0', 'P1'],
          revokedPartitions: [],
          status: 'REASSIGN_COMPLETED',
        },
      },
      stateMutation: {
        'Worker A Ownership': 'P0 + P1 (100% Traffic)',
        'Worker B': 'REMOVED_FROM_GROUP',
        'Rebalance Status': 'COMPLETED',
        'Total Data Loss': '0 msgs',
        'Throughput': '12,500 ops/s',
      },
      activeHighlights: ['kafka-broker', 'kafka-consumer-a'],
      packets: [
        {
          id: 'pkt-4-1',
          fromNodeId: 'kafka-broker',
          toNodeId: 'kafka-consumer-a',
          label: 'Reassign P0 + P1',
          type: 'rerouted',
          detail: 'Consumer Worker A phụ trách 100% dung lượng topic',
        },
      ],
    },
    {
      stepIndex: 5,
      title: 'Đồng bộ & Lưu vị trí (Commit Offset)',
      explanation:
        'Consumer Worker A xử lý thông suốt toàn bộ luồng thông điệp từ cả 2 Partition, tiến hành Commit Offset lên Kafka Broker định kỳ để ghi nhớ vị trí xử lý an toàn.',
      activeHighlights: ['kafka-consumer-a', 'kafka-broker'],
      packets: [
        {
          id: 'pkt-5-1',
          fromNodeId: 'kafka-consumer-a',
          toNodeId: 'kafka-broker',
          label: 'Commit Offset [P0:1090, P1:2060]',
          type: 'normal',
          detail: 'Xác nhận xử lý thành công không thất thoát',
        },
      ],
    },
  ],
};

export const redisScenario: SimulationScenario = {
  id: 'redis-cache',
  title: 'Redis Cache-Aside',
  subtitle: 'Read-Through Pattern & Sub-Millisecond Acceleration',
  category: 'Caching',
  tags: ['In-Memory', 'Latency < 1ms', 'Key-Value', 'Cache Eviction'],
  description:
    'Minh họa chiến lược Cache-Aside phổ biến nhất trong kiến trúc ngân hàng số nhằm giảm tải cơ sở dữ liệu chính và tăng tốc truy vấn.',
  academicOverview: {
    mentalModel: 'Bộ nhớ đệm tốc độ cao nằm trước cơ sở dữ liệu: Khi ứng dụng cần dữ liệu, trước tiên tra cứu trong RAM siêu tốc (Redis). Nếu có (Cache Hit), trả về tức thì trong <1ms. Nếu không (Cache Miss), đọc từ Database rồi nạp ngược vào Cache để phục vụ các lần sau.',
    complexityOrPrinciple: 'Độ phức tạp O(1) trung bình cho thao tác GET/SET nhờ bảng băm RAM và vòng lặp đơn luồng bất đồng bộ (epoll event loop). Chiến lược Cache-Aside & TTL chống rò rỉ bộ nhớ, đánh đổi tính nhất quán tức thời (Eventual Consistency).',
    useCases: [
      'Lưu trữ Session người dùng và giỏ hàng thương mại điện tử',
      'Bộ đệm dữ liệu nóng (Hot Data Cache) giảm 90% tải truy vấn cho SQL Database',
      'Khóa phân tán (Distributed Locks Redlock) và bảng xếp hạng Leaderboard (Sorted Sets)',
    ],
  },
  laneTitles: [
    'Ứng dụng Khách (Client)',
    'Điều phối (API Gateway)',
    'Bộ nhớ RAM (Redis Cache)',
    'CSDL Gốc (PostgreSQL)',
  ],
  nodes: [
    {
      id: 'client-app',
      name: 'Mobile Banking App',
      role: 'Client Requestor',
      layer: 'ingress',
      status: 'active',
      icon: 'Radio',
      description: 'Ứng dụng di động của khách hàng gửi lệnh tra cứu thông tin số dư tài khoản.',
    },
    {
      id: 'api-gateway',
      name: 'Core API Gateway',
      role: 'Request Dispatcher',
      layer: 'compute',
      status: 'active',
      icon: 'Server',
      description: 'Lớp xử lý nghiệp vụ, quyết định đường đi của dữ liệu giữa Cache và RDBMS.',
    },
    {
      id: 'redis-node',
      name: 'Redis Cluster (RAM)',
      role: 'In-Memory Store',
      layer: 'storage',
      status: 'active',
      icon: 'Database',
      description: 'Lưu trữ dạng Key-Value trong bộ nhớ RAM, thời gian phản hồi siêu tốc dưới 1ms.',
    },
    {
      id: 'postgres-db',
      name: 'PostgreSQL Primary DB',
      role: 'Persistent Storage',
      layer: 'storage',
      status: 'active',
      icon: 'Database',
      description: 'Cơ sở dữ liệu quan hệ nguồn chân lý (Source of Truth), ghi đĩa an toàn.',
    },
  ],
  steps: [
    {
      stepIndex: 1,
      title: 'Yêu cầu đọc dữ liệu gửi đến API Gateway',
      explanation:
        'Khách hàng mở app ngân hàng để kiểm tra số dư và thông tin tài khoản. Request RESTful được gửi đến Core API Gateway.',
      logicCode:
        'const accountId = req.params.id;\nconst res = await apiGateway.handleAccountLookup(accountId);\nreturn res.send(data);',
      payloadSample: {
        method: 'GET',
        endpoint: '/api/v1/accounts/19008888',
        headers: { 'Authorization': 'Bearer tcb_jwt_sec_9918' },
        clientIp: '118.70.124.9',
      },
      stateMutation: {
        'Client State': 'WAITING_RESPONSE',
        'Gateway Action': 'CHECK_CACHE',
        'Requested Key': 'acc:19008888',
      },
      activeHighlights: ['client-app', 'api-gateway'],
      packets: [
        {
          id: 'pkt-r-1',
          fromNodeId: 'client-app',
          toNodeId: 'api-gateway',
          label: 'GET /api/v1/account/19008888',
          fallbackToNodeId: 'api-gateway',
          detail: 'Query thông tin tài khoản Techcombank',
        },
      ],
    },
    {
      stepIndex: 2,
      title: 'Kiểm tra Cache: Cache Miss (Key chưa có)',
      explanation:
        'API Gateway gửi lệnh GET key "acc:19008888" vào Redis. Do chưa có trong RAM hoặc đã hết hạn (TTL Expired), Redis trả về kết quả rỗng (NIL - Cache Miss).',
      logicCode:
        'const val = await redis.get("acc:19008888");\nif (val === null) {\n  // Cache Miss -> Chuyển hướng sang Primary Database\n  return fetchFromPostgres("19008888");\n}',
      payloadSample: {
        redisCommand: 'GET acc:19008888',
        result: null,
        durationUs: 380,
        status: 'CACHE_MISS',
      },
      stateMutation: {
        'Cache Result': 'MISS (nil)',
        'Redis Latency': '0.38ms',
        'Database Fallback': 'REQUIRED',
      },
      activeHighlights: ['api-gateway', 'redis-node'],
      packets: [
        {
          id: 'pkt-r-2',
          fromNodeId: 'api-gateway',
          toNodeId: 'redis-node',
          label: 'GET acc:19008888 (Miss)',
          detail: 'Redis phản hồi: (nil) trong 0.4ms',
        },
      ],
    },
    {
      stepIndex: 3,
      title: 'Truy vấn CSDL gốc và Nạp ngược Cache (Warm-up)',
      explanation:
        'API Gateway buộc phải truy vấn xuống PostgreSQL để lấy dữ liệu gốc (mất ~35ms), sau đó lập tức nạp bản ghi này vào Redis với TTL=300 giây.',
      logicCode:
        'const row = await db.query("SELECT * FROM accounts WHERE id = $1", [id]);\nawait redis.setex("acc:19008888", 300, JSON.stringify(row));',
      payloadSample: {
        sqlQuery: 'SELECT id, owner, balance, tier FROM accounts WHERE id = 19008888;',
        dbRecord: { id: '19008888', owner: 'Techcombank VIP', balance: 850000000, tier: 'DIAMOND' },
        cacheWarmup: { key: 'acc:19008888', ttlSeconds: 300 },
      },
      stateMutation: {
        'Postgres Latency': '34.2ms',
        'Cache State': 'WARMED_UP',
        'Key TTL': '300s',
        'Account Balance': '850,000,000 VND',
      },
      activeHighlights: ['api-gateway', 'postgres-db', 'redis-node'],
      packets: [
        {
          id: 'pkt-r-3',
          fromNodeId: 'api-gateway',
          toNodeId: 'postgres-db',
          label: 'SELECT * FROM accounts WHERE id=...',
          fallbackToNodeId: 'redis-node',
          detail: 'Đọc ổ đĩa SSD & Index B-Tree',
        },
        {
          id: 'pkt-r-3b',
          fromNodeId: 'api-gateway',
          toNodeId: 'redis-node',
          label: 'SETEX acc:19008888 300 {data}',
          detail: 'Cache Warm-up với thời gian sống 5 phút',
        },
      ],
    },
    {
      stepIndex: 4,
      title: 'Lượt truy vấn tiếp theo: Cache Hit tuyệt đối',
      explanation:
        'Khách hàng tiếp theo yêu cầu dữ liệu. API Gateway lấy ngay lập tức từ Redis RAM trong 0.8ms (Cache Hit). PostgreSQL hoàn toàn không bị đánh thức!',
      logicCode:
        'const val = await redis.get("acc:19008888");\n// Cache Hit -> Phản hồi trực tiếp, bypass Database\nreturn res.status(200).json(JSON.parse(val));',
      payloadSample: {
        cacheResult: {
          key: 'acc:19008888',
          hit: true,
          data: { id: '19008888', owner: 'Techcombank VIP', balance: 850000000 },
          latencyMs: 0.72,
        },
      },
      stateMutation: {
        'Cache Result': 'CACHE_HIT (100%)',
        'DB State': 'IDLE (0 queries)',
        'Total Response Latency': '0.72ms',
        'Throughput Speedup': '47.5x',
      },
      activeHighlights: ['client-app', 'api-gateway', 'redis-node'],
      packets: [
        {
          id: 'pkt-r-4',
          fromNodeId: 'api-gateway',
          toNodeId: 'redis-node',
          label: 'GET acc:19008888 (HIT)',
          detail: 'Trực tiếp từ RAM, không chạm DB',
        },
        {
          id: 'pkt-r-4b',
          fromNodeId: 'api-gateway',
          toNodeId: 'client-app',
          label: 'HTTP 200 OK (Latency: 1.2ms)',
          detail: 'Phản hồi siêu tốc về người dùng',
        },
      ],
    },
    {
      stepIndex: 5,
      title: 'Cập nhật dữ liệu & Hủy Cache (Cache Invalidation)',
      explanation:
        'Khi có giao dịch nạp tiền mới, API Gateway cập nhật trực tiếp vào PostgreSQL và đồng thời xóa/hủy khóa trong Redis (DEL acc:19008888) để tránh dữ liệu bị cũ (stale data).',
      activeHighlights: ['api-gateway', 'postgres-db', 'redis-node'],
      packets: [
        {
          id: 'pkt-r-5a',
          fromNodeId: 'api-gateway',
          toNodeId: 'postgres-db',
          label: 'UPDATE accounts SET balance=...',
          type: 'normal',
          detail: 'Ghi số dư mới vào DB',
        },
        {
          id: 'pkt-r-5b',
          fromNodeId: 'api-gateway',
          toNodeId: 'redis-node',
          label: 'DEL acc:19008888 (Evict)',
          type: 'rerouted',
          detail: 'Hủy cache cũ để đồng bộ',
        },
      ],
    },
  ],
};

export const ragScenario: SimulationScenario = {
  id: 'rag-pipeline',
  title: 'RAG Pipeline',
  subtitle: 'Retrieval-Augmented Generation for Enterprise Knowledge',
  category: 'AI / Machine Learning',
  tags: ['Vector Search', 'Embeddings', 'LLM Context', 'Anti-Hallucination'],
  description:
    'Quy trình kết hợp Tìm kiếm Ngữ nghĩa Vector và Mô hình Ngôn ngữ lớn (LLM) để trả lời nghiệp vụ chính xác, triệt tiêu ảo giác.',
  academicOverview: {
    mentalModel: 'Thi mở sách cho Mô hình Ngôn ngữ Lớn (LLM): Thay vì bắt AI học thuộc toàn bộ dữ liệu nội bộ (vốn dễ bị ảo giác Hallucination), hệ thống tra cứu các đoạn tài liệu chính xác nhất từ Vector Database rồi đính kèm vào ngữ cảnh Prompt trước khi sinh câu trả lời.',
    complexityOrPrinciple: 'Độ phức tạp tìm kiếm lân cận xấp xỉ ANN (Approximate Nearest Neighbors) là O(log N) với HNSW. Giảm thiểu rủi ro ảo giác từ 30% xuống <2%, đảm bảo tính có thể trích dẫn nguồn (Attribution & Transparency).',
    useCases: [
      'Trợ lý ảo tra cứu văn bản quy phạm pháp luật và sổ tay tín dụng ngân hàng',
      'Hệ thống hỏi đáp tài liệu kỹ thuật nội bộ doanh nghiệp (Enterprise Knowledge Base)',
      'Hệ sinh thái Agent AI tự động trích xuất tri thức từ PDF và API',
    ],
  },
  laneTitles: [
    'Giao diện Khách (UI)',
    'Vector hóa (Embedding)',
    'Chỉ mục (Milvus HNSW)',
    'Suy luận & Phản hồi (LLM)',
  ],
  nodes: [
    {
      id: 'rag-user',
      name: 'Banking Assistant UI',
      role: 'User Query Interface',
      layer: 'ingress',
      status: 'active',
      icon: 'Radio',
      description: 'Giao diện hỏi đáp hỗ trợ khách hàng tìm kiếm thông tin quy chế sản phẩm tài chính.',
    },
    {
      id: 'rag-embedding',
      name: 'Embedding Engine',
      role: 'Semantic Vectorizer',
      layer: 'compute',
      status: 'active',
      icon: 'Brain',
      description: 'Chuyển hóa câu hỏi tự nhiên thành vector 1536 chiều đại diện cho ngữ nghĩa.',
    },
    {
      id: 'rag-milvus',
      name: 'Milvus Vector DB',
      role: 'Vector Index (HNSW)',
      layer: 'storage',
      status: 'active',
      icon: 'Database',
      description: 'Chỉ mục vector HNSW, tính toán khoảng cách Cosine tìm kiếm Top-3 đoạn văn bản liên quan nhất.',
    },
    {
      id: 'rag-llm',
      name: 'Reasoning LLM (Gemini)',
      role: 'Generative Synthesizer',
      layer: 'compute',
      status: 'active',
      icon: 'Cpu',
      description: 'Mô hình ngôn ngữ nhận ngữ cảnh đã được xác thực để tổng hợp câu trả lời mạch lạc.',
    },
  ],
  steps: [
    {
      stepIndex: 1,
      title: 'Người dùng gửi câu hỏi nghiệp vụ tài chính',
      explanation:
        'Khách hàng hỏi: "Điều kiện tham gia Tài khoản Sinh Lời Tự Động của Techcombank là gì?". Câu hỏi được chuyển đến Embedding Engine.',
      logicCode:
        'const userPrompt = "Điều kiện tham gia Tài khoản Sinh Lời Tự Động là gì?";\nawait embeddingEngine.vectorize(userPrompt);',
      payloadSample: {
        rawPrompt: 'Điều kiện tham gia Tài khoản Sinh Lời Tự Động của Techcombank là gì?',
        sessionId: 'sess_user_9921',
        locale: 'vi-VN',
        channel: 'mobile-app',
      },
      stateMutation: {
        'User Intent': 'FAQ / Quy chế tiền gửi',
        'Query Length': '67 ký tự',
        'Pipeline Stage': 'INGRESS_ACCEPTED',
      },
      activeHighlights: ['rag-user', 'rag-embedding'],
      packets: [
        {
          id: 'pkt-g-1',
          fromNodeId: 'rag-user',
          toNodeId: 'rag-embedding',
          label: 'Natural Language Query',
          fallbackToNodeId: 'rag-llm',
          detail: 'Prompt thô từ người dùng cuối',
        },
      ],
    },
    {
      stepIndex: 2,
      title: 'Vector hóa câu hỏi đa chiều (Dense Vector)',
      explanation:
        'Embedding Model biến đổi câu hỏi thành Vector toán học 1536 chiều [0.021, -0.158, ...], nắm bắt trọn vẹn ý định ngữ nghĩa thay vì chỉ từ khóa khớp chữ thô.',
      logicCode:
        'const vector = await textEmbedding3Small.embed(userPrompt);\n// Vector embedding 1536 chiều đại diện ngữ nghĩa đa chiều',
      payloadSample: {
        embeddingModel: 'text-embedding-3-small',
        dimensions: 1536,
        vectorPreview: [0.0341, -0.1287, 0.0892, -0.0451, 0.2018],
        l2Norm: 1.0,
      },
      stateMutation: {
        'Vector Dimensions': 1536,
        'Embedding Latency': '12.4ms',
        'Vector Space': 'Normalized L2',
      },
      activeHighlights: ['rag-embedding', 'rag-milvus'],
      packets: [
        {
          id: 'pkt-g-2',
          fromNodeId: 'rag-embedding',
          toNodeId: 'rag-milvus',
          label: 'Query Vector (1536 dims)',
          fallbackToNodeId: 'rag-llm',
          detail: 'Gửi truy vấn ANN Search sang Vector Store',
        },
      ],
    },
    {
      stepIndex: 3,
      title: 'Truy xuất Top-K ngữ cảnh chính xác từ Milvus',
      explanation:
        'Vector DB thực hiện Cosine Similarity Search trên hàng triệu trang quy chế nội bộ, trích xuất chính xác 3 đoạn văn bản (Chunks) về điều kiện tài khoản sinh lời.',
      logicCode:
        'const topChunks = await milvus.search({\n  vector: queryVector,\n  limit: 3,\n  metricType: "COSINE",\n  params: { ef: 64 }\n});',
      payloadSample: {
        searchMethod: 'HNSW_COSINE_SIMILARITY',
        topK: 3,
        retrievedDocuments: [
          { docId: 'doc_tcb_rules_p12', similarityScore: 0.942, title: 'Quy chế Tài khoản Sinh Lời Tự Động 2026' },
          { docId: 'doc_tcb_faq_sec2', similarityScore: 0.891, title: 'Biểu phí & Điều kiện số dư tối thiểu' },
        ],
      },
      stateMutation: {
        'Vector DB': 'Milvus Cluster',
        'Top Similarity': '0.942',
        'Retrieved Chunks': 3,
        'Hallucination Risk': '0% (Grounding Verified)',
      },
      activeHighlights: ['rag-milvus', 'rag-llm'],
      packets: [
        {
          id: 'pkt-g-3',
          fromNodeId: 'rag-milvus',
          toNodeId: 'rag-llm',
          label: 'Top-3 Relevant Chunks',
          fallbackToNodeId: 'rag-llm',
          detail: 'Similarity Score > 0.89',
        },
      ],
    },
    {
      stepIndex: 4,
      title: 'Tăng cường Prompt & LLM sinh câu trả lời',
      explanation:
        'LLM nhận Prompt kết hợp: [Ngữ cảnh chính xác từ Techcombank] + [Câu hỏi của khách]. LLM tổng hợp câu trả lời 100% chuẩn xác, hoàn toàn tránh ảo giác!',
      logicCode:
        'const prompt = buildGroundedPrompt({ context: topChunks, query: userPrompt });\nconst answer = await gemini.generateContent(prompt);',
      payloadSample: {
        promptComposition: {
          systemInstructions: 'Chỉ trả lời dựa trên tài liệu ngân hàng Techcombank đính kèm.',
          contextTokens: 1450,
          userPromptTokens: 24,
        },
        generatedAnswer:
          'Khách hàng cá nhân có tài khoản thanh toán tại Techcombank và duy trì số dư khả dụng từ 10.000.000 VNĐ sẽ được tự động kích hoạt tính năng Sinh Lời Tự Động với lãi suất tối ưu theo ngày.',
        citations: ['Quy chế Tài khoản Sinh Lời Tự Động 2026 (Mục 3.1)'],
      },
      stateMutation: {
        'Reasoning LLM': 'Gemini 2.5 Pro',
        'Factual Grounding': '100% Verified Citations',
        'Total Tokens': 268,
        'Output Latency': '410ms',
      },
      activeHighlights: ['rag-llm', 'rag-user'],
      packets: [
        {
          id: 'pkt-g-4',
          fromNodeId: 'rag-llm',
          toNodeId: 'rag-user',
          label: 'Grounded Answer + Citations',
          fallbackToNodeId: 'rag-user',
          detail: 'Trả về câu trả lời kèm trích dẫn văn bản quy chuẩn',
        },
      ],
    },
    {
      stepIndex: 5,
      title: 'Hiển thị kết quả & Trích dẫn nguồn (Attribution)',
      explanation:
        'Ứng dụng ngân hàng số hiển thị câu trả lời hoàn chỉnh kèm thẻ nguồn tài liệu chính thức của Techcombank, người dùng có thể nhấp vào để kiểm chứng tính xác thực.',
      activeHighlights: ['rag-user', 'rag-llm'],
      packets: [
        {
          id: 'pkt-g-5',
          fromNodeId: 'rag-llm',
          toNodeId: 'rag-user',
          label: 'Display with Source Badges',
          type: 'normal',
          detail: 'Hoàn tất chu trình RAG minh bạch',
        },
      ],
    },
  ],
};

export const PRESET_SCENARIOS: SimulationScenario[] = [
  kafkaScenario,
  redisScenario,
  ragScenario,
  quickSortScenario,
  binarySearchScenario,
  mergeSortScenario,
  bubbleSortScenario,
  pathfindingScenario,
  gaScenario,
  loadBalancerScenario,
  tokenBucketScenario,
];
