<script lang="ts">
  import type { TripSummary } from '$lib/trips';

  export let data: { trips: TripSummary[] };
</script>

<svelte:head>
  <title>登山行程</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="list">
  <h1>登山行程</h1>

  {#if data.trips.length === 0}
    <p class="empty">還沒有行程</p>
  {:else}
    {#each data.trips as trip (trip.slug)}
      <article class="card">
        <p class="dates">{trip.dates.start} – {trip.dates.end}</p>
        <h2>{trip.title}</h2>
        {#if trip.subtitle}
          <p class="subtitle">{trip.subtitle}</p>
        {/if}
        <nav class="pages" aria-label="{trip.title} 頁面">
          {#each trip.pages as page (page.href)}
            <a href={page.href}>{page.label}</a>
          {/each}
        </nav>
      </article>
    {/each}
  {/if}
</main>

<style>
  /* Fallbacks mirror src/app.css tokens so this page renders on its own
     even if the token block is absent. */
  .list {
    max-width: 640px;
    margin: 0 auto;
    padding: max(var(--space-8, 32px), env(safe-area-inset-top)) var(--space-4, 16px)
      max(var(--space-8, 32px), env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: var(--space-4, 16px);
  }
  h1 {
    font-family: var(--font-serif, 'Noto Serif TC', 'Songti TC', serif);
    font-size: 1.75rem;
    margin: 0 0 var(--space-2, 8px);
  }
  .empty {
    color: var(--text-muted, #d5dde2);
    margin: 0;
  }
  .card {
    background: var(--surface, #f2f8f2);
    color: var(--ink-deep, #24364b);
    border-radius: var(--radius-md, 12px);
    padding: var(--space-4, 16px);
  }
  .dates {
    margin: 0;
    font-size: 0.875rem;
    font-variant-numeric: tabular-nums;
    color: var(--line-on-light, #74838f);
  }
  h2 {
    font-family: var(--font-serif, 'Noto Serif TC', 'Songti TC', serif);
    font-size: 1.375rem;
    margin: var(--space-1, 4px) 0 0;
  }
  .subtitle {
    margin: var(--space-1, 4px) 0 0;
    font-size: 0.9375rem;
    color: #4b5d6e;
  }
  .pages {
    display: flex;
    gap: var(--space-2, 8px);
    margin-top: var(--space-3, 12px);
  }
  .pages a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: var(--tap-min, 48px);
    padding: 0 var(--space-4, 16px);
    border-radius: var(--radius-pill, 999px);
    background: var(--amber, #dab96d);
    color: var(--ink-deep, #24364b);
    font-weight: 500;
    text-decoration: none;
    transition: background var(--dur-fast, 120ms) var(--ease, cubic-bezier(0.2, 0, 0, 1));
  }
  .pages a:hover {
    background: var(--amber-hover, #e4c77f);
  }
  .pages a:focus-visible {
    outline: 3px solid var(--focus-on-light, #3e5b79);
  }
</style>
