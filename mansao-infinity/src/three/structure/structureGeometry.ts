import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ROOMS, WALLS, VOIDS, CEILING, LEVEL_Y, roomHeight, type Level, type Opening, type Room, type Wall } from '../../data/plan';
import { boxGeometry, exteriorSide, subtractRects, wallBaseY, wallHeight, wallSolidPieces, wallThickness, type BoxSpec } from '../../utils/geometry';
import { TILE } from '../../materials/library';

/** Chaves de material usadas pela estrutura (todas existem na biblioteca de materiais). */
export type StructMat = 'plaster' | 'travertine' | 'concrete' | 'teak' | 'frame' | 'glass' | 'lacquerWhite' | 'marble' | 'porcelain' | 'marbleBlack' | 'concreteWhite' | 'stoneDark' | 'walnut';

/** Revestimento externo por parede (o padrão é travertino no térreo e concreto no superior). */
const CLADDING: Record<string, StructMat> = {
  'g-front-garage': 'concrete',
  'u-front': 'teak',
  'u-foyer-bed5': 'teak',
  'u-living-terrace': 'concrete',
  'u-east-foyer': 'concrete',
  'u-east-corridor': 'concrete',
};

/** Acabamento das paredes internas de áreas molhadas. */
export const WALL_FINISH: Record<string, StructMat> = {
  masterBath: 'marble',
  bath2: 'porcelain',
  bath3: 'porcelain',
  bathShared: 'porcelain',
  powder: 'marbleBlack',
  foyer: 'walnut',
};

const tileOf = (m: StructMat) =>
  ({ travertine: TILE.travertine, concrete: TILE.concrete, concreteWhite: TILE.concrete, teak: TILE.teak, marble: TILE.marble, marbleBlack: TILE.marbleBlack, porcelain: TILE.porcelain, stoneDark: TILE.stoneDark, walnut: TILE.walnut } as Record<string, number>)[m] ?? 1;

/** Grupo de visibilidade: pavimento 0, pavimento 1 (inclui a parte alta das paredes de pé-direito duplo) ou cobertura. */
export type VisGroup = 'L0' | 'L0up' | 'L1' | 'roof';

type Bucket = Map<string, THREE.BufferGeometry[]>;
const push = (b: Bucket, key: string, g: THREE.BufferGeometry) => {
  const arr = b.get(key);
  if (arr) arr.push(g);
  else b.set(key, [g]);
};

const SPLIT_Y = 4.0;

/** Divide caixas do térreo que passam de 4 m para que a parte alta suma junto com o pavimento superior no corte. */
function splitByLevel(b: BoxSpec, level: Level): { box: BoxSpec; group: VisGroup }[] {
  const y0 = b.cy - b.sy / 2;
  const y1 = b.cy + b.sy / 2;
  if (level === 1) return [{ box: b, group: 'L1' }];
  if (y1 <= SPLIT_Y + 0.01) return [{ box: b, group: 'L0' }];
  if (y0 >= SPLIT_Y - 0.01) return [{ box: b, group: 'L0up' }];
  return [
    { box: { ...b, cy: (y0 + SPLIT_Y) / 2, sy: SPLIT_Y - y0 }, group: 'L0' },
    { box: { ...b, cy: (SPLIT_Y + y1) / 2, sy: y1 - SPLIT_Y }, group: 'L0up' },
  ];
}

function addBox(bucket: Bucket, mat: StructMat, b: BoxSpec, level: Level, tile = tileOf(mat)) {
  for (const { box, group } of splitByLevel(b, level)) {
    if (box.sx <= 0.0005 || box.sy <= 0.0005 || box.sz <= 0.0005) continue;
    push(bucket, `${group}|${mat}`, boxGeometry(box, tile));
  }
}

/** Desloca/afina uma caixa de parede para virar camada de revestimento. */
function layer(w: Wall, b: BoxSpec, offset: number, thickness: number): BoxSpec {
  return w.axis === 'x' ? { ...b, cz: w.at + offset, sz: thickness } : { ...b, cx: w.at + offset, sx: thickness };
}

// ------------------------------------------------------------------ vidros
const MULLION = 0.06;

function glassWall(bucket: Bucket, w: Wall) {
  const H = wallHeight(w);
  const y0 = wallBaseY(w);
  const len = w.to - w.from;
  const n = Math.max(1, Math.round(len / 2.2));
  const step = len / n;
  const doors = (w.openings ?? []).map((o) => ({ a: o.c - o.w / 2, b: o.c + o.w / 2, top: (o.sill ?? 0) + o.h }));
  const rails = H > 5 ? [0, 3.85, H] : [0, H];
  // montantes verticais
  const cuts = new Set<number>();
  for (let i = 0; i <= n; i++) cuts.add(+(w.from + i * step).toFixed(3));
  for (const d of doors) {
    cuts.add(+d.a.toFixed(3));
    cuts.add(+d.b.toFixed(3));
  }
  const xs = [...cuts].sort((a, b) => a - b);
  for (const u of xs) {
    const inDoor = doors.find((d) => u > d.a + 0.01 && u < d.b - 0.01);
    const yStart = inDoor ? y0 + inDoor.top : y0;
    addBox(bucket, 'frame', wallBoxAt(w, u - MULLION / 2, u + MULLION / 2, yStart, y0 + H, 0, 0.14), w.level);
  }
  // travessas horizontais
  for (const ry of rails) {
    const yy = Math.min(Math.max(y0 + ry, y0 + 0.04), y0 + H - 0.04);
    let segs: [number, number][] = [[w.from, w.to]];
    if (ry === 0) for (const d of doors) segs = cutRange(segs, d.a, d.b);
    for (const [a, b] of segs) addBox(bucket, 'frame', wallBoxAt(w, a, b, yy - 0.04, yy + 0.04, 0, 0.14), w.level);
  }
  for (const d of doors) addBox(bucket, 'frame', wallBoxAt(w, d.a, d.b, y0 + d.top - 0.05, y0 + d.top + 0.05, 0, 0.14), w.level);
  // painéis de vidro
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i];
    const b = xs[i + 1];
    const mid = (a + b) / 2;
    const d = doors.find((dd) => mid > dd.a && mid < dd.b);
    const yA = d ? y0 + d.top : y0;
    if (yA < y0 + H - 0.05) addBox(bucket, 'glass', wallBoxAt(w, a, b, yA, y0 + H, 0, 0.024), w.level);
  }
}

function cutRange(segs: [number, number][], a: number, b: number): [number, number][] {
  const out: [number, number][] = [];
  for (const [s, e] of segs) {
    if (b <= s || a >= e) out.push([s, e]);
    else {
      if (a > s) out.push([s, a]);
      if (b < e) out.push([b, e]);
    }
  }
  return out;
}

function wallBoxAt(w: Wall, u0: number, u1: number, y0: number, y1: number, offset: number, thickness: number): BoxSpec {
  const mid = (u0 + u1) / 2;
  const len = u1 - u0;
  return w.axis === 'x'
    ? { cx: mid, cy: (y0 + y1) / 2, cz: w.at + offset, sx: len, sy: y1 - y0, sz: thickness }
    : { cx: w.at + offset, cy: (y0 + y1) / 2, cz: mid, sx: thickness, sy: y1 - y0, sz: len };
}

/** Janela: vidro no plano médio, caixilho preto e peitoril de pedra do lado externo. */
function windowFill(bucket: Bucket, w: Wall, o: Opening, side: number) {
  const t = wallThickness(w);
  const a = o.c - o.w / 2;
  const b = o.c + o.w / 2;
  const y0 = wallBaseY(w) + (o.sill ?? 0);
  const y1 = y0 + o.h;
  const f = 0.055;
  addBox(bucket, 'glass', wallBoxAt(w, a, b, y0, y1, 0, 0.02), w.level);
  addBox(bucket, 'frame', wallBoxAt(w, a, b, y0, y0 + f, 0, 0.1), w.level);
  addBox(bucket, 'frame', wallBoxAt(w, a, b, y1 - f, y1, 0, 0.1), w.level);
  addBox(bucket, 'frame', wallBoxAt(w, a, a + f, y0, y1, 0, 0.1), w.level);
  addBox(bucket, 'frame', wallBoxAt(w, b - f, b, y0, y1, 0, 0.1), w.level);
  if (o.w > 2.2) {
    const mid = (a + b) / 2;
    addBox(bucket, 'frame', wallBoxAt(w, mid - f / 2, mid + f / 2, y0, y1, 0, 0.08), w.level);
  }
  // revestimento do vão (requadro) e peitoril
  addBox(bucket, 'plaster', wallBoxAt(w, a, b, y1, y1 + 0.001, 0, t), w.level);
  if (side !== 0 && (o.sill ?? 0) > 0.05) {
    addBox(bucket, 'stoneDark', wallBoxAt(w, a - 0.03, b + 0.03, y0 - 0.03, y0, side * (t / 2 + 0.03), 0.1), w.level);
  }
}

/** Batentes (guarnições) das portas de giro. */
function doorJambs(bucket: Bucket, w: Wall, o: Opening) {
  const t = wallThickness(w) + 0.03;
  const a = o.c - o.w / 2;
  const b = o.c + o.w / 2;
  const y0 = wallBaseY(w);
  const y1 = y0 + o.h;
  const j = 0.04;
  const mat: StructMat = 'lacquerWhite';
  addBox(bucket, mat, wallBoxAt(w, a, a + j, y0, y1, 0, t), w.level);
  addBox(bucket, mat, wallBoxAt(w, b - j, b, y0, y1, 0, t), w.level);
  addBox(bucket, mat, wallBoxAt(w, a, b, y1 - j, y1, 0, t), w.level);
}

/** Caixilho das portas de correr (as folhas ficam no componente de portas). */
function slideFrame(bucket: Bucket, w: Wall, o: Opening) {
  const a = o.c - o.w / 2;
  const b = o.c + o.w / 2;
  const y0 = wallBaseY(w);
  const y1 = y0 + o.h;
  const f = 0.06;
  addBox(bucket, 'frame', wallBoxAt(w, a, b, y0, y0 + 0.02, 0, 0.16), w.level);
  addBox(bucket, 'frame', wallBoxAt(w, a, b, y1 - f, y1, 0, 0.16), w.level);
  addBox(bucket, 'frame', wallBoxAt(w, a, a + f, y0, y1, 0, 0.16), w.level);
  addBox(bucket, 'frame', wallBoxAt(w, b - f, b, y0, y1, 0, 0.16), w.level);
}

// ------------------------------------------------------------------ bordas dos cômodos (rodapés e revestimentos)
interface EdgeSeg {
  axis: 'x' | 'z';
  at: number;
  from: number;
  to: number;
  inward: number;
  wall: Wall;
}

/** Trechos das bordas de um cômodo que têm parede maciça (exclui vidro e vãos sem parede). */
export function roomEdges(rm: Room): EdgeSeg[] {
  const { x0, x1, z0, z1 } = rm.rect;
  const edges = [
    { axis: 'x' as const, at: z0, from: x0, to: x1, inward: 1 },
    { axis: 'x' as const, at: z1, from: x0, to: x1, inward: -1 },
    { axis: 'z' as const, at: x0, from: z0, to: z1, inward: 1 },
    { axis: 'z' as const, at: x1, from: z0, to: z1, inward: -1 },
  ];
  const out: EdgeSeg[] = [];
  for (const e of edges) {
    for (const w of WALLS) {
      if (w.level !== rm.level || w.axis !== e.axis || Math.abs(w.at - e.at) > 0.01 || w.kind === 'glass') continue;
      const a = Math.max(w.from, e.from);
      const b = Math.min(w.to, e.to);
      if (b - a > 0.05) out.push({ ...e, from: a, to: b, wall: w });
    }
  }
  return out;
}

function edgeLayerPieces(seg: EdgeSeg, height: number, thickness: number, keepWindows: boolean): BoxSpec[] {
  const w = seg.wall;
  const off = seg.inward * (wallThickness(w) / 2 + thickness / 2);
  const virt: Wall = { ...w, from: seg.from, to: seg.to, h: height, base: 0, openings: (w.openings ?? []).filter((o) => keepWindows || o.kind !== 'window' || (o.sill ?? 0) < 0.2) };
  if (!keepWindows) {
    // rodapé: só os vãos que chegam ao piso interrompem
    virt.openings = (virt.openings ?? []).filter((o) => (o.sill ?? 0) < 0.2).map((o) => ({ ...o, h: height + 1 }));
  }
  return wallSolidPieces(virt, [seg.from, seg.to]).map((b) => layer(virt, b, off, thickness));
}

// ------------------------------------------------------------------ montagem
export interface StructureGeometry {
  /** chave "grupo|material" → geometria mesclada */
  merged: Map<string, THREE.BufferGeometry>;
}

export function buildStructure(): StructureGeometry {
  const bucket: Bucket = new Map();

  for (const w of WALLS) {
    if (w.kind === 'glass') {
      glassWall(bucket, w);
      for (const o of w.openings ?? []) if (o.kind === 'slide') slideFrame(bucket, w, o);
      continue;
    }
    const pieces = wallSolidPieces(w);
    for (const p of pieces) addBox(bucket, 'plaster', p, w.level);
    const side = w.kind === 'ext' ? exteriorSide(w) : 0;
    if (side !== 0) {
      const t = wallThickness(w);
      const clad = CLADDING[w.id] ?? (w.level === 0 ? 'travertine' : 'concrete');
      const range: [number, number] = w.axis === 'x' ? [w.from - t / 2 - 0.04, w.to + t / 2 + 0.04] : [w.from, w.to];
      for (const p of wallSolidPieces(w, range)) addBox(bucket, clad, layer(w, p, side * (t / 2 + 0.02), 0.04), w.level);
    }
    for (const o of w.openings ?? []) {
      if (o.kind === 'window') windowFill(bucket, w, o, side);
      else if (o.kind === 'door' || o.kind === 'double') doorJambs(bucket, w, o);
      else if (o.kind === 'slide') slideFrame(bucket, w, o);
    }
  }

  // "poché": tampa preta no topo de cada parede, vista nos cortes e na prancha.
  // O pé-direito duplo do térreo é cortado a 4 m.
  for (const w of WALLS) {
    const t = wallThickness(w);
    const top = Math.min(wallBaseY(w) + wallHeight(w), w.level === 0 ? SPLIT_Y : 99);
    const ext = t / 2;
    const cap = wallBoxAt(w, w.from - ext, w.to + ext, top, top + 0.05, 0, t + 0.02);
    push(bucket, `${w.level === 0 ? 'L0cap' : 'L1cap'}|cap`, boxGeometry(cap, 1));
  }

  // rodapés e revestimentos de áreas molhadas
  for (const rm of ROOMS) {
    if (rm.outdoor) continue;
    const finish = WALL_FINISH[rm.id];
    for (const seg of roomEdges(rm)) {
      if (finish) {
        for (const p of edgeLayerPieces(seg, roomHeight(rm), 0.02, true)) addBox(bucket, finish, p, rm.level);
      } else if (rm.id !== 'garage' && rm.id !== 'storage') {
        for (const p of edgeLayerPieces(seg, 0.1, 0.016, false)) addBox(bucket, 'lacquerWhite', p, rm.level, 1);
      }
    }
  }

  // lajes
  const slab = (x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, level: Level | 'roof', mat: StructMat = 'concreteWhite') => {
    const b: BoxSpec = { cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, cy: (y0 + y1) / 2, sx: x1 - x0, sz: z1 - z0, sy: y1 - y0 };
    if (level === 'roof') push(bucket, `roof|${mat}`, boxGeometry(b, tileOf(mat)));
    else addBox(bucket, mat, b, level);
  };
  slab(-24.15, 20.15, -10.15, 10.15, -0.55, -0.04, 0, 'concrete');
  const upper = subtractRects({ x0: -24.15, x1: 4.15, z0: -10.15, z1: 10.15 }, [VOIDS[0]]);
  for (const p of upper) slab(p.x0, p.x1, p.z0, p.z1, CEILING[0] + 0.02, LEVEL_Y[1] - 0.04, 1);
  slab(4.15, 20.4, -0.15, 10.45, CEILING[0] + 0.02, LEVEL_Y[1] - 0.04, 1); // terraço (laje sobre escritório e cinema)
  slab(-10.15, 4.15, -13.05, -10.15, CEILING[0] + 0.12, LEVEL_Y[1] - 0.04, 1); // varanda em balanço
  slab(-23.45, -17.95, 10.15, 11.45, CEILING[0] + 0.15, LEVEL_Y[1] - 0.04, 1); // sacada do quarto 4
  // coberturas (beirais generosos para sombrear os vidros)
  slab(-24.6, 4.0, -10.7, 11.9, 7.4, 7.85, 'roof');
  slab(3.7, 21.7, -12.8, 0.3, 7.4, 8.05, 'roof');
  // platibanda sobre a laje do terraço (borda frontal) — faixa branca contínua
  slab(4.15, 20.4, 10.3, 10.45, 3.55, 4.15, 1);

  const merged = new Map<string, THREE.BufferGeometry>();
  for (const [key, geos] of bucket) {
    const g = mergeGeometries(geos, false);
    if (g) {
      g.computeBoundingSphere();
      merged.set(key, g);
    }
    geos.forEach((x) => x.dispose());
  }
  return { merged };
}
