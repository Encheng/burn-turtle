/**
 * Pure lookup tables for trip pages. Inputs are the two maps that
 * `import.meta.glob` produces for `static/trips/<slug>/*.html` and
 * `static/trips/<slug>/trip.json`; nothing here touches the filesystem.
 */

export interface TripManifest {
  title: string;
  subtitle?: string;
  dates: { start: string; end: string }; // ISO yyyy-mm-dd
  pages: { label: string; file: string }[]; // file e.g. 'weather.html'
}

export interface TripSummary {
  slug: string;
  title: string;
  subtitle?: string;
  dates: { start: string; end: string };
  pages: { label: string; href: string }[]; // href e.g. '/trips/<slug>/weather'
}

export interface TripRegistry {
  getPage(slug: string, page: string): string | undefined;
  entries(): { slug: string; page: string }[];
  trips(): TripSummary[];
}

const HTML_PATH = /^\/static\/trips\/([^/]+)\/([^/]+)\.html$/;
const MANIFEST_PATH = /^\/static\/trips\/([^/]+)\/trip\.json$/;

export function parseHtmlPath(path: string): { slug: string; page: string } | null {
  const m = HTML_PATH.exec(path);
  return m ? { slug: m[1], page: m[2] } : null;
}

export function parseManifestPath(path: string): string | null {
  const m = MANIFEST_PATH.exec(path);
  return m ? m[1] : null;
}

export function buildRegistry(
  html: Record<string, string>,
  manifests: Record<string, TripManifest>
): TripRegistry {
  const pages = new Map<string, string>();
  const entries: { slug: string; page: string }[] = [];
  for (const [path, content] of Object.entries(html)) {
    const parsed = parseHtmlPath(path);
    if (!parsed) continue;
    pages.set(`${parsed.slug}/${parsed.page}`, content);
    entries.push(parsed);
  }

  const trips: TripSummary[] = [];
  for (const [path, manifest] of Object.entries(manifests)) {
    const slug = parseManifestPath(path);
    if (!slug) continue;
    trips.push({
      slug,
      title: manifest.title,
      subtitle: manifest.subtitle,
      dates: manifest.dates,
      pages: manifest.pages.map((p) => ({
        label: p.label,
        href: `/trips/${slug}/${p.file.replace(/\.html$/, '')}`
      }))
    });
  }
  trips.sort((a, b) => b.dates.start.localeCompare(a.dates.start));

  return {
    getPage: (slug, page) => pages.get(`${slug}/${page}`),
    entries: () => entries.map((e) => ({ ...e })),
    trips: () => trips.map((t) => ({ ...t, pages: t.pages.map((p) => ({ ...p })) }))
  };
}
