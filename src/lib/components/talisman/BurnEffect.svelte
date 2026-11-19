<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import {
    PAPER_W,
    PAPER_H,
    makeBurnShape,
    holeOutline,
    holePathD,
    pointOnOutline,
    frontPoints,
    type Point
  } from './burnPath';

  const dispatch = createEventDispatcher<{ done: void; frame: void }>();

  // ── timeline (ms) ──────────────────────────────────────────────
  const TOTAL = 4000;
  const HOLE_START = 300; // hole begins to grow
  const HOLE_END = 3800; // paper fully consumed
  const SPARK_START = 1000;
  const FLASH_AT = 2400;
  const DYING_AT = 3300; // flames shrink, ash starts falling
  const REDUCED_DONE = 1200;

  // ── geometry ──────────────────────────────────────────────────
  const shape = makeBurnShape();
  let points: Point[] = holeOutline(shape, 0, 96);
  let holeD = holePathD(points);

  const pct = (p: Point) => `left:${(p.x / PAPER_W) * 100}%;top:${(p.y / PAPER_H) * 100}%`;

  // ── stage flags ───────────────────────────────────────────────
  let ignited = false;
  let burning = false; // hole growing → edge glow + flames visible
  let sparksOn = false;
  let flashOn = false;
  let dying = false;
  let out = false;
  let reduced = false;

  // ── flames: fixed fractions along the outline ─────────────────
  const FLAME_COUNT = 8;
  const flames = Array.from({ length: FLAME_COUNT }, (_, i) => ({
    u: (i + 0.2 + Math.random() * 0.6) / FLAME_COUNT,
    sx: 0.8 + Math.random() * 0.5,
    sy: 0.9 + Math.random() * 0.6,
    dur: 0.7 + Math.random() * 0.5,
    delay: Math.random() * 0.6
  }));
  let flamePos: Point[] = flames.map(() => ({ x: shape.cx, y: shape.cy }));

  // ── smoke: four puffs riding the front ───────────────────────
  const SMOKE_U = [0.1, 0.35, 0.6, 0.85];
  let smokePos: Point[] = SMOKE_U.map(() => ({ x: shape.cx, y: shape.cy }));

  // ── sparks: a recycled pool; replacing an entry (new id) restarts its CSS animation
  type Spark = { id: number; x: number; y: number; dx: number; dur: number; size: number };
  const SPARK_POOL = 30;
  const SPARK_EVERY = 70; // ms
  let sparks: Spark[] = [];
  let sparkSeq = 0;
  let sparkCursor = 0;
  let lastSpawn = -Infinity;

  function spawnSpark() {
    if (!hasFront) return;
    const p = onFront(Math.random());
    const s: Spark = {
      id: ++sparkSeq,
      x: p.x,
      y: p.y,
      dx: (Math.random() - 0.5) * 60,
      dur: 0.9 + Math.random() * 0.9,
      size: 2 + Math.random() * 3
    };
    if (sparks.length < SPARK_POOL) sparks = [...sparks, s];
    else {
      sparks[sparkCursor] = s;
      sparks = sparks;
      sparkCursor = (sparkCursor + 1) % SPARK_POOL;
    }
  }

  // ── ash flakes: drift down once the paper is mostly gone ─────
  const ash = Array.from({ length: 12 }, () => ({
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 70,
    dur: 1.6 + Math.random() * 1.2,
    delay: Math.random() * 0.8,
    w: 5 + Math.random() * 6,
    h: 3 + Math.random() * 3
  }));

  // ── loop ──────────────────────────────────────────────────────
  let raf = 0;
  let doneTimer: ReturnType<typeof setTimeout> | null = null;
  let buzzTimer: ReturnType<typeof setTimeout> | null = null;

  function vibrate(pattern: number | number[]) {
    try {
      navigator.vibrate?.(pattern);
    } catch {
      /* ignored */
    }
  }
  let start = 0;
  let finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    dispatch('done');
  }

  const SEGMENTS = 96;

  let front: Point[] = [];
  let hasFront = false;
  let glowPos: Point = { x: shape.cx, y: shape.cy };

  function onFront(u: number): Point {
    // u ∈ [0,1) mapped onto the sub-polyline of outline points still on paper
    return front[Math.min(front.length - 1, Math.floor(u * front.length))];
  }

  function applyProgress(t: number) {
    points = holeOutline(shape, t, SEGMENTS);
    holeD = holePathD(points);
    front = frontPoints(points);
    hasFront = front.length > 0;
    if (hasFront) {
      flamePos = flames.map((f) => onFront(f.u));
      smokePos = SMOKE_U.map((u) => onFront(u));
      const c = front.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), { x: 0, y: 0 });
      glowPos = { x: c.x / front.length, y: c.y / front.length };
    }
  }

  function jumpToEnd() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (doneTimer) clearTimeout(doneTimer);
    doneTimer = null;
    applyProgress(1);
    ignited = true;
    burning = false;
    sparksOn = false;
    dying = true;
    out = true;
    finish();
  }

  function frame() {
    const elapsed = performance.now() - start;
    const t = Math.min(1, Math.max(0, (elapsed - HOLE_START) / (HOLE_END - HOLE_START)));
    applyProgress(t);

    ignited = true;
    out = elapsed >= HOLE_END;
    burning = elapsed >= HOLE_START && !out;
    dying = elapsed >= DYING_AT;
    sparksOn = elapsed >= SPARK_START && !out;
    if (elapsed >= FLASH_AT) flashOn = true;

    if (sparksOn && elapsed - lastSpawn >= SPARK_EVERY) {
      spawnSpark();
      lastSpawn = elapsed;
    }

    // Lets the host nudge the clipped paper so WebKit repaints the clip.
    dispatch('frame');

    if (elapsed < TOTAL) raf = requestAnimationFrame(frame);
    else raf = 0;
  }

  onMount(() => {
    reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const onVis = () => {
      if (document.hidden) jumpToEnd();
    };
    document.addEventListener('visibilitychange', onVis);

    // Haptics are not motion: keep them in both branches.
    vibrate(50);

    if (reduced) {
      // Static final snapshot, no choreography.
      applyProgress(1);
      ignited = true;
      dying = true;
      out = true;
      doneTimer = setTimeout(finish, REDUCED_DONE);
    } else {
      start = performance.now();
      doneTimer = setTimeout(finish, TOTAL);
      buzzTimer = setTimeout(() => vibrate([30, 100, 30]), 1500);
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (doneTimer) clearTimeout(doneTimer);
      if (buzzTimer) clearTimeout(buzzTimer);
      document.removeEventListener('visibilitychange', onVis);
    };
  });
</script>

<div
  class="burn"
  class:ignited
  class:burning
  class:dying
  class:out
  class:reduced
  class:has-front={hasFront}
  aria-hidden="true"
>
  <!-- clip-path consumed by the paper (Burn.svelte) + char / ember strokes -->
  <svg class="edge" viewBox="0 0 {PAPER_W} {PAPER_H}" preserveAspectRatio="none">
    <defs>
      <clipPath id="burn-clip" clipPathUnits="objectBoundingBox">
        <path
          clip-rule="evenodd"
          transform="scale({1 / PAPER_W} {1 / PAPER_H})"
          d="M{-PAPER_W} {-PAPER_H}H{PAPER_W * 2}V{PAPER_H * 2}H{-PAPER_W}Z{holeD}"
        />
      </clipPath>
      <filter id="burn-scorch" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
      <filter id="burn-char" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" />
      </filter>
      <filter id="burn-ember" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.2" />
      </filter>
    </defs>
    {#if burning}
      <!-- scorch: paper darkens toward the edge -->
      <path class="scorch" d={holeD} filter="url(#burn-scorch)" />
      <!-- char: black crust along the edge -->
      <path class="char" d={holeD} filter="url(#burn-char)" />
      <!-- ember: glowing line, flickers -->
      <path class="ember" d={holeD} filter="url(#burn-ember)" />
      <path class="ember-core" d={holeD} />
    {/if}
  </svg>

  <!-- ignition point -->
  <div class="ignition" style={pct({ x: shape.cx, y: shape.cy })}></div>

  <!-- warm light spill while burning -->
  <div class="glow" style={pct(glowPos)}></div>

  <!-- flames ride the front -->
  <div class="flames">
    {#each flames as f, i}
      <div
        class="flame-anchor"
        style="{pct(flamePos[i])};--sx:{f.sx};--sy:{f.sy};"
      >
        <div
          class="flame"
          style="animation-duration:{f.dur}s;animation-delay:{f.delay}s"
        ></div>
      </div>
    {/each}
  </div>

  <!-- sparks -->
  <div class="sparks">
    {#each sparks as s (s.id)}
      <i
        class="spark"
        style="{pct(s)};--dx:{s.dx}px;--dur:{s.dur}s;width:{s.size}px;height:{s.size}px"
      ></i>
    {/each}
  </div>

  <!-- smoke -->
  <div class="smokes">
    {#each SMOKE_U as _, i}
      <div class="smoke" style="{pct(smokePos[i])};animation-delay:{i * 0.3}s"></div>
    {/each}
  </div>

  <!-- ash flakes -->
  <div class="ashes">
    {#each ash as a}
      <i
        class="ash"
        style="left:{a.x}%;top:{a.y}%;width:{a.w}px;height:{a.h}px;animation-duration:{a.dur}s;animation-delay:{a.delay}s"
      ></i>
    {/each}
  </div>

  <!-- one-shot flash when the fire reaches the middle -->
  {#if flashOn}
    <div class="flash"></div>
  {/if}
</div>

<style>
  .burn {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: visible;
  }
  .burn > * {
    position: absolute;
    inset: 0;
  }

  /* ─── edge strokes ─── */
  .edge {
    width: 100%;
    height: 100%;
    overflow: hidden; /* strokes only where paper exists */
  }
  .scorch {
    fill: none;
    stroke: #3a1f0f;
    stroke-width: 44;
    opacity: 0.55;
  }
  .char {
    fill: none;
    stroke: #1a0d08;
    stroke-width: 14;
    opacity: 0.95;
  }
  .ember {
    fill: none;
    stroke: #ff7a1a;
    stroke-width: 6;
    animation: emberFlicker 0.35s ease-in-out infinite alternate;
  }
  .ember-core {
    fill: none;
    stroke: #ffd98a;
    stroke-width: 1.6;
    opacity: 0.9;
    animation: emberFlicker 0.25s ease-in-out infinite alternate-reverse;
  }
  .dying .ember,
  .dying .ember-core {
    animation-duration: 0.9s;
    opacity: 0.5;
  }
  @keyframes emberFlicker {
    from {
      opacity: 0.55;
    }
    to {
      opacity: 1;
    }
  }

  /* ─── ignition ─── */
  .ignition {
    position: absolute;
    inset: auto;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(
      circle,
      rgba(255, 240, 180, 1) 0%,
      rgba(255, 150, 40, 0.9) 25%,
      rgba(220, 60, 0, 0.5) 55%,
      transparent 75%
    );
    mix-blend-mode: screen;
    opacity: 0;
    transition: opacity 0.25s ease-out;
  }
  .ignited .ignition {
    opacity: 1;
    animation: ignite 0.6s ease-out forwards;
  }
  @keyframes ignite {
    0% {
      transform: translate(-50%, -50%) scale(0.2);
      opacity: 0;
    }
    40% {
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) scale(1.6);
      opacity: 0;
    }
  }

  /* ─── glow ─── */
  .glow {
    position: absolute;
    inset: auto;
    width: 55%;
    aspect-ratio: 1;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(
      circle,
      rgba(255, 190, 90, 0.5) 0%,
      rgba(255, 120, 30, 0.28) 35%,
      transparent 68%
    );
    mix-blend-mode: screen;
    filter: blur(10px);
    opacity: 0;
    transition: opacity 0.5s ease-in;
  }
  .burning.has-front .glow {
    opacity: 1;
  }
  .dying .glow {
    opacity: 0.2;
  }
  .out .glow {
    opacity: 0;
    transition-duration: 0.2s;
  }

  /* ─── flames ─── */
  .flames {
    mix-blend-mode: screen;
    filter: blur(1.5px);
    opacity: 0;
    transition: opacity 0.4s ease-in;
  }
  .burning.has-front .flames {
    opacity: 1;
  }
  .out .flames {
    opacity: 0;
    transition-duration: 0.25s;
  }
  .flame-anchor {
    position: absolute;
    inset: auto;
    width: 0;
    height: 0;
    --s: 1;
    transition: --s 0.6s;
  }
  .dying .flame-anchor {
    --s: 0.45;
  }
  .flame {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 64px;
    height: 118px;
    border-radius: 50% 50% 35% 35% / 60% 60% 40% 40%;
    background: radial-gradient(
      ellipse at center 78%,
      rgba(255, 248, 200, 0.95) 0%,
      rgba(255, 215, 80, 0.9) 12%,
      rgba(255, 140, 30, 0.85) 30%,
      rgba(220, 60, 10, 0.65) 55%,
      rgba(140, 20, 0, 0.3) 75%,
      transparent 90%
    );
    transform-origin: 50% 92%;
    animation: flicker 1s ease-in-out infinite alternate;
    will-change: transform, opacity;
  }
  @keyframes flicker {
    0% {
      transform: translate(-50%, -88%) scale(calc(var(--sx) * 0.85 * var(--s)), calc(var(--sy) * 0.9 * var(--s)));
      opacity: 0.85;
    }
    35% {
      transform: translate(-52%, -92%) scale(calc(var(--sx) * 1.05 * var(--s)), calc(var(--sy) * 1.12 * var(--s)));
      opacity: 1;
    }
    65% {
      transform: translate(-48%, -95%) scale(calc(var(--sx) * 0.95 * var(--s)), calc(var(--sy) * 1.22 * var(--s)));
      opacity: 0.95;
    }
    100% {
      transform: translate(-50%, -90%) scale(calc(var(--sx) * var(--s)), calc(var(--sy) * var(--s)));
      opacity: 0.9;
    }
  }

  /* ─── sparks ─── */
  .spark {
    position: absolute;
    display: block;
    border-radius: 50%;
    background: #ffd27a;
    box-shadow: 0 0 6px 2px rgba(255, 150, 40, 0.8);
    animation: sparkRise var(--dur) ease-out forwards;
  }
  @keyframes sparkRise {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
    70% {
      opacity: 0.9;
    }
    100% {
      transform: translate(calc(-50% + var(--dx)), calc(-50% - 140px)) scale(0.3);
      opacity: 0;
    }
  }

  /* ─── smoke ─── */
  .smokes {
    opacity: 0;
    transition: opacity 0.6s;
  }
  .burning.has-front .smokes {
    opacity: 1;
  }
  .out .smokes {
    opacity: 0;
    transition-duration: 1s;
  }
  .smoke {
    position: absolute;
    inset: auto;
    width: 90px;
    height: 90px;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      rgba(150, 150, 150, 0.5) 0%,
      rgba(100, 100, 100, 0.3) 50%,
      transparent 75%
    );
    filter: blur(14px);
    animation: smokeRise 2.4s linear infinite;
  }
  @keyframes smokeRise {
    0% {
      transform: translate(-50%, -30%) scale(0.5);
      opacity: 0;
    }
    15% {
      opacity: 0.7;
    }
    60% {
      opacity: 0.4;
    }
    100% {
      transform: translate(-45%, -230%) scale(1.8);
      opacity: 0;
    }
  }

  /* ─── ash ─── */
  .ashes {
    opacity: 0;
  }
  .dying .ashes {
    opacity: 1;
  }
  .ash {
    position: absolute;
    display: block;
    background: #8a8078;
    border-radius: 1px;
    opacity: 0;
  }
  .dying .ash {
    animation: ashFall linear forwards;
  }
  @keyframes ashFall {
    0% {
      transform: translate(0, 0) rotate(0deg);
      opacity: 0;
    }
    15% {
      opacity: 0.85;
    }
    100% {
      transform: translate(18px, 160px) rotate(200deg);
      opacity: 0;
    }
  }

  /* ─── flash ─── */
  .flash {
    background: radial-gradient(
      ellipse at 50% 50%,
      rgba(255, 244, 214, 0.95) 0%,
      rgba(255, 200, 120, 0.5) 35%,
      transparent 70%
    );
    mix-blend-mode: screen;
    opacity: 0;
    animation: flash 0.5s ease-out forwards;
  }
  @keyframes flash {
    0% {
      opacity: 0;
    }
    35% {
      opacity: 0.4;
    }
    100% {
      opacity: 0;
    }
  }

  /* ─── reduced motion: static end state ─── */
  @media (prefers-reduced-motion: reduce) {
    .burn * {
      animation: none !important;
      transition: none !important;
    }
    .reduced .ignition,
    .reduced .glow,
    .reduced .flames,
    .reduced .sparks,
    .reduced .smokes {
      opacity: 0;
    }
    /* a still scatter of ash reads as "burned", a blank box reads as broken */
    .reduced .ashes {
      opacity: 1;
    }
    .reduced .ash {
      opacity: 0.85;
      transform: translate(10px, 80px) rotate(25deg);
    }
  }
</style>
