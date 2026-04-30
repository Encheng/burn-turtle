import { writable } from 'svelte/store';
import type { Stage } from '$lib/utils/types';

export const stage = writable<Stage>('setup');
