import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import Page from './+page.svelte';
import type { TripSummary } from '$lib/trips';

const trips: TripSummary[] = [
  {
    slug: '2027-01-05-b',
    title: '雪山',
    dates: { start: '2027-01-05', end: '2027-01-06' },
    pages: [{ label: '行程', href: '/trips/2027-01-05-b/itinerary' }]
  },
  {
    slug: '2026-11-20-a',
    title: '大小霸 3 天 2 夜',
    subtitle: '九九山莊二泊',
    dates: { start: '2026-11-20', end: '2026-11-22' },
    pages: [
      { label: '行程', href: '/trips/2026-11-20-a/itinerary' },
      { label: '天氣', href: '/trips/2026-11-20-a/weather' }
    ]
  }
];

describe('/trip-list', () => {
  afterEach(cleanup);

  it('renders one card per trip in given order with page links', () => {
    const { getAllByRole, getByText } = render(Page, { props: { data: { trips } } });
    const headings = getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(['雪山', '大小霸 3 天 2 夜']);
    expect(getByText('九九山莊二泊')).toBeInTheDocument();
    expect(getByText('2026-11-20 – 2026-11-22')).toBeInTheDocument();
    const links = getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(links).toEqual([
      '/trips/2027-01-05-b/itinerary',
      '/trips/2026-11-20-a/itinerary',
      '/trips/2026-11-20-a/weather'
    ]);
  });

  it('shows an empty state when there are no trips', () => {
    const { getByText } = render(Page, { props: { data: { trips: [] } } });
    expect(getByText('還沒有行程')).toBeInTheDocument();
  });
});
