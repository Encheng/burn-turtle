import { djb2, makeRng } from '$lib/utils/seededRandom';

export type AutoTurtle = {
  x: number;
  y: number;
  scale: number;
  variant: 0 | 1 | 2;
};

const ROWS = [
  { y: 165, count: 4 },
  { y: 215, count: 6 },
  { y: 260, count: 6 }
];
const X_MIN = 30;
const X_MAX = 210;

export function generateAutoTurtles(date: string, location: string): AutoTurtle[] {
  const seed = djb2(`${date}|${location}`);
  const rng = makeRng(seed);
  const turtles: AutoTurtle[] = [];

  for (const row of ROWS) {
    const span = X_MAX - X_MIN;
    const step = span / (row.count - 1);
    for (let i = 0; i < row.count; i++) {
      const baseX = X_MIN + i * step;
      const dx = (rng() - 0.5) * 6; // ±3
      const dy = (rng() - 0.5) * 6;
      const scale = 0.9 + rng() * 0.2; // 0.9–1.1
      const variant = Math.floor(rng() * 3) as 0 | 1 | 2;
      turtles.push({
        x: Math.max(X_MIN, Math.min(X_MAX, baseX + dx)),
        y: Math.max(150, Math.min(280, row.y + dy)),
        scale,
        variant
      });
    }
  }
  return turtles;
}
