import type { Op } from './types';

export function canBurn(ops: Op[]): boolean {
  return ops.some((op) => op.type === 'stroke' || op.type === 'stamp');
}

export function addOp(ops: Op[], op: Op): Op[] {
  return [...ops, op];
}

export function popOp(ops: Op[]): Op[] {
  return ops.slice(0, -1);
}
