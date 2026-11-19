<script lang="ts">
  import { ritual } from '$lib/stores/ritual';
  import { formatTalismanFooter } from '$lib/utils/lunar';

  $: footer = formatTalismanFooter({
    date: $ritual.date,
    time: $ritual.time,
    location: $ritual.location
  });
</script>

<svg
  viewBox="0 0 240 320"
  class="frame"
  xmlns="http://www.w3.org/2000/svg"
  preserveAspectRatio="xMidYMid meet"
>
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#EDCBA8" />
      <stop offset="100%" stop-color="#DAB96D" />
    </linearGradient>
    <pattern id="paper-grain" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="0.3" fill="#A69B8E" opacity="0.25" />
      <circle cx="3" cy="3" r="0.2" fill="#A69B8E" opacity="0.18" />
    </pattern>
    <filter id="ink-bleed">
      <feGaussianBlur stdDeviation="0.5" />
    </filter>
  </defs>

  <!-- paper -->
  <rect width="240" height="320" fill="url(#paper)" />
  <rect width="240" height="320" fill="url(#paper-grain)" />

  <!-- frame borders -->
  <rect x="14" y="14" width="212" height="292" fill="none" stroke="#3E5B79" stroke-width="1.5" />
  <rect x="20" y="20" width="200" height="280" fill="none" stroke="#3E5B79" stroke-width="0.6" />

  <!-- 勅令 header -->
  <g filter="url(#ink-bleed)">
    <text
      x="120"
      y="50"
      text-anchor="middle"
      font-size="14"
      font-family="'Noto Serif TC', 'Songti TC', 'PMingLiU', serif"
      font-weight="bold"
      fill="#3E5B79"
      letter-spacing="6"
    >勅 令</text>
  </g>
  <line x1="40" y1="62" x2="200" y2="62" stroke="#3E5B79" stroke-width="1" />

  <!-- sun -->
  <g filter="url(#ink-bleed)">
    <g stroke="#3E5B79" stroke-width="2.5" stroke-linecap="round" fill="none">
      <line x1="120" y1="78" x2="120" y2="86" />
      <line x1="120" y1="130" x2="120" y2="138" />
      <line x1="74" y1="108" x2="82" y2="108" />
      <line x1="158" y1="108" x2="166" y2="108" />
      <line x1="86" y1="80" x2="92" y2="86" />
      <line x1="148" y1="86" x2="154" y2="80" />
      <line x1="86" y1="136" x2="92" y2="130" />
      <line x1="148" y1="130" x2="154" y2="136" />
    </g>
    <circle cx="120" cy="108" r="22" fill="#3E5B79" />
    <text
      x="120"
      y="115"
      text-anchor="middle"
      font-size="20"
      fill="#DAB96D"
      font-family="serif"
      font-weight="bold"
    >日</text>
  </g>

  <!-- 「晴」印 -->
  <g transform="translate(195 250)">
    <rect x="-12" y="-12" width="24" height="24" fill="#3E5B79" rx="2" />
    <text
      x="0"
      y="5"
      text-anchor="middle"
      font-size="14"
      fill="#F2F8F2"
      font-family="serif"
      font-weight="bold"
    >晴</text>
  </g>

  <!-- footer: lunar date · time · location (reactive) -->
  {#if footer}
    <text
      x="120"
      y="295"
      text-anchor="middle"
      font-size="11"
      fill="#24364B"
      font-family="'Noto Serif TC', 'Songti TC', 'PMingLiU', serif"
      letter-spacing="2"
    >
      {footer}
    </text>
  {/if}
</svg>

<style>
  .frame {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
