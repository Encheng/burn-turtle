import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';
import DrawCanvas from './DrawCanvas.svelte';
import { ritual } from '$lib/stores/ritual';
import { DEFAULT_RITUAL } from '$lib/utils/types';

describe('DrawCanvas', () => {
  beforeEach(() => {
    ritual.set({ ...DEFAULT_RITUAL });
  });

  it('starts with no operations', () => {
    render(DrawCanvas, { props: { tool: 'brush' } });
    expect(get(ritual).operations.length).toBe(0);
  });

  it('placeStamp adds a stamp op at given coordinates', async () => {
    const { component } = render(DrawCanvas, { props: { tool: 'stamp' } });
    component.placeStamp(50, 100);
    const ops = get(ritual).operations;
    expect(ops.length).toBe(1);
    expect(ops[0].type).toBe('stamp');
    if (ops[0].type === 'stamp') {
      expect(ops[0].x).toBe(50);
      expect(ops[0].y).toBe(100);
    }
  });

  it('undo() removes the last op', async () => {
    const { component } = render(DrawCanvas, { props: { tool: 'stamp' } });
    component.placeStamp(10, 10);
    component.placeStamp(20, 20);
    expect(get(ritual).operations.length).toBe(2);
    component.undo();
    expect(get(ritual).operations.length).toBe(1);
  });
});
