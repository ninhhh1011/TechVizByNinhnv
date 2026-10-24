# Independent final review — P4/P5

Date: 2026-10-22. Read-only code review followed by independent verification of the three reported fixes. The reviewer changed only this review record; no source, build output, credentials, or deployment was modified.

## Findings and fix verification

| Severity | Initial finding | Current result |
|---|---|---|
| Important | `src/components/ArrayPointerRenderer.tsx:253`: centered nonshrinking bars overflowed before the scroll origin. On a 390 px viewport, a 20-number Bubble pass placed its first bar at x=-340 while the scrollport began at x=33; the initial elements were unreachable. | Fixed with start alignment fallback and `safe center`. Independently verified the served build at `http://127.0.0.1:3000/`: first bar spans x=41–85 inside scrollport x=33–357 at scrollLeft=0; last bar spans x=305–349 after scrolling to 762. Both endpoints are reachable. |
| Important | `src/components/GridPathRenderer.tsx:411`: `found=false` always asserted that walls blocked the target, including unfinished curated frames and missing data. | Fixed: reason-bearing invalid states remain distinct; curated pending frames say no conclusion yet; an exhausted live solver reports no route. Independently verified the initial grid frame has the pending statement without the old blocked assertion. Blocking all eight neighbors of start [5,2] through keyboard editing produces the distinct exhausted-solver statement. Source inspection confirms missing-data reasons take precedence. |
| Minor | `src/components/HeroHeader.tsx:120`: quick preset Chips rendered as nonfocusable div/span controls with no keyboard activation. | Fixed with `as="button"`, `type="button"`, and `aria-pressed`. Independently focused the A* / Dijkstra preset in the served build and activated it with Enter; selection changed and aria-pressed became true. |

Verification used headless Chromium, viewport 390×844, against the existing built release. The targeted assertions all passed. Existing source regression checks cover grid status, array endpoint reachability, and preset keyboard activation. The parent reported a passing 22-test unit suite; this reviewer did not rerun that suite or rebuild while the broader E2E run was active.

## Remaining release gates

- Staging still serves the old release, according to the parent's read-only staging check. Current local results do not certify that deployment. The owner confirmed the previously exposed credential was revoked/rotated; this reviewer did not fetch, print, or use it. Deploy the corrected artifact and verify the actual hosted evidence labels, proxy behavior, and absence of client credentials before public rollout.
- Human content review, learner pilot, independent contributor trial, and operational rollback drill remain pending external evidence. The P5–P7 records disclose these limits; no fabricated completion is required or appropriate.
- Public AI rollout still requires the documented edge rate rule: the local per-isolate limiter is not a global quota.

No further concrete local correctness or security defect was identified in the inspected P4/P5 surfaces. This review does not supply a human domain verdict, screen-reader verdict, learner outcome, or staging deployment certification.
