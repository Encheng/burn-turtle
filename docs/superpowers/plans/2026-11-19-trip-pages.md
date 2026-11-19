# Trip Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve per-trip static HTML pages (itinerary + weather chart) at extension-less URLs `/trips/<YYYY-MM-DD>-<slug>/<page>`, plus a hidden `/trip-list` index, with the first trip (大小霸 2026-11-20) in place.

**Architecture:** Trip content lives in `static/trips/<slug>/` as raw HTML, a `trip.json` manifest and images. A pure registry module (`src/lib/trips/registry.ts`) turns two `import.meta.glob` maps into lookups; a `+server.ts` route returns the HTML for `/trips/[slug]/[page]`, prerendered so Vercel serves plain files; `/trip-list` is a prerendered page reading the same registry. Nothing links to these pages from the existing `/` flow.

**Tech Stack:** SvelteKit 2, Svelte 4, Vite `import.meta.glob` (`?raw`), Vitest + @testing-library/svelte, adapter-vercel.

**Spec:** `docs/superpowers/specs/2026-11-19-trip-pages-design.md`

## Global Constraints

- URL format: `/trips/<YYYY-MM-DD>-<slug>/itinerary`, `/trips/<YYYY-MM-DD>-<slug>/weather`, `/trip-list`. No file extension in links.
- Content files: `static/trips/<slug>/itinerary.html`, `weather.html`, `profile.png`, `trip.json`.
- This trip's slug: `2026-11-20-dabajian`.
- No new npm dependencies. No changes to `src/routes/+page.svelte` or the existing ritual components.
- No links to `/trip-list` or `/trips/...` anywhere in UI. No entries added to `static/robots.txt`.
- Every served trip HTML and the list page carry `<meta name="robots" content="noindex">`.
- Prerendered endpoint responses must use `Content-Type: text/html` **exactly** (no charset suffix): SvelteKit only classifies a prerendered response as a page (and adapter-vercel only maps `x.html` → `/x`) when the header equals `text/html`. Charset comes from `<meta charset="utf-8">` inside each file.
- Working tree already has unrelated uncommitted changes (burn animation v2). Commit only the files each task names; never `git add -A`.

## Review Focus

- Unknown slug or page (`/trips/nope/weather`, `/trips/2026-11-20-dabajian/foo`) must 404, not 500. Pinned by Task 3 test.
- Lookups must never touch the filesystem with user input; `../` style params fall through to 404. Pinned by Task 1 test (`getPage('../etc', 'passwd')` → undefined).
- Two or more trips must list newest `dates.start` first regardless of glob key order. Pinned by Task 1 test.
- The itinerary HTML references `profile.png` relatively; it must resolve under the extension-less route (`/trips/<slug>/profile.png`). Checked in Task 5 verification.
- The weather HTML must still run its inline scripts when served through the route (no wrapping, no `{@html}`). Checked in Task 6 build verification.

---

### Task 1: Trip registry (pure module)

**Files:**
- Create: `src/lib/trips/registry.ts`
- Test: `src/lib/trips/registry.test.ts`

**Interfaces:**
- Produces:
  ```ts
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
    getPage(slug: string, page: string): string | undefined; // raw HTML
    entries(): { slug: string; page: string }[];
    trips(): TripSummary[]; // sorted by dates.start desc
  }
  export function parseHtmlPath(path: string): { slug: string; page: string } | null;
  export function parseManifestPath(path: string): string | null;
  export function buildRegistry(
    html: Record<string, string>,
    manifests: Record<string, TripManifest>
  ): TripRegistry;
  ```
  Path keys are what Vite's glob produces: `/static/trips/<slug>/<page>.html` and `/static/trips/<slug>/trip.json`.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { parseHtmlPath, parseManifestPath, buildRegistry, type TripManifest } from './registry';

const manifestA: TripManifest = {
  title: 'A', dates: { start: '2026-11-20', end: '2026-11-22' },
  pages: [{ label: '行程', file: 'itinerary.html' }, { label: '天氣', file: 'weather.html' }]
};
const manifestB: TripManifest = {
  title: 'B', dates: { start: '2027-01-05', end: '2027-01-06' },
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
    expect(parseHtmlPath('/static/trips/2026-11-20-a/weather.html')).toEqual({ slug: '2026-11-20-a', page: 'weather' });
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
    expect(reg.entries()).toEqual(expect.arrayContaining([
      { slug: '2026-11-20-a', page: 'itinerary' },
      { slug: '2026-11-20-a', page: 'weather' },
      { slug: '2027-01-05-b', page: 'itinerary' }
    ]));
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/trips/registry.test.ts`
Expected: FAIL, module `./registry` not found.

- [ ] **Step 3: Implement `src/lib/trips/registry.ts`**

Parse paths with one regex each (`^/static/trips/([^/]+)/([^/]+)\.html$`, `^/static/trips/([^/]+)/trip\.json$`). `buildRegistry` builds a `Map<string, string>` keyed `${slug}/${page}` from the html map; `getPage` is a plain map lookup. `trips()` maps manifests to summaries, href `/trips/${slug}/${file.replace(/\.html$/, '')}`, sorted by `dates.start` descending with `localeCompare`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/trips/registry.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/trips/registry.ts src/lib/trips/registry.test.ts
git commit -m "feat(trips): add pure trip registry built from glob maps"
```

---

### Task 2: Trip content folder + glob wiring

**Files:**
- Create: `static/trips/2026-11-20-dabajian/weather.html` (moved from repo root `大小霸天氣_1120-1122.html`)
- Create: `static/trips/2026-11-20-dabajian/trip.json`
- Create: `static/trips/2026-11-20-dabajian/profile.png` (extracted from `大小霸行程.docx` → `word/media/image1.png`)
- Create: `src/lib/trips/index.ts`
- Test: `src/lib/trips/index.test.ts`

**Interfaces:**
- Consumes: `buildRegistry`, `TripManifest` from Task 1.
- Produces: `export const registry: TripRegistry` from `src/lib/trips/index.ts`.

- [ ] **Step 1: Move the weather HTML and add the noindex meta**

```bash
mkdir -p static/trips/2026-11-20-dabajian
mv "大小霸天氣_1120-1122.html" static/trips/2026-11-20-dabajian/weather.html
```

Insert `<meta name="robots" content="noindex">` immediately after the `<meta name="viewport" ...>` line in `weather.html`. Change nothing else in the file.

- [ ] **Step 2: Extract the elevation profile image**

```bash
unzip -p "大小霸行程.docx" word/media/image1.png > static/trips/2026-11-20-dabajian/profile.png
file static/trips/2026-11-20-dabajian/profile.png
```
Expected: `PNG image data, 1800 x 1720`.

- [ ] **Step 3: Write `static/trips/2026-11-20-dabajian/trip.json`**

```json
{
  "title": "大小霸 3 天 2 夜",
  "subtitle": "九九山莊二泊 · 大鹿林道東線進出 · 4 座百岳",
  "dates": { "start": "2026-11-20", "end": "2026-11-22" },
  "pages": [
    { "label": "行程", "file": "itinerary.html" },
    { "label": "天氣", "file": "weather.html" }
  ]
}
```

- [ ] **Step 4: Write the failing test `src/lib/trips/index.test.ts`**

```ts
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
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npx vitest run src/lib/trips/index.test.ts`
Expected: FAIL, `./index` not found.

- [ ] **Step 6: Implement `src/lib/trips/index.ts`**

```ts
import { buildRegistry, type TripManifest } from './registry';

const html = import.meta.glob('/static/trips/*/*.html', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const manifests = import.meta.glob('/static/trips/*/trip.json', { import: 'default', eager: true }) as Record<string, TripManifest>;

export const registry = buildRegistry(html, manifests);
export type { TripSummary } from './registry';
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run src/lib/trips`
Expected: PASS (index + registry tests). The itinerary link test passes from the manifest alone; the file itself arrives in Task 5.

- [ ] **Step 8: Commit**

```bash
git add src/lib/trips/index.ts src/lib/trips/index.test.ts static/trips/2026-11-20-dabajian/weather.html static/trips/2026-11-20-dabajian/trip.json static/trips/2026-11-20-dabajian/profile.png
git commit -m "feat(trips): add dabajian trip assets and glob-backed registry"
```

Do not commit `大小霸行程.docx`; it stays untracked at the repo root as the source document.

---

### Task 3: Extension-less route `/trips/[slug]/[page]`

**Files:**
- Create: `src/routes/trips/[slug]/[page]/+server.ts`
- Test: `src/routes/trips/[slug]/[page]/server.test.ts`

**Interfaces:**
- Consumes: `registry` from Task 2.
- Produces: `GET: RequestHandler`, `prerender = true`, `entries: EntryGenerator`.

- [ ] **Step 1: Write the failing test**

```ts
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
    expect(entries()).toEqual(expect.arrayContaining([{ slug: '2026-11-20-dabajian', page: 'weather' }]));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/routes/trips`
Expected: FAIL, `./+server` not found.

- [ ] **Step 3: Implement `+server.ts`**

```ts
import { error } from '@sveltejs/kit';
import type { EntryGenerator, RequestHandler } from './$types';
import { registry } from '$lib/trips';

export const prerender = true;
export const entries: EntryGenerator = () => registry.entries();

export const GET: RequestHandler = ({ params }) => {
  const html = registry.getPage(params.slug, params.page);
  if (html === undefined) error(404, 'Not found');
  return new Response(html, { headers: { 'content-type': 'text/html', 'x-robots-tag': 'noindex' } });
};
```

`error(404)` throws synchronously; the test's `rejects` works because the `call` wrapper is `async`, which turns the throw into a rejection. Keep `content-type` exactly `text/html` (see Global Constraints).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/routes/trips`
Expected: PASS (4 tests).

- [ ] **Step 5: Smoke test in dev**

Run: `npm run dev -- --port 5173 &` then `curl -sI http://localhost:5173/trips/2026-11-20-dabajian/weather | head -5` and `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5173/trips/x/y`.
Expected: first shows `200` and `content-type: text/html`; second prints `404`. Stop the dev server afterwards.

- [ ] **Step 6: Commit**

```bash
git add "src/routes/trips/[slug]/[page]/+server.ts" "src/routes/trips/[slug]/[page]/server.test.ts"
git commit -m "feat(trips): serve trip html at extension-less /trips/[slug]/[page]"
```

---

### Task 4: Hidden list page `/trip-list`

**Files:**
- Create: `src/routes/trip-list/+page.ts`
- Create: `src/routes/trip-list/+page.svelte`
- Test: `src/routes/trip-list/page.test.ts`

**Interfaces:**
- Consumes: `registry.trips(): TripSummary[]` from Task 2.
- Produces: page `data.trips: TripSummary[]`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import Page from './+page.svelte';
import type { TripSummary } from '$lib/trips';

const trips: TripSummary[] = [
  { slug: '2027-01-05-b', title: '雪山', dates: { start: '2027-01-05', end: '2027-01-06' },
    pages: [{ label: '行程', href: '/trips/2027-01-05-b/itinerary' }] },
  { slug: '2026-11-20-a', title: '大小霸 3 天 2 夜', subtitle: '九九山莊二泊',
    dates: { start: '2026-11-20', end: '2026-11-22' },
    pages: [{ label: '行程', href: '/trips/2026-11-20-a/itinerary' }, { label: '天氣', href: '/trips/2026-11-20-a/weather' }] }
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
    expect(links).toEqual(['/trips/2027-01-05-b/itinerary', '/trips/2026-11-20-a/itinerary', '/trips/2026-11-20-a/weather']);
  });

  it('shows an empty state when there are no trips', () => {
    const { getByText } = render(Page, { props: { data: { trips: [] } } });
    expect(getByText('還沒有行程')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/routes/trip-list`
Expected: FAIL, `./+page.svelte` not found.

- [ ] **Step 3: Implement `+page.ts`**

```ts
import type { PageLoad } from './$types';
import { registry } from '$lib/trips';

export const prerender = true;
export const load: PageLoad = () => ({ trips: registry.trips() });
```

- [ ] **Step 4: Implement `+page.svelte`**

Requirements the test and spec pin:
- `export let data: { trips: TripSummary[] }`.
- `<svelte:head>`: `<title>登山行程</title>` and `<meta name="robots" content="noindex" />`.
- `<h1>登山行程</h1>`; one `<article>` per trip with `<h2>{title}</h2>`, optional `<p>` subtitle, `<p>{dates.start} – {dates.end}</p>` (en dash, spaces as in the test), and an `<a>` per page in manifest order.
- Empty state text exactly `還沒有行程`.
- Styling uses existing tokens from `src/app.css` (`--surface`, `--ink-deep`, `--radius-md`, `--space-*`); cards on the navy page background; links at least `--tap-min` tall. Mobile-first single column, `max-width: 640px` centered.
- No link back to `/` and no link from `/` to here.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/routes/trip-list`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/routes/trip-list/+page.ts src/routes/trip-list/+page.svelte src/routes/trip-list/page.test.ts
git commit -m "feat(trips): add hidden /trip-list index page"
```

---

### Task 5: Itinerary HTML for 大小霸 (from docx)

**Files:**
- Create: `static/trips/2026-11-20-dabajian/itinerary.html`

**Interfaces:**
- Consumes: served by Task 3 at `/trips/2026-11-20-dabajian/itinerary`; `profile.png` from Task 2 in the same folder.

- [ ] **Step 1: Extract the docx text in document order**

```bash
python3 - <<'EOF'
import zipfile,re
x=zipfile.ZipFile('大小霸行程.docx').read('word/document.xml').decode()
body=x[x.find('<w:body>'):]
for m in re.finditer(r'<w:tbl>.*?</w:tbl>|<w:p[ >].*?</w:p>',body,re.S):
    b=m.group(0)
    if b.startswith('<w:tbl>'):
        print('[TABLE]')
        for row in re.findall(r'<w:tr[ >].*?</w:tr>',b,re.S):
            print(' | '.join(' / '.join(''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>',p)) for p in re.findall(r'<w:p[ >].*?</w:p>',c,re.S)).strip() for c in re.findall(r'<w:tc>.*?</w:tc>',row,re.S)))
        print('[/TABLE]')
    else:
        t=''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>',b))
        if t.strip(): print(t)
EOF
```

- [ ] **Step 2: Write `itinerary.html`**

A single self-contained file (inline CSS only, no scripts needed, no external requests). Pin these:
- `<!DOCTYPE html><html lang="zh-TW">`, `<meta charset="utf-8">`, viewport meta with `viewport-fit=cover`, `<meta name="robots" content="noindex">`, `<title>大小霸 3 天 2 夜 · 11/20–11/22 行程</title>`.
- Copy the `:root` / dark-mode token block and `html`, `body`, `.tw-page`, `.tw-title` rules from `weather.html` so both pages look like one set (cream light / near-black dark, system + PingFang/Noto TC fonts, 1100px max width, safe-area padding).
- Content, in docx order, every table and paragraph included, nothing paraphrased: header (eyebrow `DABAJIAN · XIAOBAJIAN · YIZE · JIALI`, h1, subtitle line, 4 stat tiles, intro paragraph); `00 行前必確認`; `01 詳細行程` with `<img src="profile.png" alt="每日海拔剖面" style="max-width:100%;height:auto">` before the three DAY tables, the 時間檢核 table, 結論, 奇萊南華 estimate tables; `02 九九山莊`; `03 配給`; `04 裝備清單` (each `☐` item as a `<li>` inside a `<ul class="checklist">`, keep the `☐` glyph as text); `05 高山症與安全`; `06 協作費用與退費期限`; closing 資料來源 paragraph.
- Section numbers (`00`–`06`) as `<h2 id="s00">` … `<h2 id="s06">`; a nav row under the header linking `#s00`…`#s06`.
- Timetable rows are `<table>` with columns 時間 / 地點 / 備註; 2-cell docx rows (callout boxes) become `<aside class="callout">`.
- Tables wider than the viewport scroll inside a `div.scroll { overflow-x:auto }`; the page body must never scroll horizontally.
- A link at the end of the header to `weather` (relative, resolves to `/trips/2026-11-20-dabajian/weather`) labelled `每小時天氣預報 →`.

- [ ] **Step 3: Verify structure**

```bash
f=static/trips/2026-11-20-dabajian/itinerary.html
grep -c 'name="robots" content="noindex"' $f      # 1
grep -c 'src="profile.png"' $f                     # 1
grep -o 'id="s0[0-6]"' $f | sort -u | wc -l        # 7
grep -c '☐' $f                                     # 25 (number of checklist items in the docx)
grep -c '<script' $f                               # 0
```

- [ ] **Step 4: Verify in the browser**

Run `npm run dev -- --port 5173 &`, open `http://localhost:5173/trips/2026-11-20-dabajian/itinerary` at 390px width and at desktop. Expected: profile image loads (Network shows `/trips/2026-11-20-dabajian/profile.png` 200), no horizontal page scroll, dark mode switches with the OS, the weather link opens the chart. Stop the dev server.

- [ ] **Step 5: Run the full suite**

Run: `npx vitest run`
Expected: all green, including `src/lib/trips/index.test.ts`.

- [ ] **Step 6: Commit**

```bash
git add static/trips/2026-11-20-dabajian/itinerary.html
git commit -m "content(trips): add dabajian 2026-11-20 itinerary page"
```

---

### Task 6: Production build check + README

**Files:**
- Modify: `README.md` (add a "Trip pages" section after "Development")

- [ ] **Step 1: Build and inspect the prerendered output**

```bash
npm run build
ls .svelte-kit/output/prerendered/pages/trips/2026-11-20-dabajian/
ls .svelte-kit/output/prerendered/pages/ | grep trip-list
grep -c 'overrides' .vercel/output/config.json
node -e "const c=require('./.vercel/output/config.json');console.log(c.overrides['trips/2026-11-20-dabajian/weather.html'], c.overrides['trip-list.html'])"
```
Expected: `itinerary.html` and `weather.html` listed; `trip-list.html` present; the node line prints `{ path: 'trips/2026-11-20-dabajian/weather' } { path: 'trip-list' }`.

- [ ] **Step 2: Preview and exercise the weather chart**

Run `npm run preview -- --port 4173 &`, open `http://localhost:4173/trips/2026-11-20-dabajian/weather`. Expected: chart renders, the three elevation buttons re-draw it, hovering shows the tooltip (proves inline scripts execute when served via the route). Open `http://localhost:4173/trip-list` and click both links. Stop the preview server.

- [ ] **Step 3: Run checks**

Run: `npm run check && npx vitest run`
Expected: svelte-check reports 0 errors in the new files (pre-existing warnings elsewhere are out of scope); tests green.

- [ ] **Step 4: Document in README**

Add under a new `## Trip pages` heading: the three URL patterns, the folder layout `static/trips/<YYYY-MM-DD>-<slug>/{itinerary.html,weather.html,profile.png,trip.json}`, the `trip.json` shape, the rule that nothing in the UI links to `/trip-list`, and that every HTML file must contain the noindex meta. Keep it under 25 lines.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: describe trip pages layout and URLs"
```
