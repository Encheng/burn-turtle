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

  $: isDraw = $ritual.mode === 'draw';
  $: canUndo = isDraw && $ritual.operations.length > 0;
  $: ready = !isDraw || canBurn($ritual.operations);

  function startBurn() {
    if (!ready) return;
    stage.set('burn');
  }

  function back() {
    stage.set('setup');
  }

  function undo() {
    drawCanvas?.undo();
  }

  // Cmd/Ctrl+Z → undo (keyboard alternative for the toolbar button)
  function onKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
      if (!canUndo) return;
      e.preventDefault();
      undo();
    }
  }
</script>

<svelte:window on:keydown={onKeydown} />

<div class="ritual">
  <h1 class="sr-only">步驟 2 / 3 · 畫符</h1>

  <button class="back" type="button" on:click={back} aria-label="返回設定">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m15 5-7 7 7 7" />
    </svg>
  </button>

  <div class="paper">
    <TalismanFrame />
    {#if isDraw}
      <DrawCanvas bind:this={drawCanvas} {tool} />
    {:else}
      <AutoTurtles />
    {/if}
  </div>

  {#if isDraw}
    <ToolBar bind:tool {canUndo} onUndo={undo} />
  {/if}

  <div class="action-bar">
    <Button variant="primary" disabled={!ready} onClick={startBurn}>燒</Button>
    <p class="hint" role="status" aria-live="polite">
      {#if !ready}
        至少畫一隻烏龜，或蓋一個印章
      {:else if isDraw && tool === 'stamp'}
        點符咒任一處放置烏龜
      {:else if isDraw && tool === 'erase'}
        在想擦掉的地方塗抹
      {:else}
        &nbsp;
      {/if}
    </p>
  </div>
</div>

<style>
  .ritual {
    position: relative;
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: var(--bg);
    padding: calc(80px + env(safe-area-inset-top, 0px)) var(--space-4)
      calc(120px + env(safe-area-inset-bottom, 0px));
  }
  .back {
    position: absolute;
    top: calc(var(--space-3) + env(safe-area-inset-top, 0px));
    left: calc(var(--space-3) + env(safe-area-inset-left, 0px));
    width: var(--tap-min);
    height: var(--tap-min);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(242, 248, 242, 0.94);
    border: none;
    border-radius: var(--radius-pill);
    color: var(--ink);
    cursor: pointer;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
    transition: background-color var(--dur-base) var(--ease), transform var(--dur-fast) var(--ease);
    z-index: 20;
  }
  .back svg {
    width: 24px;
    height: 24px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  @media (hover: hover) {
    .back:hover {
      background: var(--surface);
    }
  }
  .back:active {
    transform: scale(0.95);
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
    bottom: 0;
    left: 0;
    right: 0;
    padding: var(--space-4) var(--space-4) calc(var(--space-4) + env(safe-area-inset-bottom, 0px));
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
    background: linear-gradient(180deg, rgba(62, 91, 121, 0) 0%, rgba(62, 91, 121, 0.9) 35%);
    pointer-events: none;
  }
  .action-bar :global(.btn) {
    pointer-events: auto;
    min-width: 160px;
  }
  .hint {
    font-size: 13px;
    color: var(--text-muted);
    margin: 0;
    min-height: 1.5em;
    text-align: center;
  }
</style>
