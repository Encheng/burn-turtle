<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  let phase = 0; // 0..4

  onMount(() => {
    const t1 = setTimeout(() => (phase = 1), 300);
    const t2 = setTimeout(() => (phase = 2), 1000);
    const t3 = setTimeout(() => (phase = 3), 2500);
    const t4 = setTimeout(() => (phase = 4), 3500);
    const tDone = setTimeout(() => dispatch('done'), 4000);

    try {
      navigator.vibrate?.(50);
      setTimeout(() => navigator.vibrate?.([30, 100, 30]), 1500);
    } catch {
      /* ignored */
    }

    const onVis = () => {
      if (document.hidden) {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        clearTimeout(tDone);
        phase = 4;
        dispatch('done');
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(tDone);
      document.removeEventListener('visibilitychange', onVis);
    };
  });

  // 12 flame particles distributed around the paper. Each gets random-ish
  // position / scale / delay via CSS variables so they flicker out of phase.
  const flames = [
    { left: '6%', bottom: '-12%', sx: 1.0, sy: 1.1, delay: 0.0, dur: 0.9 },
    { left: '18%', bottom: '-8%', sx: 0.9, sy: 0.95, delay: 0.35, dur: 1.1 },
    { left: '30%', bottom: '-10%', sx: 1.2, sy: 1.25, delay: 0.15, dur: 0.85 },
    { left: '42%', bottom: '-5%', sx: 1.0, sy: 1.4, delay: 0.5, dur: 1.0 },
    { left: '54%', bottom: '-10%', sx: 1.15, sy: 1.0, delay: 0.25, dur: 0.95 },
    { left: '66%', bottom: '-7%', sx: 0.95, sy: 1.2, delay: 0.4, dur: 1.05 },
    { left: '78%', bottom: '-10%', sx: 1.05, sy: 1.1, delay: 0.1, dur: 0.9 },
    { left: '88%', bottom: '-12%', sx: 0.9, sy: 0.95, delay: 0.45, dur: 1.0 },
    { left: '15%', bottom: '15%', sx: 0.7, sy: 0.8, delay: 0.6, dur: 0.8 },
    { left: '50%', bottom: '20%', sx: 0.85, sy: 0.95, delay: 0.2, dur: 0.95 },
    { left: '75%', bottom: '18%', sx: 0.75, sy: 0.85, delay: 0.5, dur: 0.9 },
    { left: '38%', bottom: '35%', sx: 0.6, sy: 0.7, delay: 0.3, dur: 0.85 }
  ];
</script>

<div class="burn-overlay phase-{phase}">
  <!-- Char (under everything) -->
  <div class="char-edge top"></div>
  <div class="char-edge bottom"></div>
  <div class="char-edge left"></div>
  <div class="char-edge right"></div>

  <!-- Glow halo behind the flames -->
  <div class="glow"></div>

  <!-- Layered flame particles, blended additively -->
  <div class="flames">
    {#each flames as f, i}
      <div
        class="flame"
        style="left: {f.left}; bottom: {f.bottom};
               --sx: {f.sx}; --sy: {f.sy};
               animation-delay: {f.delay}s;
               animation-duration: {f.dur}s;"
      ></div>
    {/each}
  </div>

  <!-- Grain / noise overlay (SVG turbulence) -->
  <svg class="noise" aria-hidden="true" preserveAspectRatio="none">
    <filter id="burn-noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
      <feColorMatrix
        values="0 0 0 0 1
                0 0 0 0 0.6
                0 0 0 0 0.1
                0 0 0 1 0"
      />
    </filter>
    <rect width="100%" height="100%" filter="url(#burn-noise)" />
  </svg>

  <!-- Smoke -->
  <div class="smoke smoke-1"></div>
  <div class="smoke smoke-2"></div>
  <div class="smoke smoke-3"></div>
  <div class="smoke smoke-4"></div>

  <!-- Ash darkening overlay at the very end -->
  <div class="ash"></div>

  <!-- Flash white at ignition peak -->
  <div class="flash"></div>
</div>

<style>
  .burn-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  /* ─── char edges ─── */
  .char-edge {
    position: absolute;
    background:
      radial-gradient(circle at center, transparent 0%, #1a1a1a 60%),
      #1a1a1a;
    opacity: 0;
    transition:
      opacity 0.6s ease-out,
      width 0.8s ease-in,
      height 0.8s ease-in;
  }
  .char-edge.top {
    top: 0;
    left: 0;
    right: 0;
    height: 0;
  }
  .char-edge.bottom {
    bottom: 0;
    left: 0;
    right: 0;
    height: 0;
  }
  .char-edge.left {
    top: 0;
    bottom: 0;
    left: 0;
    width: 0;
  }
  .char-edge.right {
    top: 0;
    bottom: 0;
    right: 0;
    width: 0;
  }
  .phase-1 .char-edge,
  .phase-2 .char-edge {
    opacity: 0.85;
  }
  .phase-1 .top,
  .phase-1 .bottom {
    height: 8%;
  }
  .phase-1 .left,
  .phase-1 .right {
    width: 8%;
  }
  .phase-2 .top,
  .phase-2 .bottom {
    height: 25%;
  }
  .phase-2 .left,
  .phase-2 .right {
    width: 25%;
  }
  .phase-3 .top,
  .phase-3 .bottom {
    height: 50%;
  }
  .phase-3 .left,
  .phase-3 .right {
    width: 50%;
  }
  .phase-3 .char-edge {
    opacity: 0.95;
  }
  .phase-4 .top,
  .phase-4 .bottom {
    height: 50%;
    opacity: 1;
  }
  .phase-4 .left,
  .phase-4 .right {
    width: 50%;
    opacity: 1;
  }

  /* ─── glow halo ─── */
  .glow {
    position: absolute;
    inset: -10%;
    background: radial-gradient(
      ellipse at 50% 60%,
      rgba(255, 200, 80, 0.55) 0%,
      rgba(255, 130, 30, 0.4) 25%,
      rgba(200, 50, 0, 0.25) 50%,
      transparent 75%
    );
    mix-blend-mode: screen;
    filter: blur(12px);
    opacity: 0;
    transition: opacity 0.6s ease-in;
  }
  .phase-2 .glow {
    opacity: 1;
  }
  .phase-3 .glow {
    opacity: 0.85;
  }
  .phase-4 .glow {
    opacity: 0;
  }

  /* ─── flame particles ─── */
  .flames {
    position: absolute;
    inset: 0;
    mix-blend-mode: screen;
    filter: blur(2px);
    opacity: 0;
    transition: opacity 0.5s ease-in;
  }
  .phase-2 .flames {
    opacity: 1;
  }
  .phase-3 .flames {
    opacity: 0.85;
  }
  .phase-4 .flames {
    opacity: 0;
    transition: opacity 0.3s;
  }

  .flame {
    position: absolute;
    width: 70px;
    height: 130px;
    border-radius: 50% 50% 35% 35% / 60% 60% 40% 40%;
    background: radial-gradient(
      ellipse at center 75%,
      rgba(255, 248, 200, 0.95) 0%,
      rgba(255, 215, 80, 0.9) 12%,
      rgba(255, 140, 30, 0.85) 30%,
      rgba(220, 60, 10, 0.65) 55%,
      rgba(140, 20, 0, 0.3) 75%,
      transparent 90%
    );
    transform-origin: center 90%;
    animation: flicker var(--dur, 1s) ease-in-out infinite alternate;
    will-change: transform, opacity;
  }

  @keyframes flicker {
    0% {
      transform: translate(-50%, 8%) scaleX(calc(var(--sx, 1) * 0.85)) scaleY(calc(var(--sy, 1) * 0.9));
      opacity: 0.85;
    }
    35% {
      transform: translate(-50%, 0%) scaleX(calc(var(--sx, 1) * 1.05)) scaleY(calc(var(--sy, 1) * 1.1));
      opacity: 1;
    }
    65% {
      transform: translate(-50%, -3%) scaleX(calc(var(--sx, 1) * 0.95)) scaleY(calc(var(--sy, 1) * 1.2));
      opacity: 0.95;
    }
    100% {
      transform: translate(-50%, 5%) scaleX(calc(var(--sx, 1) * 1)) scaleY(calc(var(--sy, 1) * 1));
      opacity: 0.9;
    }
  }

  /* ─── grain noise ─── */
  .noise {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    mix-blend-mode: overlay;
    opacity: 0;
    transition: opacity 0.5s;
  }
  .phase-2 .noise,
  .phase-3 .noise {
    opacity: 0.35;
  }

  /* ─── smoke ─── */
  .smoke {
    position: absolute;
    bottom: 5%;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      rgba(140, 140, 140, 0.55) 0%,
      rgba(100, 100, 100, 0.35) 50%,
      transparent 75%
    );
    filter: blur(15px);
    opacity: 0;
  }
  .smoke-1 {
    left: 22%;
  }
  .smoke-2 {
    left: 42%;
  }
  .smoke-3 {
    left: 62%;
  }
  .smoke-4 {
    left: 78%;
  }
  .phase-2 .smoke,
  .phase-3 .smoke,
  .phase-4 .smoke {
    animation: smokeRise 2.4s linear forwards;
  }
  .phase-2 .smoke-2 {
    animation-delay: 0.2s;
  }
  .phase-2 .smoke-3 {
    animation-delay: 0.5s;
  }
  .phase-2 .smoke-4 {
    animation-delay: 0.8s;
  }
  @keyframes smokeRise {
    0% {
      transform: translateY(0) scale(0.5);
      opacity: 0.7;
    }
    50% {
      transform: translateY(-100%) scale(1.2);
      opacity: 0.5;
    }
    100% {
      transform: translateY(-220%) scale(1.8);
      opacity: 0;
    }
  }

  /* ─── ash ─── */
  .ash {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(60, 60, 60, 0) 0%,
      rgba(40, 40, 40, 0) 100%
    );
    transition: background 0.6s ease-out;
    mix-blend-mode: multiply;
  }
  .phase-4 .ash {
    background: linear-gradient(
      180deg,
      rgba(80, 80, 80, 0.55) 0%,
      rgba(40, 40, 40, 0.75) 100%
    );
  }

  /* ─── flash ─── */
  .flash {
    position: absolute;
    inset: 0;
    background: white;
    opacity: 0;
    pointer-events: none;
  }
  .phase-2 .flash {
    animation: flash 0.5s ease-out;
  }
  @keyframes flash {
    0% {
      opacity: 0;
    }
    40% {
      opacity: 0.5;
    }
    100% {
      opacity: 0;
    }
  }
</style>
