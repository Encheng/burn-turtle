import { describe, it, expect } from 'vitest';
import {
  PAPER_W,
  PAPER_H,
  makeBurnShape,
  holeRadius,
  holeOutline,
  holePathD,
  pointOnOutline,
  frontPoints,
  type BurnShape,
  type Corner
} from './burnPath';

type Pt = { x: number; y: number };

/** Ray-cast point-in-polygon. */
function inside(poly: Pt[], p: Pt): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      hit = !hit;
    }
  }
  return hit;
}

const PAPER_CORNERS: Pt[] = [
  { x: 0, y: 0 },
  { x: PAPER_W, y: 0 },
  { x: PAPER_W, y: PAPER_H },
  { x: 0, y: PAPER_H }
];

function shapeFor(corner: Corner): BurnShape {
  return makeBurnShape(() => corner / 4 + 0.01);
}

describe('makeBurnShape', () => {
  it('is deterministic for a fixed rng', () => {
    const rng = () => 0.42;
    expect(makeBurnShape(rng)).toEqual(makeBurnShape(rng));
  });

  it('places the ignition point on the chosen paper corner', () => {
    for (const corner of [0, 1, 2, 3] as Corner[]) {
      const s = shapeFor(corner);
      expect(s.corner).toBe(corner);
      expect({ x: s.cx, y: s.cy }).toEqual(PAPER_CORNERS[corner]);
    }
  });

  it('draws phases in [0, 2π)', () => {
    const s = makeBurnShape(() => 0.999);
    expect(s.phases).toHaveLength(3);
    for (const p of s.phases) {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThan(Math.PI * 2);
    }
  });
});

describe('holeRadius', () => {
  it('starts at 0 and ends just beyond what this shape needs to cover the paper', () => {
    const diag = Math.hypot(PAPER_W, PAPER_H);
    for (const corner of [0, 1, 2, 3] as Corner[]) {
      const s = shapeFor(corner);
      expect(holeRadius(0, s)).toBe(0);
      // must reach the far corner (one diagonal away) even through the
      // deepest noise trough (0.77×), but not waste time far beyond it
      expect(holeRadius(1, s)).toBeGreaterThanOrEqual(diag);
      expect(holeRadius(1, s)).toBeLessThanOrEqual(1.35 * diag);
    }
  });

  it('is monotonic', () => {
    const s = shapeFor(1);
    let prev = -1;
    for (let i = 0; i <= 10; i++) {
      const r = holeRadius(i / 10, s);
      expect(r).toBeGreaterThanOrEqual(prev);
      prev = r;
    }
  });
});

describe('holeOutline', () => {
  it('collapses to the ignition point at t = 0', () => {
    const s = shapeFor(0);
    for (const p of holeOutline(s, 0)) {
      expect(p.x).toBeCloseTo(s.cx);
      expect(p.y).toBeCloseTo(s.cy);
    }
  });

  it('covers every paper corner at t = 1, for every ignition corner', () => {
    for (const corner of [0, 1, 2, 3] as Corner[]) {
      const poly = holeOutline(shapeFor(corner), 1);
      for (const c of PAPER_CORNERS) {
        // nudge inward so the corner is not exactly on an edge
        const p = { x: c.x === 0 ? 0.5 : c.x - 0.5, y: c.y === 0 ? 0.5 : c.y - 0.5 };
        expect(inside(poly, p), `corner ${corner} should cover ${c.x},${c.y}`).toBe(true);
      }
    }
  });

  it('returns the requested number of segments', () => {
    expect(holeOutline(shapeFor(1), 0.5, 32)).toHaveLength(32);
  });

  it('is irregular (not a perfect circle) mid-burn', () => {
    const s = shapeFor(2);
    const pts = holeOutline(s, 0.5);
    const radii = pts.map((p) => Math.hypot(p.x - s.cx, p.y - s.cy));
    expect(Math.max(...radii) - Math.min(...radii)).toBeGreaterThan(1);
  });
});

describe('holePathD', () => {
  it('builds a closed, smoothed path with one quadratic segment per point', () => {
    const pts = holeOutline(shapeFor(3), 0.5, 16);
    const d = holePathD(pts);
    expect(d.startsWith('M')).toBe(true);
    expect(d.trim().endsWith('Z')).toBe(true);
    expect(d.match(/Q/g)).toHaveLength(16);
    expect(d).not.toContain('L');
  });
});

describe('pointOnOutline', () => {
  it('returns the first point at u = 0 and interpolates along the ring', () => {
    const pts = holeOutline(shapeFor(0), 0.5, 8);
    expect(pointOnOutline(pts, 0)).toEqual(pts[0]);
    const mid = pointOnOutline(pts, 0.5 / 8);
    expect(mid.x).toBeCloseTo((pts[0].x + pts[1].x) / 2);
    expect(mid.y).toBeCloseTo((pts[0].y + pts[1].y) / 2);
  });

  it('wraps around at u → 1', () => {
    const pts = holeOutline(shapeFor(0), 0.5, 8);
    const p = pointOnOutline(pts, 1 - 1e-9);
    expect(p.x).toBeCloseTo(pts[0].x, 3);
    expect(p.y).toBeCloseTo(pts[0].y, 3);
  });
});

describe('frontPoints', () => {
  it('keeps only outline points that lie on the paper', () => {
    const front = frontPoints(holeOutline(shapeFor(0), 0.5));
    expect(front.length).toBeGreaterThan(0);
    for (const p of front) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(PAPER_W);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(PAPER_H);
    }
  });

  it('is empty once the hole has swallowed the paper', () => {
    for (const corner of [0, 1, 2, 3] as Corner[]) {
      expect(frontPoints(holeOutline(shapeFor(corner), 1))).toHaveLength(0);
    }
  });

  it('still has paper to burn at t = 0.75 (no long dead time before done)', () => {
    // eased(0.75) = 0.875, so this holds only if the radius is sized to the
    // shape rather than to a fixed worst case
    for (let seed = 0; seed < 40; seed++) {
      let x = seed * 9301 + 49297;
      const rng = () => ((x = (x * 9301 + 49297) % 233280), x / 233280);
      const shape = makeBurnShape(rng);
      expect(frontPoints(holeOutline(shape, 0.75, 96)).length, `seed ${seed}`).toBeGreaterThan(0);
    }
  });
});
