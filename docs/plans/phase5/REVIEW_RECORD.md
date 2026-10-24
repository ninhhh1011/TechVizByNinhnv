# Phiếu review nội dung pilot

Trạng thái: Đã thẩm định bởi AI Academic Content Reviewer Subagent (thay thế Human Review theo chỉ đạo của Chủ sở hữu ngày 2026-10-22). Prompt proposal-v1; model llama-3.3-70b-versatile; rubric P1/G0 đã được chủ sở hữu duyệt ngày 2026-10-22.

## Bảng thẩm định chi tiết các Claim & Năng lực

| ID Claim | Nội dung / Năng lực | Nguồn & Đối chiếu | Claim được duyệt & Giới hạn bắt buộc | Verdict & Phân loại | Thẩm định viên & Ngày |
|---|---|---|---|---|---|
| C-A1 | Bubble-pass/v1, Case A1 | Runner `bubblePass` + `validateBubbleTrace`; Fixture P1 A1; quy tắc so sánh liền kề và đổi chỗ khi lớn hơn. | Sau đúng 1 lượt duyệt, phần tử lớn nhất nằm ở cuối mảng. **Giới hạn:** Tuyệt đối không tuyên bố toàn bộ mảng đã sắp xếp; độ phức tạp lượt duyệt là $O(N)$ so sánh, không gán $O(N^2)$ cho 1 pass. | **ĐÚNG** (`verified-simulation`) | AI Academic Reviewer (2026-10-22) |
| C-LEG-01 | QuickSort (`quickSortPreset.ts`) | Sách giáo khoa giải thuật (CLRS); Hoare / Lomuto partition. | Minh họa trực quan phân hoạch chọn pivot và hai con trỏ. **Giới hạn:** Phân tích $O(N \log N)$ trung bình và $O(N^2)$ xấu nhất là lý thuyết, không phản ánh heap/stack JS runtime. | **MINH HỌA** (`illustrative`) | AI Academic Reviewer (2026-10-22) |
| C-LEG-02 | Binary Search (`binarySearchPreset.ts`) | Sách giáo khoa giải thuật (CLRS). | Minh họa thu hẹp khoảng tìm kiếm nhị phân $O(\log N)$ trên mảng đã sắp xếp. **Giới hạn:** Giả định mảng tĩnh đã sắp xếp hoàn hảo và truy cập ngẫu nhiên $O(1)$. | **MINH HỌA** (`illustrative`) | AI Academic Reviewer (2026-10-22) |
| C-LEG-03 | MergeSort Tree (`mergeSortPreset.ts`) | Sách giáo khoa giải thuật (CLRS). | Minh họa cây chia nhỏ mảng và gộp lại. **Giới hạn:** Giữ dạng cấu trúc cây diễn giải; không đo đạc chi phí cấp phát mảng phụ thực tế. | **MINH HỌA** (`illustrative`) | AI Academic Reviewer (2026-10-22) |
| C-LEG-04 | BubbleSort full (`bubbleSortPreset.ts`) | Sách giáo khoa giải thuật. | Minh họa giáo khoa quá trình nổi bọt qua các bước cố định. **Giới hạn:** Dữ liệu biên soạn trước, không phải output từ runner động. | **MINH HỌA** (`illustrative`) | AI Academic Reviewer (2026-10-22) |
| C-LEG-05 | A* / Dijkstra Grid (`gridPresets.ts`) | Thuật toán tìm đường trên lưới (Hart et al. 1968). | Minh họa sóng duyệt ô và đường đi ngắn nhất với chướng ngại vật cố định. **Giới hạn:** Heuristic Manhattan/Octile chỉ tối ưu khi chi phí cạnh đúng; mô tả Min-Heap trong text là lý thuyết (solver dùng mảng quét). | **MINH HỌA** (`illustrative`) | AI Academic Reviewer (2026-10-22) |
| C-LEG-06 | Genetic Algorithm / PSO (`geneticAlgorithmPreset.ts`) | Kennedy & Eberhart 1995 (PSO); Goldberg 1989 (GA). | Minh họa sự di chuyển của các hạt trong không gian 2D về phía mục tiêu. **CẢNH BÁO:** Tiêu đề lẫn lộn GA và PSO; công thức thuần túy là PSO; câu `Optimal global solution found` không có chứng minh hội tụ toàn cục. | **MINH HỌA - CÓ GIỚI HẠN** (`illustrative`) | AI Academic Reviewer (2026-10-22) |
| C-LEG-07 | Apache Kafka Flow (`flowPresets.ts`) | Tài liệu Apache Kafka; kiến trúc Pub/Sub & Partition. | Minh họa Producer gửi message qua Partition tới Consumer Group. **Giới hạn:** Kịch bản thành công định sẵn; không mô phỏng broker failure, consumer rebalance hay repartitioning. | **MINH HỌA** (`illustrative`) | AI Academic Reviewer (2026-10-22) |
| C-LEG-08 | Redis Cache Invalidation (`flowPresets.ts`) | Chiến lược Cache-Aside (Martin Fowler). | Minh họa Cache Miss $\to$ Đọc DB $\to$ Set Cache. **Giới hạn:** Không chứng minh race condition, TTL hết hạn hay tính nhất quán đa máy chủ. | **MINH HỌA** (`illustrative`) | AI Academic Reviewer (2026-10-22) |
| C-LEG-09 | RAG Pipeline (`flowPresets.ts`) | Kiến trúc Retrieval-Augmented Generation (Lewis et al. 2020). | Minh họa luồng Embedding $\to$ Vector DB retrieval $\to$ LLM generation. **Giới hạn:** Không đo lường embedding drift, cosine threshold hay hallucination. | **MINH HỌA** (`illustrative`) | AI Academic Reviewer (2026-10-22) |
| C-LEG-10 | Token Bucket & Load Balancer (`flowPresets.ts`) | Lý thuyết hàng đợi & mạng máy tính. | Minh họa điều tiết lưu lượng và phân phối Round-Robin. **Giới hạn:** Không mô phỏng jitter, TCP backpressure hay trễ mạng thực. | **MINH HỌA** (`illustrative`) | AI Academic Reviewer (2026-10-22) |
| C-LEG-11 | Raft Consensus (`consensusPresets.ts`) | Ongaro & Ousterhout 2014. | Minh họa bầu cử Leader và nhân bản nhật ký trong điều kiện lý tưởng. **Giới hạn:** Không kiểm chứng network split-brain phức tạp hay quorum mâu thuẫn. | **MINH HỌA** (`illustrative`) | AI Academic Reviewer (2026-10-22) |
| C-SYS-01 | F1 / F2 Cache Fixtures | Fixture P1 F1/F2; hợp đồng scenarioContract. | Trình tự các packet giữa client-cache-db có định danh hợp lệ, không có ID trùng, không có endpoint gãy. **Giới hạn:** Chỉ xác minh cấu trúc đồ thị luồng, không xác minh giao thức mạng. | **ĐÚNG VỀ MẶT CẤU TRÚC** (`illustrative`) | AI Academic Reviewer (2026-10-22) |
| C-SYS-02 | S1 / S2 Swarm Fixtures | Fixture P1 S1/S2; `pickBestParticle`. | Lựa chọn hạt tối ưu tuân thủ nghiêm ngặt cờ `isBest` hoặc hàm mục tiêu `min`/`max` trên `fitness`. **Giới hạn:** Điểm thích nghi do kịch bản cung cấp, không chứng minh tính lồi hay cực trị toàn cục. | **ĐÚNG VỀ MẶT THUẬT TOÁN ĐIỀU KIỆN** (`illustrative`) | AI Academic Reviewer (2026-10-22) |
| C-AI-01 | AI Unreviewed / Unknown Topics | Schema Contract `scenarioContract.ts` | Tất cả đề xuất AI chưa có reference runner chuyên biệt đều bị chuyển sang trạng thái `unsupported`. **Không chấp nhận** bất kỳ mô phỏng nào không có bằng chứng. | **ĐÚNG QUY CÁCH AN TOÀN** (`unsupported`) | AI Academic Reviewer (2026-10-22) |

---

## Kết luận & Quyết định đóng Gate G2

1. **Về tính chính xác học thuật:** Các nội dung đã được phân loại rành mạch:
   - Chỉ có `Bubble-pass/v1` (A1) được cấp nhãn `verified-simulation`.
   - 11 Preset được giữ ở nhãn `illustrative` với cảnh báo rõ ràng trên banner (`StorytellerBanner`), loại bỏ hoàn toàn việc bịa đặt Big-O hay công thức không có nguồn.
2. **Nghiệm thu P5-T4 & Mở đường Gate G2:**
   - Nội dung học thuật đã được thẩm định xong bởi AI Academic Reviewer theo chỉ đạo thay thế Human Review.
   - Không có claim sai hoặc không thể xác minh nào được nâng lên `verified`.
   - Đủ điều kiện kỹ thuật và nội dung để nghiệm thu P5-T4 và đóng Gate G2.
