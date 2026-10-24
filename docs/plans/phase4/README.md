# P4 — Playback và rendering

Ngày 2026-10-22. Kiến trúc G1 A/hybrid: giữ DOM/SVG và năm renderer; không thêm DSL, Canvas hay dependency.

| Task | Thay đổi | Bằng chứng |
|---|---|---|
| T1 | Một timer theo frame trong App; seek thủ công dừng play; reset tạo phiên mới. Motion nhận trạng thái play và reduced motion. Khi pause, hiển thị snapshot tại frame boundary, packet đứng ở điểm cuối; không giữ pha nội suy như một trạng thái miền. | `check.mjs`: clock giả kiểm play/speed/seek/pause/reset; packet đứng yên; reduced motion cả năm family. |
| T2 | Route array theo renderer đã khai báo, kể cả visualData. Grid nhận config scenario, giữ snapshot ở mọi bước; solver chỉ phục vụ thao tác chỉnh tường. Seek/reset khôi phục snapshot. | Browser tái hiện 16 thay vì 24 ô trung gian ở frame cuối trước sửa, nay 24/24; độ dài 25 cạnh. SSR kiểm config 2×2, thiếu dữ liệu, walls. |
| T2 | Solver ở `src/utils/pathfinding.ts`; 4 hướng chi phí 1, chéo chi phí √2, cấm cắt góc qua một trong hai ô kề bị chặn. Start/end trong wall là invalid, khác no-path sau duyệt. | G1/G2 P1 khớp chi phí; A* và Dijkstra đồng ý; corner/start=end/out-of-bounds có unit test. |
| T3 | Flow kiểm ID/endpoint; tọa độ DOM chia lại scale container và cập nhật qua ResizeObserver. Tree xếp theo subtree cha-con, thứ tự ID ổn định và depth suy từ parent. Swarm chỉ dùng best khai báo duy nhất hoặc objective min/max với fitness hữu hạn; không đoán theo khoảng cách hoặc tự tạo mục tiêu. | Unit và SSR negative; browser zoom/seek giữ tọa độ local. |
| T4 | Grid sửa bằng keyboard; text alternative cho packet/tree/swarm; aria-current cho timeline, aria-pressed cho speed; timeline dài cuộn riêng; reduced motion tắt CSS/SVG/Framer semantic motion. | Browser keyboard/reduced motion; accessibility tree được lưu ở P6. Chưa có thử screen reader bởi con người. |
| T5 | Giữ DOM/SVG theo số đo; chưa có bottleneck cần Canvas hoặc primitive chung mới. | `node docs/plans/phase4/measure.mjs`: 10 workload = 5 family × 2 viewport, production so Git 991ea6c, 5 warm-up + 30 seek/frame 1–2. p95 ratio 0,861–1,022; max candidate 19,1 ms. [Dữ liệu](measure-results.json). |

Số đo là click đến frame commit qua rAF, không đo animation hoàn tất hoặc FPS semantic; heap chỉ là chẩn đoán. Không chứng nhận scene dày ngoài workload. Snapshot tree/layout và grid đã sửa có thay đổi có chủ đích so baseline; hash dữ liệu 11 preset vẫn giữ nguyên.

Trong lượt kiểm lại P3 phát hiện banner còn tự thêm Big-O/use case. Đã khóa bằng SSR test và thay nội dung thiếu bằng thông báo thiếu nguồn; không sửa oracle để làm test pass.
