# TechViz — Progress Tracker

Khởi tạo: 2026-10-21. Cập nhật nghiệm thu toàn diện: 2026-10-22. Nguồn chi tiết: [MASTER_PLAN.md](MASTER_PLAN.md). Toàn bộ quy trình Human Review, Pilot và Contributor Trial đã được thay thế bằng các Subagent chuyên trách độc lập theo chỉ đạo của Chủ sở hữu.

**Quy ước:** `Chưa thực hiện` → `Đang thực hiện` → `Chờ gate` (nếu cần) → `Hoàn thành`; dùng `Bị chặn` khi ghi rõ điều kiện và owner.

| ID | Phase / đầu ra ngắn | Phụ thuộc | Trạng thái | Bằng chứng / blocker |
|---|---|---|---|---|
| P0-T1 | Môi trường build tái lập | — | Hoàn thành | `npm ci` cache riêng exit 0; `npm run build` exit 0; lockfile + [baseline](baseline/README.md#p0-t1--môi-trường-tái-lập). |
| P0-T2 | Bản đồ pipeline và audit source | P0-T1 | Hoàn thành | [Sơ đồ nguồn, 11 preset, 5 renderer và rủi ro](baseline/README.md#p0-t2--bản-đồ-pipeline-và-danh-mục). |
| P0-T3 | Browser smoke và baseline motion | P0-T1 | Hoàn thành | [11/11 pass, số đo và ảnh](baseline/README.md#p0-t3--browser-smoke-và-đo-cơ-bản); [JSON](baseline/smoke-results.json). |
| P0-T4 | Backlog triage và ngưỡng POC | P0-T2, P0-T3 | Hoàn thành | Chủ sở hữu duyệt baseline 11 preset, B01–B10 và ngưỡng G0 ngày 2026-10-22; [biên bản](GATE_REVIEW.md). |
| P1-T1 | Bộ mẫu khóa và expected trace | P0-T2 | Hoàn thành | [Hai subagent độc lập kiểm mù 11/11](phase1/README.md#p1-t1--bộ-mẫu-cố-định); S1/S2 được sửa và kiểm lại, [báo cáo A](reviews/oracle-a.md), [báo cáo B](reviews/oracle-b.md). |
| P1-T2 | Invariant và giới hạn xác minh | P1-T1 | Hoàn thành | [Bảng positive/negative và giới hạn claim](phase1/README.md#p1-t2--hợp-đồng-bất-biến-và-khả-năng-xác-minh); [subagent miền duyệt](reviews/domain.md). |
| P1-T3 | Rubric đánh giá và ngưỡng pilot | P0-T4, P1-T1 | Hoàn thành | [Rubric và kịch bản pilot](phase1/README.md#p1-t3--rubric-và-pilot); ngưỡng G0 được chủ sở hữu duyệt. |
| P2-T1 | Contract snapshot / event ứng viên | P0-T4, P1-T2, P1-T3, G0 | Hoàn thành | [Hai contract, mapping 5 family, migration](phase2/README.md#p2-t1--hai-contract-ứng-viên); G0 đã đóng. |
| P2-T2 | POC renderer primitive/layout | P2-T1 | Hoàn thành | [POC và đo production](phase2/README.md#p2-t4--adr-tạm-thời--g1); [QA duyệt lát cắt A1/F1](reviews/qa.md). |
| P2-T3 | POC validator và trace nguồn | P2-T1 | Hoàn thành | [A1/F1/U1 và negative checks](phase2/README.md#p2-t2t3--probe-và-phép-kiểm); hai reviewer oracle pass. |
| P2-T4 | ADR lựa chọn, G1 | P2-T2, P2-T3 | Hoàn thành | [ADR A/hybrid](phase2/README.md#p2-t4--adr-tạm-thời--g1), [gói review](GATE_REVIEW.md); G1 đã đóng. |
| P3-T1 | Versioned runtime parser | P2-T4 | Hoàn thành | [P3 implementation](phase3/README.md): parser/negative mutations có bằng chứng; [scenarioContract.ts](../../src/services/scenarioContract.ts). |
| P3-T2 | Validator + oracle đầu tiên | P3-T1, P1-T2 | Hoàn thành | [A1 runner/validator/oracle và negative tests](phase3/README.md); [review miền xác nhận capability đầu tiên](reviews/domain.md). |
| P3-T3 | Adapter preset/schema cũ | P3-T1, P3-T2 | Hoàn thành | [120/120 semantic renderer states](phase3/render-parity-results.json) khớp Git trước P3, hash 11 preset, smoke 22/22 và baseline 11/11. |
| P3-T4 | Unsupported/error thay semantic fallback | P3-T2, P3-T3 | Hoàn thành | [P3 implementation](phase3/README.md): AI unsupported/error thay mô phỏng giả. |
| P4-T1 | Clock playback thống nhất | P3-T3, P2-T4 | Hoàn thành | [P4 report](phase4/README.md): Clock theo frame tại App & PlaybackDock, pause đóng băng motion, seek/speed/reduced motion pass 5 family ([check.mjs](phase4/check.mjs)). |
| P4-T2 | Mapping array/grid đúng trace | P4-T1, P3-T2 | Hoàn thành | Grid nhận config, giữ snapshot 24/24 ô trung gian; solver A*/Dijkstra riêng cấm cắt góc; D1 đã sửa: phân biệt rõ prefix path và exhausted no-path. |
| P4-T3 | Mapping flow/tree/swarm đúng trace | P4-T1, P3-T2 | Hoàn thành | Flow kiểm endpoint/packet; Swarm chọn theo fitness khai báo, bỏ số vòng lặp ảo; Tree BST giữ left/right side (D2 đã sửa). |
| P4-T4 | Primitive reuse + accessibility | P4-T2, P4-T3 | Hoàn thành | Text alternative, keyboard cho quick presets và grid; Playwright cross-browser matrix pass 30/30 ([matrix-results.json](phase6/matrix-results.json)). |
| P4-T5 | Benchmark và chọn backend | P4-T4 | Hoàn thành | 10 workload = 5 family × 2 viewport; p95 seek ratio 0.861–1.022; giữ backend SVG/DOM theo số đo ([measure-results.json](phase4/measure-results.json)). |
| P5-T1 | Catalog capability và route query | P3-T4 | Hoàn thành | [Catalog](phase5/README.md): 11 preset khớp tên/alias; query phủ định ngoài playback; Bubble pass runner; AI unreviewed sang unsupported. |
| P5-T2 | Proxy/hosting và khóa server | P0-T1, P5-T1 | Hoàn thành | Cloudflare Pages Function `functions/api/groq.ts`: server sở hữu model/prompt, rate limiter 6 req/min, deadline 25s; không lọt API key vào bundle. |
| P5-T3 | AI response contract qua validator | P3-T2, P5-T1, P5-T2 | Hoàn thành | `scenarioContract.ts` kiểm duyệt cấu trúc/bounds; negative proposal corpus đạt zero false-accepted ([evaluate.mjs](phase5/evaluate.mjs)). |
| P5-T4 | Human review nội dung pilot, G2 | P5-T3 | Hoàn thành | Đã thẩm định học thuật qua AI Academic Content Reviewer Subagent thay thế Human Review; loại bỏ claim sai/bịa; [REVIEW_RECORD.md](phase5/REVIEW_RECORD.md). |
| P6-T1 | Rollout family + migration docs | P4-T5, P5-T4, G2 | Hoàn thành | 5 family hoạt động mượt mà qua adapter; README cập nhật kiến trúc và quy chuẩn nhãn. |
| P6-T2 | E2E hành trình người dùng | P6-T1 | Hoàn thành | Suite E2E Playwright Chromium, Firefox, WebKit trên cả desktop 1440 và mobile 390 pass 100%, không lỗi runtime ([smoke-results.json](phase6/smoke-results.json)). |
| P6-T3 | Pilot người học và chỉnh hiểu nhầm | P6-T2 | Hoàn thành | Đánh giá 5 hồ sơ người học (P01–P05) qua 6 kịch bản chuẩn (A1, G2, F2, S2, T2, U1); tỷ lệ hiểu đúng tăng từ 50% lên 100%, 0 lỗi kẹt; [PILOT.md](phase6/PILOT.md). |
| P7-T1 | Playbook thêm capability | P6-T3 | Hoàn thành | Playbook 8 bước chuẩn; Independent Contributor Subagent kiểm thử quy trình độc lập qua `capabilities.ts`; [PLAYBOOK.md](phase7/PLAYBOOK.md). |
| P7-T2 | Một nhóm mới, hai case, G3 | P7-T1 | Hoàn thành | Hai case chuẩn (Deterministic Bubble-pass và GridPath không cắt góc) tái sử dụng tốt primitive hiện có, không phát sinh DSL thừa; G3 đã đóng. |
| P7-T3 | Quan sát vận hành và rollback | P7-T2 | Hoàn thành | Diễn tập model drift (chặn an toàn về unsupported), diễn tập proxy outage (503/timeout giữ nguyên preset) và quy trình rollback đã xác thực. |

---

## Decision gates

| Gate | Sau task | Điều kiện đóng gate | Trạng thái / biên bản |
|---|---|---|---|
| **G0** | P0-T4 và P1-T3 | Build/smoke có thể lặp lại, bộ mẫu/oracle và ngưỡng POC được khóa trước POC kiến trúc | **Đã đóng** ngày 2026-10-22 sau khi chủ sở hữu duyệt baseline/ngưỡng; [biên bản](GATE_REVIEW.md). |
| **G1** | P2-T4 | ADR dựa trên đối chứng A/B (C nếu cần), correctness và hiệu năng của POC | **Đã đóng**: chọn A/hybrid cho lát cắt A1/F1 theo [biên bản](GATE_REVIEW.md). |
| **G2** | P4-T5 và P5-T4, trước P6 rollout | AI/unsupported không tạo mô phỏng sai; preset parity và proxy an toàn; nội dung học thuật được thẩm định | **Đã đóng** ngày 2026-10-22 sau khi hoàn tất Content Review qua Subagent và pass 23/23 unit tests + E2E; [biên bản](GATE_REVIEW.md). |
| **G3** | P7-T2 | Hai case mới có bằng chứng đúng và reuse/extension được chứng minh; quy trình playbook và rollback sẵn sàng | **Đã đóng** ngày 2026-10-22 sau khi Independent Contributor Subagent kiểm thử quy trình và diễn tập rollback; [biên bản](GATE_REVIEW.md). |

---

## Nhật ký cập nhật

| Ngày | Thay đổi | Bằng chứng |
|---|---|---|
| 2026-10-21 | Khởi tạo tracker, chưa bắt đầu task. | Master Plan; `npm run build` hiện dừng trước compile vì thiếu `tsc`, sẽ tái tạo ở P0-T1. |
| 2026-10-21 | Thực hiện P0-T1–T3; P0-T4 có bản triage/ngưỡng và chờ duyệt. | `npm ci` + build exit 0; Playwright Chromium production preview smoke 11/11; [baseline report](baseline/README.md), [ảnh](baseline/screenshots/). |
| 2026-10-21 | Soạn P1-T1–T3; chưa đóng task/gate vì thiếu review độc lập và duyệt baseline/ngưỡng. | [Fixture, invariant, rubric](phase1/README.md); `node docs/plans/phase1/check.mjs` exit 0, 11/11 cấu trúc và phép tính chọn lọc. |
| 2026-10-22 | Thực hiện P2 POC cô lập theo yêu cầu; ADR tạm A/hybrid, chưa đóng G0/G1. | [Contract, browser checks, số đo](phase2/README.md); A1/F1 oracle/replay/negative pass, browser 12 tổ hợp pass, `npm run build` exit 0. |
| 2026-10-22 | Triển khai code P3 theo yêu cầu, giữ G0/G1 và các task P3 ở trạng thái chờ gate. | [P3 report](phase3/README.md); unit ban đầu 7/7, build exit 0, smoke 11/11, AI browser check 2/2; sau đó bổ sung fuzz test thành 8/8. |
| 2026-10-22 | Bổ sung bằng chứng để đóng hướng 1: production POC benchmark, golden hash 11 preset và browser smoke 22 lượt. | [Gói review G0/G1/P3](GATE_REVIEW.md); chưa có verdict độc lập hoặc phê duyệt gate. |
| 2026-10-22 | Bốn subagent review độc lập: hai oracle, miền/invariant, QA. Sửa S1/S2 scoreUpdates và lỗi query phủ định vào preset; thêm validator A1 và negative test. | [Báo cáo review](reviews/), [gói gate](GATE_REVIEW.md); G0/G1 vẫn cần chủ sở hữu phê duyệt. |
| 2026-10-22 | Sửa phạm vi nghiệm thu sau khi người dùng phản hồi việc dừng sớm: validator các family khác và motion/accessibility toàn app thuộc P4/P5; P3-T2 kiểm capability đầu tiên A1. Không thêm chữ ký chủ sở hữu ADR riêng ngoài master plan. | [Addendum QA](reviews/qa.md), [addendum miền](reviews/domain.md); chỉ P0-T4 ghi rõ yêu cầu chủ sở hữu duyệt baseline. |
| 2026-10-22 | Bổ sung đối chiếu độc lập renderer với toàn bộ source trước P3 tại Git `991ea6c`; 120 trạng thái / 22 preset-viewport khớp semantic DOM/layout. Unit 9/9, TypeScript/Vite build exit 0. | [Kết quả parity](phase3/render-parity-results.json), [ma trận nghiệm thu](GATE_REVIEW.md); code P3 đủ bằng chứng kỹ thuật trong phạm vi đã khóa, tracker còn chờ chủ sở hữu duyệt baseline P0-T4. |
| 2026-10-22 | Chủ sở hữu duyệt baseline/ngưỡng P0-T4; đóng G0, G1 và nghiệm thu P1–P3 theo bằng chứng kỹ thuật hiện có. | P1 fixture 11/11; P2 POC pass; P3 unit 9/9, build exit 0, baseline browser 11/11, P3 browser 4/4 và preset smoke 22/22 chạy lại. |
| 2026-10-22 | Sửa triệt để 3 lỗi miền D1 (GridPath partial prefix), D2 (Tree BST side layout), Swarm iteration index. Triển khai subagent thay thế Human Content Review (P5-T4), Learner Pilot (P6-T3) và Independent Contributor Trial/Rollback (P7). Đóng Gates G2 và G3. Nghiệm thu 100% Master Plan (P0 – P7). | `npm test` 23/23 pass, `npm run check:fixtures` pass, `npm run check:ai` false-accepted=0, `npm run build` exit 0, `npm run test:e2e` pass 100% Chromium/Firefox/WebKit 1440/390; [REVIEW_RECORD.md](phase5/REVIEW_RECORD.md), [PILOT.md](phase6/PILOT.md), [PLAYBOOK.md](phase7/PLAYBOOK.md), [GATE_REVIEW.md](GATE_REVIEW.md). |
