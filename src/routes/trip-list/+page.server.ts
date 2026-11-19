import type { PageServerLoad } from './$types';
import { registry } from '$lib/trips';

export const prerender = true;
export const load: PageServerLoad = () => ({ trips: registry.trips() });
