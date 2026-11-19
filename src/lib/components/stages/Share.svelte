<script lang="ts">
  import { onMount } from 'svelte';
  import { ritual, clearRitual } from '$lib/stores/ritual';
  import { stage } from '$lib/stores/stage';
  import TalismanFrame from '$lib/components/talisman/TalismanFrame.svelte';
  import AutoTurtles from '$lib/components/talisman/AutoTurtles.svelte';
  import DrawCanvas from '$lib/components/talisman/DrawCanvas.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { captureShareImage, shareOrDownload } from '$lib/utils/share';
  import { formatShareDate } from '$lib/utils/lunar';
  import { loadStamps } from '$lib/utils/stamps';

  let captureRoot: HTMLDivElement;
  let imageUrl: string | null = null;
  let imageBlob: Blob | null = null;
  let captureError = false;
  let capturing = true;
  let sharing = false;
  let canShareFiles = false;

  function detectShareSupport(): boolean {
    try {
      if (typeof navigator === 'undefined') return false;
      if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') {
        return false;
      }
      const probe = new File([''], 'probe.png', { type: 'image/png' });
      return navigator.canShare({ files: [probe] });
    } catch {
      return false;
    }
  }

  async function capture() {
    capturing = true;
    captureError = false;
    try {
      const blob = await captureShareImage(captureRoot);
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      imageBlob = blob;
      imageUrl = URL.createObjectURL(blob);
    } catch (err) {
      console.error('Share capture failed:', err);
      captureError = true;
    } finally {
      capturing = false;
    }
  }

  onMount(async () => {
    canShareFiles = detectShareSupport();
    if ($ritual.mode === 'draw') {
      try {
        await loadStamps();
      } catch {
        // ignored — render whatever we have
      }
    }
    // Give browser a beat to lay out and paint the visible talisman
    await new Promise((r) => setTimeout(r, 400));
    await capture();
  });

  async function onShare() {
    if (!imageBlob || sharing) return;
    sharing = true;
    try {
      await shareOrDownload(imageBlob, {
        title: '已祈晴',
        text: `${formatShareDate($ritual.date)} · ${$ritual.location} 祈求晴天 ☀️`
      });
    } finally {
      sharing = false;
    }
  }

  function startOver() {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    clearRitual();
    stage.set('setup');
  }
</script>

<div class="share-stage">
  <header class="head">
    <p class="step">步驟 3 / 3 · 完成</p>
    <h1>已祈晴</h1>
    <p class="sub">{formatShareDate($ritual.date)} · {$ritual.location}</p>
  </header>

  <div class="paper-wrap">
    <div class="paper" bind:this={captureRoot} aria-busy={capturing || undefined}>
      <TalismanFrame />
      {#if $ritual.mode === 'draw'}
        <DrawCanvas tool="brush" />
      {:else}
        <AutoTurtles />
      {/if}
    </div>
    <p class="hint" role="status" aria-live="polite">
      {#if capturing}
        產生分享圖中…
      {:else if captureError}
        <span role="alert">分享圖製作失敗</span>
      {:else}
        分享圖已準備好
      {/if}
    </p>
  </div>

  <div class="actions">
    {#if captureError}
      <Button variant="primary" onClick={capture}>重新產生分享圖</Button>
    {:else}
      <Button
        variant="primary"
        disabled={!imageBlob}
        loading={capturing || sharing}
        onClick={onShare}
      >
        {#if canShareFiles}
          分享到 LINE / IG
        {:else}
          下載圖片
        {/if}
      </Button>
    {/if}
    <Button variant="secondary" onClick={startOver}>再做一張</Button>
  </div>
</div>

<style>
  .share-stage {
    min-height: 100vh;
    min-height: 100dvh;
    background: var(--bg);
    color: var(--text);
    padding: calc(var(--space-8) + env(safe-area-inset-top, 0px)) var(--space-4)
      calc(var(--space-8) + env(safe-area-inset-bottom, 0px));
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-6);
  }
  .head {
    text-align: center;
  }
  .step {
    margin: 0 0 var(--space-2);
    font-size: 13px;
    letter-spacing: 2px;
    color: var(--text-muted);
  }
  h1 {
    margin: 0;
    color: var(--text-amber);
    font-family: var(--font-serif);
    font-weight: 700;
    font-size: 32px;
    line-height: 1.2;
    letter-spacing: 10px;
    text-indent: 10px;
  }
  .sub {
    margin: var(--space-2) 0 0;
    color: var(--peach);
    font-size: 14px;
    letter-spacing: 1px;
  }
  .paper-wrap {
    width: 100%;
    max-width: 360px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
  }
  .paper {
    position: relative;
    width: 100%;
    aspect-ratio: 3 / 4;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  }
  .hint {
    font-size: 13px;
    color: var(--text-muted);
    margin: 0;
    min-height: 1.5em;
  }
  .hint [role='alert'] {
    color: var(--text-error);
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    width: 100%;
    max-width: 320px;
  }
</style>
