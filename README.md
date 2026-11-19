# 燒烏龜 · Burn Turtle

A pure-frontend mobile web app that digitizes the Taiwanese "burn turtle"
(燒烏龜，"烏雲歸去") sun-praying ritual. For hiking groups praying for clear
weather before a trip.

## Stack

- SvelteKit + Vite + TypeScript
- Vercel (auto-deploy from GitHub)
- `lunar-javascript` for lunar calendar conversion
- `html-to-image` for share-image generation
- No backend, no accounts, no analytics

## Development

```bash
npm install
npm run dev       # localhost:5173
npm test          # vitest
npm run check     # svelte-check
npm run build     # production build
```

## Trip pages

Per-trip static pages (itinerary + hourly weather chart) live outside the
ritual flow. Nothing in the UI links to them; they are reached by URL only.

| URL | Source file |
| --- | --- |
| `/trips/<YYYY-MM-DD>-<slug>/itinerary` | `static/trips/<YYYY-MM-DD>-<slug>/itinerary.html` |
| `/trips/<YYYY-MM-DD>-<slug>/weather` | `static/trips/<YYYY-MM-DD>-<slug>/weather.html` |
| `/trip-list` | built from every `static/trips/*/trip.json` |

To add a trip, create `static/trips/<YYYY-MM-DD>-<slug>/` with the two HTML
files, any images they reference (relative paths, e.g. `profile.png`), and a
`trip.json`:

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

Rules: every HTML file must contain `<meta name="robots" content="noindex">`;
never link to `/trip-list` from the app; do not list these paths in
`robots.txt`. Pages are prerendered at build time (`src/lib/trips/`); the route
must answer with `Content-Type: text/html` exactly (no charset), otherwise
SvelteKit stops treating it as a page and Vercel serves it as a download.
Adding a folder needs a rebuild/redeploy before its clean URLs exist.

## Manual test checklist

Before tagging a release, run through these on real devices:

### Setup stage
- [ ] Cannot proceed with empty date
- [ ] Cannot proceed with empty location
- [ ] Past-date confirms before proceeding
- [ ] Mode toggle persists when navigating back

### Ritual — draw mode
- [ ] Brush draws red strokes on yellow paper
- [ ] Stamp tool places turtles at tap location
- [ ] Eraser removes prior strokes/stamps
- [ ] Undo button removes last operation
- [ ] "燒" button disabled until ≥1 stroke or stamp exists
- [ ] Lunar date + location appear at bottom of paper
- [ ] Refreshing the page restores in-progress operations

### Ritual — auto mode
- [ ] 16 red turtles appear, all facing the sun
- [ ] Same date+location yields the same arrangement on reload
- [ ] Different date+location yields different arrangement
- [ ] "燒" button enabled immediately

### Burn animation
- [ ] Animation plays for ~4 seconds
- [ ] Edges char first, fire spreads, then smoke + ash
- [ ] Phone vibrates at start (Android)
- [ ] Auto-advances to share stage when finished
- [ ] Animation skips to end if tab is hidden mid-burn

### Share stage
- [ ] Ash image appears within ~2 seconds
- [ ] iOS Safari: tapping share opens iOS share sheet with image
- [ ] Android Chrome: tapping share opens Android share sheet
- [ ] Desktop: tapping share triggers PNG download
- [ ] LINE: shared image renders correctly in chat
- [ ] "再做一張" clears state and returns to setup

### Browser compatibility
- [ ] iOS Safari 15+
- [ ] Android Chrome 90+
- [ ] LINE in-app browser (Android + iOS)

## Spec & Plan

- Spec: `docs/superpowers/specs/2026-04-30-burn-turtle-design.md`
- Implementation plan: `docs/superpowers/plans/2026-04-30-burn-turtle.md`
