# P1 — Mô hình miền và dữ liệu đánh giá

Ngày khóa bản nháp: 2026-10-21 (Asia/Saigon). Nguồn yêu cầu: [Master Plan](../MASTER_PLAN.md#p1--mô-hình-miền-và-dữ-liệu-đánh-giá), [baseline P0](../baseline/README.md). Đây là oracle để so sánh thiết kế ở P2, chưa phải dữ liệu production hay xác nhận rằng các preset hiện tại đều đúng.

## P1-T1 — Bộ mẫu cố định

[`cases.json`](cases.json) ghi input, event theo thứ tự, state kỳ vọng sau từng event, nguồn, giới hạn và một câu hỏi hiểu đúng cho người học. Quy ước: frame đầu là state ban đầu khi cần; frame tiếp theo là state **sau** event. Event rút gọn có thể gộp nhiều phép tính; không được suy thêm event trung gian từ ảnh. ID là danh tính logic, không phụ thuộc tọa độ vẽ. Các case thuật toán do tác giả tính tay từ quy tắc nêu trong `source`; case flow và swarm là ví dụ được biên soạn. Bảng dưới khóa việc chọn case trước POC.

| Family | Case 1 | Case 2 | Phạm vi kết luận |
|---|---|---|---|
| Array | A1 bubble sort có compare/swap | A2 binary search không thấy phần tử | Tính đúng state từ quy tắc xác định; A2 đòi input tăng dần. |
| Grid | G1 đường 4 hướng đi vòng tường | G2 đích bị chặn | Chi phí bằng số cạnh trên lưới đơn vị; trạng thái ban đầu chưa phải “không có đường”. |
| Flow | F1 round-robin hai request | F2 cache miss/fill | Chỉ một luồng hợp lệ theo chính sách được nêu; không chứng minh sản phẩm/hệ thống thật. |
| Swarm | S1 cực đại score | S2 cực tiểu score | Chỉ xác định best từ score đã cho; không chứng minh GA/PSO, hội tụ hay cực trị toàn cục. |
| Tree | T1 merge sort ba phần tử | T2 BST lệch nhánh | Quan hệ cha-con và kết quả thuật toán; layout không quyết định quan hệ. |
| Unsupported | U1 chủ đề rộng, không có nguồn/runner | — | Không tạo mô phỏng giả. |

**Đối chiếu preset:** A1/A2 liên hệ `morePresets.ts`/`arrayPresets.ts`, G1/G2 liên hệ `gridPresets.ts`, F1/F2 liên hệ `morePresets.ts`/`presets.ts`, S1/S2 liên hệ `geneticAlgorithmPreset.ts`, T1/T2 liên hệ `morePresets.ts`/`TreeGraphRenderer.tsx`. Fixture là bài kiểm độc lập; nếu preset khác oracle, ghi discrepancy và review miền trước khi sửa hoặc chấp nhận. Không thay fixture để cho POC pass.

**Nguồn quy tắc ngoài repo:** [NIST bubble sort](https://xlinux.nist.gov/dads/HTML/bubblesort.html) cho A1, [NIST binary search](https://xlinux.nist.gov/dads/HTML/binarySearch.html) cho A2, [NIST merge sort](https://xlinux.nist.gov/dads/HTML/mergesort.html) cho T1, [NIST binary search tree](https://xlinux.nist.gov/dads/HTML/binarySearchTree.html) cho T2, [Redis cache-aside](https://redis.io/docs/latest/develop/use-cases/cache-aside/) cho chuỗi miss→database→fill của F2. Các nguồn này xác định quy tắc; state số cụ thể trong fixture vẫn phải kiểm bằng tính toán/review riêng. F1/S1/S2 là tình huống giả định đã khai báo, không mượn tài liệu ngoài để gắn nhãn verified.

**Quy trình review hai người:** reviewer A và B nhận riêng input không có đáp án trong `review-inputs.json`, tự tính expected state trước khi xem fixture, ghi verdict từng ID và lý do sai khác vào bảng dưới. Hai subagent độc lập đã thực hiện vòng này theo yêu cầu của chủ sở hữu phiên làm việc; kết quả là review bằng AI, chưa thay thế phê duyệt chuyên gia miền.

| Reviewer | Ngày | Case ID / verdict | Sai khác và cách giải quyết |
|---|---|---|---|
| [Subagent A](../reviews/oracle-a.md) | 2026-10-22 | 11/11 pass sau kiểm lại | S1/S2 ban đầu thiếu `scoreUpdates`; fixture và input mù đã bổ sung, reviewer xác nhận lại. |
| [Subagent B](../reviews/oracle-b.md) | 2026-10-22 | 11/11 pass sau kiểm lại | Phát hiện độc lập cùng sai khác S1/S2; xác nhận phép tính sau sửa. |

## P1-T2 — Hợp đồng bất biến và khả năng xác minh

Áp dụng cho trace được gắn nhãn `verified-simulation`; trace `illustrative` vẫn phải đạt kiểm tra cấu trúc nhưng không được nâng thành sự thật miền. Mỗi `accepted` phải có provenance và case/runner/oracle tương ứng. Một kiểm tra cấu trúc pass không chứng minh thuật toán, Big-O, tối ưu, độ trễ hoặc cơ chế hệ thống.

| Bất biến | Positive trong fixture | Negative khóa (kết quả mong đợi) |
|---|---|---|
| ID entity/particle/node ổn định và duy nhất trong frame; cùng ID giữ cùng ý nghĩa qua frame | T2 `n2` luôn là khóa 2; S1 `p1` vẫn là cùng hạt | Hai node cùng ID, hoặc ID `n2` đổi từ 2 thành 9 → reject. |
| Event có thứ tự; frame là state sau event, seek cùng chỉ số trả cùng state | A1 compare rồi swap; F2 miss trước db-response | Swap xuất hiện trước compare mà không có nguyên nhân; seek lại cho state khác → reject. |
| Array sort bảo toàn multiset và độ dài; compare không đổi array; swap chỉ đổi đúng hai chỉ số | A1 `[3,1,2]` → `[1,3,2]` → `[1,2,3]` | `[3,1,2]` → `[1,3,3]`, hoặc compare đổi giá trị → reject. Binary search đòi input đã tăng dần và khoảng `[lo,hi]` thu hẹp. |
| Grid: tọa độ trong bounds, không vào wall, mỗi cạnh path kề theo policy; cost cộng từ cạnh thực | G1 cost 4, G2 `no-path` sau exhausted | G1 nhảy `[0,0]`→`[1,1]` khi diagonal=false; path qua `[0,1]`; cost 5 → reject. Start/end bị wall → invalid input. |
| Graph packet: endpoint tồn tại, ID message ổn định, receive sau send cùng message | F1 `client→lb→a`, F2 db-response sau api→db | `lb→missing`, response trước request, hoặc một ID request đồng thời chỉ hai payload khác nhau → reject. |
| Tree: một root, parent tồn tại ở cùng frame, không cycle, một parent/node, quan hệ nhánh theo quy tắc chủ đề | T2 `n3` là right child của `n2` | `n4.parentId=n3` tạo cycle; `n3.parentId=missing`; BST 3 nằm bên trái 2 → reject. |
| Fitness: objective phải khai báo; best trỏ vào particle có score tốt nhất theo objective trong frame | S1 max 6 chọn p1; S2 min 1 chọn p2 | S2 chọn score 5; thiếu objective mà suy best theo khoảng cách hình vẽ → unsupported/partial. |
| Flow ordering áp dụng theo chính sách đã khai báo, không suy đồng hồ mạng từ thứ tự hiển thị | F1 r1→a rồi r2→b; F2 miss→db→fill | Cache fill trước db-response khi không có giá trị khác; nhận packet chưa gửi → reject. |
| Nội dung trống/tham chiếu gãy không được dựng mô phỏng | U1 không có frames | `steps=[]` nhưng UI render step 1; thiếu array/grid/tree/packet rồi tự sinh dữ liệu hoặc Big-O → unsupported/error. |

**Giới hạn tự động hóa:** invariant chỉ phát hiện mâu thuẫn trong dữ liệu và giữa event/state. Nó không thể xác nhận một packet thật đã đi qua broker, rằng latency/P99 đạt số liệu, rằng heuristic admissible nếu policy/cost không rõ, rằng fitness là hàm mục tiêu thực, hoặc Big-O của một thuật toán AI tự mô tả. Những claim này cần runner xác định, tài liệu nguồn đủ cụ thể hoặc chuyên gia duyệt. `S1/S2` và `F1/F2` luôn là `illustrative` cho đến khi có bằng chứng mới.

## P1-T3 — Rubric và pilot

Đơn vị chấm là một case × một viewport × một lần chạy, giữ riêng bốn cột dưới. Người chấm miền đọc claim/state, QA chấm giao diện và accessibility, kỹ sư đo hiệu năng, người điều phối pilot ghi câu trả lời của người học. Lưu ID case, commit, browser/version, viewport, input, fixture version, thời điểm, reviewer, verdict và bằng chứng ảnh/log; không lưu thông tin định danh người học ngoài mã ngẫu nhiên. Chấm `fail` khi sai ngữ nghĩa dù giao diện đẹp hoặc nhanh.

| Trục | Phép đo / người chấm | Điều kiện fail hoặc ngưỡng POC |
|---|---|---|
| Correctness nội dung | Reviewer miền đối chiếu từng frame/event/claim với oracle và nguồn; QA chạy negative cases | 0 false-accepted trên tập negative khóa; mọi case verified khớp toàn bộ state; case illustrative có nhãn/giới hạn rõ; claim không chứng minh phải bỏ hoặc đánh dấu chưa xác minh. |
| Clarity | 5 người học mục tiêu trả câu hỏi trong `cases.json` trước/sau xem, nêu lý do bằng lời; điều phối chấm đúng/sai theo `expectedAnswer` | Ghi tỷ lệ đúng trước/sau và hiểu nhầm theo case, không gộp vào điểm renderer. Pilot fail khi có hiểu nhầm nghiêm trọng về trạng thái `illustrative`/`verified`, hoặc câu trả lời sau xem sai vì hình/text; sửa rồi kiểm lại. 5 là pilot phát hiện lỗi, không là ước lượng tổng thể. |
| Accessibility | QA keyboard và screen reader trên desktop/mobile; thử `prefers-reduced-motion`; kiểm pause/seek, text tương đương cho state quan trọng | Không thao tác được bằng keyboard, focus mất, thông tin chỉ thể hiện bằng màu/chuyển động, motion tiếp tục khi pause hoặc không tôn trọng reduced motion → fail. |
| Performance | Kỹ sư đo từ click Next đến frame state mới đã commit qua `requestAnimationFrame`, 30 lần/case sau 5 lần warm-up; ghi p50/p95, DOM nodes, JS error, memory nếu có | Trước P2 đo baseline cùng workload trên Chromium desktop 1440×900 và mobile 390×844, cùng máy/build/input. POC fail nếu p95 > 1.25× baseline của cùng case/viewport hoặc có frame > 100 ms do chuyển bước; ngưỡng này là đề xuất cần chủ sở hữu chốt ở G0. Idle rAF 16.7 ms trong P0 không thay thế phép đo này. |

**Kịch bản quan sát:** hỏi một câu trước khi xem; cho tự dùng Next/Back/Seek/Pause trên A1, G2, F2, S2, T2 và U1, không gợi ý đáp án; hỏi lại câu tương ứng và “đây là mô phỏng đã kiểm chứng hay minh họa?”; ghi nguyên văn lời giải thích, thao tác bị kẹt, thời gian hoàn thành và mức tự tin 1–5. Thứ tự case đổi luân phiên giữa người học. Reviewer chấm mù theo `expectedAnswer`; sai khác giữa hai người chấm được giải quyết trước khi tính tỷ lệ. Mức pilot 5 người là đề xuất vận hành và phải được chủ sở hữu chốt ở G0.

**Phân loại lỗi:** `DOMAIN` (rule/claim/oracle), `DATA` (trace/boundary), `RENDER` (state đúng nhưng hình sai), `INTERACTION` (playback/input), `A11Y`, `PERF`. Một issue có thể mang nhiều nhãn; báo cáo số lượng riêng từng nhãn, không dùng một điểm tổng che lỗi miền.

## Trạng thái và điều kiện chuyển P2

Fixture và contract/rubric đã viết; kiểm máy xác nhận cấu trúc và phép tính scoreUpdates. Hai subagent độc lập đã duyệt 11/11 oracle. [Subagent miền](../reviews/domain.md) duyệt giới hạn claim ở mức bản nháp và ghi các invariant chưa có negative test thực thi. P1-T3 phụ thuộc P0-T4 và chủ sở hữu chốt ngưỡng đo, pilot. G0 còn mở cho đến các điều kiện đó.
