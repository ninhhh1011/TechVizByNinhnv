# Independent P1 oracle review B

## Derived traces before reading `cases.json`

Derived from `review-inputs.json` and the stated rules. Preset source was consulted for the intended visualization semantics, but preset frame values were not treated as an oracle for these new inputs.

| ID | Expected event and state trace | Reasoning and boundary |
| --- | --- | --- |
| A1 | Start `[3,1,2]`. Compare indices 0,1: `3>1`, swap to `[1,3,2]`. Compare indices 1,2: `3>2`, swap to `[1,2,3]`. End **one pass**, two comparisons and two swaps; index 2 is settled. | Adjacent compare/swap rule for one left-to-right bubble pass. This input happens to become fully sorted; a single pass is not a general full-sort claim. |
| A2 | Start sorted `[1,3,5,7]`, target 4, inclusive bounds `left=0,right=3`. `mid=floor((0+3)/2)=1`, value 3, so `left=2`. `mid=floor((2+3)/2)=2`, value 5, so `right=1`. Now `left>right`: **not found**; no matching index. | The midpoint rule discards values at or below 3, then at or above 5. Requires ascending input. |
| G1 | Start `(0,0)`, goal `(0,2)`, wall `(0,1)`. Valid shortest path `(0,0) → (1,0) → (1,1) → (1,2) → (0,2)`, four moves, five cells. | Direct upper row is blocked. In four-neighbor unit-cost movement, each move changes one coordinate by one; detour below is the only simple route. Search frontier/visit order may vary, but path length and validity may not. |
| G2 | Start `(0,0)` with goal `(1,1)` and walls `(0,1),(1,0)`. Initial frame has an unsearched start. On expansion, both legal four-neighbors of start are walls, frontier empties, and only then result is **no path**. | Diagonal jump would change the result and is excluded. No-path is a conclusion after reachability check, not an initial state. |
| F1 | Both `a` and `b` healthy. `r1`: `client → lb → a`; advance round-robin cursor. `r2`: `client → lb → b`; cursor returns to `a` for a possible next request. Each request gets one selected backend; final assignment `r1→a,r2→b`. | This is one valid illustrative round-robin trace with initial cursor at `a`, matching source's A then B example. Input says nothing about latency, failover, measured fairness, or responses. |
| F2 | Initial `cache={}`, `database={k:v}`. Read `k`: `client → api`, `api → cache` lookup returns miss/absent. `api → db` reads `v`. `api → cache` fills `k:v`. `api → client` may return `v`. Final `cache={k:v}`, database unchanged. A later read could hit cache, but is not required by this one-request input. | Cache-aside miss and fill. No timing, consistency, or live Redis property follows from the fixture. |
| S1 | Evaluate declared fitnesses `p1=2,p2=5` under **maximize**. Choose `p2` as best, score 5. No position, movement, convergence, or global optimum follows. | Supplied score comparison, `5>2`. |
| S2 | Evaluate declared fitnesses `p1=2` at `x=90`, `p2=5` at `x=0` under **minimize**. Choose `p1` as best, score 2; positions stay as given and are irrelevant to selection. | Supplied score comparison, `2<5`; choosing by greatest fitness or nearest position would be wrong. |
| T1 | Root `[3,1,2]`. Split at midpoint into `[3]` and `[1,2]`; split right into `[1]`,`[2]`. Merge `[1]` and `[2]` → `[1,2]`; merge `[3]` with `[1,2]` → `[1,2,3]`. Root becomes sorted. | Standard stable merge-sort split and merge. The `[1,2]` intermediate split may be omitted visually, but the parent-child and final value relationships remain correct. |
| T2 | Insert 4 as root. Insert 2: `2<4`, left child of 4. Insert 3: `3<4` then `3>2`, right child of 2. Final edges `4→left 2`, `2→right 3`; 3 has depth 2. | Plain, unbalanced BST insertion with distinct keys. A renderer's level-based horizontal coordinates are presentation, not BST ordering. |
| U1 | The arbitrary quantum-algorithm query has **unsupported** status. No generated nodes, state transitions, algorithm trace, invariant, or Big-O. A static explanation can be prepared only after source review. | No reviewed runner or oracle is available for the requested general category. |

## Comparison with `cases.json`

| ID | Verdict | Evidence from `cases.json` |
| --- | --- | --- |
| A1 | **PASS** | Frames compare `(0,1)`, swap to `[1,3,2]`, compare `(1,2)`, and swap to `[1,2,3]` with `sortedIndices:[2]`. Exactly two comparisons and two swaps in one pass. |
| A2 | **PASS** | Frames start `lo=0,hi=3`, compare midpoint 1/value 3 and set `lo=2`, compare midpoint 2/value 5 and set `hi=1`, then `not-found` with `result:-1`. |
| G1 | **PASS** | Found path is `[[0,0],[1,0],[1,1],[1,2],[0,2]]` and `cost:4`, all legal four-neighbor moves avoiding `[0,1]`. |
| G2 | **PASS** | Initial frame has no no-path result. `exhausted` frame lists only visited `[[0,0]]` and `result:"no-path"`, correct after both neighbors are blocked. |
| F1 | **PASS** | `r1` goes `client→lb→a`; `r2` goes `client→lb→b`. This is the source's A-then-B illustrative policy trace and includes no performance claim. |
| F2 | **PASS** | Events show request, empty-cache lookup and miss, DB fetch and `db-response` value `v`, then `cache-fill` with `{k:v}`. The final response to client is omitted but is not needed to establish the stated miss-then-fill outcome. |
| S1 | **DISCREPANCY** | The `observe` frame correctly selects `p2` from supplied input fitnesses 2 and 5. The following `update` frame silently changes `p1` fitness from 2 to 6 and selects it. No input update, score function, or transition rule explains 6. The selected best is arithmetically correct *given that invented frame state*, but the event/state trace is not independently derivable from the input. |
| S2 | **DISCREPANCY** | The `observe` frame correctly selects `p1` for minimize (2 versus 5), independent of `x`. The `update` frame silently changes `p2` fitness from 5 to 1 and selects it. Neither the input nor any declared motion/scoring rule supplies 1; the limit even says no motion model is asserted. As in S1, best selection within the new frame is correct but the transition lacks an oracle. |
| T1 | **PASS** | Split children are left `[3]` and right `[1,2]`; final root is `[1,2,3]`. The omission of right child's internal split is explicitly scoped and does not change the independently computed merge. |
| T2 | **PASS** | Final nodes put `n2` left of `n4` and `n3` right of `n2`, consistent with inserting 4, 2, 3 into an unbalanced BST. The cited renderer describes tree display and links, not the BST rule; the stated hand derivation supplies the rule. |
| U1 | **PASS** | `status:"unsupported"` and `frames:[]` introduce no invented quantum trace or complexity. The input query matches the review input. |

**Verdict:** P1's array, grid, flow, tree, and unsupported oracles are correct for these 9 cases. P1 oracle correctness is **not fully established** because S1 and S2 add ungrounded fitness-update events. To make those cases reviewable, add explicit score updates to their inputs or remove the update frames and their dependent learner questions. This is an oracle-provenance blocker for those two cases, not a claim that their within-frame max/min comparisons are wrong.

## Addendum — 2026-10-22, revised swarm inputs

### Independent derivation before rereading `cases.json`

- **S1:** Initial fitness `p1=2`, `p2=5`; maximize selects `p2` at 5. Apply the single declared `scoreUpdates` item, `p1→6`, leaving `p2=5`; maximize now selects `p1` at 6. These supplied values establish only an illustrative score and best-label update, not motion or convergence.
- **S2:** Initial fitness `p1=2` at `x=90`, `p2=5` at `x=0`; minimize selects `p1` at 2. Apply the single declared `scoreUpdates` item, `p2→1`, leaving `p1=2`; minimize now selects `p2` at 1. Screen position does not determine the best label and need not change.

### Revised fixture comparison

| ID | Revised verdict | Evidence |
| --- | --- | --- |
| S1 | **PASS** | Revised fixture input includes `scoreUpdates:[{particleId:"p1",fitness:6}]`. Its `observe` frame selects `p2` from 2 versus 5; its `update` frame has `p1=6,p2=5` and selects `p1` at 6, exactly as independently derived. |
| S2 | **PASS** | Revised fixture input includes `scoreUpdates:[{particleId:"p2",fitness:1}]`. Its `observe` frame selects `p1` from 2 versus 5; its `update` frame has `p1=2,p2=1` and selects `p2` at 1, exactly as independently derived under minimize. |

**Revised verdict:** The original S1/S2 oracle-provenance blocker is resolved. Both update scores are now explicit inputs, and both frame traces follow from them. Combined with the unchanged nine case verdicts above, all 11 P1 cases pass this independent oracle check. The original discrepancy entries remain above as the historical finding for the earlier fixture version.
