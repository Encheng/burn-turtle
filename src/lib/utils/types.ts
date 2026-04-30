export type Stage = 'setup' | 'ritual' | 'burn' | 'share';

export type Mode = 'draw' | 'auto';

export type Point = { x: number; y: number };

export type Op =
  | { type: 'stroke'; points: Point[]; size: number }
  | { type: 'stamp'; x: number; y: number; variant: 0 | 1 | 2 }
  | { type: 'erase'; points: Point[]; size: number };

export type Ritual = {
  date: string;       // ISO 'YYYY-MM-DD'
  time?: string;      // 'HH:mm'
  location: string;
  mode: Mode;
  operations: Op[];
};

export const DEFAULT_RITUAL: Ritual = {
  date: '',
  time: undefined,
  location: '',
  mode: 'draw',
  operations: []
};
