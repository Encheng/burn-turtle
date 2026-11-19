/**
 * Geometry for the burn-hole animation: an irregular blob that grows from a
 * paper corner until it swallows the whole sheet. Pure functions; the
 * component drives `t` with requestAnimationFrame.
 */

export const PAPER_W = 300;
export const PAPER_H = 400;

/** 0 top-left, 1 top-right, 2 bottom-right, 3 bottom-left */
export type Corner = 0 | 1 | 2 | 3;

export type Point = { x: number; y: number };

export type BurnShape = {
  corner: Corner;
  cx: number;
  cy: number;
  phases: [number, number, number];
};

const CORNER_XY: Point[] = [
  { x: 0, y: 0 },
  { x: PAPER_W, y: 0 },
  { x: PAPER_W, y: PAPER_H },
  { x: 0, y: PAPER_H }
];

const TAU = Math.PI * 2;
const NOISE_SAMPLES = 360;
const COVER_MARGIN = 1.02;

/** Pick an ignition corner and three noise phases. */
export function makeBurnShape(rng: () => number = Math.random): BurnShape {
  const corner = Math.min(3, Math.floor(rng() * 4)) as Corner;
  const { x: cx, y: cy } = CORNER_XY[corner];
  const phases: [number, number, number] = [rng() * TAU, rng() * TAU, rng() * TAU];
  return { corner, cx, cy, phases };
}

/** Edge-noise multiplier for angle `a` (1 ± 0.23). */
function noiseAt(shape: BurnShape, a: number): number {
  const [p1, p2, p3] = shape.phases;
  return 1 + 0.12 * Math.sin(5 * a + p1) + 0.07 * Math.sin(11 * a + p2) + 0.04 * Math.sin(23 * a + p3);
}

/** Distance from the ignition corner along angle `a` to where the ray leaves the paper (0 if it never enters). */
function exitDistance(shape: BurnShape, a: number): number {
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  let t = Infinity;
  if (Math.abs(dx) > 1e-9) t = Math.min(t, ((dx > 0 ? PAPER_W : 0) - shape.cx) / dx);
  if (Math.abs(dy) > 1e-9) t = Math.min(t, ((dy > 0 ? PAPER_H : 0) - shape.cy) / dy);
  return t > 0 && Number.isFinite(t) ? t : 0;
}

/**
 * Smallest base radius at which every ray through the paper is already past
 * its far edge, noise included — so the paper is fully consumed right at
 * t = 1 instead of long before it.
 */
export function requiredRadius(shape: BurnShape): number {
  let r = 0;
  for (let i = 0; i < NOISE_SAMPLES; i++) {
    const a = (i / NOISE_SAMPLES) * TAU;
    const d = exitDistance(shape, a);
    if (d > 0) r = Math.max(r, d / noiseAt(shape, a));
  }
  return r * COVER_MARGIN;
}

/** Ease-in-out radius: 0 at t=0, exactly `requiredRadius(shape)` at t=1. */
export function holeRadius(t: number, shape: BurnShape): number {
  const c = Math.min(1, Math.max(0, t));
  const eased = c < 0.5 ? 2 * c * c : 1 - Math.pow(-2 * c + 2, 2) / 2;
  return eased * requiredRadius(shape);
}

/** Irregular ring of points around the ignition corner at progress t. */
export function holeOutline(shape: BurnShape, t: number, segments = 64): Point[] {
  const R = holeRadius(t, shape);
  const pts: Point[] = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * TAU;
    const r = Math.max(0, R * noiseAt(shape, a));
    pts.push({ x: shape.cx + r * Math.cos(a), y: shape.cy + r * Math.sin(a) });
  }
  return pts;
}

/**
 * Closed, smoothed SVG path through the points: starts at the midpoint of
 * the first edge and draws one quadratic curve per vertex (vertex as control
 * point, next midpoint as end), so the burnt edge reads as scorched paper
 * rather than a polyline.
 */
export function holePathD(points: Point[]): string {
  const n = points.length;
  if (n === 0) return '';
  const f = (v: number) => v.toFixed(2);
  const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  let m = mid(points[0], points[1 % n]);
  let d = `M${f(m.x)} ${f(m.y)}`;
  for (let i = 1; i <= n; i++) {
    const ctrl = points[i % n];
    m = mid(ctrl, points[(i + 1) % n]);
    d += `Q${f(ctrl.x)} ${f(ctrl.y)} ${f(m.x)} ${f(m.y)}`;
  }
  return d + 'Z';
}

/** Point at fraction u ∈ [0,1) along the ring, interpolating between vertices. */
export function pointOnOutline(points: Point[], u: number): Point {
  const n = points.length;
  const s = ((u % 1) + 1) % 1;
  const f = s * n;
  const i = Math.floor(f);
  const frac = f - i;
  const a = points[i % n];
  const b = points[(i + 1) % n];
  return { x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac };
}

/** Outline points that still lie on the paper: the visible burning front. */
export function frontPoints(points: Point[]): Point[] {
  return points.filter((p) => p.x >= 0 && p.x <= PAPER_W && p.y >= 0 && p.y <= PAPER_H);
}
