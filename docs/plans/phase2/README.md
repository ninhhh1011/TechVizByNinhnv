# P2 — Architecture decision POC

Ngày thực hiện: 2026-10-22 (Asia/Saigon). Đây là POC cô lập trong `docs/plans/phase2/`; đường production và 11 preset không thay đổi. Lát cắt được khóa trước code: A1 (bubble sort, `verified-simulation`), F1 (round-robin, `illustrative`) và U1 (`unsupported`) trong [P1 cases](../phase1/cases.json). A1/F1 dùng cùng input ở cả ba chế độ: renderer cũ, snapshot và event + reducer.

## P2-T1 — Hai contract ứng viên

**Snapshot:** một scenario có `scenarioVersion`, `topic`, `status`, `source`, `entities`, `relations`, `frames`, `annotations`, `encoding`. Mỗi frame giữ state **sau** event và event label; seek là truy cập `frames[index]`. Dữ liệu lặp theo frame nhưng dễ inspect. `annotations` neo bằng `frameIndex` và `entityId`. POC chỉ kiểm snapshot A1/F1 bằng oracle sinh độc lập từ input/rule; parser snapshot tổng quát thuộc P3.

**Event + reducer:** cùng metadata, `initialState`, `events` có thứ tự, `annotations` neo bằng `eventIndex` và `entityId`. Reducer tạo frame bất biến; seek phát lại từ đầu trên lát cắt nhỏ này. Với trace dài cần checkpoint theo số đo, chưa thêm vào POC. POC hiện thực `poc-core.mjs`; array chỉ chấp nhận compare/swap kề nhau, flow chỉ chấp nhận send trên edge có thật từ vị trí hiện tại của request. `source` là provenance; nhãn `illustrative` không được nâng lên verified bởi validator.

Ví dụ event contract rút gọn (A1):

```json
{
  "scenarioVersion": 1,
  "topic": "Bubble sort, one pass",
  "status": "verified-simulation",
  "source": "P1 A1 rule/oracle",
  "entities": [{ "id": "cell-0", "kind": "cell" }, { "id": "cell-1", "kind": "cell" }],
  "relations": [],
  "initialState": { "array": [3, 1] },
  "events": [{ "type": "compare", "indices": [0, 1] }, { "type": "swap", "indices": [0, 1] }],
  "annotations": [{ "eventIndex": 0, "entityId": "cell-0", "text": "Compare adjacent values" }],
  "encoding": "array"
}
```

Ví dụ snapshot tương ứng: `frames: [{event:"initial",array:[3,1]}, {event:"compare(0,1)",array:[3,1]}, {event:"swap(0,1)",array:[1,3]}]`; annotation dùng `frameIndex:1`. Negative: `swap(0,7)` bị reject vì vượt bounds; flow `lb→missing` bị reject vì endpoint không tồn tại; U1 có `events:[]`, `initialState:null`, `encoding:null` và không dựng stage.

| Family P1 | Entity/relations | Event/state có thể biểu diễn | Chưa chứng minh ở P2 |
|---|---|---|---|
| Array A1/A2 | cell ID, pointer neo vào index | compare/swap hoặc midpoint/bounds; array snapshot | A2 reducer và tính đúng mọi thuật toán |
| Grid G1/G2 | cell ID, adjacency theo policy | visit/found/exhausted; path và cost | layout lớn, solver và optimality |
| Flow F1/F2 | node, directed edge, request ID | send/receive/cache state; vị trí request | F2 consistency và network timing |
| Swarm S1/S2 | particle ID, objective | score update, best theo objective | vị trí, GA/PSO và convergence |
| Tree T1/T2 | node ID, parent edge | split/merge/insert; hierarchy snapshot | layout bất đối xứng và BST generality |

Mapping trên giấy không là chứng nhận validator cho 5 family. ID logic tách khỏi x/y; layout SVG tính tọa độ từ encoding, không lấy tọa độ AI. Adapter dự kiến ở P3 đọc `SimulationScenario` cũ, gắn provenance/status theo nguồn đã duyệt, chuyển `steps` thành snapshot; preset không đủ chứng cứ giữ nhãn minh họa hoặc unsupported, không tự sinh event. Migration thay từng đường dữ liệu sau golden regression 11 preset, giữ renderer cũ trước khi thay family.

## P2-T2/T3 — Probe và phép kiểm

`node docs/plans/phase2/check.mjs` đối chiếu từng frame A1/F1 với oracle P1, replay lặp lại, seek, null/malformed, bounds, endpoint, thứ tự bubble-sort/round-robin, snapshot sai state và annotation. U1 trả không frame. `screenAiProposal` đưa cả đề xuất AI malformed, unknown hoặc tự xưng verified về `unsupported` không frame; POC không có capability AI nào được phê duyệt. `poc.html` chạy với `npm run dev` tại `/docs/plans/phase2/poc.html`; `node docs/plans/phase2/browser-check.mjs` kiểm 3 chế độ × 2 case × desktop/mobile: seek, play/pause timer, tín hiệu compare/swap/send trên SVG, nhãn không cắt/chồng, document không overflow và không page error. [Ảnh](screenshots/) lưu mỗi legacy/reducer ở hai viewport. React/SVG đủ cho lát cắt; không có lý do đo được để thêm library hoặc Canvas.

Đo bằng `node docs/plans/phase2/measure.mjs`: Chromium headless trên máy này, **Vite dev**, 1440×900 và 390×844, 5 warm-up + 30 lần seek luân phiên đầu/cuối, `performance.now()` từ dispatch đến text frame đổi và rAF kế tiếp; [JSON gốc](measure-results.json). Đây là thời gian phản hồi UI, **không** đo lúc animation legacy kết thúc; không dùng để chứng nhận ngưỡng hiệu năng G1. P95 (ms) và DOM nodes:

| Case / viewport | Legacy | Snapshot | Event + reducer |
|---|---:|---:|---:|
| A1 / desktop | 15.8 / 99 | 15.3 / 43 | 16.4 / 43 |
| F1 / desktop | 16.2 / 137 | 15.3 / 46 | 16.5 / 46 |
| A1 / mobile | 15.9 / 99 | 16.6 / 43 | 15.5 / 43 |
| F1 / mobile | 15.8 / 137 | 15.2 / 46 | 16.1 / 46 |

Các chênh lệch nhỏ quanh một rAF, chưa có ý nghĩa thắng hiệu năng. Legacy flow trên mobile có vùng nội dung dài và header chật; reducer SVG đọc được bốn node và route trong viewport. Đây là quan sát của POC wrapper, không suy rằng toàn bộ ứng dụng cũ chậm hoặc kém accessibility. `idleRafFps` là 60 ở cả 12 phép đo, chỉ chẩn đoán vòng rAF, không đo FPS animation semantic. React/SVG text có accessible name; keyboard dùng button/range native và pause ngừng step timer của POC. Renderer legacy vẫn có motion riêng khi pause; kiểm motion đồng bộ, screen reader và reduced-motion audit đầy đủ thuộc P4. Core và UI mỗi file khoảng 100 dòng, dùng cùng stage cho hai contract. Event reducer thêm nhánh miền và validation; trên hai case không chứng minh giảm code lặp so với snapshot.

## P2-T4 — ADR tạm thời / G1

**Quyết định tạm: A/hybrid.** Giữ family renderer và dùng snapshot đã xác thực làm contract migration đầu tiên ở P3. Với capability có runner xác định, có thể giữ event + reducer làm nguồn sinh snapshot và đối chiếu oracle; không áp đặt event DSL chung cho tất cả family. B đạt replay/oracle và hiệu năng POC nhưng chưa chứng minh giảm lặp code; một SVG nhỏ tái dùng được cho hai topology nhưng không đủ căn cứ thay năm renderer. C không cần thử vì A đáp ứng lát cắt và chưa có vấn đề backend đo được.

**Điều kiện đảo quyết định:** sau khi P1 oracle và ngưỡng G0 được duyệt, nếu hai family tiếp theo dùng cùng primitive/reducer với ít hoặc bằng code lặp, parity đủ 11 preset, production benchmark cùng workload đạt p95 ≤1.25× baseline và review accessibility/correctness pass, mở lại B. Nếu snapshot gây trace quá lớn hoặc seek chậm trên workload thật, đo lại event + checkpoint. Không ngoại suy kết luận POC sang grid, swarm, tree, F2 hoặc AI rộng.

**Gate:** artifact P2 đã có, nhưng G0 chưa đóng: P0-T4 chờ chủ sở hữu duyệt, P1-T1/T2 chờ reviewer, P1-T3 chưa chốt ngưỡng và pilot. Vì vậy G1 là **ADR đề xuất, chưa được phê duyệt**; kết quả Vite dev không thay production benchmark. Không bắt đầu P3 theo kết luận tạm này cho đến khi các gate được xử lý.

**Bổ sung 2026-10-22:** chạy `node docs/plans/phase2/measure-production.mjs` để build riêng POC bằng Vite production, chạy browser check 12 tổ hợp và đo cùng A1/F1, hai viewport, ba chế độ trên một server preview. [Số liệu gốc](measure-production-results.json): p95 snapshot/legacy lần lượt A1 desktop 0.994×, A1 mobile 0.982×, F1 desktop 1.000×, F1 mobile 0.944×; max seek-to-next-rAF trong 12 phép đo là 17.1 ms. Đây là cùng wrapper POC, không là benchmark toàn ứng dụng hoặc chi phí animation hoàn tất. G1 vẫn cần review correctness/accessibility và G0 được đóng trước khi phê duyệt ADR.

**Cập nhật verdict sau subagent review:** [Hai oracle reviewer](../phase1/README.md#p1-t1--bộ-mẫu-cố-định) đã duyệt 11/11; [review miền](../reviews/domain.md) chấp nhận phạm vi hợp đồng và [QA](../reviews/qa.md) ủng hộ lựa chọn A/hybrid trên lát cắt khóa A1/F1. Keyboard/reduced-motion POC có bằng chứng; manual screen reader chưa chạy và không được tuyên bố pass. Motion/accessibility toàn app tiếp tục ở P4. Không còn yêu cầu review P1/QA chưa phân công như đoạn trạng thái ban đầu; G1 hiện chờ điều kiện G0: chủ sở hữu duyệt baseline P0-T4 trong [biên bản](../GATE_REVIEW.md). Không thêm bước chữ ký ADR riêng ngoài master plan.
