import * as THREE from 'three';
import { CEILING, EXT_T, INT_T, LEVEL_Y, ROOMS, VOIDS, type Level, type Opening, type Rect, type Wall } from '../data/plan';

/** Caixa alinhada aos eixos, descrita pelo centro e pelas dimensões (metros). */
export interface BoxSpec {
  cx: number;
  cy: number;
  cz: number;
  sx: number;
  sy: number;
  sz: number;
}

export const wallThickness = (w: Wall) => (w.kind === 'int' ? INT_T : EXT_T);

export function wallHeight(w: Wall): number {
  if (w.h) return w.h;
  if (w.kind === 'int') return CEILING[w.level];
  return w.level === 0 ? 4.0 : 3.4;
}

export const wallBaseY = (w: Wall) => LEVEL_Y[w.level] + (w.base ?? 0);

/** Converte um intervalo ao longo da parede (u0..u1, alturas y0..y1) em caixa no mundo. */
export function wallBox(w: Wall, u0: number, u1: number, y0: number, y1: number, offset = 0, thickness = wallThickness(w)): BoxSpec {
  const len = u1 - u0;
  const mid = (u0 + u1) / 2;
  if (w.axis === 'x') {
    return { cx: mid, cy: (y0 + y1) / 2, cz: w.at + offset, sx: len, sy: y1 - y0, sz: thickness };
  }
  return { cx: w.at + offset, cy: (y0 + y1) / 2, cz: mid, sx: thickness, sy: y1 - y0, sz: len };
}

const sortedOpenings = (w: Wall) => [...(w.openings ?? [])].sort((a, b) => a.c - b.c);

/**
 * Divide uma parede em blocos maciços ao redor dos vãos (trechos cheios,
 * peitoris e vergas). Paredes externas paralelas ao eixo x são estendidas meia
 * espessura em cada ponta para fechar os cantos.
 */
export function wallSolidPieces(w: Wall, range?: [number, number]): BoxSpec[] {
  const H = wallHeight(w);
  const y0 = wallBaseY(w);
  const ext = w.kind !== 'int' && w.axis === 'x' && !range ? wallThickness(w) / 2 : 0;
  const from = range ? range[0] : w.from - ext;
  const to = range ? range[1] : w.to + ext;
  const pieces: BoxSpec[] = [];
  let cur = from;
  for (const o of sortedOpenings(w)) {
    const a = Math.max(o.c - o.w / 2, from);
    const b = Math.min(o.c + o.w / 2, to);
    if (b <= from || a >= to) continue;
    if (a > cur + 1e-4) pieces.push(wallBox(w, cur, a, y0, y0 + H));
    const sill = o.sill ?? 0;
    if (sill > 0.001) pieces.push(wallBox(w, a, b, y0, y0 + sill));
    const top = sill + o.h;
    if (top < H - 0.001) pieces.push(wallBox(w, a, b, y0 + top, y0 + H));
    cur = Math.max(cur, b);
  }
  if (to > cur + 1e-4) pieces.push(wallBox(w, cur, to, y0, y0 + H));
  return pieces;
}

/** Ponto está dentro de um retângulo (com tolerância). */
export const inRect = (x: number, z: number, rc: Rect, pad = 0) =>
  x >= rc.x0 - pad && x <= rc.x1 + pad && z >= rc.z0 - pad && z <= rc.z1 + pad;

/** Verdadeiro se o ponto está em área coberta/interna do pavimento (cômodo fechado ou vazio de pé-direito duplo). */
export function isInterior(level: Level, x: number, z: number): boolean {
  if (ROOMS.some((rm) => rm.level === level && !rm.outdoor && inRect(x, z, rm.rect))) return true;
  if (level === 1 && VOIDS.some((v) => inRect(x, z, v))) return true;
  return false;
}

/** Lado externo de uma parede: +1 ou −1 ao longo da normal (z para paredes 'x', x para paredes 'z'); 0 se interna dos dois lados. */
export function exteriorSide(w: Wall): -1 | 0 | 1 {
  const mid = (w.from + w.to) / 2;
  const probe = (s: number) => (w.axis === 'x' ? isInterior(w.level, mid, w.at + s * 0.6) : isInterior(w.level, w.at + s * 0.6, mid));
  const plus = probe(1);
  const minus = probe(-1);
  if (plus && !minus) return -1;
  if (minus && !plus) return 1;
  return 0;
}

/** Vãos de uma parede com coordenadas no mundo (para esquadrias e planta). */
export function openingWorld(w: Wall, o: Opening) {
  const y0 = wallBaseY(w) + (o.sill ?? 0);
  const center = w.axis === 'x' ? { x: o.c, z: w.at } : { x: w.at, z: o.c };
  return { ...center, y0, y1: y0 + o.h, along: w.axis, width: o.w };
}

// ------------------------------------------------------------------ geometria three
/** Reescreve as UVs de uma geometria em metros (projeção pela normal dominante) — evita esticar texturas. */
export function applyWorldUV(geo: THREE.BufferGeometry, tile = 1, offset: THREE.Vector3 = new THREE.Vector3()): THREE.BufferGeometry {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const nor = geo.getAttribute('normal') as THREE.BufferAttribute;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + offset.x;
    const y = pos.getY(i) + offset.y;
    const z = pos.getZ(i) + offset.z;
    const ax = Math.abs(nor.getX(i));
    const ay = Math.abs(nor.getY(i));
    const az = Math.abs(nor.getZ(i));
    let u: number;
    let v: number;
    if (ay >= ax && ay >= az) {
      u = x;
      v = -z;
    } else if (ax >= az) {
      u = z * Math.sign(nor.getX(i) || 1) * -1;
      v = y;
    } else {
      u = x * Math.sign(nor.getZ(i) || 1);
      v = y;
    }
    uv[i * 2] = u / tile;
    uv[i * 2 + 1] = v / tile;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

/** Cria a geometria de uma caixa já posicionada no mundo, com UV em metros. */
export function boxGeometry(b: BoxSpec, tile = 1): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(b.sx, b.sy, b.sz);
  g.translate(b.cx, b.cy, b.cz);
  return applyWorldUV(g, tile);
}

/** Subtrai retângulos (vazios) de um retângulo, devolvendo pedaços retangulares. */
export function subtractRects(base: Rect, holes: Rect[]): Rect[] {
  let pieces: Rect[] = [base];
  for (const h of holes) {
    const next: Rect[] = [];
    for (const p of pieces) {
      const ix0 = Math.max(p.x0, h.x0);
      const ix1 = Math.min(p.x1, h.x1);
      const iz0 = Math.max(p.z0, h.z0);
      const iz1 = Math.min(p.z1, h.z1);
      if (ix0 >= ix1 || iz0 >= iz1) {
        next.push(p);
        continue;
      }
      if (p.z0 < iz0) next.push({ x0: p.x0, x1: p.x1, z0: p.z0, z1: iz0 });
      if (iz1 < p.z1) next.push({ x0: p.x0, x1: p.x1, z0: iz1, z1: p.z1 });
      if (p.x0 < ix0) next.push({ x0: p.x0, x1: ix0, z0: iz0, z1: iz1 });
      if (ix1 < p.x1) next.push({ x0: ix1, x1: p.x1, z0: iz0, z1: iz1 });
    }
    pieces = next;
  }
  return pieces;
}

export const deg = (d: number) => (d * Math.PI) / 180;
