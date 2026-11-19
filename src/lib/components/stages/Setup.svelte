<script lang="ts">
  import { ritual } from '$lib/stores/ritual';
  import { stage } from '$lib/stores/stage';
  import Button from '$lib/components/ui/Button.svelte';
  import type { Mode } from '$lib/utils/types';

  let dateTouched = false;
  let locationTouched = false;

  $: dateMissing = $ritual.date.length === 0;
  $: locationMissing = $ritual.location.trim().length === 0;
  $: canSubmit = !dateMissing && !locationMissing;
  $: showDateError = dateTouched && dateMissing;
  $: showLocationError = locationTouched && locationMissing;

  function setMode(m: Mode) {
    ritual.update((r) => ({ ...r, mode: m }));
  }

  function submit() {
    dateTouched = true;
    locationTouched = true;
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

<form class="setup" on:submit|preventDefault={submit} novalidate>
  <header class="head">
    <p class="step">步驟 1 / 3 · 設定</p>
    <h1>燒烏龜</h1>
    <p class="tagline">為晴天祈晴 · 烏雲歸去</p>
  </header>

  <div class="field">
    <label for="date">日期 <span class="req" aria-hidden="true">＊</span></label>
    <input
      id="date"
      type="date"
      aria-label="日期"
      required
      aria-required="true"
      aria-invalid={showDateError || undefined}
      aria-describedby={showDateError ? 'date-error' : undefined}
      bind:value={$ritual.date}
      on:blur={() => (dateTouched = true)}
    />
    {#if showDateError}
      <p id="date-error" class="error" role="alert">請選擇祈晴的日期</p>
    {/if}
  </div>

  <div class="field">
    <label for="time">時間（可選）</label>
    <input id="time" type="time" aria-label="時間" bind:value={$ritual.time} />
  </div>

  <div class="field">
    <label for="location">地點 <span class="req" aria-hidden="true">＊</span></label>
    <input
      id="location"
      type="text"
      aria-label="地點"
      placeholder="例：玉山主峰"
      autocomplete="off"
      enterkeyhint="done"
      required
      aria-required="true"
      aria-invalid={showLocationError || undefined}
      aria-describedby={showLocationError ? 'location-error' : undefined}
      bind:value={$ritual.location}
      on:blur={() => (locationTouched = true)}
    />
    {#if showLocationError}
      <p id="location-error" class="error" role="alert">請輸入祈晴的地點</p>
    {/if}
  </div>

  <fieldset class="mode">
    <legend>模式</legend>
    <label class="card" class:selected={$ritual.mode === 'draw'}>
      <input
        class="sr-only"
        type="radio"
        name="mode"
        value="draw"
        checked={$ritual.mode === 'draw'}
        on:change={() => setMode('draw')}
      />
      <span class="card-body">
        <strong>自己畫</strong>
        <span class="desc">手繪烏龜，較有儀式感</span>
      </span>
      <svg class="check" viewBox="0 0 24 24" aria-hidden="true">
        <path d="m5 12.5 4.5 4.5L19 7.5" />
      </svg>
    </label>
    <label class="card" class:selected={$ritual.mode === 'auto'}>
      <input
        class="sr-only"
        type="radio"
        name="mode"
        value="auto"
        checked={$ritual.mode === 'auto'}
        on:change={() => setMode('auto')}
      />
      <span class="card-body">
        <strong>華麗版</strong>
        <span class="desc">系統自動排版，快速完成</span>
      </span>
      <svg class="check" viewBox="0 0 24 24" aria-hidden="true">
        <path d="m5 12.5 4.5 4.5L19 7.5" />
      </svg>
    </label>
  </fieldset>

  <div class="submit">
    <Button variant="primary" type="submit" disabled={!canSubmit}>進入儀式</Button>
    <p class="helper" aria-live="polite">
      {#if canSubmit}
        &nbsp;
      {:else}
        填寫日期與地點後即可進入儀式
      {/if}
    </p>
  </div>
</form>

<style>
  .setup {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: calc(var(--space-6) + env(safe-area-inset-top, 0px)) var(--space-6)
      calc(var(--space-8) + env(safe-area-inset-bottom, 0px));
    max-width: 480px;
    margin: 0 auto;
    min-height: 100vh;
    min-height: 100dvh;
  }
  .head {
    text-align: center;
    margin-bottom: var(--space-2);
  }
  .step {
    margin: 0 0 var(--space-2);
    font-size: 13px;
    letter-spacing: 2px;
    color: var(--text-muted);
  }
  h1 {
    color: var(--text-amber);
    font-family: var(--font-serif);
    font-weight: 700;
    font-size: 36px;
    line-height: 1.2;
    letter-spacing: 10px;
    text-indent: 10px;
    margin: 0;
  }
  .tagline {
    color: var(--peach);
    margin: var(--space-2) 0 0;
    letter-spacing: 1px;
  }

  /* ── fields ── */
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  .field > label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
  }
  .req {
    color: var(--text-amber);
  }
  input[type='date'],
  input[type='time'],
  input[type='text'] {
    min-height: var(--tap-min);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--line-on-light);
    border-radius: var(--radius-sm);
    font-size: 16px;
    background: var(--surface);
    color: var(--ink-deep);
    font-family: inherit;
    width: 100%;
    transition: border-color var(--dur-base) var(--ease), box-shadow var(--dur-base) var(--ease);
  }
  input::placeholder {
    color: var(--line-on-light);
  }
  input:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
    border-color: var(--ink);
  }
  input[aria-invalid='true'] {
    border-color: var(--text-error);
    box-shadow: 0 0 0 1px var(--text-error);
  }
  .error {
    margin: 0;
    font-size: 13px;
    color: var(--text-error);
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }
  .error::before {
    content: '!';
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1.5px solid currentColor;
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
  }

  /* ── mode cards ── */
  .mode {
    border: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .mode legend {
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
    margin-bottom: var(--space-1);
    padding: 0;
  }
  .card {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-height: 60px;
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--line-on-light);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--ink-deep);
    cursor: pointer;
    transition:
      background-color var(--dur-base) var(--ease),
      border-color var(--dur-base) var(--ease),
      box-shadow var(--dur-base) var(--ease);
  }
  @media (hover: hover) {
    .card:hover {
      border-color: var(--ink);
    }
  }
  .card:focus-within {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
  .card.selected {
    border-color: var(--ink);
    background: var(--amber);
    box-shadow: inset 0 0 0 1px var(--ink);
  }
  .card-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }
  .card strong {
    font-size: 16px;
  }
  .desc {
    font-size: 13px;
    color: var(--ink-deep);
    opacity: 0.85;
  }
  .check {
    width: 24px;
    height: 24px;
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0;
    transform: scale(0.6);
    transition:
      opacity var(--dur-base) var(--ease),
      transform var(--dur-base) var(--ease);
  }
  .card.selected .check {
    opacity: 1;
    transform: scale(1);
  }

  /* ── submit ── */
  .submit {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }
  .helper {
    margin: 0;
    text-align: center;
    font-size: 13px;
    color: var(--text-muted);
    min-height: 1.5em;
  }
</style>
