<script lang="ts">
  import { stage } from '$lib/stores/stage';
  import { ritual } from '$lib/stores/ritual';
  import TalismanFrame from '$lib/components/talisman/TalismanFrame.svelte';
  import DrawCanvas from '$lib/components/talisman/DrawCanvas.svelte';
  import AutoTurtles from '$lib/components/talisman/AutoTurtles.svelte';
  import BurnEffect from '$lib/components/talisman/BurnEffect.svelte';

  // WebKit does not always repaint an HTML element when the <clipPath> it
  // references changes; toggling an invisible opacity delta each frame
  // forces the repaint. Harmless elsewhere.
  let nudge = false;

  function onDone() {
    stage.set('share');
  }

  function onFrame() {
    nudge = !nudge;
  }
</script>

<div class="burn-stage" aria-busy="true">
  <p class="sr-only" role="status">符咒燒化中，請稍候</p>
  <div class="scene">
    <!-- The paper is clipped by the hole BurnEffect draws (#burn-clip);
         BurnEffect itself sits outside .paper so flames and sparks are not clipped. -->
    <div class="paper" style="opacity: {nudge ? 1 : 0.999}">
      <TalismanFrame />
      {#if $ritual.mode === 'draw'}
        <DrawCanvas tool="brush" />
      {:else}
        <AutoTurtles />
      {/if}
    </div>
    <BurnEffect on:done={onDone} on:frame={onFrame} />
  </div>
</div>

<style>
  .burn-stage {
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-deep);
    padding: var(--space-4);
    overflow: hidden;
  }
  .scene {
    position: relative;
    width: 100%;
    max-width: 480px;
    aspect-ratio: 3 / 4;
  }
  .paper {
    position: absolute;
    inset: 0;
    -webkit-clip-path: url(#burn-clip);
    clip-path: url(#burn-clip);
    /* cache the talisman as a texture; only the mask changes per frame */
    will-change: transform, opacity;
  }
</style>
