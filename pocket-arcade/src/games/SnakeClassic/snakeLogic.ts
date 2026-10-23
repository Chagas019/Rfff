import type { Rng } from '../engine/random';

export type Dir = 'up' | 'down' | 'left' | 'right';
export interface Cell {
  x: number;
  y: number;
}

export const DIRS: Record<Dir, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

/** Intervalo entre passos (s) para cada nível de velocidade (1 a 5). */
export const SPEED_STEPS = [0.2, 0.15, 0.115, 0.09, 0.065];

export interface SnakeState {
  cols: number;
  rows: number;
  body: Cell[]; // cabeça primeiro
  dir: Dir;
  queue: Dir[];
  food: Cell | null;
  grow: number;
  alive: boolean;
  won: boolean;
  eaten: number;
}

export function createSnake(cols: number, rows: number, rng: Rng): SnakeState {
  const cx = Math.floor(cols / 3);
  const cy = Math.floor(rows / 2);
  const body = [
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy },
  ];
  const s: SnakeState = { cols, rows, body, dir: 'right', queue: [], food: null, grow: 0, alive: true, won: false, eaten: 0 };
  s.food = spawnFood(s, rng);
  return s;
}

/** Comida sempre em uma célula livre; null quando o tabuleiro está cheio. */
export function spawnFood(s: Pick<SnakeState, 'cols' | 'rows' | 'body'>, rng: Rng): Cell | null {
  const occupied = new Set(s.body.map((c) => c.y * s.cols + c.x));
  const free: number[] = [];
  for (let i = 0; i < s.cols * s.rows; i++) if (!occupied.has(i)) free.push(i);
  if (!free.length) return null;
  const idx = free[Math.floor(rng() * free.length)];
  return { x: idx % s.cols, y: Math.floor(idx / s.cols) };
}

/** Enfileira uma curva (no máximo 2), ignorando meia-volta. */
export function turn(s: SnakeState, d: Dir) {
  const last = s.queue.length ? s.queue[s.queue.length - 1] : s.dir;
  if (d === last || d === OPPOSITE[last] || s.queue.length >= 2) return;
  s.queue.push(d);
}

export type StepResult = 'moved' | 'ate' | 'died' | 'won';

/** Um passo da cobra: move, come, cresce ou morre ao bater na parede/no corpo. */
export function stepSnake(s: SnakeState, rng: Rng): StepResult {
  if (!s.alive) return 'died';
  if (s.queue.length) s.dir = s.queue.shift()!;
  const d = DIRS[s.dir];
  const head = { x: s.body[0].x + d.x, y: s.body[0].y + d.y };
  if (head.x < 0 || head.y < 0 || head.x >= s.cols || head.y >= s.rows) {
    s.alive = false;
    return 'died';
  }
  // a ponta da cauda sai do lugar neste passo (a não ser que a cobra esteja crescendo)
  const willMoveTail = s.grow === 0;
  const bodyToCheck = willMoveTail ? s.body.slice(0, -1) : s.body;
  if (bodyToCheck.some((c) => c.x === head.x && c.y === head.y)) {
    s.alive = false;
    return 'died';
  }
  s.body.unshift(head);
  if (s.grow > 0) s.grow--;
  else s.body.pop();

  if (s.food && head.x === s.food.x && head.y === s.food.y) {
    s.grow += 1;
    s.eaten++;
    s.food = spawnFood(s, rng);
    if (!s.food) {
      s.won = true;
      return 'won';
    }
    return 'ate';
  }
  return 'moved';
}
