import type { Rng } from '../engine/random';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export type EnemyKind = 'drone' | 'diver' | 'gunner';

export interface Enemy extends Box {
  kind: EnemyKind;
  hp: number;
  vx: number;
  vy: number;
  t: number;
  fireIn: number;
  baseX: number;
}

export interface Bullet extends Box {
  vx: number;
  vy: number;
}

export const ENEMY_SPEC: Record<EnemyKind, { w: number; h: number; hp: number; score: number }> = {
  drone: { w: 12, h: 9, hp: 1, score: 50 },
  diver: { w: 11, h: 11, hp: 1, score: 80 },
  gunner: { w: 16, h: 10, hp: 3, score: 150 },
};

/** Composição de cada onda: mais inimigos e tipos mais difíceis conforme avança. */
export function waveSpec(wave: number) {
  const count = 5 + wave * 2;
  const kinds: EnemyKind[] = ['drone'];
  if (wave >= 2) kinds.push('diver');
  if (wave >= 3) kinds.push('gunner');
  return { count, kinds, interval: Math.max(0.35, 1.1 - wave * 0.08), speedMul: 1 + (wave - 1) * 0.12 };
}

export function spawnEnemy(kind: EnemyKind, rng: Rng, width: number, top: number, speedMul: number): Enemy {
  const spec = ENEMY_SPEC[kind];
  const x = 8 + rng() * (width - 16 - spec.w);
  const e: Enemy = { kind, x, y: top - spec.h, w: spec.w, h: spec.h, hp: spec.hp, vx: 0, vy: 0, t: rng() * 6, fireIn: 1 + rng() * 1.5, baseX: x };
  if (kind === 'drone') e.vy = (28 + rng() * 18) * speedMul;
  if (kind === 'diver') e.vy = (40 + rng() * 15) * speedMul;
  if (kind === 'gunner') {
    e.vy = 18 * speedMul;
    e.vx = (rng() < 0.5 ? -1 : 1) * 40 * speedMul;
  }
  return e;
}

/** Move um inimigo; mergulhadores perseguem a nave, artilheiros param no alto e atiram. */
export function moveEnemy(e: Enemy, dt: number, target: { x: number; y: number }, width: number) {
  e.t += dt;
  if (e.kind === 'drone') {
    e.y += e.vy * dt;
    e.x = e.baseX + Math.sin(e.t * 2.2) * 18;
  } else if (e.kind === 'diver') {
    const dx = target.x - (e.x + e.w / 2);
    e.vx += Math.sign(dx) * 70 * dt;
    e.vx = Math.max(-60, Math.min(60, e.vx));
    e.x += e.vx * dt;
    e.y += e.vy * dt;
  } else {
    if (e.y < 34) e.y += e.vy * dt;
    e.x += e.vx * dt;
    if (e.x < 4 || e.x + e.w > width - 4) e.vx = -e.vx;
  }
  e.x = Math.max(0, Math.min(width - e.w, e.x));
}
