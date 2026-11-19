<script lang="ts">
  export let variant: 'primary' | 'secondary' | 'icon' = 'primary';
  export let disabled = false;
  /** Shows a spinner and blocks clicks while an async action runs. */
  export let loading = false;
  /** For toggle buttons (e.g. toolbar tools): renders aria-pressed. */
  export let pressed: boolean | undefined = undefined;
  export let type: 'button' | 'submit' = 'button';
  export let onClick: (() => void) | undefined = undefined;
  export let ariaLabel: string | undefined = undefined;
</script>

<button
  class="btn btn-{variant}"
  {type}
  disabled={disabled || loading}
  aria-label={ariaLabel}
  aria-pressed={pressed}
  aria-busy={loading || undefined}
  on:click={onClick}
>
  {#if loading}
    <span class="spinner" aria-hidden="true"></span>
  {/if}
  <slot />
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    min-height: var(--tap-min);
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    padding: var(--space-3) var(--space-6);
    font-size: 16px;
    font-family: inherit;
    line-height: 1.2;
    cursor: pointer;
    transition:
      background-color var(--dur-base) var(--ease),
      color var(--dur-base) var(--ease),
      border-color var(--dur-base) var(--ease),
      box-shadow var(--dur-base) var(--ease),
      transform var(--dur-fast) var(--ease),
      opacity var(--dur-base) var(--ease);
  }
  .btn:active:not(:disabled) {
    transform: scale(0.97);
  }
  .btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  /* ── primary ── */
  .btn-primary {
    background: var(--amber);
    color: var(--ink-deep);
    font-weight: 700;
    letter-spacing: 4px;
    text-indent: 4px; /* visually re-centre letter-spaced text */
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  }
  @media (hover: hover) {
    .btn-primary:hover:not(:disabled) {
      background: var(--amber-hover);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
    }
  }

  /* ── secondary ── */
  .btn-secondary {
    background: transparent;
    color: var(--text-amber);
    border-color: var(--text-amber);
  }
  @media (hover: hover) {
    .btn-secondary:hover:not(:disabled) {
      background: rgba(242, 248, 242, 0.08);
    }
  }

  /* ── icon ── */
  .btn-icon {
    background: transparent;
    color: var(--ink);
    width: var(--tap-min);
    height: var(--tap-min);
    padding: 0;
    border-radius: var(--radius-sm);
  }
  @media (hover: hover) {
    .btn-icon:hover:not(:disabled) {
      background: rgba(62, 91, 121, 0.1);
    }
  }
  .btn-icon[aria-pressed='true'] {
    background: var(--amber);
    color: var(--ink-deep);
    box-shadow: inset 0 0 0 2px var(--ink);
  }
  /* icon buttons sit on a light surface → use the dark ring */
  .btn-icon:focus-visible {
    outline-color: var(--focus-on-light);
  }

  /* ── loading spinner ── */
  .spinner {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid currentColor;
    border-right-color: transparent;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .spinner {
      animation: none;
      border-right-color: currentColor;
      opacity: 0.6;
    }
  }
</style>
