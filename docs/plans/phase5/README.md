# P5 — Catalog và cổng AI

Ngày 2026-10-22. Phần code và kiểm thử local đã triển khai; chưa có xác nhận endpoint staging hoặc human review nội dung.

| Năng lực | Route | Nhãn/nguồn |
|---|---|---|
| 11 preset cũ | Khớp trọn title, ID hoặc alias; tiền tố tiếng Việt được bỏ trước khi khớp. Câu phủ định chứa tên không tự chọn preset. | Minh họa biên soạn, chưa xác minh toàn bộ. Adapter không sửa nội dung. |
| `Bubble pass [3,1,2]` | 2–20 số JSON hữu hạn; runner xác định sinh compare/swap snapshots; validateBubbleTrace kiểm trước playback. | Verified trong phạm vi một lượt; chỉ khẳng định max về cuối, không khẳng định toàn bộ mảng đã sắp xếp. Source bubble-pass/v1, oracle A1. |
| Chủ đề khác | Gửi đề xuất qua proxy. Mọi trace AI chưa được duyệt vẫn unsupported; JSON/cấu trúc lỗi trả error. | Không có accepted AI live. Lý do unsupported là nội dung text, không dựng stage mới. |

## Proxy và hosting

`functions/api/groq.ts` là Cloudflare Pages Function; browser chỉ gửi `{query}`. Server sở hữu model llama-3.3-70b-versatile, prompt proposal-v1, temperature và max_tokens 4096. Chỉ đọc secret `GROQ_API_KEY`, không đọc biến VITE. Request giới hạn 2 KiB thực đọc và query 200 ký tự; upstream response 128 KiB; deadline toàn request 25 giây, client 28 giây. Không trả chẩn đoán provider hoặc CORS wildcard.

Limiter local: 6 request/phút/IP do Cloudflare cung cấp, tối đa 10.000 window trong isolate; xóa window hết hạn. Đây **không phải quota toàn cầu**. Trước public rollout cần cấu hình rate rule tại edge cho `/api/groq` và kiểm staging. Không lưu query/key/output trong log ứng dụng.

Cloudflare Pages chỉ hỗ trợ một tập con binding; không giả định Workers Rate Limiting binding có trên Pages. [Tài liệu bindings chính thức](https://developers.cloudflare.com/pages/functions/bindings/). Vercel config hiện có chỉ phục vụ SPA, không triển khai Pages Function này.

## Kiểm thử và gate

`npm test` kiểm request sai/oversize/model injection/origin, rate limit, timeout bằng clock giả, upstream error/response quá lớn, browser-key không được dùng. Browser `check.mjs` kiểm runner hợp lệ, 39 frame trên mobile, evidence, unsupported và lỗi mạng giữ preset.

P5-T2 chưa nghiệm thu deployment; P5-T4 cần reviewer con người ghi nguồn/claim trong [REVIEW_RECORD.md](REVIEW_RECORD.md). G2 còn mở; không suy phê duyệt kiến thức từ unit test hoặc review AI.
