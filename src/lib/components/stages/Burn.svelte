<script lang="ts">
  import { stage } from '$lib/stores/stage';
  import { ritual } from '$lib/stores/ritual';
  import TalismanFrame from '$lib/components/talisman/TalismanFrame.svelte';
  import DrawCanvas from '$lib/components/talisman/DrawCanvas.svelte';
  import AutoTurtles from '$lib/components/talisman/AutoTurtles.svelte';
  import BurnEffect from '$lib/components/talisman/BurnEffect.svelte';

  function onDone() {
    stage.set('share');
  }

  function onBack() {
    if (confirm('確定放棄祈晴嗎？')) {
      stage.set('ritual');
    }
  }
</script>

<svelte:window on:popstate={onBack} />

<div class="burn-stage">
  <div class="paper">
    <TalismanFrame />
    {#if $ritual.mode === 'draw'}
      <DrawCanvas tool="brush" />
    {:else}
      <AutoTurtles />
    {/if}
    <BurnEffect on:done={onDone} />
  </div>
</div>

<style>
  .burn-stage {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1a0000;
    padding: 16px;
  }
  .paper {
    position: relative;
    width: 100%;
    max-width: 480px;
    aspect-ratio: 3 / 4;
    box-shadow: 0 8px 48px rgba(255, 100, 0, 0.4);
  }
</style>
