# Renderer fixes implementation plan

**Goal:** Correct the grid weight badge and preserve array elements through swaps.
**Architecture:** Keep snapshot rendering. Report unavailable weights honestly. Identify equal array values by occurrence so swaps retain DOM identity without changing scenario contracts.
**Tech Stack:** React, Framer Motion, Vite, Node tests, Playwright.
**Spec:** User-approved review findings 1 and 2 in this conversation.

- [x] Add regression checks and demonstrate failures.
- [x] Fix grid badge and array keys; preserve duplicate-value support and paused/reduced-motion behavior.
- [x] Run unit tests, build, and the complete existing E2E suite.
- [x] Exercise the UI, capture screenshots and inspect them; record results.

Constraints: no dependencies, no changes to curated snapshots, preserve existing uncommitted work.
Review focus: duplicate values, stable DOM identity after swaps, missing costs, interactive solver costs, paused and reduced motion.

## Results

- Before fixes: browser regression failed both weight badge and swapped DOM identity at 1440px and 390px.
- After fixes: npm test passed 23/23; npm run test:e2e exited 0, including build, baseline smoke, all 11 presets, playback/capability checks, Chromium/Firefox/WebKit matrix and the new renderer regression.
- The new regression measures movement over animation frames, duplicate identity and paused position tolerance (<1px), and verifies interactive weights remain available.
- Visually inspected grid and array screenshots at desktop and mobile sizes in docs/plans/phase6/{grid-fix,array-fix}-*.png. Grid badge now reflects missing costs; array retains both copies of 3 in [3,1,3].
- Existing mobile limitation observed: stage toolbar overlaps part of the heading and fixed-width grid cells crowd together. Outside these two fixes.
- Build retains the existing >500kB bundle warning. No deployment or commit performed.
