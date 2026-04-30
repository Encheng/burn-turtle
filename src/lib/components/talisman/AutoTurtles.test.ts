import { describe, it, expect } from 'vitest';
import { generateAutoTurtles } from './autoTurtles';

describe('generateAutoTurtles', () => {
  it('returns 16 turtles', () => {
    const t = generateAutoTurtles('2026-05-15', '玉山');
    expect(t.length).toBe(16);
  });

  it('returns the same layout for same seed', () => {
    const a = generateAutoTurtles('2026-05-15', '玉山');
    const b = generateAutoTurtles('2026-05-15', '玉山');
    expect(a).toEqual(b);
  });

  it('returns different layouts for different seeds', () => {
    const a = generateAutoTurtles('2026-05-15', '玉山');
    const b = generateAutoTurtles('2026-05-15', '合歡山');
    expect(a).not.toEqual(b);
  });

  it('keeps turtles within paper bounds', () => {
    const t = generateAutoTurtles('2026-05-15', '玉山');
    for (const turtle of t) {
      expect(turtle.x).toBeGreaterThanOrEqual(20);
      expect(turtle.x).toBeLessThanOrEqual(220);
      expect(turtle.y).toBeGreaterThanOrEqual(150);
      expect(turtle.y).toBeLessThanOrEqual(280);
    }
  });
});
