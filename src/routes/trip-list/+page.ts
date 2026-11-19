import type { PageLoad } from './$types';
import { registry } from '$lib/trips';

export const prerender = true;
export const load: PageLoad = () => ({ trips: registry.trips() });
