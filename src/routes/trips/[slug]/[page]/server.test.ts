import { describe, it, expect } from 'vitest';
import { GET, entries, prerender } from './+server';

const call = async (slug: string, page: string) =>
  // @ts-expect-error minimal event for unit test
  GET({ params: { slug, page } });

describe('GET /trips/[slug]/[page]', () => {
  it('returns the raw html with exact text/html content type', async () => {
    const res = await call('2026-11-20-dabajian', 'weather');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/html');
    expect(res.headers.get('x-robots-tag')).toBe('noindex');
    expect(await res.text()).toContain('大霸尖山');
  });
  it('throws a 404 for an unknown page', async () => {
    await expect(call('2026-11-20-dabajian', 'nope')).rejects.toMatchObject({ status: 404 });
  });
  it('throws a 404 for an unknown slug', async () => {
    await expect(call('nope', 'weather')).rejects.toMatchObject({ status: 404 });
  });
  it('is prerendered with every registry entry', () => {
    expect(prerender).toBe(true);
    expect(entries()).toEqual(
      expect.arrayContaining([{ slug: '2026-11-20-dabajian', page: 'weather' }])
    );
  });
});
