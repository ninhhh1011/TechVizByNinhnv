# AI domain review — P1–P5

Date: 2026-10-22. This is an independent AI source and executable review. It is **not a human content review, a learner pilot, or evidence of five learner responses**. No deployment, remote API call, secret use, rebuild, or modification of `dist` was performed.

## Verdict

The live `Bubble pass [numbers]` capability supports its narrow verified label: one left-to-right pass over 2–20 finite numbers, adjacent comparison, swap only for strict greater-than, and only the last index marked settled. It explicitly excludes a complete-sort claim. Representative sorted, repeated, negative, and descending inputs agree with independently calculated states.

P1's 11 fixture oracles remain sound within their stated limits; the old S1/S2 provenance discrepancy is resolved by explicit input `scoreUpdates`. Passing fixture arithmetic does not prove the renderer communicates every fixture correctly. Two rendering gaps below prevent accepting full pilot-topic parity. Keep G2 open until they are corrected and checked; AI review does not close the plan's human review or actual learner pilot requirements.

## Findings

### D1 — High: grid playback reports success for a partial path and cannot express exhausted no-path

Location: `src/components/GridPathRenderer.tsx:117` and `:419`; grid contract in `src/types/simulation.ts`.

The snapshot adapter defines `found` as `path.length > 0`, without testing whether the path reaches the destination. The locked G1 `visit` frame has path `[[0,0],[1,0]]` and destination `[0,2]`; rendering it produces **“Đã chạm đích thành công”** even though the current cell is `[1,0]`. Separately, locked G2's terminal `exhausted` frame has `result:"no-path"`, but that outcome is not represented/read by the live grid contract. It renders **“Bước này chưa kết luận tìm được đường hay không.”** after the oracle has concluded no path.

Reproduction actually run: SSR-load `GridPathRenderer.tsx` with Vite, map fixture input `walls` to `config.initialWalls`, pass each named frame into `step.gridData` with its start/end, then `renderToStaticMarkup`. Assert that the G1 visit HTML contains the success sentence and the G2 exhausted HTML contains the pending sentence. Both assertions passed, confirming the bugs. This does not depend on browser animation timing.

Required correction: preserve explicit searching/found/exhausted outcome at the frame boundary; a nonempty partial path alone cannot establish success. Check both initial and exhausted G2 frames and intermediate versus terminal G1 frames. Existing solver unit tests do not cover these renderer outcome messages.

### D2 — Medium: T2's left/right BST relation is lost in layout

Location: `src/utils/renderState.ts:19–21`; `TreeNodeItem` in `src/types/simulation.ts`; `TreeGraphRenderer.tsx`.

For insert `[4,2,3]`, the independently derived tree is `4 → left 2 → right 3`. The fixture correctly records `side:"left"` for n2 and `side:"right"` for n3. The live node type has no side field, and `layoutTree` sorts siblings by ID and centers every single child directly under its parent. Running the final T2 nodes through the helper yielded `n4.x=50,n2.x=50,n3.x=50`, despite the declared sides. Parent links and depth survive; the ordered BST encoding does not. Renaming sibling IDs can likewise change their left/right order without changing tree semantics.

Required correction: preserve a declared order/side for ordered-tree cases, or explicitly restrict this renderer to unordered hierarchy and avoid claiming T2 encoding parity. The current test proves parent grouping and input-order stability, which does not establish BST side correctness.

### D3 — Medium: legacy educational claims and snapshot algorithm labels remain unverified

`src/data/geneticAlgorithmPreset.ts:7,25,141` still describes convergence/global optimum and ends with `return gBest; // Optimal global solution found`, without an objective function or proof. Its title also combines PSO and GA while its equations describe PSO. These are preserved legacy-content problems; an illustrative badge prevents a verified-status overclaim but does not make the underlying sentences correct. Keep human knowledge acceptance open and show a specific limitation if preserving preset bytes.

`GridPathRenderer` labels the algorithm using active switch IDs even in curated playback. In preset step 4, active highlights contain only trace and weights, so the header labels Dijkstra although the snapshot declares Manhattan heuristic. A curated frame should be identified as such; only the interactive solver result warrants the current-switch algorithm label. This review does not certify all preexisting prose or pseudocode as academically correct.

## Independently calculated checks

All arrays below list initial, compare, and post-swap snapshots in execution order. The final frame alone marks index 2 as settled.

| Input | Expected snapshots | Result |
| --- | --- | --- |
| A1 `[3,1,2]` | `[3,1,2]`; compare unchanged; swap `[1,3,2]`; compare unchanged; swap `[1,2,3]` | Existing capability test passed |
| Sorted `[1,2,3]` | `[1,2,3]`; compare unchanged; compare unchanged; zero swaps | Independent assert passed |
| Repeated `[2,2,1]` | `[2,2,1]`; compare unchanged (equal values); compare unchanged; swap `[2,1,2]` | Independent assert passed |
| Negative `[-1,-3,-2]` | `[-1,-3,-2]`; compare unchanged; swap `[-3,-1,-2]`; compare unchanged; swap `[-3,-2,-1]` | Independent assert passed |
| Descending `[3,2,1]` | `[3,2,1]`; compare unchanged; swap `[2,3,1]`; compare unchanged; swap `[2,1,3]` | Independent assert passed; demonstrates why only the final position is settled |

For G1, the only four-neighbor route around wall `[0,1]` is `[0,0]→[1,0]→[1,1]→[1,2]→[0,2]`, four moves. G2 has only the start reachable because both legal neighbors are blocked. With the new solver's declared no-corner-cut rule, enabling diagonals still cannot escape G2; an additional executed check returned `found:false`. The old fixture limit “diagonal movement would change the result” requires that policy qualification: it is true only if corner cutting is allowed.

The solver uses unit orthogonal cost, sqrt(2) diagonal cost, Manhattan for four-neighbor A*, and octile distance for eight-neighbor A*. These heuristics are consistent for their stated edge costs, including the restricted no-corner graph; closed-node processing therefore supports shortest cost for this model. This is source reasoning plus the executed representative cases, not exhaustive verification of all 2,500-cell grids. The existing preset final path has 25 moves, equal to the executed four-neighbor solver cost of 25; the executed diagonal cost was approximately 20.3137085. Its educational min-heap complexity statement is conditional on that data structure; the actual live helper scans an array and must not be described as a min-heap implementation.

F2 independently yields empty cache → miss → DB read of v → fill `{k:v}`; the fixture's omission of a final client-response frame does not invalidate the scoped miss/fill claim. It remains illustrative, with no verified deployment, consistency, latency, or universal Redis claim. Flow endpoint and duplicate-ID guards improve structural safety; they do not establish cache protocol semantics.

S2 independently selects p1 for initial scores 2 versus 5 under minimize, then p2 after the explicitly supplied update to 1. Both direct helper assertions passed; geometric position was irrelevant. Scores and velocity values remain supplied illustrative data, with no objective-function evaluation, convergence, or global-optimum proof. T2's fixture parent relationships are correct, subject to the layout defect above. U1 correctly has no oracle trace; unknown AI proposals never gain simulation status merely by passing structural parsing.

## Provenance and prior-phase acceptance

- `scenarioContract.parseCandidate` ends in unsupported for structurally valid unreviewed AI. Its shape, reference, and bounds checks are useful rejection gates, not an endorsement of arbitrary semantic claims. `adaptPreset` is deliberately a trusted legacy pass-through, not a semantic validator.
- `StorytellerBanner` defaults legacy presets to **“Minh họa biên soạn — chưa xác minh toàn bộ”**, shows source/limits, and no longer substitutes generic executable pseudocode. That scope is appropriate. The new verified label is confined to the local Bubble reference runner and cannot be generalized to all presets or AI responses.
- `oracle-a.md` and `oracle-b.md` independently agree on the original arrays, paths, cache flow, BST parent relationships, and unsupported topic. Review B's addendum correctly resolves its original S1/S2 invented-score findings; the revised checker now verifies input-declared updates.
- P2's executed POC remains evidence for A1 and F1 only. P3's fixture and structural acceptance does not establish all pilot families' runtime display parity. The live catalog contains legacy presets and the Bubble command; the G2/S2/T2 fixture records are not automatically a learner-facing scenario route. A pilot must state the exact executable representation it uses.
- The owner reports the old exposed key revoked/rotated. This review did not verify provider state and did not fetch or use any secret. The old staging bundle is not evidence of the current local implementation.

## Commands actually run

1. `node --test src/services/capabilities.test.mjs src/services/scenarioContract.test.mjs src/utils/pathfinding.test.mjs src/utils/renderState.test.mjs` — exit 0; 15 passed, 0 failed.
2. `npm run check:fixtures` — exit 0; P1 11-case fixture arithmetic/structure and P2 A1/F1 oracle/replay/negative checks passed.
3. One stdin Node/Vite SSR self-check — exit 0; independent Bubble traces and final settled marks, S2 best selection, T2 x-coordinate reproduction, G2 diagonal no-corner result, and preset path/solver costs described above.
4. One stdin React SSR reproduction — exit 0; independently confirmed D1's partial-path false success and exhausted-path pending message.

No browser E2E, visual screenshot inspection, deployed endpoint check, source-wide academic claim certification, human screen-reader session, or learner interview was performed by this reviewer. The parent agent's concurrently running browser suite is separate evidence.
