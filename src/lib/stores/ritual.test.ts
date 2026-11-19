import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';

const STORAGE_KEY = 'burn-turtle:ritual';

describe('ritual store', () => {
  beforeEach(() => {
    // Fake timers so the store's 500 ms debounced write from a previous
    // test can never fire mid-import and overwrite this test's fixture.
    vi.useFakeTimers();
    localStorage.clear();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes from default when localStorage empty', async () => {
    const { ritual } = await import('./ritual');
    const r = get(ritual);
    expect(r.date).toBe('');
    expect(r.location).toBe('');
    expect(r.mode).toBe('draw');
    expect(r.operations).toEqual([]);
  });

  it('restores from localStorage on import', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        date: '2026-05-15',
        location: '玉山',
        mode: 'auto',
        operations: []
      })
    );
    const { ritual } = await import('./ritual');
    const r = get(ritual);
    expect(r.date).toBe('2026-05-15');
    expect(r.location).toBe('玉山');
    expect(r.mode).toBe('auto');
  });

  it('persists changes to localStorage (debounced)', async () => {
    vi.useFakeTimers();
    const { ritual } = await import('./ritual');
    ritual.set({
      date: '2026-06-01',
      location: '合歡山',
      mode: 'draw',
      operations: []
    });
    vi.advanceTimersByTime(600);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    expect(stored.date).toBe('2026-06-01');
    expect(stored.location).toBe('合歡山');
  });

  it('clearRitual resets store and removes from storage', async () => {
    const { ritual, clearRitual } = await import('./ritual');
    ritual.set({
      date: '2026-06-01',
      location: '合歡山',
      mode: 'draw',
      operations: []
    });
    clearRitual();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(get(ritual).date).toBe('');
  });

  it('survives malformed localStorage by falling back to default', async () => {
    localStorage.setItem(STORAGE_KEY, 'not json');
    const { ritual } = await import('./ritual');
    expect(get(ritual).date).toBe('');
  });
});
