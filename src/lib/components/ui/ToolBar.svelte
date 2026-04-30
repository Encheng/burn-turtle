<script lang="ts">
  import Button from './Button.svelte';

  export let tool: 'brush' | 'stamp' | 'erase' = 'brush';
  export let onUndo: () => void;
  export let canUndo = false;
</script>

<div class="toolbar">
  <Button variant="icon" ariaLabel="毛筆" onClick={() => (tool = 'brush')}>
    <span class:active={tool === 'brush'}>✎</span>
  </Button>
  <Button variant="icon" ariaLabel="印章" onClick={() => (tool = 'stamp')}>
    <span class:active={tool === 'stamp'}>🐢</span>
  </Button>
  <Button variant="icon" ariaLabel="橡皮擦" onClick={() => (tool = 'erase')}>
    <span class:active={tool === 'erase'}>⌫</span>
  </Button>
  <Button variant="icon" ariaLabel="復原" disabled={!canUndo} onClick={onUndo}>
    <span>↶</span>
  </Button>
</div>

<style>
  .toolbar {
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
    background: rgba(255, 245, 200, 0.85);
    padding: 6px;
    border-radius: 12px;
    backdrop-filter: blur(8px);
    z-index: 10;
  }
  .active {
    text-shadow: 0 0 6px #ffba00;
  }
</style>
