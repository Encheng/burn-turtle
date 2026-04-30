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
  timer = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent
  }
  ritual.set({ ...DEFAULT_RITUAL });
}
