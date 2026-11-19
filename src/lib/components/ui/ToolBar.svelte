<script lang="ts">
  import Button from './Button.svelte';

  export let tool: 'brush' | 'stamp' | 'erase' = 'brush';
  export let onUndo: () => void;
  export let canUndo = false;
</script>

<div class="toolbar" role="toolbar" aria-label="繪圖工具">
  <Button
    variant="icon"
    ariaLabel="毛筆"
    pressed={tool === 'brush'}
    onClick={() => (tool = 'brush')}
  >
    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  </Button>

  <Button
    variant="icon"
    ariaLabel="烏龜印章"
    pressed={tool === 'stamp'}
    onClick={() => (tool = 'stamp')}
  >
    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
      <ellipse cx="12" cy="13.5" rx="7" ry="5" />
      <circle cx="12" cy="7" r="2.5" />
      <circle cx="4" cy="13.5" r="1.4" />
      <circle cx="20" cy="13.5" r="1.4" />
      <circle cx="6.5" cy="19" r="1.2" />
      <circle cx="17.5" cy="19" r="1.2" />
    </svg>
  </Button>

  <Button
    variant="icon"
    ariaLabel="橡皮擦"
    pressed={tool === 'erase'}
    onClick={() => (tool = 'erase')}
  >
    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"
      />
      <path d="M22 21H7" />
      <path d="m5 11 9 9" />
    </svg>
  </Button>

  <span class="divider" aria-hidden="true"></span>

  <Button variant="icon" ariaLabel="復原上一步" disabled={!canUndo} onClick={onUndo}>
    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  </Button>
</div>

<style>
  .toolbar {
    position: absolute;
    top: calc(var(--space-2) + env(safe-area-inset-top, 0px));
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: var(--space-2);
    background: rgba(242, 248, 242, 0.94);
    padding: var(--space-1);
    border-radius: var(--radius-md);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
    z-index: 10;
  }
  .icon {
    width: 24px;
    height: 24px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.75;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .divider {
    width: 1px;
    height: 24px;
    background: rgba(62, 91, 121, 0.3);
  }
</style>
