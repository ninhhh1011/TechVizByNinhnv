# Master Plan Closure Implementation Plan

> **For agentic workers:** Execute each task with a test and an evidence review before marking it complete. Keep `docs/plans/MASTER_PLAN.md` and the current source open while working.

**Goal:** Close the gaps between TechViz's local implementation and the acceptance criteria in the master plan, then report the achieved status without overstating evidence.

**Architecture:** Keep the existing five renderers, snapshot playback, capability catalog, and Cloudflare Pages Function. Add only the deployment configuration, evidence, and operational measurement needed to verify the current design. A real learner pilot and a genuinely new capability trial remain separate acceptance gates.

**Tech Stack:** React, TypeScript, Vite, Node test runner, Playwright, Cloudflare Pages.

**Spec:** `docs/plans/MASTER_PLAN.md` (P5-T2/T4, P6-T3, P7-T1/T2/T3; gates G2/G3).

## Global constraints

- Presets must remain available when AI is unavailable.
- AI proposals cannot claim verified simulation without a reference runner and validator.
- Do not store learner identities, raw queries, provider keys, or AI responses in telemetry.
- Do not claim a human review, learner result, deployed behavior, or rollback drill from a simulated exercise.
- Do not add a renderer, DSL, or dependency unless the two new P7 cases require it.

## Review focus

1. A previously exposed Groq key may remain valid after a new deploy: verify revocation separately.
2. A Pages Function may work locally while the deployed route serves an old build: verify the exact deployed URL and release identity.
3. The per-isolate limiter does not enforce a global quota: exercise an edge rate rule on staging.
4. An illustrative preset may contain a misleading academic claim even when its state is valid: review text and frames together.
5. A learner may use controls successfully yet misunderstand the `verified`/`illustrative` label: ask for their explanation without prompting.

---

### Task 1: Establish a release baseline and repair the deployed AI boundary

**Files and surfaces:** `README.md`, `functions/api/groq.ts`, `functions/api/groq.test.mjs`, `docs/plans/phase5/staging.mjs`, `docs/plans/phase5/staging-results.json`, Cloudflare Pages project settings, Groq key management. Change code only if the deployed checks expose a code defect.

- [ ] Record the current Git diff and a release identifier. Run `npm ci`, `npm test`, `npm run check:fixtures`, `npm run check:ai`, `npm run build`, and `npm run test:e2e`; attach commands, exit codes, and browser versions to the release record.
- [ ] Revoke the key identified as potentially exposed by the 2026-10-22 staging audit. Confirm the old key fails at the provider; create a new `GROQ_API_KEY` as a server-only Pages secret. Remove any browser-facing key from deployment settings. Do not put either key in logs or evidence files.
- [ ] Deploy that release to a staging URL with the Pages Function and an edge rate rule for `/api/groq`. Record the release identifier and deployment URL.
- [ ] Run `node docs/plans/phase5/staging.mjs` with `TECHVIZ_STAGING_URL` set to that URL. Require exit 0: evidence label present, `OPTIONS` advertises POST, no wildcard CORS, no Groq-key-pattern match in public bundles, and no page error.
- [ ] Exercise staging requests with no secret, malformed/oversized input, a valid query, provider failure/timeout, and repeated requests across fresh sessions. Require the documented status/error behavior, no provider detail or key disclosure, and enforcement by the edge rate rule. Add a narrow regression test in `functions/api/groq.test.mjs` only for any behavior fixed in code.

**Exit:** P5-T2 has a compatible deployed endpoint and revoked old key. If staging cannot be changed, leave P5-T2 and G2 open; local tests alone do not close them.

### Task 2: Obtain academic review on the release candidate

**Files:** `docs/plans/phase5/REVIEW_RECORD.md`, `docs/plans/phase1/cases.json`, `src/data/*.ts`, `src/services/capabilities.ts`, `src/components/StorytellerBanner.tsx` if a reviewed claim needs correction.

- [ ] Give a named domain reviewer the 11 presets, Bubble-pass case, source material, expected traces, and claim/limit rubric from P1. Record reviewer, date, release identifier, source per claim, verdict, and required edit in `REVIEW_RECORD.md`.
- [ ] Correct or remove rejected claims in the relevant preset or banner. Run the relevant fixture/unit tests and browser smoke; review the corrected claim again.
- [ ] Mark unverified qualitative system scenes `illustrative` with explicit limits. Only the validated Bubble-pass capability may keep `verified-simulation` under the current contract.

**Exit:** Every pilot topic has a review record from a real reviewer; no rejected claim appears in the release candidate. Close P5-T4 only then.

### Task 3: Run and act on a real learner pilot

**Files:** `docs/plans/phase1/README.md`, `docs/plans/phase1/cases.json`, `docs/plans/phase6/PILOT.md`, affected `src/components/*` or `src/data/*`, relevant tests.

- [ ] Recruit five target learners and use the P1 pre/post questions for A1, G2, F2, S2, T2, U1. Rotate case order; record anonymous participant codes, exact answers, label interpretation, observed control problems, and time. Do not substitute synthetic personas.
- [ ] Score against `expectedAnswer` without showing it to participants. Report numerator/denominator per case and before/after; do not set a required improvement percentage or infer population-wide learning from five people.
- [ ] Fix each severe semantic, interaction, or accessibility misunderstanding at its source. Add a focused regression check for any code fix, rerun the relevant local suite, and have participants recheck the changed case.
- [ ] Replace the synthetic success numbers in `PILOT.md` with observed results and unresolved limits.

**Exit:** P6-T3 has real observations and confirmed fixes; a learner misunderstanding caused by the product keeps this task open.

### Task 4: Prove expansion with actual demand

**Files:** `docs/plans/phase7/PLAYBOOK.md`, `src/services/capabilities.ts`, `src/services/scenarioContract.ts`, `src/data/*`, `src/components/*` only as the selected cases require; fixture and unit tests beside touched code.

- [ ] Choose one new capability group from a real learner need or issue and document the need. Pick two distinct topics in that group; do not reuse Bubble-pass and GridPath as the P7 evidence.
- [ ] Ask an independent contributor to implement the two cases on a separate branch using the playbook. Require a source of truth, expected trace, positive and negative fixtures, invariant checks, and explicit evidence labels. Keep existing renderer/primitive APIs where they suffice.
- [ ] Review both traces against their oracle and review any new claims. Run `npm test`, `npm run check:fixtures`, `npm run check:ai`, `npm run test:e2e`, and preset parity. Record the diff and any reason a primitive changed.
- [ ] Update `PLAYBOOK.md` with the actual contributor friction and required edits. If no real new group is justified, defer P7-T2 and G3 rather than adding topics to satisfy a count.

**Exit:** The contributor trial is reproducible, two genuinely new cases pass, and existing golden cases remain intact.

### Task 5: Make operations observable and rehearse rollback

**Files and surfaces:** `docs/plans/phase7/PLAYBOOK.md`, `docs/plans/PROGRESS.md`, `docs/plans/GATE_REVIEW.md`, Cloudflare Pages logs/analytics and deployment history. Touch `functions/api/groq.ts` only if the platform cannot supply safe aggregate measurements.

- [ ] Define and capture aggregate counts for unsupported, invalid, false-accepted review findings, renderer errors, proxy status, and latency. Establish a review interval and owner. Exclude raw queries, keys, and learner data.
- [ ] Induce a bad AI proposal and a provider outage in staging; verify unsupported/error presentation and unchanged presets. Record counts and response times from the deployed environment.
- [ ] Rehearse rollback from a tagged staging release to the prior tested release, verify preset smoke and endpoint behavior, then restore the intended release. Record release IDs, times, commands, results, and oracle update procedure.
- [ ] Update `PROGRESS.md`, `GATE_REVIEW.md`, and `README.md` from the evidence. Close G2 only after Tasks 1–2; close G3 only after Tasks 3–5. State any remaining screen-reader or production-scale limits explicitly.

**Exit:** P7-T3 has an actual measurement and rollback record; tracker claims match the artifacts.

## Completion check

Re-run the release checks on the final commit and inspect every acceptance row for P5-T2/T4, P6-T3, and P7-T1/T2/T3 against its evidence. Report 100% only when every row is met; otherwise report completed tasks and open gates separately.
