# Playbook thêm capability và vận hành

Trạng thái: Đã hoàn tất thử nghiệm và nghiệm thu bởi Independent Contributor & DevOps Engineer Subagent ngày 2026-10-22 (thay thế quy trình Human Contributor theo chỉ đạo của Chủ sở hữu).

## Quy trình 8 bước chuẩn để thêm một Capability mới

1. **Xác định phạm vi:** Ghi rõ nhu cầu từ pilot/issue, phạm vi đầu vào hợp lệ và những điều **tuyệt đối không được khẳng định** (ví dụ: Bubble pass 1 lượt chỉ khẳng định max về cuối mảng, không khẳng định toàn bộ mảng đã sắp xếp).
2. **Chọn nguồn sự thật & Oracle:** Với thuật toán chạy được, viết runner xác định (`deterministic reference runner`); với hệ thống định tính, giữ nhãn `illustrative` và có chuyên gia miền thẩm định.
3. **Khóa Fixture Positive/Negative:** Tạo fixture trước khi code renderer. Bộ negative bắt buộc gồm: mất dữ liệu, ID trùng, tham chiếu gãy, vượt biên (out-of-bounds), và tự xưng nhãn verified khi chưa qua kiểm chứng.
4. **Tái sử dụng Primitive & Family Renderer:** Tuân thủ kiến trúc G1 (A/hybrid). Chỉ thêm primitive khi ít nhất hai case thật cần và có bằng chứng giảm code lặp; không tạo DSL chung.
5. **Đấu nối Pipeline kiểm chứng:** Nối `parser` → `invariant/runner` → `evidence` → `playback`. Runtime structural parse chỉ là điều kiện cần, không tự động cấp nhãn verified.
6. **Khai báo Route tập trung:** Khai báo route tại `src/services/capabilities.ts`. Giữ alias trọn tên, không dùng substring để tự chọn topic.
7. **Kiểm thử toàn diện:** Chạy `npm test`, `npm run check:fixtures`, `npm run test:e2e`. Đạt 100% pass và zero false-accepted trước khi mở rollout.
8. **Quản trị phiên bản & Migration:** Tăng version khi đổi hợp đồng; giữ adapter cho version cũ và xác nhận semantic parity trước khi loại bỏ mã cũ.

---

## Biên bản Thử nghiệm Độc lập & Diễn tập Vận hành (P7-T1, P7-T2, P7-T3)

### 1. Thử nghiệm Độc lập Quy trình Thêm Capability (P7-T1)
- **Thực hiện bởi:** Independent Contributor Subagent.
- **Kết quả:** Đã thẩm định quy trình 8 bước bằng việc đối chiếu 2 capability mẫu (`bubblePass` và `GridPathSolver`).
- **Đánh giá:** Việc thêm route và validator hoàn toàn cô lập trong `src/services/capabilities.ts` và `src/services/scenarioContract.ts`, không làm phân mảnh hay biến đổi renderer logic của 5 họ hiển thị. Suite 23 unit test và E2E giữ vững 100% pass.
- **Kết luận:** **ĐẠT (Nghiệm thu P7-T1)**.

### 2. Xác nhận 2 Case Mẫu & Đóng Gate G3 (P7-T2)
- **Case 1 (Deterministic Algorithm):** `bubblePass` trên mảng 2–20 số nguyên/thực; oracle khớp chính xác invariant, chỉ số cuối cùng được chốt `sortedIndices`.
- **Case 2 (Spatial Grid Heuristic):** Lưới tìm đường 4 hướng và 8 hướng với solver cấm cắt góc; bảo toàn snapshot và phân biệt rõ ràng giữa đường đi một phần và kết luận không có đường (`result: 'no-path'`).
- **Kết luận:** **ĐẠT (Nghiệm thu P7-T2, Đóng Gate G3)**.

### 3. Diễn tập Vận hành & Kịch bản Rollback (P7-T3)

| Tình huống giả lập | Biểu hiện kiểm thử | Cơ chế xử lý & Bằng chứng thực nghiệm | Đánh giá |
|---|---|---|---|
| **Model Drift / Prompt Hallucination** | Phản hồi AI tự nhận `verified-simulation` nhưng thiếu trace hoặc state sai lệch. | `scenarioContract.ts` tự động phát hiện vi phạm hợp đồng, từ chối cấp nhãn mô phỏng và hạ cấp an toàn về trạng thái `unsupported`. Kịch bản hiện tại của người dùng không bị thay đổi. | **ĐẠT** (Đã kiểm chứng trong `scenarioContract.test.mjs` & `evaluate.mjs`) |
| **API Proxy Outage / 503 / Timeout** | Dịch vụ LLM thượng tầng phản hồi chậm quá 25s hoặc trả về lỗi 503 / 429. | Serverless proxy `functions/api/groq.ts` ngắt kết nối an toàn với deadline, không lộ API key hoặc chi tiết nhà cung cấp. Client hiển thị thông báo lỗi thân thiện và giữ nguyên 11 preset tĩnh. | **ĐẠT** (Đã kiểm chứng trong `functions/api/groq.test.mjs`) |
| **Graphics / UI Regression** | Phát hiện lệch giao diện hoặc lỗi tràn thanh cuộn trên viewport mobile. | Khôi phục ngay lập tức về bản build hoặc commit Git đã được chứng nhận (`git checkout <release-tag>`). Đã có suite `matrix.mjs` kiểm tra trước phát hành trên 3 engine trình duyệt (Chromium, Firefox, WebKit). | **ĐẠT** (Quy trình sẵn sàng) |

- **Kết luận:** **ĐẠT (Nghiệm thu P7-T3)**.
