# Independent QA review — P2/P3 (2026-10-22)

Scope: P2 A1/F1/U1 POC, G1 evidence, P3 AI boundary, adapter, and 11 preset regression. Reviewed current source, tests, production POC browser artifacts, and the 390 px F1 reducer screenshot. No manual screen-reader run.

## Findings

### Critical

1. **Unknown queries can enter a curated simulation through substring matching.** `src/App.tsx:178-201` selects a preset when the whole query contains a preset title or tag, then returns before `generateScenarioWithGroq` and `parseCandidate`. For example, `Do not simulate Apache Kafka; explain why it is unsupported` satisfies `lower.includes(titleLower)` and opens the Kafka playback. This bypasses P3's unsupported boundary and violates the P3-T4 unknown-topic criterion (`docs/plans/MASTER_PLAN.md:168`). Reproduce by submitting that query; the predicate itself was reproduced with Node and returned `matched: true`. Require an explicit, unambiguous preset selection or a narrow canonical query match before showing a preset as the answer to free text. Add a browser negative case.

### Important

2. **The 11-preset golden check proves source identity, not rendered step parity.** `src/services/scenarioContract.test.mjs:68-76` hashes each current source object and checks that `adaptPreset` returns the same object and `steps`. `docs/plans/phase3/preset-smoke.mjs:19-28` checks only first/last step text, a step count, reset, and page errors. It never compares rendered packet/state, intermediate steps, or per-step screenshots against a pre-adapter baseline. `adaptPreset` itself accepts every supplied object without validation (`src/services/scenarioContract.ts:80-82`). Thus P3-T3's full golden-state/packet parity acceptance (`docs/plans/MASTER_PLAN.md:167`) remains unproven even though all current tests pass. Capture representative frame state and packet outputs per family before declaring parity; keep the adapter in a provisional status.

3. **G1's accessibility and motion comparison remains incomplete.** POC browser checks verify native control access by Playwright role, frame text after pause, label geometry, and page errors (`docs/plans/phase2/browser-check.mjs:15-46`). They do not inspect the accessibility tree, test keyboard-only traversal, screen-reader announcements, or reduced-motion behavior. The legacy comparison mounts a `FlowGraphRenderer` whose packet motion repeats forever (`src/components/FlowGraphRenderer.tsx:395-415`), while the POC pause only stops its own 500 ms step interval (`docs/plans/phase2/poc.jsx:67-71`). The POC README correctly limits those claims (`docs/plans/phase2/README.md:53`). Do not treat 12/12 browser combinations as a complete G1 accessibility/pause verdict. The 390 px F1 reducer screenshot is legible, but one screenshot cannot establish keyboard or spoken semantics.

### Minor

4. **The performance result measures a narrow frame response.** `docs/plans/phase2/measure.mjs:15-42` alternates first/last slider values, waits for the next rAF after text changes, and reports idle rAF FPS; it does not measure completion of legacy packet animation. Production POC measurements are useful for the tested wrapper, but not whole-app or semantic-animation performance. This limit is disclosed in `docs/plans/phase2/README.md:63` and should remain attached to any G1 decision.

## Checks run

| Command / evidence | Result |
|---|---|
| `node docs/plans/phase2/check.mjs` | Exit 0; A1/F1 oracle, replay, seek, and negative checks pass. |
| `node --test src/services/scenarioContract.test.mjs` | Exit 0; 8/8 tests pass. |
| `npm run build` | Exit 0; TypeScript/Vite pass; Vite reports a 696 kB bundle warning. |
| `node docs/plans/phase2/measure-production.mjs` | Exit 0; production POC build, 12/12 browser combinations, and 12 timing rows. Current rerun p95 ranges 15.2–17.3 ms across tested modes; idle rAF 60 in all rows. The command refreshes POC screenshots and `measure-production-results.json`. |
| `390-F1-reducer.png` visual inspection | Four nodes and route labels fit the mobile screenshot; no obvious clipping. |

## Gate recommendation

**G1: hold.** The A/hybrid ADR is a reasonable provisional choice for A1/F1, but G0/P1 review and thresholds are still open (`docs/plans/PROGRESS.md:35-36`), and accessibility/pause evidence is incomplete. Do not extrapolate the POC to other families.

**P3: hold completion.** The AI parser itself returns unsupported for structurally valid unreviewed proposals (`src/services/scenarioContract.ts:14-15,77`), and focused tests pass. Fix the free-text preset bypass, then demonstrate per-step golden visual/state parity and the relevant negative browser case before closing P3-T3/T4. No production code or fixtures were edited in this review.

## Addendum — rerun after matching and smoke revisions

This addendum supersedes the status of findings 1 and 2 above; the earlier findings remain as the audit trail.

- **Critical #1: resolved for the reported bypass.** `src/App.tsx:175-181` now matches the complete normalized query only against a complete title, ID, or chip name. `docs/plans/phase3/browser-check.mjs:6-30` exercises the formerly failing Kafka substring and an exact Redis alias. Against the rebuilt production app, `node docs/plans/phase3/browser-check.mjs` exited 0: three negative/unsupported cases preserved the current simulation, and the exact alias selected without an AI call. This does not audit all natural-language intent or every alias collision; it closes the concrete substring false acceptance.
- **Important #2: improved, still limited.** `docs/plans/phase3/preset-smoke.mjs:19-34` now visits every step on each of 11 presets at 1440×900 and 390×844, asserting each title, explanation, and presence of every expected flow packet label. `node docs/plans/phase3/preset-smoke.mjs` exited 0 with 22/22 viewport/preset runs. `src/services/scenarioContract.test.mjs:68-76` still locks source hashes and adapter identity. This is meaningful text/label regression coverage. The manifest values come from the current preset source, and the browser assertions do not prove exact packet count, endpoint/position, intermediate rendered state, or parity to independently captured pre-adapter visuals. P3-T3's full golden-state/packet parity therefore remains open.

### Focused P2 accessibility check

On the Vite POC page in headless Chromium at 390×844 with `reducedMotion: 'reduce'`, I exercised A1 and F1 in both Snapshot and Event + reducer modes using `Tab`, `Space`, and `ArrowRight` only. All four runs had the expected initial tab order (A1, F1, Legacy renderer, Snapshot, Event + reducer, Previous, Play, Next); `Space` selected case/mode and toggled Play/Pause; `ArrowRight` advanced the named seek slider from 0 to 1; frame text stayed fixed for 650 ms after pause. The media query matched reduced motion, each SVG exposed `role="img"` with a frame-specific `aria-label`, and `svg.getAnimations({subtree:true})` returned 0. The keyboard controls and static SVG stage pass this focused check.

**Remaining G1 accessibility blockers:** No manual screen-reader test or verification of `aria-live` announcement timing/content; no keyboard and reduced-motion audit of the legacy renderer's repeating packet motion; no complete app keyboard/mobile audit. POC `docs/plans/phase2/poc.jsx:67-71,80-89` pauses the step timer but does not control legacy animation (`src/components/FlowGraphRenderer.tsx:395-415`). G1 still needs the already open G0/P1 approvals and a scoped accessibility verdict before approval. The provisional A/hybrid recommendation is unchanged.

Rerun commands: `npm run build` exit 0; `node --test src/services/scenarioContract.test.mjs` 8/8; `node docs/plans/phase3/browser-check.mjs` 4/4; `node docs/plans/phase3/preset-smoke.mjs` 22/22. The focused POC keyboard/reduced-motion check was an inline Playwright script; it did not write repository files.

## Scope correction — exact G1/P3 acceptance audit

The previous recommendation demanded more than the gate text in places. This section is the current QA verdict.

**G1 can select A/hybrid on A1/F1 now, conditional on G0.** `docs/plans/MASTER_PLAN.md:117,150-157` confines the architecture decision to the locked POC slice. A1/F1 oracle, negative, replay and seek checks pass; both viewport browser checks pass; the production POC measurement uses the same inputs and wrapper. On that evidence, B has not shown the required code-reuse/readability benefit and A/hybrid (family renderer plus validated snapshots) is the defensible decision. The plan says to try C only if A/B cannot satisfy the slice (`MASTER_PLAN.md:78,150`); there is no measured reason to add a library trial. G1 does not certify grid, swarm, tree, a universal engine, or rollout. The P2 ADR itself states these bounds (`docs/plans/phase2/README.md:55-63`).

**Legacy motion is a known baseline defect, not a regression caused by the snapshot candidate.** Infinite packet motion is in the existing `FlowGraphRenderer` (`src/components/FlowGraphRenderer.tsx:395-415`) and the P0 backlog assigns unified pause/reduced-motion work to P4 (`docs/plans/baseline/README.md:43,69`; `MASTER_PLAN.md:176`). It should be recorded as a P4 obligation, not used to fail the A/hybrid G1 architecture decision. The POC Snapshot/Event + reducer SVG stage has no active animation under reduced motion, and its step timer pauses in the focused keyboard test. This does not claim that retaining legacy renderers fixes their motion.

**Accessibility requirement, narrowly stated:** `MASTER_PLAN.md:117` asks that candidate B not reduce accessibility; P2-T2 asks readable layout. The P1 draft rubric at `docs/plans/phase1/README.md:55` does request keyboard, screen reader, reduced motion and equivalent text on desktop/mobile. I verified keyboard/reduced-motion behavior only on mobile for A1/F1 and inspected the mobile F1 screenshot. A full-app keyboard/mobile audit was an over-broad G1 demand; it belongs to later integration work. If the P1 rubric is ratified as written at G0, the smallest missing POC check is a scoped screen-reader pass for A1/F1 candidate modes at desktop and mobile, confirming frame/state announcement and focus, plus the corresponding legacy comparison needed for a no-regression claim. No manual screen-reader result exists yet.

**P3-T3 is substantially evidenced for this identity adapter.** `adaptPreset` returns the original scenario and its original `steps` (`src/services/scenarioContract.ts:80-82`); the hash and JSON identity checks in `src/services/scenarioContract.test.mjs:68-76` cover every field and every step for all 11 presets. The revised browser smoke then visits every step and checks text and expected packet labels on both viewports (`docs/plans/phase3/preset-smoke.mjs:19-34`). Requiring pre-adapter screenshots of every intermediate frame, exact pixel positions, and packet animation timing for this no-op data adapter was an over-broad reading of `MASTER_PLAN.md:167`. Those are useful P4/P6 visual/behavior regression checks. The remaining P3-T3 task is a reviewer sign-off that unchanged data and existing renderer routing are an acceptable golden-state proof; it does not require new fixture machinery to judge this adapter.

**P3-T1/T2/T4:** The parser and unsupported boundary have focused negative coverage; unreviewed AI cannot become accepted (`src/services/scenarioContract.ts:14-15,77`), and the concrete query bypass is fixed. P3-T2's A1 runner/invariant work is sufficient for its *first deterministic capability* wording (`MASTER_PLAN.md:166`); it does not authorize AI simulation for the other families. Source claims in `docs/plans/phase3/README.md:7-10` maintain that limit. A broad oracle for all 11 presets and production proxy hardening are later phase work. The minimal P3 closeout is to keep unsupported routing for unreviewed AI, record the narrow capability scope, and obtain the G0/G1 dependency decision.

**Formal verdict:** QA supports the bounded A/hybrid G1 decision from current A1/F1 correctness, rendering and performance evidence. Formal gate closure still waits for owner approval of the P0/P1 baseline and performance/accessibility thresholds at G0 (`MASTER_PLAN.md:115,136,146`; `PROGRESS.md:44-45`). If the P1 screen-reader rubric remains a G1 condition, perform the small POC-only screen-reader comparison above; do not block G1 on fixing legacy full-app animation or on every-family golden screenshots. P3 implementation is reviewable against this bounded decision and should remain provisional until its prerequisite gates are recorded.

## Render parity script review

`docs/plans/phase3/render-parity.mjs:10-34` builds the pre-P3 `991ea6c` source and current candidate separately, so its baseline is independent of the current preset manifest. `src/App.tsx:399-405,443-449` confirms `main > div` child 2 is the stage container selected at script line 57. For each preset, viewport and step, lines 47-75 compare the complete normalized stage DOM: node/packet presence and count, labels, classes, SVG paths, and inline layout. Once it passes, this is strong evidence of **renderer step-state parity** for P3-T3, alongside the existing preset hash/identity and every-step text checks. Animation phase and pixels are outside P3-T3's needed proof; they belong to P4/P6 behavior and visual review.

The normalization at lines 64-69 removes opacity and most nonzero inline transforms, so it cannot detect a change encoded *only* in a transient Framer transform. It also disables CSS motion and samples a fixed clock, deliberately omitting animation timing. These are disclosed, nonblocking limits for an identity adapter because the renderer components and preset data are otherwise unchanged. A passing script does not validate the presets' domain truth; it establishes that P3 did not change their stage output.

**Final P3-T3 QA verdict: pass at semantic frame scope.** The owner reports `node docs/plans/phase3/render-parity.mjs` exit 0. I inspected `docs/plans/phase3/render-parity-results.json`: baseline `991ea6c`, Chromium `156.0.8078.4`, 22 pass rows (11 presets × desktop/mobile) covering 120 step/viewport comparisons. Together with the unchanged-source hashes/adapter identity and all-step text smoke, this closes the specific P3-T3 concern about step, packet and layout regression through the adapter. There is no further parity test blocker for P3-T3. Animation timing, pixel-level appearance, and independent semantic correctness remain explicitly outside this parity verdict.
