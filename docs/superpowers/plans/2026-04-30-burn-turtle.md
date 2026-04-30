# 燒烏龜（Burn Turtle）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure-frontend mobile-web ritual app that lets users perform the Taiwanese "burn turtle" sun-praying ritual digitally, then share the result image to LINE.

**Architecture:** Single-page SvelteKit app with 4 stages (setup → ritual → burn → share). Two ritual modes (hand-draw on Canvas overlay vs. auto-generated SVG turtle array) sharing one Taoist-Fu-charm SVG frame. State held in two Svelte stores with localStorage persistence. PNG capture via `html-to-image` for Web Share API distribution. No backend.

**Tech Stack:** SvelteKit + Vite + TypeScript, `lunar-javascript`, `html-to-image`, Vitest, @testing-library/svelte, Vercel.

**Spec:** `docs/superpowers/specs/2026-04-30-burn-turtle-design.md`

---

## File Map

Files this plan creates (in order of creation):

- `package.json`, `tsconfig.json`, `svelte.config.js`, `vite.config.ts`, `vitest.config.ts` — scaffolding (Task 1)
- `src/lib/utils/types.ts` — shared types (Task 2)
- `src/lib/utils/seededRandom.ts` + test (Task 3)
- `src/lib/utils/lunar.ts` + test (Task 4)
- `src/lib/utils/canvas.ts` + test (Task 5)
- `src/lib/stores/stage.ts`, `src/lib/stores/ritual.ts` + test (Task 6)
- `src/lib/utils/share.ts` + test (Task 7)
- `src/lib/components/talisman/TalismanFrame.svelte` (Task 8)
- `static/stamps/turtle-1.svg`, `turtle-2.svg`, `turtle-3.svg` (Task 9)
- `src/lib/components/talisman/AutoTurtles.svelte` + test (Task 10)
- `src/lib/components/talisman/DrawCanvas.svelte` + test (Task 11)
- `src/lib/components/ui/Button.svelte`, `ToolBar.svelte` (Task 12)
- `src/lib/components/stages/Setup.svelte` + test (Task 13)
- `src/lib/components/stages/Ritual.svelte` (Task 14)
- `src/lib/components/talisman/BurnEffect.svelte`, `src/lib/components/stages/Burn.svelte` (Task 15)
- `src/lib/components/stages/Share.svelte` (Task 16)
- `src/routes/+page.svelte`, `src/app.css` (Task 17)
- `README.md` with manual test checklist (Task 18)

---

## Task 1: Scaffold SvelteKit project

**Files:**
- Create: `package.json`, `svelte.config.js`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `src/app.html`, `src/app.d.ts`, `.prettierrc`, `vitest-setup.ts`
- Existing: `.gitignore`, `LICENSE`, `docs/`

- [ ] **Step 1: Run SvelteKit scaffolder**

```bash
npm create svelte@latest .
```

Select these options when prompted:
- "Which template?" → **Skeleton project**
- "Add type checking?" → **Yes, using TypeScript syntax**
- "Add ESLint?" → **Yes**
- "Add Prettier?" → **Yes**
- "Add Playwright?" → **No**
- "Add Vitest?" → **Yes**
- "Use Svelte 5?" → **No** (use Svelte 4) — the test patterns in this plan use `export function` from components, which works most reliably in Svelte 4. If the CLI does not offer this choice and forces Svelte 5, the plan still works but `bind:this` may need adjustments in the DrawCanvas test (Task 11).

If the scaffolder refuses because the directory isn't empty (LICENSE, .gitignore, docs/ exist), run with `--force`:

```bash
npm create svelte@latest . -- --force
```

Then install:

```bash
npm install
```

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install lunar-javascript html-to-image
npm install -D @sveltejs/adapter-vercel @testing-library/svelte @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Configure Vercel adapter in `svelte.config.js`**

Replace the contents of `svelte.config.js`:

```js
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter()
  }
};

export default config;
```

- [ ] **Step 4: Configure Vitest with jsdom and testing-library setup**

Create `vitest-setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

Replace `vitest.config.ts` (or merge if scaffold created a different config) with:

```ts
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest-setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts}']
  }
});
```

If the scaffold created a `vite.config.ts` that already includes vitest config, delete `vitest.config.ts` and put the `test` block inside `vite.config.ts` instead.

- [ ] **Step 5: Verify dev server boots**

```bash
npm run dev
```

Expected: server starts on `http://localhost:5173`, default skeleton page renders. Stop with `Ctrl+C`.

- [ ] **Step 6: Verify test runner works**

```bash
npm test -- --run
```

Expected: PASS with 0 tests (or whatever scaffold tests exist) — confirms vitest is configured.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold SvelteKit project with TypeScript and Vitest"
```

---

## Task 2: Define shared types

**Files:**
- Create: `src/lib/utils/types.ts`

- [ ] **Step 1: Write the types file**

Create `src/lib/utils/types.ts`:

```ts
export type Stage = 'setup' | 'ritual' | 'burn' | 'share';

export type Mode = 'draw' | 'auto';

export type Point = { x: number; y: number };

export type Op =
  | { type: 'stroke'; points: Point[]; size: number }
  | { type: 'stamp'; x: number; y: number; variant: 0 | 1 | 2 }
  | { type: 'erase'; points: Point[]; size: number };

export type Ritual = {
  date: string;       // ISO 'YYYY-MM-DD'
  time?: string;      // 'HH:mm'
  location: string;
  mode: Mode;
  operations: Op[];
};

export const DEFAULT_RITUAL: Ritual = {
  date: '',
  time: undefined,
  location: '',
  mode: 'draw',
  operations: []
};
```

- [ ] **Step 2: Verify it compiles**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/utils/types.ts
git commit -m "feat: add shared type definitions"
```

---

## Task 3: Seeded random utility

The auto-generate mode needs deterministic randomization based on `date + location` so reload yields the same layout for the same ritual.

**Files:**
- Create: `src/lib/utils/seededRandom.ts`
- Test: `src/lib/utils/seededRandom.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/lib/utils/seededRandom.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { djb2, makeRng } from './seededRandom';

describe('djb2', () => {
  it('produces same hash for same input', () => {
    expect(djb2('玉山-2026-05-15')).toBe(djb2('玉山-2026-05-15'));
  });

  it('produces different hashes for different inputs', () => {
    expect(djb2('玉山')).not.toBe(djb2('合歡山'));
  });

  it('returns positive integer', () => {
    const h = djb2('test');
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
  });
});

describe('makeRng', () => {
  it('produces deterministic sequence for same seed', () => {
    const a = makeRng(42);
    const b = makeRng(42);
    expect(a()).toBe(b());
    expect(a()).toBe(b());
    expect(a()).toBe(b());
  });

  it('produces values in [0, 1)', () => {
    const rng = makeRng(123);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('produces different sequences for different seeds', () => {
    expect(makeRng(1)()).not.toBe(makeRng(2)());
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npm test -- --run seededRandom
```

Expected: FAIL with "Cannot find module './seededRandom'".

- [ ] **Step 3: Implement**

Create `src/lib/utils/seededRandom.ts`:

```ts
/** djb2 hash — fast, well-distributed string hash. */
export function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Mulberry32 PRNG — small, fast, deterministic given a seed. */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

- [ ] **Step 4: Run test, verify it passes**

```bash
npm test -- --run seededRandom
```

Expected: 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/seededRandom.ts src/lib/utils/seededRandom.test.ts
git commit -m "feat: add djb2 hash and seeded PRNG"
```

---

## Task 4: Lunar calendar utility

**Files:**
- Create: `src/lib/utils/lunar.ts`
- Test: `src/lib/utils/lunar.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/lib/utils/lunar.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { toLunarString, formatTalismanFooter, formatShareDate } from './lunar';

describe('toLunarString', () => {
  it('converts a known solar date to lunar Chinese string', () => {
    // 2026-02-17 is Lunar New Year (lunar 1/1) for year 丙午
    const lunar = toLunarString('2026-02-17');
    expect(lunar).toMatch(/丙午年/);
    expect(lunar).toMatch(/正月初一/);
  });

  it('returns empty string for invalid date', () => {
    expect(toLunarString('not-a-date')).toBe('');
    expect(toLunarString('')).toBe('');
  });
});

describe('formatTalismanFooter', () => {
  it('returns lunar date · location when no time', () => {
    const out = formatTalismanFooter({
      date: '2026-02-17',
      location: '玉山主峰'
    });
    expect(out).toMatch(/丙午年正月初一 · 玉山主峰/);
  });

  it('inserts time between date and location when present', () => {
    const out = formatTalismanFooter({
      date: '2026-02-17',
      time: '09:00',
      location: '玉山主峰'
    });
    expect(out).toMatch(/丙午年正月初一 09:00 · 玉山主峰/);
  });

  it('returns empty string for missing date or location', () => {
    expect(formatTalismanFooter({ date: '', location: 'x' })).toBe('');
    expect(formatTalismanFooter({ date: '2026-01-01', location: '' })).toBe('');
  });
});

describe('formatShareDate', () => {
  it('formats ISO date as YYYY/M/D', () => {
    expect(formatShareDate('2026-05-15')).toBe('2026/5/15');
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npm test -- --run lunar
```

Expected: FAIL with "Cannot find module './lunar'".

- [ ] **Step 3: Implement**

Create `src/lib/utils/lunar.ts`:

```ts
import { Solar } from 'lunar-javascript';

/**
 * Convert ISO date 'YYYY-MM-DD' to a Chinese lunar string like "丙午年正月初一".
 * Returns empty string on invalid input.
 */
export function toLunarString(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return '';
  try {
    const [y, m, d] = isoDate.split('-').map(Number);
    const solar = Solar.fromYmd(y, m, d);
    const lunar = solar.getLunar();
    return `${lunar.getYearInGanZhi()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
  } catch {
    return '';
  }
}

export function formatTalismanFooter(input: {
  date: string;
  time?: string;
  location: string;
}): string {
  const lunar = toLunarString(input.date);
  if (!lunar || !input.location) return '';
  const timePart = input.time ? ` ${input.time}` : '';
  return `${lunar}${timePart} · ${input.location}`;
}

/** ISO 'YYYY-MM-DD' → 'YYYY/M/D' for share text. */
export function formatShareDate(isoDate: string): string {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${y}/${m}/${d}`;
}
```

Note: `lunar-javascript`'s `getMonthInChinese()` returns "正" for month 1, "二" for month 2, etc., and `getDayInChinese()` returns "初一" through "三十". The format above produces e.g. "丙午年正月初一". Adjust the test expectation if the library version produces slightly different strings — the library is the source of truth.

- [ ] **Step 4: Run test, verify it passes**

```bash
npm test -- --run lunar
```

Expected: 6 tests PASS. If the lunar string output differs from the test (e.g. "正" vs "正月"), update test expectations to match the library's actual output, not the other way around.

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/lunar.ts src/lib/utils/lunar.test.ts
git commit -m "feat: add lunar date conversion utility"
```

---

## Task 5: Canvas operation stack utility

Pure functions for managing the operation stack. No DOM access here — just data manipulation. Drawing onto a 2D context happens in `DrawCanvas.svelte` (Task 11).

**Files:**
- Create: `src/lib/utils/canvas.ts`
- Test: `src/lib/utils/canvas.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/lib/utils/canvas.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { canBurn, popOp, addOp } from './canvas';
import type { Op } from './types';

describe('canBurn', () => {
  it('false for empty operations', () => {
    expect(canBurn([])).toBe(false);
  });

  it('false when only erase operations exist', () => {
    const ops: Op[] = [{ type: 'erase', points: [{ x: 0, y: 0 }], size: 10 }];
    expect(canBurn(ops)).toBe(false);
  });

  it('true with at least one stroke', () => {
    const ops: Op[] = [{ type: 'stroke', points: [{ x: 0, y: 0 }], size: 3 }];
    expect(canBurn(ops)).toBe(true);
  });

  it('true with at least one stamp', () => {
    const ops: Op[] = [{ type: 'stamp', x: 1, y: 2, variant: 0 }];
    expect(canBurn(ops)).toBe(true);
  });
});

describe('addOp', () => {
  it('appends without mutating original', () => {
    const a: Op[] = [];
    const b = addOp(a, { type: 'stamp', x: 0, y: 0, variant: 0 });
    expect(a.length).toBe(0);
    expect(b.length).toBe(1);
  });
});

describe('popOp', () => {
  it('returns shorter array', () => {
    const ops: Op[] = [
      { type: 'stamp', x: 0, y: 0, variant: 0 },
      { type: 'stamp', x: 1, y: 1, variant: 1 }
    ];
    const result = popOp(ops);
    expect(result.length).toBe(1);
    expect(ops.length).toBe(2); // original not mutated
  });

  it('returns empty array when popping empty', () => {
    expect(popOp([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npm test -- --run canvas.test
```

Expected: FAIL with "Cannot find module './canvas'".

- [ ] **Step 3: Implement**

Create `src/lib/utils/canvas.ts`:

```ts
import type { Op } from './types';

export function canBurn(ops: Op[]): boolean {
  return ops.some((op) => op.type === 'stroke' || op.type === 'stamp');
}

export function addOp(ops: Op[], op: Op): Op[] {
  return [...ops, op];
}

export function popOp(ops: Op[]): Op[] {
  return ops.slice(0, -1);
}
```

- [ ] **Step 4: Run test, verify it passes**

```bash
npm test -- --run canvas.test
```

Expected: 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/canvas.ts src/lib/utils/canvas.test.ts
git commit -m "feat: add canvas operation stack helpers"
```

---

## Task 6: Stores with localStorage persistence

**Files:**
- Create: `src/lib/stores/stage.ts`, `src/lib/stores/ritual.ts`
- Test: `src/lib/stores/ritual.test.ts`

- [ ] **Step 1: Write the stage store**

Create `src/lib/stores/stage.ts`:

```ts
import { writable } from 'svelte/store';
import type { Stage } from '$lib/utils/types';

export const stage = writable<Stage>('setup');
```

- [ ] **Step 2: Write failing test for ritual store persistence**

Create `src/lib/stores/ritual.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';

const STORAGE_KEY = 'burn-turtle:ritual';

describe('ritual store', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes from default when localStorage empty', async () => {
    const { ritual } = await import('./ritual');
    const r = get(ritual);
    expect(r.date).toBe('');
    expect(r.location).toBe('');
    expect(r.mode).toBe('draw');
    expect(r.operations).toEqual([]);
  });

  it('restores from localStorage on import', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        date: '2026-05-15',
        location: '玉山',
        mode: 'auto',
        operations: []
      })
    );
    const { ritual } = await import('./ritual');
    const r = get(ritual);
    expect(r.date).toBe('2026-05-15');
    expect(r.location).toBe('玉山');
    expect(r.mode).toBe('auto');
  });

  it('persists changes to localStorage (debounced)', async () => {
    vi.useFakeTimers();
    const { ritual } = await import('./ritual');
    ritual.set({
      date: '2026-06-01',
      location: '合歡山',
      mode: 'draw',
      operations: []
    });
    vi.advanceTimersByTime(600);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    expect(stored.date).toBe('2026-06-01');
    expect(stored.location).toBe('合歡山');
  });

  it('clearRitual resets store and removes from storage', async () => {
    const { ritual, clearRitual } = await import('./ritual');
    ritual.set({
      date: '2026-06-01',
      location: '合歡山',
      mode: 'draw',
      operations: []
    });
    clearRitual();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(get(ritual).date).toBe('');
  });

  it('survives malformed localStorage by falling back to default', async () => {
    localStorage.setItem(STORAGE_KEY, 'not json');
    const { ritual } = await import('./ritual');
    expect(get(ritual).date).toBe('');
  });
});
```

- [ ] **Step 3: Run test, verify it fails**

```bash
npm test -- --run ritual.test
```

Expected: FAIL with "Cannot find module './ritual'".

- [ ] **Step 4: Implement ritual store**

Create `src/lib/stores/ritual.ts`:

```ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { DEFAULT_RITUAL, type Ritual } from '$lib/utils/types';

const STORAGE_KEY = 'burn-turtle:ritual';
const DEBOUNCE_MS = 500;

function loadInitial(): Ritual {
  if (!browser && typeof localStorage === 'undefined') return { ...DEFAULT_RITUAL };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_RITUAL };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_RITUAL, ...parsed };
  } catch {
    return { ...DEFAULT_RITUAL };
  }
}

export const ritual = writable<Ritual>(loadInitial());

let timer: ReturnType<typeof setTimeout> | null = null;

ritual.subscribe((value) => {
  if (typeof localStorage === 'undefined') return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // silent — quota / private browsing
    }
  }, DEBOUNCE_MS);
});

export function clearRitual(): void {
  if (timer) clearTimeout(timer);
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent
  }
  ritual.set({ ...DEFAULT_RITUAL });
}
```

Note: `$app/environment` is a SvelteKit module. In jsdom/Vitest it's stubbed to return `browser: false` by default, but `localStorage` is still available — the function still works because of the `typeof localStorage === 'undefined'` guard.

- [ ] **Step 5: Run test, verify it passes**

```bash
npm test -- --run ritual.test
```

Expected: 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/stores/
git commit -m "feat: add stage and ritual stores with localStorage persistence"
```

---

## Task 7: Share utility (Web Share API + html-to-image)

**Files:**
- Create: `src/lib/utils/share.ts`
- Test: `src/lib/utils/share.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/lib/utils/share.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { shareOrDownload } from './share';

describe('shareOrDownload', () => {
  let originalShare: any;
  let originalCanShare: any;

  beforeEach(() => {
    originalShare = (navigator as any).share;
    originalCanShare = (navigator as any).canShare;
  });

  afterEach(() => {
    (navigator as any).share = originalShare;
    (navigator as any).canShare = originalCanShare;
  });

  it('uses navigator.share when canShare returns true', async () => {
    const shareSpy = vi.fn().mockResolvedValue(undefined);
    (navigator as any).canShare = () => true;
    (navigator as any).share = shareSpy;

    const blob = new Blob(['x'], { type: 'image/png' });
    await shareOrDownload(blob, { title: 't', text: 'hi' });

    expect(shareSpy).toHaveBeenCalledTimes(1);
    expect(shareSpy.mock.calls[0][0].title).toBe('t');
  });

  it('falls back to download when canShare returns false', async () => {
    (navigator as any).canShare = () => false;
    (navigator as any).share = vi.fn();
    const downloadSpy = vi.fn();

    const blob = new Blob(['x'], { type: 'image/png' });
    await shareOrDownload(blob, { title: 't', text: 'hi' }, downloadSpy);

    expect((navigator as any).share).not.toHaveBeenCalled();
    expect(downloadSpy).toHaveBeenCalledWith(blob, expect.any(String));
  });

  it('falls back to download when navigator.share is missing', async () => {
    delete (navigator as any).canShare;
    delete (navigator as any).share;
    const downloadSpy = vi.fn();

    const blob = new Blob(['x'], { type: 'image/png' });
    await shareOrDownload(blob, { title: 't', text: 'hi' }, downloadSpy);

    expect(downloadSpy).toHaveBeenCalled();
  });

  it('silently handles AbortError from share', async () => {
    (navigator as any).canShare = () => true;
    const err = new Error('User aborted');
    err.name = 'AbortError';
    (navigator as any).share = vi.fn().mockRejectedValue(err);

    const blob = new Blob(['x'], { type: 'image/png' });
    await expect(
      shareOrDownload(blob, { title: 't', text: 'hi' })
    ).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npm test -- --run share.test
```

Expected: FAIL with "Cannot find module './share'".

- [ ] **Step 3: Implement**

Create `src/lib/utils/share.ts`:

```ts
import { toBlob } from 'html-to-image';

export type ShareMeta = { title: string; text: string };

const FILENAME = 'burn-turtle.png';

function defaultDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function shareOrDownload(
  blob: Blob,
  meta: ShareMeta,
  download: (blob: Blob, filename: string) => void = defaultDownload
): Promise<void> {
  const file = new File([blob], FILENAME, { type: 'image/png' });
  const data = { files: [file], title: meta.title, text: meta.text };

  const canUseShare =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare(data);

  if (canUseShare) {
    try {
      await navigator.share(data);
      return;
    } catch (err: any) {
      if (err?.name === 'AbortError') return; // user cancelled — silent
      // Fall through to download on any other share error
    }
  }
  download(blob, FILENAME);
}

/**
 * Capture a DOM node as a 1080x1440 PNG Blob using html-to-image.
 * The node should already be styled and visible (or rendered off-screen).
 * Retries once on failure.
 */
export async function captureShareImage(node: HTMLElement): Promise<Blob> {
  const opts = {
    width: 1080,
    height: 1440,
    pixelRatio: 1,
    backgroundColor: '#ffffff'
  };
  try {
    const blob = await toBlob(node, opts);
    if (!blob) throw new Error('toBlob returned null');
    return blob;
  } catch {
    const blob = await toBlob(node, opts);
    if (!blob) throw new Error('toBlob retry returned null');
    return blob;
  }
}
```

- [ ] **Step 4: Run test, verify it passes**

```bash
npm test -- --run share.test
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/share.ts src/lib/utils/share.test.ts
git commit -m "feat: add Web Share API helper with download fallback"
```

---

## Task 8: TalismanFrame component (shared SVG base)

The SVG底圖 used by both ritual modes. Includes yellow paper, 勅令, sun, frame, 紅印, and reactive bottom text.

**Files:**
- Create: `src/lib/components/talisman/TalismanFrame.svelte`

- [ ] **Step 1: Write the component**

Create `src/lib/components/talisman/TalismanFrame.svelte`:

```svelte
<script lang="ts">
  import { ritual } from '$lib/stores/ritual';
  import { formatTalismanFooter } from '$lib/utils/lunar';

  $: footer = formatTalismanFooter({
    date: $ritual.date,
    time: $ritual.time,
    location: $ritual.location
  });
</script>

<svg
  viewBox="0 0 240 320"
  class="frame"
  xmlns="http://www.w3.org/2000/svg"
  preserveAspectRatio="xMidYMid meet"
>
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f4dc7a" />
      <stop offset="100%" stop-color="#e8c850" />
    </linearGradient>
    <pattern id="paper-grain" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="0.3" fill="#a08840" opacity="0.15" />
      <circle cx="3" cy="3" r="0.2" fill="#a08840" opacity="0.1" />
    </pattern>
    <filter id="ink-bleed">
      <feGaussianBlur stdDeviation="0.5" />
    </filter>
  </defs>

  <!-- paper -->
  <rect width="240" height="320" fill="url(#paper)" />
  <rect width="240" height="320" fill="url(#paper-grain)" />

  <!-- frame borders -->
  <rect x="14" y="14" width="212" height="292" fill="none" stroke="#9a1c1c" stroke-width="1.5" />
  <rect x="20" y="20" width="200" height="280" fill="none" stroke="#9a1c1c" stroke-width="0.6" />

  <!-- 勅令 header -->
  <g filter="url(#ink-bleed)">
    <text
      x="120"
      y="50"
      text-anchor="middle"
      font-size="14"
      font-family="serif"
      font-weight="bold"
      fill="#9a1c1c"
      letter-spacing="6"
    >勅 令</text>
  </g>
  <line x1="40" y1="62" x2="200" y2="62" stroke="#9a1c1c" stroke-width="1" />

  <!-- sun -->
  <g filter="url(#ink-bleed)">
    <g stroke="#9a1c1c" stroke-width="2.5" stroke-linecap="round" fill="none">
      <line x1="120" y1="78" x2="120" y2="86" />
      <line x1="120" y1="130" x2="120" y2="138" />
      <line x1="74" y1="108" x2="82" y2="108" />
      <line x1="158" y1="108" x2="166" y2="108" />
      <line x1="86" y1="80" x2="92" y2="86" />
      <line x1="148" y1="86" x2="154" y2="80" />
      <line x1="86" y1="136" x2="92" y2="130" />
      <line x1="148" y1="130" x2="154" y2="136" />
    </g>
    <circle cx="120" cy="108" r="22" fill="#c52828" />
    <text
      x="120"
      y="115"
      text-anchor="middle"
      font-size="20"
      fill="#fff5c8"
      font-family="serif"
      font-weight="bold"
    >日</text>
  </g>

  <!-- 紅印 "晴" stamp -->
  <g transform="translate(195 250)">
    <rect x="-12" y="-12" width="24" height="24" fill="#c52828" rx="2" />
    <text
      x="0"
      y="5"
      text-anchor="middle"
      font-size="14"
      fill="#fff5c8"
      font-family="serif"
      font-weight="bold"
    >晴</text>
  </g>

  <!-- footer: lunar date · time · location (reactive) -->
  {#if footer}
    <text
      x="120"
      y="295"
      text-anchor="middle"
      font-size="11"
      fill="#3a1818"
      font-family="serif"
      letter-spacing="2"
    >
      {footer}
    </text>
  {/if}
</svg>

<style>
  .frame {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
```

- [ ] **Step 2: Verify it compiles**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/talisman/TalismanFrame.svelte
git commit -m "feat: add TalismanFrame SVG base component"
```

---

## Task 9: Stamp SVG assets

Three turtle stamps with slight pose variation. Single-color red ink (`#9a1c1c`), 60×40 viewBox.

**Files:**
- Create: `static/stamps/turtle-1.svg`, `static/stamps/turtle-2.svg`, `static/stamps/turtle-3.svg`

- [ ] **Step 1: Create turtle-1.svg (head straight ahead)**

Create `static/stamps/turtle-1.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40" width="60" height="40">
  <g fill="#9a1c1c">
    <ellipse cx="30" cy="22" rx="18" ry="13"/>
    <circle cx="30" cy="8" r="6.5"/>
    <circle cx="9" cy="22" r="3.5"/>
    <circle cx="51" cy="22" r="3.5"/>
    <circle cx="14" cy="34" r="3"/>
    <circle cx="46" cy="34" r="3"/>
  </g>
</svg>
```

- [ ] **Step 2: Create turtle-2.svg (head tilted left)**

Create `static/stamps/turtle-2.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40" width="60" height="40">
  <g fill="#9a1c1c">
    <ellipse cx="30" cy="22" rx="18" ry="13"/>
    <circle cx="22" cy="9" r="6"/>
    <circle cx="9" cy="22" r="3.5"/>
    <circle cx="51" cy="22" r="3.5"/>
    <circle cx="14" cy="34" r="3"/>
    <circle cx="46" cy="34" r="3"/>
  </g>
</svg>
```

- [ ] **Step 3: Create turtle-3.svg (head tilted right)**

Create `static/stamps/turtle-3.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40" width="60" height="40">
  <g fill="#9a1c1c">
    <ellipse cx="30" cy="22" rx="18" ry="13"/>
    <circle cx="38" cy="9" r="6"/>
    <circle cx="9" cy="22" r="3.5"/>
    <circle cx="51" cy="22" r="3.5"/>
    <circle cx="14" cy="34" r="3"/>
    <circle cx="46" cy="34" r="3"/>
  </g>
</svg>
```

- [ ] **Step 4: Commit**

```bash
git add static/stamps/
git commit -m "feat: add turtle stamp SVG assets"
```

---

## Task 10: AutoTurtles component

Renders 16 deterministically-randomized turtles based on the ritual's date+location seed.

**Files:**
- Create: `src/lib/components/talisman/AutoTurtles.svelte`
- Test: `src/lib/components/talisman/AutoTurtles.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/lib/components/talisman/AutoTurtles.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { generateAutoTurtles } from './autoTurtles';

describe('generateAutoTurtles', () => {
  it('returns 16 turtles', () => {
    const t = generateAutoTurtles('2026-05-15', '玉山');
    expect(t.length).toBe(16);
  });

  it('returns the same layout for same seed', () => {
    const a = generateAutoTurtles('2026-05-15', '玉山');
    const b = generateAutoTurtles('2026-05-15', '玉山');
    expect(a).toEqual(b);
  });

  it('returns different layouts for different seeds', () => {
    const a = generateAutoTurtles('2026-05-15', '玉山');
    const b = generateAutoTurtles('2026-05-15', '合歡山');
    expect(a).not.toEqual(b);
  });

  it('keeps turtles within paper bounds', () => {
    const t = generateAutoTurtles('2026-05-15', '玉山');
    for (const turtle of t) {
      expect(turtle.x).toBeGreaterThanOrEqual(20);
      expect(turtle.x).toBeLessThanOrEqual(220);
      expect(turtle.y).toBeGreaterThanOrEqual(150);
      expect(turtle.y).toBeLessThanOrEqual(280);
    }
  });
});
```

- [ ] **Step 2: Implement layout generator**

Create `src/lib/components/talisman/autoTurtles.ts`:

```ts
import { djb2, makeRng } from '$lib/utils/seededRandom';

export type AutoTurtle = {
  x: number;
  y: number;
  scale: number;
  variant: 0 | 1 | 2;
};

const ROWS = [
  { y: 165, count: 4 },
  { y: 215, count: 6 },
  { y: 260, count: 6 }
];
const X_MIN = 30;
const X_MAX = 210;

export function generateAutoTurtles(date: string, location: string): AutoTurtle[] {
  const seed = djb2(`${date}|${location}`);
  const rng = makeRng(seed);
  const turtles: AutoTurtle[] = [];

  for (const row of ROWS) {
    const span = X_MAX - X_MIN;
    const step = span / (row.count - 1);
    for (let i = 0; i < row.count; i++) {
      const baseX = X_MIN + i * step;
      const dx = (rng() - 0.5) * 6; // ±3
      const dy = (rng() - 0.5) * 6;
      const scale = 0.9 + rng() * 0.2; // 0.9–1.1
      const variant = Math.floor(rng() * 3) as 0 | 1 | 2;
      turtles.push({
        x: Math.max(X_MIN, Math.min(X_MAX, baseX + dx)),
        y: Math.max(150, Math.min(280, row.y + dy)),
        scale,
        variant
      });
    }
  }
  return turtles;
}
```

- [ ] **Step 3: Run test, verify it passes**

```bash
npm test -- --run autoTurtles
```

Expected: 4 tests PASS.

- [ ] **Step 4: Implement the Svelte component**

Create `src/lib/components/talisman/AutoTurtles.svelte`:

```svelte
<script lang="ts">
  import { ritual } from '$lib/stores/ritual';
  import { generateAutoTurtles } from './autoTurtles';

  $: turtles = generateAutoTurtles($ritual.date, $ritual.location);

  const STAMPS = [
    '/stamps/turtle-1.svg',
    '/stamps/turtle-2.svg',
    '/stamps/turtle-3.svg'
  ];
</script>

<svg viewBox="0 0 240 320" class="overlay" preserveAspectRatio="xMidYMid meet">
  {#each turtles as t}
    <image
      href={STAMPS[t.variant]}
      x={t.x - 12 * t.scale}
      y={t.y - 8 * t.scale}
      width={24 * t.scale}
      height={16 * t.scale}
    />
  {/each}
</svg>

<style>
  .overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
</style>
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/talisman/AutoTurtles.svelte src/lib/components/talisman/autoTurtles.ts src/lib/components/talisman/AutoTurtles.test.ts
git commit -m "feat: add AutoTurtles component with seeded layout"
```

---

## Task 11: DrawCanvas component

Canvas-based drawing surface with pointer events, brush, stamp, eraser, undo. Operations are written into the `ritual` store.

**Files:**
- Create: `src/lib/components/talisman/DrawCanvas.svelte`
- Test: `src/lib/components/talisman/DrawCanvas.test.ts`

- [ ] **Step 1: Write failing test (component logic, not visual)**

Create `src/lib/components/talisman/DrawCanvas.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';
import DrawCanvas from './DrawCanvas.svelte';
import { ritual } from '$lib/stores/ritual';
import { DEFAULT_RITUAL } from '$lib/utils/types';

describe('DrawCanvas', () => {
  beforeEach(() => {
    ritual.set({ ...DEFAULT_RITUAL });
  });

  it('starts with no operations', () => {
    render(DrawCanvas, { props: { tool: 'brush' } });
    expect(get(ritual).operations.length).toBe(0);
  });

  it('placeStamp adds a stamp op at given coordinates', async () => {
    const { component } = render(DrawCanvas, { props: { tool: 'stamp' } });
    component.placeStamp(50, 100);
    const ops = get(ritual).operations;
    expect(ops.length).toBe(1);
    expect(ops[0].type).toBe('stamp');
    if (ops[0].type === 'stamp') {
      expect(ops[0].x).toBe(50);
      expect(ops[0].y).toBe(100);
    }
  });

  it('undo() removes the last op', async () => {
    const { component } = render(DrawCanvas, { props: { tool: 'stamp' } });
    component.placeStamp(10, 10);
    component.placeStamp(20, 20);
    expect(get(ritual).operations.length).toBe(2);
    component.undo();
    expect(get(ritual).operations.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npm test -- --run DrawCanvas.test
```

Expected: FAIL — component doesn't exist.

- [ ] **Step 3: Implement component**

Create `src/lib/components/talisman/DrawCanvas.svelte`:

```svelte
<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { ritual } from '$lib/stores/ritual';
  import type { Op, Point } from '$lib/utils/types';
  import { addOp, popOp } from '$lib/utils/canvas';

  export let tool: 'brush' | 'stamp' | 'erase' = 'brush';

  const W = 1080;  // logical canvas resolution
  const H = 1440;
  const INK = '#9a1c1c';
  const BRUSH = 6;       // px in canvas-resolution
  const ERASER = 30;
  const STAMPS = ['/stamps/turtle-1.svg', '/stamps/turtle-2.svg', '/stamps/turtle-3.svg'];

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let drawing = false;
  let currentStroke: Point[] = [];
  const stampImages: HTMLImageElement[] = [];

  onMount(() => {
    ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Preload stamps
    STAMPS.forEach((src, i) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        stampImages[i] = img;
        redraw();
      };
    });

    redraw();
  });

  function clientToCanvas(e: PointerEvent): Point {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H
    };
  }

  function onPointerDown(e: PointerEvent) {
    if (tool === 'stamp') {
      const p = clientToCanvas(e);
      placeStamp(p.x, p.y);
      return;
    }
    drawing = true;
    currentStroke = [clientToCanvas(e)];
    canvas.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!drawing) return;
    currentStroke.push(clientToCanvas(e));
    redraw(true); // include in-progress stroke
  }

  function onPointerUp() {
    if (!drawing) return;
    drawing = false;
    if (currentStroke.length > 1) {
      const op: Op =
        tool === 'erase'
          ? { type: 'erase', points: [...currentStroke], size: ERASER }
          : { type: 'stroke', points: [...currentStroke], size: BRUSH };
      ritual.update((r) => ({ ...r, operations: addOp(r.operations, op) }));
    }
    currentStroke = [];
    redraw();
  }

  export function placeStamp(x: number, y: number): void {
    const variant = Math.floor(Math.random() * 3) as 0 | 1 | 2;
    ritual.update((r) => ({
      ...r,
      operations: addOp(r.operations, { type: 'stamp', x, y, variant })
    }));
    redraw();
  }

  export function undo(): void {
    ritual.update((r) => ({ ...r, operations: popOp(r.operations) }));
    redraw();
  }

  function drawStroke(c: CanvasRenderingContext2D, points: Point[], size: number, erase = false) {
    if (points.length < 1) return;
    c.save();
    if (erase) c.globalCompositeOperation = 'destination-out';
    c.strokeStyle = INK;
    c.lineWidth = size;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length - 1; i++) {
      const mid = {
        x: (points[i].x + points[i + 1].x) / 2,
        y: (points[i].y + points[i + 1].y) / 2
      };
      c.quadraticCurveTo(points[i].x, points[i].y, mid.x, mid.y);
    }
    c.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    c.stroke();
    c.restore();
  }

  function drawStamp(c: CanvasRenderingContext2D, x: number, y: number, variant: 0 | 1 | 2) {
    const img = stampImages[variant];
    if (!img) return;
    const sw = 120; // canvas-resolution width
    const sh = 80;
    c.drawImage(img, x - sw / 2, y - sh / 2, sw, sh);
  }

  function redraw(includeCurrent = false): void {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    const ops = $ritual.operations;
    for (const op of ops) {
      if (op.type === 'stroke') drawStroke(ctx, op.points, op.size);
      else if (op.type === 'erase') drawStroke(ctx, op.points, op.size, true);
      else if (op.type === 'stamp') drawStamp(ctx, op.x, op.y, op.variant);
    }
    if (includeCurrent && currentStroke.length > 1) {
      drawStroke(
        ctx,
        currentStroke,
        tool === 'erase' ? ERASER : BRUSH,
        tool === 'erase'
      );
    }
  }

  // re-render when operations externally changed (undo from parent, restore from localStorage)
  $: if (ctx) {
    $ritual.operations;
    tick().then(() => redraw());
  }
</script>

<canvas
  bind:this={canvas}
  width={W}
  height={H}
  class="canvas"
  class:cursor-stamp={tool === 'stamp'}
  on:pointerdown={onPointerDown}
  on:pointermove={onPointerMove}
  on:pointerup={onPointerUp}
  on:pointercancel={onPointerUp}
></canvas>

<style>
  .canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    touch-action: none;
  }
  .cursor-stamp {
    cursor: crosshair;
  }
</style>
```

- [ ] **Step 4: Run test, verify it passes**

```bash
npm test -- --run DrawCanvas.test
```

Expected: 3 tests PASS. Note: the component exposes `placeStamp` and `undo` as `export function`s so they're callable from tests via `component.placeStamp(...)`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/talisman/DrawCanvas.svelte src/lib/components/talisman/DrawCanvas.test.ts
git commit -m "feat: add DrawCanvas with brush, stamp, erase, undo"
```

---

## Task 12: ToolBar and Button UI components

**Files:**
- Create: `src/lib/components/ui/Button.svelte`, `src/lib/components/ui/ToolBar.svelte`

- [ ] **Step 1: Create Button.svelte**

Create `src/lib/components/ui/Button.svelte`:

```svelte
<script lang="ts">
  export let variant: 'primary' | 'secondary' | 'icon' = 'primary';
  export let disabled = false;
  export let onClick: (() => void) | undefined = undefined;
  export let ariaLabel: string | undefined = undefined;
</script>

<button
  class="btn btn-{variant}"
  {disabled}
  aria-label={ariaLabel}
  on:click={onClick}
>
  <slot />
</button>

<style>
  .btn {
    border: none;
    border-radius: 8px;
    padding: 12px 20px;
    font-size: 16px;
    font-family: inherit;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.1s;
  }
  .btn:active:not(:disabled) {
    transform: scale(0.97);
  }
  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .btn-primary {
    background: #9a1c1c;
    color: #fff5c8;
    font-weight: bold;
    letter-spacing: 4px;
  }
  .btn-secondary {
    background: transparent;
    color: #9a1c1c;
    border: 1px solid #9a1c1c;
  }
  .btn-icon {
    background: rgba(255, 255, 255, 0.7);
    color: #9a1c1c;
    width: 48px;
    height: 48px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }
</style>
```

- [ ] **Step 2: Create ToolBar.svelte**

Create `src/lib/components/ui/ToolBar.svelte`:

```svelte
<script lang="ts">
  import Button from './Button.svelte';

  export let tool: 'brush' | 'stamp' | 'erase' = 'brush';
  export let onUndo: () => void;
  export let canUndo = false;
</script>

<div class="toolbar">
  <Button
    variant="icon"
    ariaLabel="毛筆"
    onClick={() => (tool = 'brush')}
  >
    <span class:active={tool === 'brush'}>✎</span>
  </Button>
  <Button
    variant="icon"
    ariaLabel="印章"
    onClick={() => (tool = 'stamp')}
  >
    <span class:active={tool === 'stamp'}>🐢</span>
  </Button>
  <Button
    variant="icon"
    ariaLabel="橡皮擦"
    onClick={() => (tool = 'erase')}
  >
    <span class:active={tool === 'erase'}>⌫</span>
  </Button>
  <Button
    variant="icon"
    ariaLabel="復原"
    disabled={!canUndo}
    onClick={onUndo}
  >
    <span>↶</span>
  </Button>
</div>

<style>
  .toolbar {
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
    background: rgba(255, 245, 200, 0.85);
    padding: 6px;
    border-radius: 12px;
    backdrop-filter: blur(8px);
    z-index: 10;
  }
  .active {
    text-shadow: 0 0 6px #ffba00;
  }
</style>
```

- [ ] **Step 3: Verify compile**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/ui/
git commit -m "feat: add Button and ToolBar UI primitives"
```

---

## Task 13: Setup stage component

**Files:**
- Create: `src/lib/components/stages/Setup.svelte`
- Test: `src/lib/components/stages/Setup.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/lib/components/stages/Setup.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import Setup from './Setup.svelte';
import { ritual } from '$lib/stores/ritual';
import { DEFAULT_RITUAL } from '$lib/utils/types';

describe('Setup', () => {
  beforeEach(() => {
    ritual.set({ ...DEFAULT_RITUAL });
  });

  it('disables submit when date and location empty', () => {
    const { getByRole } = render(Setup);
    const button = getByRole('button', { name: /進入儀式/ });
    expect(button).toBeDisabled();
  });

  it('enables submit when date and location filled', async () => {
    const { getByLabelText, getByRole } = render(Setup);
    await fireEvent.input(getByLabelText('日期'), { target: { value: '2026-05-15' } });
    await fireEvent.input(getByLabelText('地點'), { target: { value: '玉山' } });
    const button = getByRole('button', { name: /進入儀式/ });
    expect(button).not.toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npm test -- --run Setup.test
```

Expected: FAIL — Setup.svelte missing.

- [ ] **Step 3: Implement Setup.svelte**

Create `src/lib/components/stages/Setup.svelte`:

```svelte
<script lang="ts">
  import { ritual } from '$lib/stores/ritual';
  import { stage } from '$lib/stores/stage';
  import Button from '$lib/components/ui/Button.svelte';
  import type { Mode } from '$lib/utils/types';

  $: canSubmit = $ritual.date.length > 0 && $ritual.location.length > 0;

  function setMode(m: Mode) {
    ritual.update((r) => ({ ...r, mode: m }));
  }

  function submit() {
    if (!canSubmit) return;
    // Past-date warning
    const today = new Date().toISOString().slice(0, 10);
    if ($ritual.date < today) {
      const ok = confirm('該日期已過，仍要祈晴嗎？');
      if (!ok) return;
    }
    stage.set('ritual');
  }
</script>

<div class="setup">
  <h1>燒烏龜</h1>
  <p class="tagline">為晴天祈晴 · 烏雲歸去</p>

  <label>
    <span>日期</span>
    <input
      type="date"
      aria-label="日期"
      bind:value={$ritual.date}
    />
  </label>

  <label>
    <span>時間（可選）</span>
    <input
      type="time"
      aria-label="時間"
      bind:value={$ritual.time}
    />
  </label>

  <label>
    <span>地點</span>
    <input
      type="text"
      aria-label="地點"
      placeholder="例：玉山主峰"
      bind:value={$ritual.location}
    />
  </label>

  <fieldset class="mode">
    <legend>模式</legend>
    <label class:selected={$ritual.mode === 'draw'}>
      <input
        type="radio"
        name="mode"
        value="draw"
        checked={$ritual.mode === 'draw'}
        on:change={() => setMode('draw')}
      />
      <strong>自己畫</strong>
      <span>手繪烏龜，較有儀式感</span>
    </label>
    <label class:selected={$ritual.mode === 'auto'}>
      <input
        type="radio"
        name="mode"
        value="auto"
        checked={$ritual.mode === 'auto'}
        on:change={() => setMode('auto')}
      />
      <strong>華麗版</strong>
      <span>系統自動排版</span>
    </label>
  </fieldset>

  <Button variant="primary" disabled={!canSubmit} onClick={submit}>
    進入儀式
  </Button>
</div>

<style>
  .setup {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 24px;
    max-width: 480px;
    margin: 0 auto;
  }
  h1 {
    text-align: center;
    color: #9a1c1c;
    font-family: serif;
    font-size: 32px;
    letter-spacing: 8px;
    margin: 0;
  }
  .tagline {
    text-align: center;
    opacity: 0.7;
    margin: 0 0 16px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 14px;
  }
  label > span {
    font-weight: 500;
    color: #555;
  }
  input[type='date'],
  input[type='time'],
  input[type='text'] {
    padding: 10px 12px;
    border: 1px solid #c0b890;
    border-radius: 6px;
    font-size: 16px;
    background: #fffce8;
    font-family: inherit;
  }
  .mode {
    border: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .mode legend {
    font-size: 14px;
    font-weight: 500;
    color: #555;
    margin-bottom: 4px;
  }
  .mode > label {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    padding: 12px;
    border: 1px solid #c0b890;
    border-radius: 6px;
    background: #fffce8;
    cursor: pointer;
  }
  .mode > label.selected {
    border-color: #9a1c1c;
    background: #fff3d6;
  }
  .mode strong {
    color: #9a1c1c;
  }
  .mode span {
    opacity: 0.7;
    font-size: 13px;
  }
</style>
```

- [ ] **Step 4: Run test, verify it passes**

```bash
npm test -- --run Setup.test
```

Expected: 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/stages/Setup.svelte src/lib/components/stages/Setup.test.ts
git commit -m "feat: add Setup stage with form validation"
```

---

## Task 14: Ritual stage container

Renders TalismanFrame + (DrawCanvas | AutoTurtles) + (ToolBar if draw) + the主要 Action Bar with the "燒" button.

**Files:**
- Create: `src/lib/components/stages/Ritual.svelte`

- [ ] **Step 1: Implement**

Create `src/lib/components/stages/Ritual.svelte`:

```svelte
<script lang="ts">
  import { ritual } from '$lib/stores/ritual';
  import { stage } from '$lib/stores/stage';
  import TalismanFrame from '$lib/components/talisman/TalismanFrame.svelte';
  import DrawCanvas from '$lib/components/talisman/DrawCanvas.svelte';
  import AutoTurtles from '$lib/components/talisman/AutoTurtles.svelte';
  import ToolBar from '$lib/components/ui/ToolBar.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { canBurn } from '$lib/utils/canvas';

  let tool: 'brush' | 'stamp' | 'erase' = 'brush';
  let drawCanvas: DrawCanvas;

  $: ready = $ritual.mode === 'auto' || canBurn($ritual.operations);

  function startBurn() {
    if (!ready) return;
    stage.set('burn');
  }

  function back() {
    stage.set('setup');
  }
</script>

<div class="ritual">
  <button class="back" on:click={back} aria-label="返回設定">‹</button>

  <div class="paper">
    <TalismanFrame />
    {#if $ritual.mode === 'draw'}
      <DrawCanvas bind:this={drawCanvas} {tool} />
    {:else}
      <AutoTurtles />
    {/if}
  </div>

  {#if $ritual.mode === 'draw'}
    <ToolBar
      bind:tool
      canUndo={$ritual.operations.length > 0}
      onUndo={() => drawCanvas?.undo()}
    />
  {/if}

  <div class="action-bar">
    <Button variant="primary" disabled={!ready} onClick={startBurn}>
      燒
    </Button>
    {#if !ready}
      <p class="hint">至少畫一隻烏龜</p>
    {/if}
  </div>
</div>

<style>
  .ritual {
    position: relative;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #2a1818;
    padding: 60px 16px 100px;
  }
  .back {
    position: absolute;
    top: 12px;
    left: 12px;
    background: rgba(255, 245, 200, 0.85);
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    font-size: 22px;
    color: #9a1c1c;
    cursor: pointer;
    z-index: 20;
  }
  .paper {
    position: relative;
    width: 100%;
    max-width: 480px;
    aspect-ratio: 3 / 4;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }
  .action-bar {
    position: fixed;
    bottom: 24px;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .hint {
    font-size: 12px;
    color: rgba(255, 245, 200, 0.7);
    margin: 0;
  }
</style>
```

- [ ] **Step 2: Verify compile**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/stages/Ritual.svelte
git commit -m "feat: add Ritual stage with mode switching and burn action"
```

---

## Task 15: Burn animation (Burn stage + BurnEffect overlay)

**Files:**
- Create: `src/lib/components/talisman/BurnEffect.svelte`, `src/lib/components/stages/Burn.svelte`

- [ ] **Step 1: Implement BurnEffect.svelte (visual overlay)**

Create `src/lib/components/talisman/BurnEffect.svelte`:

```svelte
<script lang="ts">
  /**
   * Plays a 4s burn animation. Emits 'done' on finish.
   * Visual: edge char → fire → smoke → ash.
   * The animation runs purely via CSS classes; this component
   * just toggles them and dispatches 'done' after 4s.
   */
  import { onMount, createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  let phase = 0; // 0..4

  onMount(() => {
    // Phase progression: 0=idle 1=char(0.3s) 2=fire(1s) 3=smoke(2.5s) 4=ash(3.5s)
    const t1 = setTimeout(() => (phase = 1), 300);
    const t2 = setTimeout(() => (phase = 2), 1000);
    const t3 = setTimeout(() => (phase = 3), 2500);
    const t4 = setTimeout(() => (phase = 4), 3500);
    const tDone = setTimeout(() => dispatch('done'), 4000);

    // Vibrate
    try {
      navigator.vibrate?.(50);
      setTimeout(() => navigator.vibrate?.([30, 100, 30]), 1500);
    } catch { /* ignored */ }

    // Skip to end if tab hidden
    const onVis = () => {
      if (document.hidden) {
        clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
        clearTimeout(tDone);
        phase = 4;
        dispatch('done');
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
      clearTimeout(tDone);
      document.removeEventListener('visibilitychange', onVis);
    };
  });
</script>

<div class="burn-overlay phase-{phase}">
  <div class="char-edge top"></div>
  <div class="char-edge bottom"></div>
  <div class="char-edge left"></div>
  <div class="char-edge right"></div>
  <div class="fire"></div>
  <div class="smoke smoke-1"></div>
  <div class="smoke smoke-2"></div>
  <div class="smoke smoke-3"></div>
  <div class="ash"></div>
  <div class="flash"></div>
</div>

<style>
  .burn-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }
  .char-edge {
    position: absolute;
    background: #1a1a1a;
    opacity: 0;
    transition: opacity 0.6s ease-out;
  }
  .char-edge.top    { top: 0; left: 0; right: 0; height: 0; }
  .char-edge.bottom { bottom: 0; left: 0; right: 0; height: 0; }
  .char-edge.left   { top: 0; bottom: 0; left: 0; width: 0; }
  .char-edge.right  { top: 0; bottom: 0; right: 0; width: 0; }

  .phase-1 .char-edge,
  .phase-2 .char-edge { opacity: 0.8; }
  .phase-1 .top, .phase-1 .bottom { height: 8%; }
  .phase-1 .left, .phase-1 .right { width: 8%; }
  .phase-2 .top, .phase-2 .bottom { height: 25%; }
  .phase-2 .left, .phase-2 .right { width: 25%; }
  .phase-3 .top, .phase-3 .bottom { height: 50%; }
  .phase-3 .left, .phase-3 .right { width: 50%; }
  .phase-4 .top, .phase-4 .bottom { height: 50%; opacity: 0; }
  .phase-4 .left, .phase-4 .right { width: 50%; opacity: 0; }

  .fire {
    position: absolute;
    inset: 4%;
    background: radial-gradient(ellipse at center,
      rgba(255, 200, 0, 0.0) 0%,
      rgba(255, 100, 0, 0.0) 50%,
      rgba(180, 30, 0, 0.0) 100%);
    filter: blur(8px);
    transition: background 0.4s, transform 0.3s;
    transform: scale(0.5);
  }
  .phase-2 .fire {
    background: radial-gradient(ellipse at center,
      rgba(255, 230, 80, 0.4) 0%,
      rgba(255, 100, 0, 0.5) 60%,
      rgba(180, 30, 0, 0.3) 100%);
    transform: scale(1);
    animation: flicker 0.2s steps(2) infinite;
  }
  .phase-3 .fire {
    opacity: 0.5;
    transform: scale(1.1);
  }
  .phase-4 .fire { opacity: 0; }
  @keyframes flicker {
    0%, 100% { transform: scale(1) translate(0, 0); }
    50% { transform: scale(1.05) translate(2px, -2px); }
  }

  .smoke {
    position: absolute;
    bottom: 10%;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: rgba(120, 120, 120, 0.4);
    filter: blur(20px);
    opacity: 0;
  }
  .smoke-1 { left: 30%; }
  .smoke-2 { left: 50%; }
  .smoke-3 { left: 70%; }
  .phase-3 .smoke,
  .phase-4 .smoke {
    animation: smokeRise 2s linear forwards;
  }
  .phase-3 .smoke-2 { animation-delay: 0.3s; }
  .phase-3 .smoke-3 { animation-delay: 0.6s; }
  @keyframes smokeRise {
    0%   { transform: translateY(0) scale(0.6); opacity: 0.7; }
    100% { transform: translateY(-200%) scale(1.6); opacity: 0; }
  }

  .ash {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(90, 90, 90, 0.0) 0%, rgba(60, 60, 60, 0.0) 100%);
    transition: background 0.6s;
    mix-blend-mode: multiply;
  }
  .phase-4 .ash {
    background: linear-gradient(180deg, rgba(90, 90, 90, 0.7) 0%, rgba(40, 40, 40, 0.85) 100%);
  }

  .flash {
    position: absolute;
    inset: 0;
    background: white;
    opacity: 0;
  }
  .phase-2 .flash {
    animation: flash 0.4s ease-out;
  }
  @keyframes flash {
    0% { opacity: 0; }
    50% { opacity: 0.6; }
    100% { opacity: 0; }
  }
</style>
```

- [ ] **Step 2: Implement Burn.svelte (stage container)**

Create `src/lib/components/stages/Burn.svelte`:

```svelte
<script lang="ts">
  import { stage } from '$lib/stores/stage';
  import { ritual } from '$lib/stores/ritual';
  import TalismanFrame from '$lib/components/talisman/TalismanFrame.svelte';
  import DrawCanvas from '$lib/components/talisman/DrawCanvas.svelte';
  import AutoTurtles from '$lib/components/talisman/AutoTurtles.svelte';
  import BurnEffect from '$lib/components/talisman/BurnEffect.svelte';

  function onDone() {
    stage.set('share');
  }

  function onBack() {
    if (confirm('確定放棄祈晴嗎？')) {
      stage.set('ritual');
    }
  }
</script>

<svelte:window on:popstate={onBack} />

<div class="burn-stage">
  <div class="paper">
    <TalismanFrame />
    {#if $ritual.mode === 'draw'}
      <DrawCanvas tool="brush" />
    {:else}
      <AutoTurtles />
    {/if}
    <BurnEffect on:done={onDone} />
  </div>
</div>

<style>
  .burn-stage {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1a0000;
    padding: 16px;
  }
  .paper {
    position: relative;
    width: 100%;
    max-width: 480px;
    aspect-ratio: 3 / 4;
    box-shadow: 0 8px 48px rgba(255, 100, 0, 0.4);
  }
</style>
```

- [ ] **Step 3: Verify compile**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/talisman/BurnEffect.svelte src/lib/components/stages/Burn.svelte
git commit -m "feat: add burn animation and Burn stage"
```

---

## Task 16: Share stage component

Captures the burned talisman as PNG, shows it, lets user share or restart.

**Files:**
- Create: `src/lib/components/stages/Share.svelte`

- [ ] **Step 1: Implement**

Create `src/lib/components/stages/Share.svelte`:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { ritual, clearRitual } from '$lib/stores/ritual';
  import { stage } from '$lib/stores/stage';
  import TalismanFrame from '$lib/components/talisman/TalismanFrame.svelte';
  import AutoTurtles from '$lib/components/talisman/AutoTurtles.svelte';
  import DrawCanvas from '$lib/components/talisman/DrawCanvas.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { captureShareImage, shareOrDownload } from '$lib/utils/share';
  import { formatShareDate } from '$lib/utils/lunar';

  let captureRoot: HTMLDivElement;
  let imageUrl: string | null = null;
  let imageBlob: Blob | null = null;
  let captureError = false;

  onMount(async () => {
    // Wait long enough for stamps (loaded via <img> in DrawCanvas) to be ready.
    // Browser image cache makes this fast on second mount but onload still fires async.
    await new Promise((r) => setTimeout(r, 500));
    try {
      const blob = await captureShareImage(captureRoot);
      imageBlob = blob;
      imageUrl = URL.createObjectURL(blob);
    } catch {
      captureError = true;
    }
  });

  async function onShare() {
    if (!imageBlob) return;
    await shareOrDownload(imageBlob, {
      title: '已祈晴',
      text: `${formatShareDate($ritual.date)} · ${$ritual.location} 祈求晴天 ☀️`
    });
  }

  function startOver() {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    clearRitual();
    stage.set('setup');
  }
</script>

<div class="share-stage">
  <!-- Off-screen capture target (1080x1440) -->
  <div class="capture-root" bind:this={captureRoot} aria-hidden="true">
    <div class="capture-paper ash">
      <TalismanFrame />
      {#if $ritual.mode === 'draw'}
        <DrawCanvas tool="brush" />
      {:else}
        <AutoTurtles />
      {/if}
    </div>
  </div>

  <!-- Visible UI -->
  <h2>已祈晴</h2>

  {#if imageUrl}
    <img src={imageUrl} alt="燒過的符咒" class="result" />
  {:else if captureError}
    <p class="error">分享圖製作失敗，仍可繼續</p>
  {:else}
    <p class="loading">製作分享圖中...</p>
  {/if}

  <div class="actions">
    <Button variant="primary" disabled={!imageBlob} onClick={onShare}>
      分享到 LINE / IG
    </Button>
    <Button variant="secondary" onClick={startOver}>
      再做一張
    </Button>
  </div>
</div>

<style>
  .share-stage {
    min-height: 100vh;
    background: #1a0000;
    color: #fff5c8;
    padding: 32px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  h2 {
    margin: 0;
    font-family: serif;
    letter-spacing: 8px;
  }
  .result {
    max-width: 480px;
    width: 100%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    /* The captured PNG already has the ash filter baked in via .capture-paper.ash;
       no extra filter on the displayed <img>. */
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 320px;
  }
  .loading,
  .error {
    opacity: 0.7;
  }
  .capture-root {
    position: fixed;
    top: -10000px;
    left: -10000px;
    width: 1080px;
    height: 1440px;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .capture-paper {
    position: relative;
    width: 1080px;
    height: 1440px;
  }
  .capture-paper.ash {
    filter: grayscale(0.6) brightness(0.7);
  }
</style>
```

- [ ] **Step 2: Verify compile**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/stages/Share.svelte
git commit -m "feat: add Share stage with image capture and Web Share"
```

---

## Task 17: Root page wiring + global styles

**Files:**
- Modify: `src/routes/+page.svelte`
- Create: `src/app.css`
- Modify: `src/routes/+layout.svelte` (create if missing) to import css
- Modify: `src/app.html` for mobile viewport

- [ ] **Step 1: Replace `src/routes/+page.svelte`**

```svelte
<script lang="ts">
  import { stage } from '$lib/stores/stage';
  import Setup from '$lib/components/stages/Setup.svelte';
  import Ritual from '$lib/components/stages/Ritual.svelte';
  import Burn from '$lib/components/stages/Burn.svelte';
  import Share from '$lib/components/stages/Share.svelte';
</script>

<svelte:head>
  <title>燒烏龜 · 烏雲歸去</title>
</svelte:head>

{#if $stage === 'setup'}
  <Setup />
{:else if $stage === 'ritual'}
  <Ritual />
{:else if $stage === 'burn'}
  <Burn />
{:else if $stage === 'share'}
  <Share />
{/if}
```

- [ ] **Step 2: Create `src/app.css`**

```css
* {
  box-sizing: border-box;
}
html,
body {
  margin: 0;
  padding: 0;
  font-family:
    'Noto Sans TC',
    -apple-system,
    BlinkMacSystemFont,
    'Helvetica Neue',
    sans-serif;
  background: #1a0000;
  color: #2a1818;
  -webkit-tap-highlight-color: transparent;
}
button {
  font-family: inherit;
}
```

- [ ] **Step 3: Create or update `src/routes/+layout.svelte`**

```svelte
<script lang="ts">
  import '../app.css';
</script>

<slot />
```

- [ ] **Step 4: Update `src/app.html`** to ensure correct viewport

Replace `src/app.html` with:

```html
<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%sveltekit.assets%/favicon.png" />
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
    <meta name="theme-color" content="#1a0000" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

- [ ] **Step 5: Boot dev server and walk through the flow**

```bash
npm run dev
```

Open `http://localhost:5173` on your phone (use the local network URL printed by Vite) or in DevTools mobile emulation. Walk through:

1. Setup stage: enter date, location, choose mode
2. Ritual stage: in draw mode, place stamps + use brush; in auto mode, see 16 turtles
3. Tap "燒" — watch animation
4. Share stage: see captured image, hit "分享" (will be download in desktop)
5. "再做一張" → returns to setup with cleared state

If anything is broken, fix in place.

- [ ] **Step 6: Verify all tests still pass**

```bash
npm test -- --run
```

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: wire up stage routing and global styles"
```

---

## Task 18: README with manual test checklist

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

Create `README.md`:

```markdown
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

## Spec

See `docs/superpowers/specs/2026-04-30-burn-turtle-design.md`.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with manual test checklist"
```

---

## Final Verification

- [ ] **Run all tests**

```bash
npm test -- --run
```

Expected: all tests PASS.

- [ ] **Run type check**

```bash
npm run check
```

Expected: 0 errors, 0 warnings.

- [ ] **Build production**

```bash
npm run build
```

Expected: build succeeds, output in `.svelte-kit/output/`.

- [ ] **Tag and push**

```bash
git push origin release
```

Then connect the repo to Vercel — Vercel auto-detects SvelteKit and deploys.

- [ ] **First-deploy smoke test**

Open the Vercel preview URL on a phone. Walk through one full ritual end-to-end. If sharing works to LINE, ship it.
