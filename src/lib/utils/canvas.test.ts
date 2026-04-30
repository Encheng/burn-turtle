import { describe, it, expect } from 'vitest';
import { canBurn, popOp, addOp } from './canvas';
import type { Op } from './types';

describe('canBurn', () => {
  it('false for empty operations', () => {
    expect(canBurn([])).toBe(false);
  });

  it('false when only erase operations exist', () => {
    const ops: Op[] = [{ type: 'erase', points: [{ x: 0, y: 0 }], size: 10 }];
    expect(canBurn(ops)).toBe(false);
  });

  it('true with at least one stroke', () => {
    const ops: Op[] = [{ type: 'stroke', points: [{ x: 0, y: 0 }], size: 3 }];
    expect(canBurn(ops)).toBe(true);
  });

  it('true with at least one stamp', () => {
    const ops: Op[] = [{ type: 'stamp', x: 1, y: 2, variant: 0 }];
    expect(canBurn(ops)).toBe(true);
  });
});

describe('addOp', () => {
  it('appends without mutating original', () => {
    const a: Op[] = [];
    const b = addOp(a, { type: 'stamp', x: 0, y: 0, variant: 0 });
    expect(a.length).toBe(0);
    expect(b.length).toBe(1);
  });
});

describe('popOp', () => {
  it('returns shorter array', () => {
    const ops: Op[] = [
      { type: 'stamp', x: 0, y: 0, variant: 0 },
      { type: 'stamp', x: 1, y: 1, variant: 1 }
    ];
    const result = popOp(ops);
    expect(result.length).toBe(1);
    expect(ops.length).toBe(2); // original not mutated
  });

  it('returns empty array when popping empty', () => {
    expect(popOp([])).toEqual([]);
  });
});
