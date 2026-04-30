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
</script>

<div class="burn-overlay phase-{phase}">
  <div class="char-edge top"></div>
  <div class="char-edge bottom"></div>
  <div class="char-edge left"></div>
  <div class="char-edge right"></div>
  <div class="fire"></div>
  <div class="smoke smoke-1"></div>
  <div class="smoke smoke-2"></div>
  <div class="smoke smoke-3"></div>
  <div class="ash"></div>
  <div class="flash"></div>
</div>

<style>
  .burn-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }
  .char-edge {
    position: absolute;
    background: #1a1a1a;
    opacity: 0;
    transition: opacity 0.6s ease-out;
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
    opacity: 0.8;
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
  .phase-4 .top,
  .phase-4 .bottom {
    height: 50%;
    opacity: 0;
  }
  .phase-4 .left,
  .phase-4 .right {
    width: 50%;
    opacity: 0;
  }

  .fire {
    position: absolute;
    inset: 4%;
    background: radial-gradient(
      ellipse at center,
      rgba(255, 200, 0, 0) 0%,
      rgba(255, 100, 0, 0) 50%,
      rgba(180, 30, 0, 0) 100%
    );
    filter: blur(8px);
    transition:
      background 0.4s,
      transform 0.3s;
    transform: scale(0.5);
  }
  .phase-2 .fire {
    background: radial-gradient(
      ellipse at center,
      rgba(255, 230, 80, 0.4) 0%,
      rgba(255, 100, 0, 0.5) 60%,
      rgba(180, 30, 0, 0.3) 100%
    );
    transform: scale(1);
    animation: flicker 0.2s steps(2) infinite;
  }
  .phase-3 .fire {
    opacity: 0.5;
    transform: scale(1.1);
  }
  .phase-4 .fire {
    opacity: 0;
  }
  @keyframes flicker {
    0%,
    100% {
      transform: scale(1) translate(0, 0);
    }
    50% {
      transform: scale(1.05) translate(2px, -2px);
    }
  }

  .smoke {
    position: absolute;
    bottom: 10%;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: rgba(120, 120, 120, 0.4);
    filter: blur(20px);
    opacity: 0;
  }
  .smoke-1 {
    left: 30%;
  }
  .smoke-2 {
    left: 50%;
  }
  .smoke-3 {
    left: 70%;
  }
  .phase-3 .smoke,
  .phase-4 .smoke {
    animation: smokeRise 2s linear forwards;
  }
  .phase-3 .smoke-2 {
    animation-delay: 0.3s;
  }
  .phase-3 .smoke-3 {
    animation-delay: 0.6s;
  }
  @keyframes smokeRise {
    0% {
      transform: translateY(0) scale(0.6);
      opacity: 0.7;
    }
    100% {
      transform: translateY(-200%) scale(1.6);
      opacity: 0;
    }
  }

  .ash {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(90, 90, 90, 0) 0%, rgba(60, 60, 60, 0) 100%);
    transition: background 0.6s;
    mix-blend-mode: multiply;
  }
  .phase-4 .ash {
    background: linear-gradient(180deg, rgba(90, 90, 90, 0.7) 0%, rgba(40, 40, 40, 0.85) 100%);
  }

  .flash {
    position: absolute;
    inset: 0;
    background: white;
    opacity: 0;
  }
  .phase-2 .flash {
    animation: flash 0.4s ease-out;
  }
  @keyframes flash {
    0% {
      opacity: 0;
    }
    50% {
      opacity: 0.6;
    }
    100% {
      opacity: 0;
    }
  }
</style>
