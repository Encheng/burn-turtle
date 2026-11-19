import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';
import BurnEffect from './BurnEffect.svelte';

const FAKE = {
  toFake: [
    'setTimeout',
    'clearTimeout',
    'setInterval',
    'clearInterval',
    'Date',
    'performance',
    'requestAnimationFrame',
    'cancelAnimationFrame'
  ] as const
};

function mockMatchMedia(reduce: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((q: string) => ({
      matches: reduce && q.includes('prefers-reduced-motion'),
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }))
  });
}

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
}

function holeD(container: HTMLElement): string {
  return container.querySelector('#burn-clip path')?.getAttribute('d') ?? '';
}

describe('BurnEffect', () => {
  beforeEach(() => {
    vi.useFakeTimers(FAKE as any);
    mockMatchMedia(false);
    setHidden(false);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('dispatches done exactly once at 4000ms', () => {
    const { component } = render(BurnEffect);
    const done = vi.fn();
    component.$on('done', done);
    vi.advanceTimersByTime(3999);
    expect(done).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(done).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(2000);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('jumps to the end and dispatches done once when the tab is hidden', () => {
    const { component } = render(BurnEffect);
    const done = vi.fn();
    component.$on('done', done);
    vi.advanceTimersByTime(800);
    setHidden(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(done).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5000);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('dispatches done at 1200ms under reduced motion', () => {
    mockMatchMedia(true);
    const { component } = render(BurnEffect);
    const done = vi.fn();
    component.$on('done', done);
    vi.advanceTimersByTime(1199);
    expect(done).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('renders an objectBoundingBox clipPath with id burn-clip', () => {
    const { container } = render(BurnEffect);
    const clip = container.querySelector('clipPath#burn-clip');
    expect(clip).not.toBeNull();
    expect(clip?.getAttribute('clipPathUnits')).toBe('objectBoundingBox');
    expect(clip?.querySelector('path')?.getAttribute('clip-rule')).toBe('evenodd');
  });

  it('starts the clip with an outer rect larger than the paper so no edge sliver survives', () => {
    const { container } = render(BurnEffect);
    expect(holeD(container).startsWith('M-300 -400H600V800H-300Z')).toBe(true);
  });

  it('grows the hole over time', async () => {
    const { container } = render(BurnEffect);
    vi.advanceTimersByTime(500);
    await tick(); // Svelte flushes DOM updates in a microtask
    const early = holeD(container);
    vi.advanceTimersByTime(1500);
    await tick();
    const later = holeD(container);
    expect(early).not.toBe('');
    expect(later).not.toBe(early);
  });

  it('vibrates at ignition even under reduced motion', () => {
    mockMatchMedia(true);
    const vibrate = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'vibrate', { configurable: true, writable: true, value: vibrate });
    render(BurnEffect);
    expect(vibrate).toHaveBeenCalledWith(50);
  });

  it('does not fire the second vibration after being destroyed', () => {
    const vibrate = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'vibrate', { configurable: true, writable: true, value: vibrate });
    const { unmount } = render(BurnEffect);
    vi.advanceTimersByTime(500);
    unmount();
    vi.advanceTimersByTime(2000);
    expect(vibrate).toHaveBeenCalledTimes(1);
  });

  it('emits a frame event on every animation frame so the host can force a repaint', () => {
    const { component } = render(BurnEffect);
    const onFrame = vi.fn();
    component.$on('frame', onFrame);
    vi.advanceTimersByTime(200);
    expect(onFrame.mock.calls.length).toBeGreaterThanOrEqual(10);
  });

  it('stops the animation loop on destroy', () => {
    const cancel = vi.spyOn(window, 'cancelAnimationFrame');
    const { unmount } = render(BurnEffect);
    vi.advanceTimersByTime(200);
    unmount();
    expect(cancel).toHaveBeenCalled();
  });
});
