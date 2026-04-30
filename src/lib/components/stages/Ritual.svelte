<script lang="ts">
  import { ritual } from '$lib/stores/ritual';
  import { stage } from '$lib/stores/stage';
  import TalismanFrame from '$lib/components/talisman/TalismanFrame.svelte';
  import DrawCanvas from '$lib/components/talisman/DrawCanvas.svelte';
  import AutoTurtles from '$lib/components/talisman/AutoTurtles.svelte';
  import ToolBar from '$lib/components/ui/ToolBar.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { canBurn } from '$lib/utils/canvas';

  let tool: 'brush' | 'stamp' | 'erase' = 'brush';
  let drawCanvas: DrawCanvas;

  $: ready = $ritual.mode === 'auto' || canBurn($ritual.operations);

  function startBurn() {
    if (!ready) return;
    stage.set('burn');
  }

  function back() {
    stage.set('setup');
  }
</script>

<div class="ritual">
  <button class="back" on:click={back} aria-label="返回設定">‹</button>

  <div class="paper">
    <TalismanFrame />
    {#if $ritual.mode === 'draw'}
      <DrawCanvas bind:this={drawCanvas} {tool} />
    {:else}
      <AutoTurtles />
    {/if}
  </div>

  {#if $ritual.mode === 'draw'}
    <ToolBar
      bind:tool
      canUndo={$ritual.operations.length > 0}
      onUndo={() => drawCanvas?.undo()}
    />
  {/if}

  <div class="action-bar">
    <Button variant="primary" disabled={!ready} onClick={startBurn}>燒</Button>
    {#if !ready}
      <p class="hint">至少畫一隻烏龜</p>
    {/if}
  </div>
</div>

<style>
  .ritual {
    position: relative;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #3E5B79;
    padding: 60px 16px 100px;
  }
  .back {
    position: absolute;
    top: 12px;
    left: 12px;
    background: rgba(242, 248, 242, 0.9);
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    font-size: 22px;
    color: #3E5B79;
    cursor: pointer;
    z-index: 20;
  }
  .paper {
    position: relative;
    width: 100%;
    max-width: 480px;
    aspect-ratio: 3 / 4;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }
  .action-bar {
    position: fixed;
    bottom: 24px;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .hint {
    font-size: 12px;
    color: rgba(242, 248, 242, 0.7);
    margin: 0;
  }
</style>
