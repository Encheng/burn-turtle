import { buildRegistry, type TripManifest } from './registry';

// Both globs are resolved at build time; adding a trip means adding a folder
// under static/trips/<YYYY-MM-DD>-<slug>/ — no code change.
const html = import.meta.glob('/static/trips/*/*.html', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>;

const manifests = import.meta.glob('/static/trips/*/trip.json', {
  import: 'default',
  eager: true
}) as Record<string, TripManifest>;

export const registry = buildRegistry(html, manifests);
export type { TripSummary } from './registry';
