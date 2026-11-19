import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	// Vitest resolves Svelte to its server build unless the browser condition
	// is set; without it onMount never runs inside component tests.
	resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
	test: {
		environment: 'jsdom',
		setupFiles: ['./vitest-setup.ts'],
		include: ['src/**/*.{test,spec}.{js,ts}'],
		passWithNoTests: true
	}
});
