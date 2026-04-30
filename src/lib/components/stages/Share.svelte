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

  onMount(async () => {
    if ($ritual.mode === 'draw') {
      try {
        await loadStamps();
      } catch {
        // ignored — render whatever we have
      }
    }
    // Give browser a beat to lay out and paint the visible talisman
    await new Promise((r) => setTimeout(r, 400));
    try {
      const blob = await captureShareImage(captureRoot);
      imageBlob = blob;
      imageUrl = URL.createObjectURL(blob);
    } catch (err) {
      console.error('Share capture failed:', err);
      captureError = true;
    } finally {
      capturing = false;
    }
  });

  async function onShare() {
    if (!imageBlob) return;
    await shareOrDownload(imageBlob, {
      title: '已祈晴',
      text: `${formatShareDate($ritual.date)} · ${$ritual.location} 祈求晴天 ☀️`
    });
  }

  function startOver() {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    clearRitual();
    stage.set('setup');
  }
</script>

<div class="share-stage">
  <h2>已祈晴</h2>

  <div class="paper-wrap">
    <div class="paper" bind:this={captureRoot}>
      <TalismanFrame />
      {#if $ritual.mode === 'draw'}
        <DrawCanvas tool="brush" />
      {:else}
        <AutoTurtles />
      {/if}
    </div>
    {#if capturing}
      <p class="hint">產生分享圖中...</p>
    {:else if captureError}
      <p class="hint error">分享圖製作失敗，仍可重試</p>
    {/if}
  </div>

  <div class="actions">
    <Button variant="primary" disabled={!imageBlob} onClick={onShare}>
      分享到 LINE / IG
    </Button>
    <Button variant="secondary" onClick={startOver}>再做一張</Button>
  </div>
</div>

<style>
  .share-stage {
    min-height: 100vh;
    background: #1a0000;
    color: #fff5c8;
    padding: 32px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  h2 {
    margin: 0;
    font-family: serif;
    letter-spacing: 8px;
  }
  .paper-wrap {
    width: 100%;
    max-width: 360px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .paper {
    position: relative;
    width: 100%;
    aspect-ratio: 3 / 4;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  }
  .hint {
    font-size: 13px;
    opacity: 0.7;
    margin: 0;
  }
  .error {
    color: #ff8a8a;
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 320px;
  }
</style>
