# Independent P1 oracle review A

Derived on 2026-10-22 from `phase1/review-inputs.json` and the cited source rules, before opening `phase1/cases.json`. The traces below describe semantic events and state; incidental frame count, labels, colors, and ordering of equally valid actions are not inferred.

## Independent expected traces

| ID | Expected event and state trace | Reason and boundary |
| --- | --- | --- |
| A1 | Start `[3,1,2]`; compare indices 0–1 (`3>1`), swap to `[1,3,2]`; compare 1–2 (`3>2`), swap to `[1,2,3]`; end **one pass**, with index 2 settled. | Adjacent comparison and swap in `src/data/morePresets.ts:167-204`. This input happens to be fully sorted after one pass. |
| A2 | Start sorted `[1,3,5,7]`, target 4, bounds `[0,3]`; midpoint 1 has 3, so lower bound becomes 2; midpoint 2 has 5, so upper bound becomes 1; empty interval means **absent**. | Floor midpoint and ascending array. No found index or insertion mutation. |
| G1 | Start `(0,0)`, wall `(0,1)`, destination `(0,2)`; shortest valid route `(0,0)→(1,0)→(1,1)→(1,2)→(0,2)`, four moves, five cells. | At the start, right is blocked and down is the only valid move. Bottom row and final up move are forced by four-neighbor movement. |
| G2 | Start `(0,0)` with destination `(1,1)`; right `(0,1)` and down `(1,0)` are blocked; after checking reachable frontier, conclude **no path**. | The initial state itself should not be labeled a concluded failure; diagonal movement is disabled. |
| F1 | Requests `r1`, then `r2`: each enters `client→lb`; with healthy backends `a,b` and round-robin starting at `a`, route `r1` to `a`, `r2` to `b`; final assignment `{r1:a,r2:b}`. | One illustrative policy trace, with no failure or latency inference. A different declared starting offset could swap the backend assignments while preserving alternation. |
| F2 | Initially cache `{}`, database `{k:v}`; `client→api` requests `k`; `api→cache` lookup misses; `api→db` reads `v`; API fills cache `k:v` and returns `v` to client. Final cache `{k:v}` and database unchanged. | Cache-aside sequence reflected by `src/data/presets.ts:312-407`. A later request can hit cache, but is not required by this input. |
| S1 | Compare declared scores `p1:2`, `p2:5` under maximize; select `p2` as best, value 5. | Scores are supplied; positions, movement, and convergence cannot be derived. |
| S2 | Compare declared scores `p1:2` at x=90, `p2:5` at x=0 under minimize; select `p1` as best, value 2. | Fitness objective controls selection; x distance does not. No motion is implied. |
| T1 | Root `[3,1,2]`; split into `[3]` and `[1,2]`; conceptually split right into `[1]`,`[2]`; merge right to `[1,2]`; merge `[3]` with `[1,2]` to `[1,2,3]`. | Source merge-sort example in `src/data/morePresets.ts:26-140`; intermediate right split may be omitted visually. Multiset must be preserved and final order ascending. |
| T2 | Insert 4 as root; insert 2 to root's left; insert 3 by `3<4` then `3>2`, so it is the **right child of 2**. Final edges `4→2 (left)` and `2→3 (right)`; inorder traversal `2,3,4`. | Ordinary unbalanced BST insertion, no duplicate case. |
| U1 | Mark the arbitrary quantum-algorithm request **unsupported**; provide no fabricated simulation nodes, algorithm trace, or complexity claim. | `review-inputs.json` names no reviewed runner or invariant. The encoded query text is immaterial to unsupported status. |

## Fixture comparison

Compared after the independent trace above was written. Evidence below refers to `phase1/cases.json` by ID and field.

| ID | Verdict | Exact evidence |
| --- | --- | --- |
| A1 | PASS | Frames show `[3,1,2] → compare(0,1) → swap [1,3,2] → compare(1,2) → swap [1,2,3]`, with `sortedIndices:[2]`; limit explicitly says one pass. |
| A2 | PASS | `compare(mid=1,value=3)` sets `lo:2,hi:3`; `compare(mid=2,value=5)` sets `lo:2,hi:1`; then `not-found`, `result:-1`. |
| G1 | PASS | `found.path` is `[[0,0],[1,0],[1,1],[1,2],[0,2]]` with `cost:4`, avoiding wall `[0,1]`. |
| G2 | PASS | Initial frame has only `current:[0,0]`; later `exhausted` frame has `visited:[[0,0]]` and `result:"no-path"`. |
| F1 | PASS | `r1:client->lb`, `r1:lb->a`, `r2:client->lb`, `r2:lb->b` is a valid two-request alternating sequence with both backends healthy. |
| F2 | PASS | `api->cache` is followed by `cache-miss`, `api->db`, `db-response` with `value:"v"`, then `cache-fill` with `cache:{"k":"v"}`. The fixture stops at fill, which covers the stated topic. |
| S1 | DISCREPANCY | Input supplies only `p1.fitness:2` and `p2.fitness:5`, yielding `p2` as best. Second frame invents `fitness:{"p1":6,"p2":5}` and switches `bestId` to `p1` without any supplied score update or scoring rule. The limit says scores are supplied, so this state change is not independently derivable. |
| S2 | DISCREPANCY | Input supplies only `p1.fitness:2` and `p2.fitness:5`, yielding `p1` as best under minimize. Second frame invents `fitness:{"p1":2,"p2":1}` and switches `bestId` to `p2` without any supplied score update or scoring rule. Its x positions provide no basis for the change. |
| T1 | PASS | Root `[3,1,2]` splits to left `[3]` and right `[1,2]`; merge frame has root `[1,2,3]`. The declared limit permits omission of the internal split of `[1,2]`. |
| T2 | PASS | Final frame has `n2.parentId:"n4",side:"left"` and `n3.parentId:"n2",side:"right"`, exactly the BST insert result. |
| U1 | PASS | `status:"unsupported"`, `frames:[]`, and learner answer says no verified quantum simulation. No invented complexity claim appears. |

**Verdict:** 9 of 11 cases pass. The P1 oracle is **not fully correct as an independently derivable input-to-trace oracle** until S1 and S2 either remove their update frames or declare the updated scores as additional input/events. Those updates are arithmetically consistent with their respective objectives, but the score changes themselves have no stated cause. No other blocker found.

## Addendum: 2026-10-22 score-update revision

Independent derivation from the revised `review-inputs.json`, recorded before reopening `cases.json`:

| ID | Revised expected trace |
| --- | --- |
| S1 | Initial `p1=2`, `p2=5`; maximize selects `p2` with best fitness 5. Apply the declared update `{particleId:"p1",fitness:6}`; scores become `p1=6`, `p2=5`, so best changes to `p1` with fitness 6. |
| S2 | Initial `p1=2` at x=90 and `p2=5` at x=0; minimize selects `p1` with best fitness 2. Apply the declared update `{particleId:"p2",fitness:1}`; scores become `p1=2`, `p2=1`, so best changes to `p2` with fitness 1. The x values do not affect selection. |

Revised fixture comparison, performed after recording that derivation:

| ID | Revised verdict | Evidence |
| --- | --- | --- |
| S1 | PASS | `cases.json` now declares `input.scoreUpdates:[{"particleId":"p1","fitness":6}]`; frames show `observe` best `p2/5`, then `update` scores `{p1:6,p2:5}` and best `p1/6`. |
| S2 | PASS | `cases.json` now declares `input.scoreUpdates:[{"particleId":"p2","fitness":1}]`; frames show `observe` best `p1/2`, then `update` scores `{p1:2,p2:1}` and best `p2/1`. |

**Revised verdict:** The original S1/S2 blocker is resolved. Both score changes are now declared inputs, and both traces follow the stated maximize/minimize objective. The other nine IDs retain their earlier PASS verdicts; they were not re-reviewed in this addendum.
