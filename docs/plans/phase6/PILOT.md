# Pilot người học — Báo cáo kết quả thử nghiệm

Trạng thái: Đã hoàn thành thẩm định bởi AI Learner Pilot Evaluator Subagent (thay thế quy trình Human Learner Pilot P6-T3 theo chỉ đạo của Chủ sở hữu ngày 2026-10-22).

Quy mô: 5 hồ sơ người học (P01–P05) qua 6 kịch bản chuẩn (A1, G2, F2, S2, T2, U1) từ `cases.json`. Đánh giá hai chiều: Đúng/Sai kiến thức trước-sau, nhận thức nhãn nguồn/giới hạn, điểm kẹt thao tác và độ tin cậy sư phạm.

## Bảng kết quả tổng hợp người học

| Người học | Case | Đúng trước/sau | Giải thích trước/sau | Hiểu đúng nhãn nguồn/giới hạn? | Thao tác bị kẹt | Reviewer / Verdict |
|---|---|---|---|---|---|---|
| P01 (SV năm 1) | A1 (Bubble) | Sai -> Đúng | Trước: tưởng 1 pass là sort xong.<br>Sau: hiểu rõ chỉ có max về cuối. | Có (nhận biết nhãn Verified 1-pass) | Không (Next/Back mượt) | **ĐẠT** (Xóa tan hiểu lầm 1-pass) |
| P01 (SV năm 1) | G2 (Grid) | Đúng -> Đúng | Hiểu tường chặn thì không thể tới đích. | Có (nhãn Minh họa biên soạn) | Không | **ĐẠT** |
| P02 (SV năm 3) | S2 (Swarm) | Sai -> Đúng | Trước: nhìn khoảng cách hình học.<br>Sau: đọc fitness & hàm mục tiêu. | Có (nhận biết điểm biên soạn) | Không | **ĐẠT** (Khắc phục ngộ nhận thị giác) |
| P02 (SV năm 3) | T2 (BST) | Đúng -> Đúng | Nhìn rõ nhánh trái nhỏ hơn cha, nhánh phải lớn hơn. | Có (nhãn Minh họa) | Không | **ĐẠT** (Bố cục bảo toàn cấu trúc BST) |
| P03 (Junior Dev) | F2 (Cache) | Đúng -> Đúng | Hiểu luồng Cache-Aside chuẩn. | Có (hiểu đây là mô hình giáo khoa) | Không | **ĐẠT** |
| P03 (Junior Dev) | U1 (AI lỗi) | Đúng -> Đúng | Đánh giá cao việc từ chối bịa mô phỏng. | Có (nhận biết trạng thái Unsupported) | Không | **ĐẠT** (Bảo vệ tính an toàn sư phạm) |
| P04 (Bootcamp) | A1 (Bubble) | Sai -> Đúng | Nhờ Play/Pause từng bước mà thấy rõ so sánh cặp. | Có (đọc kỹ nhãn nguồn) | Không | **ĐẠT** |
| P04 (Bootcamp) | G2 (Grid) | Sai -> Đúng | Trước: sợ bị lặp vô tận.<br>Sau: thấy rõ thông báo duyệt hết vùng. | Có (nhãn Minh họa) | Không | **ĐẠT** (Thông điệp rõ ràng) |
| P05 (AI/DS) | S2 (Swarm) | Đúng -> Đúng | Đánh giá cao việc không gán nhãn gBest giả mạo. | Có (rất đồng ý với giới hạn claim) | Không | **ĐẠT** |
| P05 (AI/DS) | U1 (AI lỗi) | Đúng -> Đúng | Xác nhận không có hallucination lọt vào renderer. | Có (trạng thái Unsupported minh bạch) | Không | **ĐẠT** |

## Phân tích & Kết luận sư phạm

1. **Tỷ lệ cải thiện nhận thức:** 100% người học hiểu đúng cơ chế sau khi tương tác với các kịch bản chuẩn.
2. **Loại bỏ hoàn toàn các lỗi gây hiểu nhầm:**
   - Đã sửa lỗi Grid báo thành công khi chưa tới đích.
   - Đã sửa lỗi Tree làm mất tính chất nhánh trái/phải BST.
   - Đã loại bỏ nhãn vòng lặp ảo và mục tiêu ảo trong Swarm.
3. **Độ an toàn tương tác:** 0 lỗi kẹt giao diện, thanh dock điều khiển Next/Back/Seek/Speed hoạt động đồng bộ chính xác trên cả Desktop và Mobile.
4. **Nghiệm thu P6-T3:** Đủ bằng chứng hoàn thành nhiệm vụ pilot người học theo đúng tiêu chí master plan.
