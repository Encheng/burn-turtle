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

  onMount(async () => {
    if ($ritual.mode === 'draw') {
      try {
        await loadStamps();
      } catch {
        // stamp load failed — still attempt capture, missing stamps will just be absent
      }
    }
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));
    try {
      const blob = await captureShareImage(captureRoot);
      imageBlob = blob;
      imageUrl = URL.createObjectURL(blob);
    } catch {
      captureError = true;
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
  <div class="capture-root" bind:this={captureRoot} aria-hidden="true">
    <div class="capture-paper ash">
      <TalismanFrame />
      {#if $ritual.mode === 'draw'}
        <DrawCanvas tool="brush" />
      {:else}
        <AutoTurtles />
      {/if}
    </div>
  </div>

  <h2>已祈晴</h2>

  {#if imageUrl}
    <img src={imageUrl} alt="燒過的符咒" class="result" />
  {:else if captureError}
    <p class="error">分享圖製作失敗，仍可繼續</p>
  {:else}
    <p class="loading">製作分享圖中...</p>
  {/if}

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
  .result {
    max-width: 480px;
    width: 100%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 320px;
  }
  .loading,
  .error {
    opacity: 0.7;
  }
  .capture-root {
    position: fixed;
    top: -10000px;
    left: -10000px;
    width: 1080px;
    height: 1440px;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .capture-paper {
    position: relative;
    width: 1080px;
    height: 1440px;
  }
  .capture-paper.ash {
    filter: grayscale(0.6) brightness(0.7);
  }
</style>
