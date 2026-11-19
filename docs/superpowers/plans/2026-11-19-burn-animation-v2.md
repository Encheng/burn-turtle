# Burn Animation v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the rectangular char-band burn with a realistic hole that eats the talisman from a random corner, with glowing char edge, edge-tracking flames, sparks, smoke and falling ash, still 4 s long.

**Architecture:** A pure TypeScript module computes the irregular hole outline (SVG path `d`) for a given progress `t`. `BurnEffect.svelte` drives `t` with `requestAnimationFrame`, writes the outline into an SVG `<clipPath>` (applied by `Burn.svelte` to the paper) and into two stroked paths (char + ember), and positions a fixed pool of flame / spark / smoke / ash elements along the outline. All particle motion stays in CSS keyframes.

**Tech Stack:** Svelte 4, SVG clipPath (objectBoundingBox), CSS keyframes, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-19-burn-animation-v2-design.md`

## Global Constraints

- Total duration 4000 ms; `done` dispatched at 4000 ms.
- No new dependencies. iOS Safari 15+ / Android Chrome 90+.
- Hidden tab → jump to end and dispatch `done` (existing behaviour).
- `prefers-reduced-motion: reduce` → static end state, `done` after 1200 ms.
- Vibration 50 ms at ignition, `[30,100,30]` at 1500 ms.

## Review Focus

- Random corner / phases must be chosen once per mount, not per frame (otherwise the hole jitters). Pinned by Task 1 determinism test.
- Hole must fully cover the paper at `t = 1` for every corner. Pinned by Task 1 coverage test.
- `done` must fire exactly once even if hidden-tab and timer both trigger. Pinned by Task 2 test.
- rAF loop must be cancelled on destroy (navigating away mid-burn). Pinned by Task 2 test.
- Paper must still be visible (not clipped) in Ritual and Share stages — clip-path only in `Burn.svelte`. Checked visually in Task 3.

---

### Task 1: Hole geometry module

**Files:**
- Create: `src/lib/components/talisman/burnPath.ts`
- Test: `src/lib/components/talisman/burnPath.test.ts`

**Interfaces:**
- Produces:
  - `export const PAPER_W = 300; export const PAPER_H = 400;`
  - `export type Corner = 0 | 1 | 2 | 3` (0 top-left, 1 top-right, 2 bottom-right, 3 bottom-left)
  - `export type BurnShape = { corner: Corner; cx: number; cy: number; phases: [number, number, number] }`
  - `export function makeBurnShape(rng?: () => number): BurnShape` — picks a corner and three phases in `[0, 2π)`.
  - `export function requiredRadius(shape: BurnShape): number` — max over sampled angles of (ray exit distance ÷ noise) × 1.02.
  - `export function holeRadius(t: number, shape: BurnShape): number` — ease-in-out mapped so `holeRadius(0, s) = 0`, `holeRadius(1, s) = requiredRadius(s)`.
  - `export function holeOutline(shape: BurnShape, t: number, segments = 64): { x: number; y: number }[]` — points at `r(θ) = R(t)·(1 + 0.12·sin(5θ+φ₁) + 0.07·sin(11θ+φ₂) + 0.04·sin(23θ+φ₃))`, clamped `r ≥ 0`.
  - `export function holePathD(points: { x: number; y: number }[]): string` — closed `M … L … Z` path.
  - `export function pointOnOutline(points, u: number): { x: number; y: number }` — `u ∈ [0,1)` fraction along the outline (for attaching flames).

- [ ] **Step 1: Write failing tests** in `burnPath.test.ts`:
  - `makeBurnShape` with a fixed rng returns the same shape twice; corner ∈ {0,1,2,3}; cx/cy are the paper corner coordinates.
  - `holeRadius(0, s) === 0`, `diag ≤ holeRadius(1, s) ≤ 1.35·diag`, monotonic over 11 samples; `frontPoints(holeOutline(s, 0.75, 96))` non-empty for 40 seeded shapes.
  - `holeOutline(shape, 1)` for every corner: every paper corner `(0,0),(300,0),(300,400),(0,400)` lies inside the polygon (ray-cast point-in-polygon helper in the test).
  - `holeOutline(shape, 0)` has all points equal to `(cx, cy)`.
  - `holePathD` starts with `M`, ends with `Z`, contains `segments` coordinates.
- [ ] **Step 2: Run** `npx vitest run src/lib/components/talisman/burnPath.test.ts` → FAIL (module missing).
- [ ] **Step 3: Implement** `burnPath.ts` per Interfaces. Easing: `t < 0.5 ? 2t² : 1 - (-2t+2)²/2`.
- [ ] **Step 4: Run** the test file → PASS.

### Task 2: BurnEffect rewrite

**Files:**
- Modify: `src/lib/components/talisman/BurnEffect.svelte` (full rewrite)
- Test: `src/lib/components/talisman/BurnEffect.test.ts`

**Interfaces:**
- Consumes: Task 1 exports.
- Produces: component renders `<svg><defs><clipPath id="burn-clip" clipPathUnits="objectBoundingBox"><path clip-rule="evenodd" transform="scale(1/300 1/400)" d="M0 0H300V400H0Z {hole}"/></clipPath></defs>…</svg>`; dispatches `done` once.

- [ ] **Step 1: Write failing tests** (vitest fake timers, mock `requestAnimationFrame` to call back via `setTimeout(cb, 16)`):
  - `dispatches done once at 4000ms`: render, advance 3999 → not called; advance 1 → called once; advance 1000 → still once.
  - `jumps to end when tab hidden`: render, set `document.hidden = true` (defineProperty), dispatch `visibilitychange`, expect `done` once; advance 5000 → still once.
  - `reduced motion dispatches done at 1200ms`: mock `matchMedia` to match, advance 1199 → not called, 1 → called.
  - `renders clipPath with id burn-clip` in the DOM.
- [ ] **Step 2: Run** `npx vitest run src/lib/components/talisman/BurnEffect.test.ts` → FAIL.
- [ ] **Step 3: Implement** BurnEffect:
  - On mount: `shape = makeBurnShape()`; `start = performance.now()`; rAF loop computes `t = clamp((now - start - 300) / 3500, 0, 1)` (hole runs 300 → 3800 ms), updates `points`, `holeD`, flame positions via `pointOnOutline(points, flame.u)`.
  - Stage flags derived from elapsed ms: `ignited ≥ 0`, `sparks ≥ 1000`, `flash` at 2400 (one-shot CSS animation), `dying ≥ 3300`, `out ≥ 3800`.
  - Layers (all `pointer-events: none`): ignition glow dot at corner; `<svg viewBox="0 0 300 400">` with char stroke (`#2b1a12`, width 14, blur 3, opacity .9) and ember stroke (`#ffb347`, width 3, blur 2, `animation: emberFlicker`) on `holeD`; 8 flames (reuse existing radial-gradient shape, `animation: flicker`) at fixed `u` values, scaled down when `dying`; 30 sparks (`<i>` elements, `animation: sparkRise` with per-element `--dx/--dur/--delay`, spawned at random `u` every frame while `sparks && !out`, re-used round-robin); 4 smoke puffs (existing `smokeRise`); 12 ash flakes (`animation: ashFall`, shown when `out`).
  - Reduced motion: skip loop, set `t = 1`, hide particles, `done` at 1200 ms.
  - Clean up rAF, timers, visibility listener on destroy.
- [ ] **Step 4: Run** the test file and the whole suite → PASS.

### Task 3: Burn stage wiring + visual check

**Files:**
- Modify: `src/lib/components/stages/Burn.svelte`

- [ ] **Step 1:** Wrap paper: `.scene` (relative, 3/4 aspect, max-width 480) containing `.paper` with `clip-path: url(#burn-clip)` and `<BurnEffect>` as a sibling **outside** `.paper` so flames/sparks are not clipped. Remove the orange `box-shadow`.
- [ ] **Step 2:** `npm run check` → 0 errors; `npx vitest run` → all pass; `npm run build` → success.
- [ ] **Step 3:** Preview + headless Chrome screenshots at 375px: 0.6 s, 1.6 s, 2.6 s, 3.5 s, 3.95 s; and with `reducedMotion: 'reduce'`. Confirm hole grows from a corner, edge glows, final frame has no paper, Share page still shows full talisman.
