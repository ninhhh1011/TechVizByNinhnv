# P0 — Baseline TechViz

Ngày: 2026-10-21 (Asia/Saigon). Phạm vi: kiểm kê, đo và khóa hành vi hiện có; không sửa logic sản phẩm. [Kế hoạch](../MASTER_PLAN.md) · [Tiến độ](../PROGRESS.md) · [Kết quả smoke dạng máy đọc](smoke-results.json).

## P0-T1 — Môi trường tái lập

| Hạng mục | Kết quả / bằng chứng |
|---|---|
| Runtime kiểm tra | Windows, Node `v24.15.0`, npm `11.12.1`. `package-lock.json` v3 được thêm vì checkout trước không có lockfile. |
| Lệnh từ checkout sạch | `npm ci`, `npx playwright install chromium`, `npm run build`; chạy `npm run dev -- --host 127.0.0.1`, rồi `npm run smoke:baseline` ở terminal khác. `TECHVIZ_URL` đổi URL khi cổng 3000 bận. Smoke dùng Playwright Chromium headless. |
| Trước khi khôi phục | `npm run build` exit 1 trước compile: `'tsc' is not recognized`; `node_modules/.bin/tsc` thiếu. |
| Sau khi có dependencies | `npm ci --cache D:\DevCache\npm-cache-techviz` exit 0 với lockfile cuối cùng (424 packages), sau đó `npm run build` exit 0: `tsc && vite build`, 3717 modules, Vite 6.4.4, 17.02 s; JS chính 706.30 kB (gzip 190.94 kB), Vite cảnh báo chunk >500 kB. Cache path chỉ là cách tránh cache máy bị lỗi; trên máy bình thường dùng `npm ci`. |
| Kiểm kê deployment từ source | `functions/api/groq.ts:19-123` dùng API kiểu Cloudflare Pages Function. `vercel.json:1-5` chỉ có SPA rewrite; không có bằng chứng deployment tương ứng trong repo. Phải smoke endpoint trên host thực ở phase sau; **chưa xác minh deploy**. |
| npm audit | 7 advisory trong toàn bộ cây (2 moderate, 5 high), liên quan nhánh build `tailwindcss` và dependencies gián tiếp; `npm audit --omit=dev` báo 0. Không chạy `npm audit fix` vì có đề xuất nâng Tailwind major và P0 không đổi stack. |

### Ranh giới phụ thuộc

`package.json` định nghĩa React 18, Vite 6, TypeScript 5, HeroUI 2, Framer Motion 11, Tailwind 3; không có test runner trước P0. P0 thêm **một** dev dependency `playwright` và script smoke để tái chạy trình duyệt; không thêm dependency production. Kết quả smoke dùng dữ liệu preset và mock `/api/groq`, không cần khóa Groq hay gọi mạng ngoài.

Một lần `npm ci` dùng cache mặc định của máy lỗi `UNKNOWN` khi đọc gói `@heroui/use-measure` trong `D:\DevCache\npm-cache`. Chạy lại với cache riêng thành công. Đây là sự cố cache môi trường, được ghi để người sau không suy thành lỗi source hoặc lockfile.

## P0-T2 — Bản đồ pipeline và danh mục

| Bước | Điểm vào / đầu ra | Bằng chứng source | Nguy cơ cần giữ trong backlog |
|---|---|---|---|
| Nhập chủ đề | `HeroHeader` đưa query hoặc preset vào App | `src/components/HeroHeader.tsx:54-57,116-123,132-158` | Quick chip chọn thẳng preset; Enter gọi nhánh generate, nhưng App vẫn dò preset. |
| Chọn nguồn | App dò preset gần đúng, nếu không có thì gọi AI | `src/App.tsx:141-208`; `src/data/presets.ts:686-699` | Dò gần đúng có thể chọn preset ngoài ý định khi tên/alias đụng nhau. |
| AI / API | Browser gửi prompt/model tới `/api/groq`; proxy dùng khóa server và fallback model, client còn nhánh direct với `VITE_GROQ_API_KEY` | `src/services/groq.ts:448-544`; `functions/api/groq.ts:19-123` | Cần xác minh deployment; nhánh khóa browser có thể lộ key nếu được cấu hình; proxy nhận nhiều tham số từ client. |
| Dữ liệu trung gian | `JSON.parse` → `sanitizeScenario` → `SimulationScenario` | `src/services/groq.ts:158-437,542-544`; `src/types/simulation.ts:94-163` | Type runtime không được bảo đảm; sanitizer tự thêm dữ liệu mang nghĩa thay vì chỉ kiểm/sửa cú pháp. |
| State | App giữ scenario, step index, autoplay, speed, zoom/pan; custom scenario chỉ trong phiên | `src/App.tsx:26-52,129-139,219-285` | Playback bước và motion của renderer chưa cùng clock. |
| Rendering | App route vào một trong năm component; Storyteller và Dock cùng đọc step | `src/App.tsx:288-290,550-589` | Cổng array chỉ xem `arrayData`, có thể rơi xuống flow renderer khi `visualData.array` tồn tại. |

**Preset được giữ làm regression set:** `flow-graph`: Kafka, Redis, RAG, Load Balancer, Token Bucket; `array-pointer`: QuickSort, Binary Search, BubbleSort; `grid-path`: A*/Dijkstra; `swarm-2d`: GA/PSO; `tree-graph`: MergeSort. Nguồn: `src/data/presets.ts:1-20,686-699` và trường `rendererType` trong `src/data/{arrayPresets,gridPresets,geneticAlgorithmPreset,morePresets,presets}.ts`. Đây là 11 preset; smoke P0 chọn một preset đại diện mỗi family, toàn bộ 11 thuộc regression ở P3/P6.

| Family | Dữ liệu/quan hệ vẽ | Điều cần xác minh ở phase sau (nhận định source, chưa coi là lỗi browser đã tái hiện) |
|---|---|---|
| Array | `arrayData` hoặc `visualData`, pointer và trạng thái compare/swap/sorted (`ArrayPointerRenderer.tsx:60-95`) | App gate không cùng logic fallback với renderer; âm thanh phát theo step (`:119-135`). |
| Grid | grid snapshot, walls, start/end, đường và chi phí; renderer chứa solver (`GridPathRenderer.tsx:43-44,68-113,115-272`) | `defaultGridConfig` của scenario không được App truyền; `stepIndex===4` chọn solver live; cost của snapshot lấy `path.length`. |
| Flow | node/lane/packet; SVG edge đo từ DOM (`FlowGraphRenderer.tsx:66-162,215-225`) | Endpoint thiếu bị bỏ qua; đo edge dưới zoom/pan cần so ảnh; packet/halo lặp độc lập pause (`:258-264,396-415`). |
| Swarm | particle, target/gBest, velocity/fitness (`Swarm2DRenderer.tsx:22-54`) | Khi thiếu dữ liệu best, renderer suy theo khoảng cách tới target; không đủ để kết luận tối ưu fitness. |
| Tree | node/parent/status và hierarchy (`TreeGraphRenderer.tsx:23-89`) | Layout theo level và thứ tự node, cần case cây bất đối xứng để kiểm crossing/overlap. |

**Animation/state:** `App.tsx:270-285` tăng step bằng interval theo speed. Renderer dùng Framer Motion, SVG `<animate>` hoặc Tailwind `animate-*` (`src/components/*Renderer.tsx`); chúng không cùng nhận `isPlaying`, nên pause chỉ dừng bước, không bảo đảm dừng mọi motion. `PlaybackDock.tsx:45-64` giả định `totalSteps > 0`. `StorytellerBanner.tsx:175-177` tạo pseudocode `execute(step)` nếu thiếu logic thật. Các điểm này đã được hai lượt audit source độc lập đối chiếu trong khi lập Master Plan; P0 browser smoke chỉ xác nhận luồng preset/controls cơ bản.

## P0-T3 — Browser smoke và đo cơ bản

Chạy `npm run smoke:baseline` trên Playwright Chromium headless, desktop 1440×900 và mobile 390×844. Script `smoke.mjs` lưu screenshot toàn trang tại `screenshots/` và dữ liệu từng case tại `smoke-results.json`. Mỗi family kiểm: hiện đúng stage, next/back/seek/reset, autoplay ở 2× rồi pause bước, zoom 115%, pan và reset view. Case AI mock `/api/groq` trả 503 và chặn đường gọi Groq trực tiếp; kiểm card lỗi, **không gọi API thật**. Ảnh/JSON chuẩn chỉ cập nhật khi 11/11 case pass; khi fail, artifact nằm trong thư mục tạm in ở terminal. `frameMs` ghi 60 khoảng `requestAnimationFrame` sau khi pause bước. Đây chỉ là chỉ số chẩn đoán môi trường, không đo chi phí render khi chuyển bước. P1-T3 cần xác lập workload chuyển bước và thước đo click đến frame đã cập nhật trước khi đặt ngưỡng hiệu năng POC.

Lần chạy cuối trên bản **production preview** bằng Playwright Chromium `http://127.0.0.1:4173/` sau `npm ci` + build: **11/11 pass**, không có uncaught page error trong mười case renderer. Có [11 ảnh toàn trang](screenshots/) gồm desktop/mobile của năm family và [case AI lỗi](screenshots/ai-error.png). Lần chạy đầu: 10/11 case pass; mobile grid pan fail vì script kéo lên chính thanh công cụ. Sau khi chọn vùng pan bằng `.cursor-grab`, case mobile grid pass khi chạy lại; đây là **lỗi test harness**, không quy lỗi ứng dụng.

| Viewport | Flow | Array | Grid | Swarm | Tree | rAF p95 / DOM / overflow ngang |
|---|---:|---:|---:|---:|---:|---|
| Desktop 1440×900 | Pass | Pass | Pass | Pass | Pass | p95 16.7–16.8 ms; 304–652 DOM nodes; 0 px document overflow. |
| Mobile 390×844 | Pass | Pass | Pass | Pass | Pass | p95 16.7–16.8 ms; 304–720 DOM nodes; 0 px document overflow. |

**Quan sát trực quan từ screenshot:** [flow mobile](screenshots/mobile-flow-graph.png) có tiêu đề stage bị toolbar chèn và packet/edge ra sát mép; [grid mobile](screenshots/mobile-grid-path.png) chỉ thấy một phần lưới rộng trong vùng cuộn ngang, không thấy toàn bộ không gian tìm đường cùng lúc. Đây là vấn đề đọc hiểu trên màn nhỏ, dù smoke controls pass và document không tràn ngang. [Grid desktop](screenshots/desktop-grid-path.png) hiển thị “Không có đường” ở bước khởi tạo; cần phân biệt “chưa tính” với “không tìm được” trong P1/P4. [QuickSort desktop](screenshots/desktop-array-pointer.png) và grid hiển thị `execute(step)` chung thay vì logic thực của bước (đã có bằng chứng source). Những điểm này được đưa vào backlog, không sửa ở P0.

## P0-T4 — Backlog ưu tiên và ngưỡng POC

Mức độ dựa trên hậu quả với người học hoặc vận hành. `Source` là giả thuyết có file/line, `Browser` là tái hiện giao diện; một mục có thể cần test thêm trước khi sửa. P0 không thay đổi production logic.

| ID | Ưu tiên | Vấn đề / bằng chứng | Loại | Task xử lý dự kiến |
|---|---|---|---|---|
| B01 | P0 | Semantic fallback tự tạo Big-O, array/grid/tree/swarm/packet và bước khi AI thiếu dữ liệu (`groq.ts:176-183,193-200,224-343,364-377`). Có thể tạo mô phỏng sai mà trông hợp lệ. | Source; cần negative cases | P1-T2, P3-T1/T2/T4 |
| B02 | P0 | Proxy nhận model/messages và thiếu giới hạn thể hiện trong source; đường browser key `VITE_GROQ_API_KEY`; deployment Cloudflare/Vercel chưa rõ (`functions/api/groq.ts:19-123`, `src/services/groq.ts:448-544`). | Source, chưa deploy test | P5-T2 |
| B03 | P1 | Route array phụ thuộc `arrayData` dù renderer đọc `visualData`; empty steps gây undefined/division (`App.tsx:219-220,288-290`, `PlaybackDock.tsx:45-64`). | Source | P3-T1/T4, P4-T2 |
| B04 | P1 | Grid dùng config mặc định, có solver nội bộ và điều kiện `stepIndex===4`; ảnh và state/cost có thể lệch (`GridPathRenderer.tsx:43-44,68-113,249-272`). | Source | P1-T2, P4-T2 |
| B05 | P1 | Swarm có thể gắn nhãn best theo distance thay fitness; preset GA và PSO dùng chung diễn giải (`Swarm2DRenderer.tsx:41-54`, `geneticAlgorithmPreset.ts:3-28`). | Source | P1-T1/T2, P4-T3 |
| B06 | P1 | Playback pause không thống nhất với animation SVG/CSS/Framer; `StorytellerBanner` hiển thị pseudocode chung. | Source; cần motion test | P4-T1/T4, P3-T4 |
| B07 | P2 | Layout tree theo thứ tự level; flow đo edge qua DOM, có giới hạn cột; cần case bất đối xứng/zoom để tái hiện (`TreeGraphRenderer.tsx:44-89`, `FlowGraphRenderer.tsx:66-162`). | Source | P2-T2, P4-T3 |
| B08 | P2 | Bundle chính 706.30 kB, cảnh báo chunk >500 kB; 7 advisory npm audit đều nhánh dev, production audit 0. | Build/audit | P4-T5 và bảo trì dependency trước release |
| B09 | P2 | README còn nhắc file `ApiKeyModal.tsx` đã không tồn tại; API/hosting chưa có runbook. | Source | P6-T1 |
| B10 | P1 | Trên mobile 390 px, toolbar lấn tiêu đề flow và lưới grid chỉ hiện một phần trong vùng cuộn; bước khởi tạo grid ghi “Không có đường” trước khi chạy. | Browser: screenshot mobile flow/grid và desktop grid | P1-T1/T3, P4-T2/T3/T4 |

**Chức năng cần bảo toàn ở mọi task sau:** cả 11 preset mở được; text overview/step đúng với dữ liệu đã duyệt; next/back/seek/reset/play/speed; keyboard ArrowLeft/ArrowRight khi không nhập liệu; zoom/pan/fullscreen; tương tác wall/grid; AI lỗi có thông báo và preset fallback; không mất các trạng thái packet, pointer, path, particle, tree. Những điều chưa có browser test P0 phải được thêm vào golden/E2E sau này.

**Ngưỡng đề xuất để khóa trước P2 (P1-T3 có quyền chỉnh từ dữ liệu thực):** 0 false-accepted trên bộ negative khóa; mọi trace POC khớp oracle/invariant; 10/10 case family×viewport và AI-error case không regression về controls; không có lỗi JS trong smoke; ngưỡng hiệu năng theo workload chuyển bước do P1-T3 đo và phê duyệt; số DOM node, overflow ngang và rAF khi idle chỉ là số chẩn đoán. Đây là ngưỡng POC, không phải SLA sản phẩm. Chỉ so benchmark khi input, viewport, browser và trạng thái animation giống nhau. Với nội dung định tính, reviewer phải đánh dấu “minh họa” và không tuyên bố đã xác minh thuật toán.

**Decision:** P0 khóa baseline và backlog, chưa qua G0. G0 chỉ được xét sau P1-T3 khi đã có oracle/rubric và review của chủ sở hữu. Không mở phase kiến trúc chỉ vì build và smoke pass.
