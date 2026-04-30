<script lang="ts">
  import { onMount } from 'svelte';
  import { ritual } from '$lib/stores/ritual';
  import type { Op, Point } from '$lib/utils/types';
  import { addOp, popOp } from '$lib/utils/canvas';
  import { loadStamps } from '$lib/utils/stamps';

  export let tool: 'brush' | 'stamp' | 'erase' = 'brush';

  const W = 1080;
  const H = 1440;
  const INK = '#3E5B79';
  const BRUSH = 6;
  const ERASER = 30;

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let drawing = false;
  let currentStroke: Point[] = [];
  let stampImages: HTMLImageElement[] = [];

  onMount(async () => {
    ctx = canvas.getContext('2d');
    if (!ctx) return;
    try {
      stampImages = await loadStamps();
    } catch {
      stampImages = [];
    }
    redraw();
  });

  function clientToCanvas(e: PointerEvent): Point {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H
    };
  }

  function onPointerDown(e: PointerEvent) {
    if (tool === 'stamp') {
      const p = clientToCanvas(e);
      placeStamp(p.x, p.y);
      return;
    }
    drawing = true;
    currentStroke = [clientToCanvas(e)];
    canvas.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!drawing) return;
    currentStroke.push(clientToCanvas(e));
    redraw(true); // include in-progress stroke
  }

  function onPointerUp() {
    if (!drawing) return;
    drawing = false;
    if (currentStroke.length > 1) {
      const op: Op =
        tool === 'erase'
          ? { type: 'erase', points: [...currentStroke], size: ERASER }
          : { type: 'stroke', points: [...currentStroke], size: BRUSH };
      ritual.update((r) => ({ ...r, operations: addOp(r.operations, op) }));
    }
    currentStroke = [];
    redraw();
  }

  export function placeStamp(x: number, y: number): void {
    const variant = Math.floor(Math.random() * 3) as 0 | 1 | 2;
    ritual.update((r) => ({
      ...r,
      operations: addOp(r.operations, { type: 'stamp', x, y, variant })
    }));
    redraw();
  }

  export function undo(): void {
    ritual.update((r) => ({ ...r, operations: popOp(r.operations) }));
    redraw();
  }

  function drawStroke(c: CanvasRenderingContext2D, points: Point[], size: number, erase = false) {
    if (points.length < 1) return;
    c.save();
    if (erase) c.globalCompositeOperation = 'destination-out';
    c.strokeStyle = INK;
    c.lineWidth = size;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length - 1; i++) {
      const mid = {
        x: (points[i].x + points[i + 1].x) / 2,
        y: (points[i].y + points[i + 1].y) / 2
      };
      c.quadraticCurveTo(points[i].x, points[i].y, mid.x, mid.y);
    }
    c.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    c.stroke();
    c.restore();
  }

  function drawStamp(c: CanvasRenderingContext2D, x: number, y: number, variant: 0 | 1 | 2) {
    const img = stampImages[variant];
    if (!img) return;
    const sw = 120; // canvas-resolution width
    const sh = 80;
    c.drawImage(img, x - sw / 2, y - sh / 2, sw, sh);
  }

  function redraw(includeCurrent = false): void {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    const ops = $ritual.operations;
    for (const op of ops) {
      if (op.type === 'stroke') drawStroke(ctx, op.points, op.size);
      else if (op.type === 'erase') drawStroke(ctx, op.points, op.size, true);
      else if (op.type === 'stamp') drawStamp(ctx, op.x, op.y, op.variant);
    }
    if (includeCurrent && currentStroke.length > 1) {
      drawStroke(
        ctx,
        currentStroke,
        tool === 'erase' ? ERASER : BRUSH,
        tool === 'erase'
      );
    }
  }

</script>

<canvas
  bind:this={canvas}
  width={W}
  height={H}
  class="canvas"
  class:cursor-stamp={tool === 'stamp'}
  on:pointerdown={onPointerDown}
  on:pointermove={onPointerMove}
  on:pointerup={onPointerUp}
  on:pointercancel={onPointerUp}
></canvas>

<style>
  .canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    touch-action: none;
  }
  .cursor-stamp {
    cursor: crosshair;
  }
</style>
