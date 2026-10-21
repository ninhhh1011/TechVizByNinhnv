# Implementation Plan: Zero-Scroll Split-View Studio UI Overhaul

**Date:** 2026-10-21  
**Goal:** Transform TechViz Sandbox into a clean, modern, zero-scroll Split-View Studio layout. Left column (35%) dedicated to pedagogical explanation & live step inspection; Right column (65%) dedicated to the spacious interactive visualizer canvas with floating playback dock, zoom/pan controls, fullscreen mode, and smooth data flow animations.

---

## 1. Visual Hierarchy & Architecture

```
+---------------------------------------------------------------------------------------------------------+
| [Header] Logo "TechViz Studio" | Compact Search Bar ("MergeSort, Kafka...") | Quick Chips | Actions     |
+---------------------------------------------------------------------------------------------------------+
| [SPLIT-VIEW STUDIO LAYOUT - h-[calc(100vh-110px)]]                                                      |
|                                                                                                         |
|  LEFT PANEL (35% - Sticky/Scrollable Inspector)     |  RIGHT PANEL (65% - Central Visualization Stage)  |
|  +------------------------------------------------+ |  +----------------------------------------------+ |
|  | [Tab Bar] Lý thuyết cốt lõi | Chi tiết bước    | |  | [Top Canvas Bar] Engine Mode | Zoom/Pan | ⛶ Full| |
|  | - Tab 1: Mental Model, Big-O, Use Cases        | |  |                                              | |
|  | - Tab 2 (or unified view):                     | |  |   5-ENGINE VISUALIZER CANVAS:                | |
|  |   * Tiêu đề & Diễn giải bước hiện tại          | |  |   - array-pointer (1D Bars & Web Audio)      | |
|  |   * Khung mã giả / công thức (logicCode)       | |  |   - grid-path (2D A*/Dijkstra interactive)   | |
|  |   * Bảng biến số trực tiếp (stateVariables)    | |  |   - flow-graph (Multi-column packet flow)    | |
|  +------------------------------------------------+ |  |   - swarm-2d (2D particles, gBest vectors)  | |
|                                                     |  |   - tree-graph (Hierarchical tree & links)   | |
|                                                     |  |                                              | |
|                                                     |  |  [FLOATING PLAYBACK DOCK AT BOTTOM OF CANVAS]| |
|                                                     |  |  B1 .. Bn | ◀ Prev | ▶ Play | Next ▶ | 1x | ← →| |
|                                                     |  +----------------------------------------------+ |
+---------------------------------------------------------------------------------------------------------+
```

---

## 2. Step-by-Step Task Decomposition

### Task 1: Compact, Elegant Header ([HeroHeader.tsx](file:///D:/demoTECH/src/components/HeroHeader.tsx))
- Transition from heavy tall red gradient to a sleek Clean Slate aesthetic:
  - Clean light background (`bg-white` or `bg-slate-900`/slate-glass border), crisp typography.
  - Compact height (around 64px - 72px): Top row with logo, inline search bar, and clean quick chips.
  - High-visibility Search Bar with instant focus, clear button, and "Trực quan hóa" button with Techcombank red accent `#E31B23`.
  - Quick-chips row wrapped elegantly right next to/under search without taking vertical space.

### Task 2: Pedagogical Inspector Panel ([StorytellerBanner.tsx](file:///D:/demoTECH/src/components/StorytellerBanner.tsx))
- Re-architect as the Left Column component of the Split-View Studio:
  - Header: Scenario Title, category badge, and Step count indicator.
  - Tabbed or structured dual sections:
    1. **Lý thuyết Nền tảng (Academic Concept)**:
       - Mental Model (Bản chất trực quan cho người mới)
       - Complexity & Theory (Big-O thời gian & bộ nhớ / Nguyên lý hệ thống)
       - Use Cases (Ứng dụng thực tế)
    2. **Diễn giải Bước hiện tại (Step Deep-Dive)**:
       - Step title & thorough explanation (what is happening & why)
       - Syntax-styled dark pre-wrap box for `logicCode`
       - Grid table for `stateVariables` live mutations
  - Designed for smooth vertical scrolling inside the left container (`overflow-y-auto`) while keeping page height fixed (`h-full`).

### Task 3: Central Visualization Canvas & Floating Dock Controls
- Right Column container:
  - Top Toolbar: Engine indicator badge, Zoom In/Out (`+` / `-`), Reset View button, Fullscreen toggle (`⛶`).
  - Fullscreen API support (using standard `requestFullscreen()` on canvas container).
  - Floating Playback Dock at bottom:
    - Stepper nodes (B1, B2, ... Bn)
    - Play/Pause, Prev, Next, Reset, Speed selector (0.5x, 1x, 2x)
    - Keyboard shortcut hints: `←` (Lùi bước) / `→` (Tiến bước)
    - Sound toggle for array audio.

### Task 4: Polish Graphic Rendering & Smooth Flows across all 5 Engines
- **`FlowGraphRenderer.tsx`**:
  - Add Zoom/Pan transform container (`scale`, `translateX`, `translateY`).
  - Animated SVG link gradients with flowing dashes (`strokeDashoffset` animation).
  - Glow/scale effect on active highlight nodes; dimming on non-active nodes.
- **`TreeGraphRenderer.tsx`**:
  - Add Zoom/Pan transform container so large trees (many nodes/levels) fit comfortably.
  - Flowing animated gradient lines for active branch paths.
- **`Swarm2DRenderer.tsx`**:
  - Zoom/Pan support for 2D arena.
  - Clearer coordinate axes and velocity vector trails.
- **`ArrayPointerRenderer.tsx` & `GridPathRenderer.tsx`**:
  - Maintain clean fit and ensure zero overflow inside the studio canvas.

### Task 5: Master Split-View Studio Layout in `App.tsx`
- Layout:
  - Header at top (fixed height ~70px).
  - Main studio container `h-[calc(100vh-70px)]` with `overflow-hidden` (Zero-Scroll on desktop).
  - Left Panel: 35% width (min 320px, max 440px on large screens), `h-full`, scrollable internally.
  - Right Panel: flex-1, `h-full`, housing canvas and floating dock.
  - Mobile responsive fallback: On small screens (`< 1024px`), smoothly stacks with natural flow.

---

## 3. Verification Criteria
- `node ./node_modules/typescript/bin/tsc --noEmit` & `npm run build` pass with 0 errors.
- Zero-scroll behavior verified on desktop: no unwanted document body scrollbars.
- Search input remains prominent, directly accessible, and quick-chips work seamlessly.
- All 5 engines render correctly with Zoom/Pan and Fullscreen toggle.
- Left column displays rich academic theory and step inspection.
- Floating playback dock responds to clicks and `←` / `→` arrow keys.
