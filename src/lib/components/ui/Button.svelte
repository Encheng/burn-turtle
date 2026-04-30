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
    transition:
      opacity 0.15s,
      transform 0.1s;
  }
  .btn:active:not(:disabled) {
    transform: scale(0.97);
  }
  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .btn-primary {
    background: #DAB96D;
    color: #3E5B79;
    font-weight: bold;
    letter-spacing: 4px;
  }
  .btn-secondary {
    background: transparent;
    color: #DAB96D;
    border: 1px solid #DAB96D;
  }
  .btn-icon {
    background: rgba(242, 248, 242, 0.9);
    color: #3E5B79;
    width: 48px;
    height: 48px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }
</style>
