import { describe, it, expect } from 'vitest';
import { load, prerender } from './+page.server';
import type { TripSummary } from '$lib/trips';

describe('/trip-list server load', () => {
  it('is prerendered and returns the registry trips from a server-only module', async () => {
    expect(prerender).toBe(true);
    // @ts-expect-error minimal event for unit test
    const data = (await load({})) as { trips: TripSummary[] };
    expect(data.trips.map((t) => t.slug)).toContain('2026-11-20-dabajian');
  });
});
