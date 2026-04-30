import { describe, it, expect } from 'vitest';
import { djb2, makeRng } from './seededRandom';

describe('djb2', () => {
  it('produces same hash for same input', () => {
    expect(djb2('玉山-2026-05-15')).toBe(djb2('玉山-2026-05-15'));
  });

  it('produces different hashes for different inputs', () => {
    expect(djb2('玉山')).not.toBe(djb2('合歡山'));
  });

  it('returns positive integer', () => {
    const h = djb2('test');
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
  });
});

describe('makeRng', () => {
  it('produces deterministic sequence for same seed', () => {
    const a = makeRng(42);
    const b = makeRng(42);
    expect(a()).toBe(b());
    expect(a()).toBe(b());
    expect(a()).toBe(b());
  });

  it('produces values in [0, 1)', () => {
    const rng = makeRng(123);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('produces different sequences for different seeds', () => {
    expect(makeRng(1)()).not.toBe(makeRng(2)());
  });
});
