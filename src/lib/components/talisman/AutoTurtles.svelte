<script lang="ts">
  import { ritual } from '$lib/stores/ritual';
  import { generateAutoTurtles } from './autoTurtles';

  $: turtles = generateAutoTurtles($ritual.date, $ritual.location);

  const STAMPS = [
    '/stamps/turtle-1.svg',
    '/stamps/turtle-2.svg',
    '/stamps/turtle-3.svg'
  ];
</script>

<svg viewBox="0 0 240 320" class="overlay" preserveAspectRatio="xMidYMid meet">
  {#each turtles as t}
    <image
      href={STAMPS[t.variant]}
      x={t.x - 12 * t.scale}
      y={t.y - 8 * t.scale}
      width={24 * t.scale}
      height={16 * t.scale}
    />
  {/each}
</svg>

<style>
  .overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
</style>
