import { WALLS, type Level, type Opening, type Rect, type Wall } from '../data/plan';
import { wallThickness } from './geometry';

/** Representação 2D das paredes para a planta baixa (trechos cheios, vidros e vãos). */
export interface PlanWalls {
  solid: Rect[];
  glass: Rect[];
  windows: { rect: Rect; axis: 'x' | 'z' }[];
  openings: { rect: Rect; axis: 'x' | 'z'; opening: Opening; wall: Wall }[];
}

const rectOf = (w: Wall, u0: number, u1: number, t: number): Rect =>
  w.axis === 'x' ? { x0: u0, x1: u1, z0: w.at - t / 2, z1: w.at + t / 2 } : { x0: w.at - t / 2, x1: w.at + t / 2, z0: u0, z1: u1 };

export function planWalls(level: Level): PlanWalls {
  const out: PlanWalls = { solid: [], glass: [], windows: [], openings: [] };
  for (const w of WALLS) {
    if (w.level !== level) continue;
    const t = wallThickness(w);
    const ext = w.kind !== 'int' && w.axis === 'x' ? t / 2 : 0;
    let cur = w.from - ext;
    const end = w.to + ext;
    const ops = [...(w.openings ?? [])].sort((a, b) => a.c - b.c);
    const pushSeg = (a: number, b: number) => {
      if (b - a < 1e-4) return;
      (w.kind === 'glass' ? out.glass : out.solid).push(rectOf(w, a, b, t));
    };
    for (const o of ops) {
      const a = o.c - o.w / 2;
      const b = o.c + o.w / 2;
      pushSeg(cur, a);
      if (o.kind === 'window') out.windows.push({ rect: rectOf(w, a, b, t), axis: w.axis });
      else out.openings.push({ rect: rectOf(w, a, b, t), axis: w.axis, opening: o, wall: w });
      cur = b;
    }
    pushSeg(cur, end);
  }
  return out;
}

/** Contorno de uma peça girada (para a planta): 4 cantos no plano x/z. */
export function rotatedRect(x: number, z: number, w: number, d: number, rotDeg: number): [number, number][] {
  const a = (rotDeg * Math.PI) / 180;
  // rotação de +a em torno de y leva o eixo local x para (cos a, −sin a) no plano (x, z)
  const ux = [Math.cos(a), -Math.sin(a)];
  const uz = [Math.sin(a), Math.cos(a)];
  return [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [w / 2, d / 2],
    [-w / 2, d / 2],
  ].map(([lx, lz]) => [x + lx * ux[0] + lz * uz[0], z + lx * ux[1] + lz * uz[1]] as [number, number]);
}

export const fmtArea = (m2: number) => `${m2.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} m²`;
export const fmtLen = (m: number) => m.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
