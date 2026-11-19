import { error } from '@sveltejs/kit';
import type { EntryGenerator, RequestHandler } from './$types';
import { registry } from '$lib/trips';

export const prerender = true;
export const entries: EntryGenerator = () => registry.entries();

export const GET: RequestHandler = ({ params }) => {
  const html = registry.getPage(params.slug, params.page);
  if (html === undefined) error(404, 'Not found');
  // Exactly 'text/html': SvelteKit only prerenders a response as a page
  // (and adapter-vercel only maps x.html → /x) when the header is this value.
  return new Response(html, {
    headers: { 'content-type': 'text/html', 'x-robots-tag': 'noindex' }
  });
};
