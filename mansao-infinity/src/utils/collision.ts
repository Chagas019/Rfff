import { WALLS, ROOMS, GUARDRAILS, STAIR, ELEVATOR, POOL, LOT, type Level, type Rect, type Wall } from '../data/plan';
import { FURNITURE, type FurnitureItem } from '../data/furniture';
import { BOUNDARY } from '../data/landscape';
import { wallThickness } from './geometry';

/**
 * Colisão do modo caminhada em 2D (planta). Como toda a arquitetura é
 * ortogonal, paredes, guarda-corpos e móveis grandes viram retângulos
 * alinhados aos eixos; o jogador é um círculo.
 */

export const PLAYER_RADIUS = 0.28;
export const EYE_HEIGHT = 1.65;

export interface Box2 {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  /** id da esquadria: o retângulo deixa de bloquear quando ela está aberta */
  door?: string;
}

/** Vãos que nunca bloqueiam a passagem. */
const ALWAYS_OPEN = new Set(['opening']);
/** Vãos que só deixam passar quando a esquadria está aberta. */
const OPERABLE = new Set(['door', 'double', 'slide', 'pivot', 'garage']);

function wallBoxes(w: Wall): Box2[] {
  const t = wallThickness(w) / 2;
  const segs: Box2[] = [];
  const mk = (u0: number, u1: number, door?: string): Box2 =>
    w.axis === 'x' ? { x0: u0, x1: u1, z0: w.at - t, z1: w.at + t, door } : { x0: w.at - t, x1: w.at + t, z0: u0, z1: u1, door };
  let cur = w.from - (w.axis === 'x' ? t : 0);
  const end = w.to + (w.axis === 'x' ? t : 0);
  const ops = [...(w.openings ?? [])].filter((o) => (o.sill ?? 0) < 0.3 && (ALWAYS_OPEN.has(o.kind) || OPERABLE.has(o.kind))).sort((a, b) => a.c - b.c);
  for (const o of ops) {
    const a = o.c - o.w / 2;
    const b = o.c + o.w / 2;
    if (a > cur) segs.push(mk(cur, a));
    if (OPERABLE.has(o.kind) && o.id) segs.push(mk(a, b, o.id));
    cur = b;
  }
  if (end > cur) segs.push(mk(cur, end));
  return segs;
}

const SOLID_FURNITURE = new Set(['island', 'counter', 'tallUnits', 'diningTable', 'bed', 'sofa', 'piano', 'bathtub', 'car', 'bbq', 'bookshelf', 'wardrobe', 'spa', 'outdoorTable', 'sideboard', 'desk', 'shelving', 'toolCabinet', 'washer', 'boiler', 'closetIsland', 'dresser', 'vanity', 'planter', 'cinemaRiser', 'outdoorSofa', 'coffeeTable', 'shower']);

function furnitureBox(it: FurnitureItem): Box2 {
  const rot = (((it.rot ?? 0) % 360) + 360) % 360;
  const swap = Math.abs(Math.sin((rot * Math.PI) / 180)) > 0.7;
  const w = (swap ? it.d : it.w) / 2;
  const d = (swap ? it.w : it.d) / 2;
  return { x0: it.x - w, x1: it.x + w, z0: it.z - d, z1: it.z + d };
}

const roomLevel = new Map(ROOMS.map((r) => [r.id, r.level]));

function buildObstacles(level: Level): Box2[] {
  const out: Box2[] = [];
  for (const w of WALLS) if (w.level === level) out.push(...wallBoxes(w));
  for (const g of GUARDRAILS) {
    if (g.level !== level) continue;
    out.push(g.axis === 'x' ? { x0: g.from, x1: g.to, z0: g.at - 0.05, z1: g.at + 0.05 } : { x0: g.at - 0.05, x1: g.at + 0.05, z0: g.from, z1: g.to });
  }
  for (const it of FURNITURE) {
    if (!SOLID_FURNITURE.has(it.type)) continue;
    if ((roomLevel.get(it.room) ?? 0) !== level) continue;
    if (it.type === 'cinemaRiser') continue;
    out.push(furnitureBox(it));
  }
  // poço do elevador (fechado, exceto pela face da porta)
  out.push({ x0: ELEVATOR.x0, x1: ELEVATOR.x1 - 0.05, z0: ELEVATOR.z0, z1: ELEVATOR.z1 });
  if (level === 0) {
    // piscina, muros e portões
    out.push({ x0: POOL.x0, x1: POOL.x1, z0: POOL.z0 - 0.6, z1: POOL.z1 });
    const { frontZ, westX, eastX, streetGate, pedGate } = BOUNDARY;
    out.push({ x0: westX - 0.2, x1: streetGate.x0, z0: frontZ - 0.2, z1: frontZ + 0.2 });
    out.push({ x0: streetGate.x0, x1: streetGate.x1, z0: frontZ - 0.45, z1: frontZ + 0.2, door: 'streetGate' });
    out.push({ x0: streetGate.x1, x1: pedGate.x0, z0: frontZ - 0.2, z1: frontZ + 0.2 });
    out.push({ x0: pedGate.x0, x1: pedGate.x1, z0: frontZ - 0.2, z1: frontZ + 0.2, door: 'pedestrianGate' });
    out.push({ x0: pedGate.x1, x1: eastX + 0.2, z0: frontZ - 0.2, z1: frontZ + 0.2 });
    out.push({ x0: westX - 0.2, x1: westX + 0.2, z0: LOT.z0, z1: frontZ });
    out.push({ x0: eastX - 0.2, x1: eastX + 0.2, z0: LOT.z0, z1: frontZ });
    out.push({ x0: LOT.x0 - 2, x1: LOT.x1 + 2, z0: -26.6, z1: -25.4 }); // borda do platô
    // laterais da escada (não se entra por baixo dos degraus)
    out.push({ x0: STAIR.x0 - 0.06, x1: STAIR.x0, z0: STAIR.zTop, z1: STAIR.zBottom - 0.6 });
    out.push({ x0: STAIR.x1, x1: STAIR.x1 + 0.06, z0: STAIR.zTop, z1: STAIR.zBottom - 0.6 });
    out.push({ x0: STAIR.x0, x1: STAIR.x1, z0: STAIR.zTop - 0.2, z1: STAIR.zTop + 2.2 });
  }
  return out;
}

export const OBSTACLES: Record<Level, Box2[]> = { 0: buildObstacles(0), 1: buildObstacles(1) };

/** Regiões pisáveis do pavimento superior (cômodos, terraço, varanda e sacada). */
export const WALKABLE_UPPER: Rect[] = ROOMS.filter((r) => r.level === 1).map((r) => r.rect);

const inside = (x: number, z: number, r: Rect, pad = 0) => x >= r.x0 + pad && x <= r.x1 - pad && z >= r.z0 + pad && z <= r.z1 - pad;

export function isWalkable(level: Level, x: number, z: number, r = PLAYER_RADIUS): boolean {
  if (level === 1) return WALKABLE_UPPER.some((rc) => inside(x, z, { x0: rc.x0 - 0.2, x1: rc.x1 + 0.2, z0: rc.z0 - 0.2, z1: rc.z1 + 0.2 }, r * 0.5));
  return x > BOUNDARY.westX && x < BOUNDARY.eastX && z > -25.4 && z < BOUNDARY.frontZ;
}

/** Empurra o círculo para fora dos retângulos que bloqueiam (portas abertas não bloqueiam). */
export function resolve(level: Level, x: number, z: number, open: Record<string, boolean>, r = PLAYER_RADIUS): { x: number; z: number } {
  let px = x;
  let pz = z;
  for (let iter = 0; iter < 3; iter++) {
    let moved = false;
    for (const b of OBSTACLES[level]) {
      if (b.door && open[b.door]) continue;
      const cx = Math.max(b.x0, Math.min(px, b.x1));
      const cz = Math.max(b.z0, Math.min(pz, b.z1));
      const dx = px - cx;
      const dz = pz - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      if (d2 > 1e-9) {
        const d = Math.sqrt(d2);
        px = cx + (dx / d) * r;
        pz = cz + (dz / d) * r;
      } else {
        // centro dentro do retângulo: sai pelo lado mais próximo
        const exits = [
          { v: px - b.x0, x: b.x0 - r, z: pz },
          { v: b.x1 - px, x: b.x1 + r, z: pz },
          { v: pz - b.z0, x: px, z: b.z0 - r },
          { v: b.z1 - pz, x: px, z: b.z1 + r },
        ].sort((a, c) => a.v - c.v)[0];
        px = exits.x;
        pz = exits.z;
      }
      moved = true;
    }
    if (!moved) break;
  }
  return { x: px, z: pz };
}

/** A posição está na projeção da escada (para calcular a altura dos degraus). */
export const inStairZone = (x: number, z: number) => x >= STAIR.x0 - 0.05 && x <= STAIR.x1 + 0.05 && z >= STAIR.zTop - 0.05 && z <= STAIR.zBottom + 0.35;

/** Altura do piso sobre a escada em função de z (0 em zBottom → 4 m em zTop). */
export const stairHeight = (z: number) => Math.min(1, Math.max(0, (STAIR.zBottom - z) / (STAIR.zBottom - STAIR.zTop))) * 4.0;

/** Ponto de embarque do elevador (fora da cabine, voltado para a porta). */
export const ELEVATOR_STOP = { x: ELEVATOR.x1 + 0.55, z: (ELEVATOR.z0 + ELEVATOR.z1) / 2 };
export const nearElevator = (x: number, z: number) => Math.hypot(x - ELEVATOR_STOP.x, z - ELEVATOR_STOP.z) < 1.4;
