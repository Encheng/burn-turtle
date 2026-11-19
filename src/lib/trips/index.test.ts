import { describe, it, expect } from 'vitest';
import { registry } from './index';

describe('trip registry (real static files)', () => {
  it('serves the dabajian weather page', () => {
    const html = registry.getPage('2026-11-20-dabajian', 'weather');
    expect(html).toContain('<meta name="robots" content="noindex">');
    expect(html).toContain('大霸尖山');
  });
  it('lists the dabajian trip with both page links', () => {
    const trip = registry.trips().find((t) => t.slug === '2026-11-20-dabajian');
    expect(trip?.title).toBe('大小霸 3 天 2 夜');
    expect(trip?.pages.map((p) => p.href)).toEqual([
      '/trips/2026-11-20-dabajian/itinerary',
      '/trips/2026-11-20-dabajian/weather'
    ]);
  });
});
