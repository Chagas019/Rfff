import { describe, expect, it } from 'vitest';
import { A_CORE, A_IN, A_OUT, AREAS, CORE_GAPS, OUTER_GAPS, RADIAL_GAPS, ROOMS, faceEnds, faceLength, roomAt, roomCenter, vertex } from '../data/plan';
import { solidPieces } from '../three/geom';

describe('planta octogonal', () => {
  it('tem oito ambientes, um por face, sem repetição', () => {
    expect(ROOMS).toHaveLength(8);
    expect(new Set(ROOMS.map((r) => r.id)).size).toBe(8);
    ROOMS.forEach((r, i) => expect(r.k).toBe(i));
    expect(OUTER_GAPS).toHaveLength(8);
    expect(CORE_GAPS).toHaveLength(8);
    expect(RADIAL_GAPS).toHaveLength(8);
  });

  it('as faces fecham o octógono e têm o comprimento certo', () => {
    for (let k = 0; k < 8; k++) {
      const [a, b] = faceEnds(A_OUT, k);
      expect(Math.hypot(b[0] - a[0], b[1] - a[1])).toBeCloseTo(faceLength(A_OUT), 6);
      const [, end] = faceEnds(A_OUT, k);
      const [start] = faceEnds(A_OUT, k + 1);
      expect(end[0]).toBeCloseTo(start[0], 9);
      expect(end[1]).toBeCloseTo(start[1], 9);
    }
  });

  it('a face 0 está voltada para a frente (+z)', () => {
    const [a, b] = faceEnds(A_OUT, 0);
    expect(a[1]).toBeCloseTo(A_OUT, 6);
    expect(b[1]).toBeCloseTo(A_OUT, 6);
    expect(vertex(A_OUT, 0)[0]).toBeGreaterThan(0);
  });

  it('localiza cada ambiente pelo centro e ignora o octógono central', () => {
    for (const r of ROOMS) {
      const [x, z] = roomCenter(r.k);
      expect(roomAt(x, z)).toBe(r.k);
    }
    expect(roomAt(0, 0)).toBe(-1);
    expect(roomAt(0, A_CORE - 0.5)).toBe(-1);
    expect(roomAt(0, A_IN + 0.3)).toBe(-1);
  });

  it('áreas coerentes', () => {
    expect(AREAS.footprint).toBeGreaterThan(300);
    expect(AREAS.ring + AREAS.core).toBeLessThan(AREAS.footprint);
  });
});

describe('paredes', () => {
  it('divide a parede ao redor de um vão de porta (dois trechos + verga)', () => {
    const p = solidPieces([{ t0: 0.4, t1: 0.6, y0: 0, y1: 2.2 }], 0, 3.3);
    expect(p).toHaveLength(3);
    expect(p.find((x) => x.y0 === 2.2)).toMatchObject({ t0: 0.4, t1: 0.6, y1: 3.3 });
  });

  it('janela alta gera peitoril e verga', () => {
    const p = solidPieces([{ t0: 0.3, t1: 0.7, y0: 1.6, y1: 2.6 }], 0, 3.3);
    expect(p).toHaveLength(4);
  });

  it('parede sem vãos é um bloco só', () => {
    expect(solidPieces([], 0, 3.3)).toEqual([{ t0: 0, t1: 1, y0: 0, y1: 3.3 }]);
  });
});
