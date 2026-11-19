import { describe, it, expect } from 'vitest';
import { parseHtmlPath, parseManifestPath, buildRegistry, type TripManifest } from './registry';

const manifestA: TripManifest = {
  title: 'A',
  dates: { start: '2026-11-20', end: '2026-11-22' },
  pages: [
    { label: '行程', file: 'itinerary.html' },
    { label: '天氣', file: 'weather.html' }
  ]
};
const manifestB: TripManifest = {
  title: 'B',
  dates: { start: '2027-01-05', end: '2027-01-06' },
  pages: [{ label: '行程', file: 'itinerary.html' }]
};
const html = {
  '/static/trips/2026-11-20-a/itinerary.html': '<p>a-it</p>',
  '/static/trips/2026-11-20-a/weather.html': '<p>a-wx</p>',
  '/static/trips/2027-01-05-b/itinerary.html': '<p>b-it</p>'
};
const manifests = {
  '/static/trips/2026-11-20-a/trip.json': manifestA,
  '/static/trips/2027-01-05-b/trip.json': manifestB
};

describe('parseHtmlPath', () => {
  it('extracts slug and page', () => {
    expect(parseHtmlPath('/static/trips/2026-11-20-a/weather.html')).toEqual({
      slug: '2026-11-20-a',
      page: 'weather'
    });
  });
  it('rejects paths outside static/trips', () => {
    expect(parseHtmlPath('/static/other/x.html')).toBeNull();
  });
});

describe('parseManifestPath', () => {
  it('extracts slug', () => {
    expect(parseManifestPath('/static/trips/2026-11-20-a/trip.json')).toBe('2026-11-20-a');
  });
});

describe('buildRegistry', () => {
  const reg = buildRegistry(html, manifests);
  it('returns raw html for a known slug/page', () => {
    expect(reg.getPage('2026-11-20-a', 'weather')).toBe('<p>a-wx</p>');
  });
  it('returns undefined for unknown page and for traversal-like input', () => {
    expect(reg.getPage('2026-11-20-a', 'nope')).toBeUndefined();
    expect(reg.getPage('../etc', 'passwd')).toBeUndefined();
  });
  it('lists every slug/page entry', () => {
    expect(reg.entries()).toEqual(
      expect.arrayContaining([
        { slug: '2026-11-20-a', page: 'itinerary' },
        { slug: '2026-11-20-a', page: 'weather' },
        { slug: '2027-01-05-b', page: 'itinerary' }
      ])
    );
    expect(reg.entries()).toHaveLength(3);
  });
  it('lists trips newest first with route hrefs', () => {
    const trips = reg.trips();
    expect(trips.map((t) => t.slug)).toEqual(['2027-01-05-b', '2026-11-20-a']);
    expect(trips[1].pages).toEqual([
      { label: '行程', href: '/trips/2026-11-20-a/itinerary' },
      { label: '天氣', href: '/trips/2026-11-20-a/weather' }
    ]);
  });
});
