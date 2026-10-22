import { describe, expect, it } from 'vitest';
import { ROOMS, WALLS, STAIR, FOOTPRINT, VOIDS, builtArea, usefulArea, roomById, rectArea, type Room, type Wall } from '../plan';
import { FURNITURE } from '../furniture';
import { DOORS } from '../doors';
import { TOUR } from '../tour';

const overlap = (a: Room['rect'], b: Room['rect']) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0));

describe('planta', () => {
  it('não tem cômodos sobrepostos no mesmo pavimento', () => {
    for (const a of ROOMS)
      for (const b of ROOMS) {
        if (a.id >= b.id || a.level !== b.level) continue;
        expect(overlap(a.rect, b.rect), `${a.id} × ${b.id}`).toBeLessThan(0.01);
      }
  });

  it('ids de cômodos são únicos', () => {
    expect(new Set(ROOMS.map((r) => r.id)).size).toBe(ROOMS.length);
  });

  it('cômodos fechados ficam dentro da projeção construída', () => {
    for (const rm of ROOMS.filter((r) => !r.outdoor)) {
      const inside = FOOTPRINT[rm.level].some((f) => rm.rect.x0 >= f.x0 && rm.rect.x1 <= f.x1 && rm.rect.z0 >= f.z0 && rm.rect.z1 <= f.z1);
      expect(inside, rm.id).toBe(true);
    }
  });

  it('o pavimento superior cobre a projeção menos os vazios de pé-direito duplo', () => {
    const upperRooms = ROOMS.filter((r) => r.level === 1 && !r.outdoor).reduce((s, r) => s + rectArea(r.rect), 0);
    const voids = VOIDS.filter((v) => v.x1 <= 4.0001).reduce((s, v) => s + rectArea(v), 0);
    expect(upperRooms + voids).toBeCloseTo(rectArea(FOOTPRINT[1][0]), 3);
  });

  it('área construída e útil compatíveis com o programa (≈ 800–1.400 m²)', () => {
    expect(builtArea()).toBeGreaterThan(800);
    expect(builtArea()).toBeLessThan(1400);
    expect(usefulArea()).toBeLessThan(builtArea());
  });

  it('programa mínimo: 4 vagas, master + 4 quartos, banheiros, cozinha, cinema, escritório, lavanderia', () => {
    const ids = ROOMS.map((r) => r.id);
    for (const id of ['garage', 'master', 'bed2', 'bed3', 'bed4', 'bed5', 'masterBath', 'bath2', 'bath3', 'bathShared', 'powder', 'kitchen', 'pantry', 'cinema', 'office', 'laundry', 'storage', 'living', 'dining', 'pool', 'gourmet']) {
      expect(ids, id).toContain(id);
    }
    expect(FURNITURE.filter((f) => f.type === 'car' && f.room === 'garage')).toHaveLength(4);
    expect(FURNITURE.filter((f) => f.type === 'diningChair')).toHaveLength(12);
  });

  it('vãos cabem dentro das paredes e não se sobrepõem', () => {
    for (const w of WALLS) {
      const ops = [...(w.openings ?? [])].sort((a, b) => a.c - b.c);
      for (const o of ops) {
        expect(o.c - o.w / 2, `${w.id}`).toBeGreaterThanOrEqual(w.from - 1e-6);
        expect(o.c + o.w / 2, `${w.id}`).toBeLessThanOrEqual(w.to + 1e-6);
      }
      for (let i = 1; i < ops.length; i++) expect(ops[i].c - ops[i].w / 2, w.id).toBeGreaterThanOrEqual(ops[i - 1].c + ops[i - 1].w / 2);
    }
  });

  it('todas as esquadrias operáveis têm id único', () => {
    expect(new Set(DOORS.map((d) => d.id)).size).toBe(DOORS.length);
  });

  it('a escada vence a altura entre pavimentos com degraus confortáveis', () => {
    const rise = 4.0 / STAIR.risers;
    const tread = (STAIR.zBottom - STAIR.zTop) / (STAIR.risers - 1);
    expect(rise).toBeGreaterThan(0.16);
    expect(rise).toBeLessThan(0.2);
    // regra de Blondel: 2h + b entre 0,60 e 0,66 m
    expect(2 * rise + tread).toBeGreaterThan(0.6);
    expect(2 * rise + tread).toBeLessThan(0.7);
  });
});

/** Constrói o grafo de circulação: cômodos ligados por vãos ou por trechos sem parede. */
function circulationGraph() {
  const adj = new Map<string, Set<string>>();
  const link = (a: string, b: string) => {
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a)!.add(b);
    adj.get(b)!.add(a);
  };
  const PASS = new Set(['door', 'double', 'slide', 'pivot', 'garage', 'opening']);
  const wallsOn = (level: number, axis: 'x' | 'z', at: number) => WALLS.filter((w) => w.level === level && w.axis === axis && Math.abs(w.at - at) < 1e-6);
  const shared = (a: Room, b: Room) => {
    const segs: { axis: 'x' | 'z'; at: number; from: number; to: number }[] = [];
    if (Math.abs(a.rect.x1 - b.rect.x0) < 1e-6 || Math.abs(b.rect.x1 - a.rect.x0) < 1e-6) {
      const at = Math.abs(a.rect.x1 - b.rect.x0) < 1e-6 ? a.rect.x1 : a.rect.x0;
      const from = Math.max(a.rect.z0, b.rect.z0);
      const to = Math.min(a.rect.z1, b.rect.z1);
      if (to - from > 0.5) segs.push({ axis: 'z', at, from, to });
    }
    if (Math.abs(a.rect.z1 - b.rect.z0) < 1e-6 || Math.abs(b.rect.z1 - a.rect.z0) < 1e-6) {
      const at = Math.abs(a.rect.z1 - b.rect.z0) < 1e-6 ? a.rect.z1 : a.rect.z0;
      const from = Math.max(a.rect.x0, b.rect.x0);
      const to = Math.min(a.rect.x1, b.rect.x1);
      if (to - from > 0.5) segs.push({ axis: 'x', at, from, to });
    }
    return segs;
  };
  const passable = (level: number, seg: { axis: 'x' | 'z'; at: number; from: number; to: number }) => {
    const ws: Wall[] = wallsOn(level, seg.axis, seg.at);
    // trecho sem nenhuma parede → integrado
    let covered = 0;
    for (const w of ws) covered += Math.max(0, Math.min(w.to, seg.to) - Math.max(w.from, seg.from));
    if (covered < seg.to - seg.from - 0.5) return true;
    return ws.some((w) => (w.openings ?? []).some((o) => PASS.has(o.kind) && (o.sill ?? 0) < 0.3 && o.c > seg.from && o.c < seg.to));
  };
  for (const a of ROOMS)
    for (const b of ROOMS) {
      if (a.id >= b.id || a.level !== b.level) continue;
      if (shared(a, b).some((seg) => passable(a.level, seg))) link(a.id, b.id);
    }
  // escada e elevador ligam hall e galeria íntima
  link('foyer', 'corridor');
  // portas externas ligam ao jardim
  for (const d of DOORS) {
    if (d.wallKind === 'int') continue;
    const probe = (s: number) => (d.axis === 'x' ? { x: d.cx, z: d.at + s * 0.6 } : { x: d.at + s * 0.6, z: d.cz });
    for (const s of [-1, 1]) {
      const p = probe(s);
      const rm = ROOMS.find((r) => r.level === d.level && p.x >= r.rect.x0 && p.x <= r.rect.x1 && p.z >= r.rect.z0 && p.z <= r.rect.z1);
      if (rm) link(rm.id, `outside-${d.level}`);
    }
  }
  link('outside-0', 'pool');
  link('outside-0', 'gourmet');
  link('outside-0', 'terraceGround');
  return adj;
}

describe('circulação', () => {
  it('todos os cômodos são alcançáveis a partir do hall de entrada', () => {
    const adj = circulationGraph();
    const seen = new Set<string>(['foyer']);
    const queue = ['foyer'];
    while (queue.length) {
      const cur = queue.shift()!;
      for (const n of adj.get(cur) ?? []) if (!seen.has(n)) {
        seen.add(n);
        queue.push(n);
      }
    }
    const missing = ROOMS.filter((r) => !seen.has(r.id)).map((r) => r.id);
    expect(missing).toEqual([]);
  });
});

describe('mobiliário', () => {
  it('cada peça pertence a um cômodo existente e fica dentro dele', () => {
    for (const it of FURNITURE) {
      const rm = roomById(it.room);
      expect(rm, it.id).toBeDefined();
      const pad = 0.6; // tolerância para peças junto às paredes/guarda-corpos
      expect(it.x, it.id).toBeGreaterThanOrEqual(rm!.rect.x0 - pad);
      expect(it.x, it.id).toBeLessThanOrEqual(rm!.rect.x1 + pad);
      expect(it.z, it.id).toBeGreaterThanOrEqual(rm!.rect.z0 - pad);
      expect(it.z, it.id).toBeLessThanOrEqual(rm!.rect.z1 + pad);
    }
  });
});

describe('visita guiada', () => {
  it('tem passos válidos', () => {
    expect(TOUR.length).toBeGreaterThan(8);
    for (const s of TOUR) {
      expect(s.title.length).toBeGreaterThan(2);
      if (s.room) expect(roomById(s.room), s.room).toBeDefined();
      for (const id of s.open ?? []) expect(DOORS.some((d) => d.id === id) || ['streetGate', 'pedestrianGate'].includes(id), id).toBe(true);
    }
  });
});
