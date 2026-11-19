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
  .list {
    max-width: 640px;
    margin: 0 auto;
    padding: max(var(--space-8), env(safe-area-inset-top)) var(--space-4)
      max(var(--space-8), env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  h1 {
    font-family: var(--font-serif);
    font-size: 1.75rem;
    margin: 0 0 var(--space-2);
  }
  .empty {
    color: var(--text-muted);
    margin: 0;
  }
  .card {
    background: var(--surface);
    color: var(--ink-deep);
    border-radius: var(--radius-md);
    padding: var(--space-4);
  }
  .dates {
    margin: 0;
    font-size: 0.875rem;
    font-variant-numeric: tabular-nums;
    color: var(--line-on-light);
  }
  h2 {
    font-family: var(--font-serif);
    font-size: 1.375rem;
    margin: var(--space-1) 0 0;
  }
  .subtitle {
    margin: var(--space-1) 0 0;
    font-size: 0.9375rem;
    color: #4b5d6e;
  }
  .pages {
    display: flex;
    gap: var(--space-2);
    margin-top: var(--space-3);
  }
  .pages a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: var(--tap-min);
    padding: 0 var(--space-4);
    border-radius: var(--radius-pill);
    background: var(--amber);
    color: var(--ink-deep);
    font-weight: 500;
    text-decoration: none;
    transition: background var(--dur-fast) var(--ease);
  }
  .pages a:hover {
    background: var(--amber-hover);
  }
  .pages a:focus-visible {
    outline: 3px solid var(--focus-on-light);
  }
</style>
