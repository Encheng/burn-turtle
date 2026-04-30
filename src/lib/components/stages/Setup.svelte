<script lang="ts">
  import { ritual } from '$lib/stores/ritual';
  import { stage } from '$lib/stores/stage';
  import Button from '$lib/components/ui/Button.svelte';
  import type { Mode } from '$lib/utils/types';

  $: canSubmit = $ritual.date.length > 0 && $ritual.location.length > 0;

  function setMode(m: Mode) {
    ritual.update((r) => ({ ...r, mode: m }));
  }

  function submit() {
    if (!canSubmit) return;
    // Past-date warning
    const today = new Date().toISOString().slice(0, 10);
    if ($ritual.date < today) {
      const ok = confirm('該日期已過，仍要祈晴嗎？');
      if (!ok) return;
    }
    stage.set('ritual');
  }
</script>

<div class="setup">
  <h1>燒烏龜</h1>
  <p class="tagline">為晴天祈晴 · 烏雲歸去</p>

  <label>
    <span>日期</span>
    <input
      type="date"
      aria-label="日期"
      bind:value={$ritual.date}
    />
  </label>

  <label>
    <span>時間（可選）</span>
    <input
      type="time"
      aria-label="時間"
      bind:value={$ritual.time}
    />
  </label>

  <label>
    <span>地點</span>
    <input
      type="text"
      aria-label="地點"
      placeholder="例：玉山主峰"
      bind:value={$ritual.location}
    />
  </label>

  <fieldset class="mode">
    <legend>模式</legend>
    <label class:selected={$ritual.mode === 'draw'}>
      <input
        type="radio"
        name="mode"
        value="draw"
        checked={$ritual.mode === 'draw'}
        on:change={() => setMode('draw')}
      />
      <strong>自己畫</strong>
      <span>手繪烏龜，較有儀式感</span>
    </label>
    <label class:selected={$ritual.mode === 'auto'}>
      <input
        type="radio"
        name="mode"
        value="auto"
        checked={$ritual.mode === 'auto'}
        on:change={() => setMode('auto')}
      />
      <strong>華麗版</strong>
      <span>系統自動排版</span>
    </label>
  </fieldset>

  <Button variant="primary" disabled={!canSubmit} onClick={submit}>
    進入儀式
  </Button>
</div>

<style>
  .setup {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 24px;
    max-width: 480px;
    margin: 0 auto;
  }
  h1 {
    text-align: center;
    color: #DAB96D;
    font-family: serif;
    font-size: 32px;
    letter-spacing: 8px;
    margin: 0;
  }
  .tagline {
    text-align: center;
    color: #EDCBA8;
    opacity: 0.85;
    margin: 0 0 16px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 14px;
    color: #F2F8F2;
  }
  label > span {
    font-weight: 500;
    opacity: 0.85;
  }
  input[type='date'],
  input[type='time'],
  input[type='text'] {
    padding: 10px 12px;
    border: 1px solid #A69B8E;
    border-radius: 6px;
    font-size: 16px;
    background: #F2F8F2;
    color: #3E5B79;
    font-family: inherit;
  }
  .mode {
    border: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .mode legend {
    font-size: 14px;
    font-weight: 500;
    color: #F2F8F2;
    opacity: 0.85;
    margin-bottom: 4px;
  }
  .mode > label {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    padding: 12px;
    border: 1px solid #A69B8E;
    border-radius: 6px;
    background: #F2F8F2;
    color: #3E5B79;
    cursor: pointer;
  }
  .mode > label.selected {
    border-color: #3E5B79;
    background: #DAB96D;
  }
  .mode strong {
    color: #3E5B79;
  }
  .mode span {
    opacity: 0.7;
    font-size: 13px;
  }
</style>
