import { describe, expect, it } from 'vitest';
import { resolve, isWalkable, stairHeight, inStairZone, PLAYER_RADIUS } from '../collision';
import { subtractRects, wallSolidPieces, exteriorSide } from '../geometry';
import { rotatedRect } from '../plan2d';
import { nearestInteractable } from '../interact';
import { levelVisibility } from '../../three/structure/visibility';
import { WALLS, STAIR } from '../../data/plan';

describe('colisão do modo caminhada', () => {
  it('não atravessa uma parede maciça', () => {
    // parede entre escritório (x>4) e cinema (x>12) em x = 12
    const r = resolve(0, 11.95, 5, {});
    expect(r.x).toBeLessThanOrEqual(12 - 0.075 - PLAYER_RADIUS + 1e-6);
  });

  it('porta fechada bloqueia e porta aberta deixa passar', () => {
    // porta do escritório em x = 4, z = 5
    const closed = resolve(0, 4.0, 5.0, {});
    expect(Math.abs(closed.x - 4)).toBeGreaterThan(0.2);
    const open = resolve(0, 4.0, 5.0, { officeDoor: true });
    expect(open.x).toBeCloseTo(4.0, 5);
  });

  it('não entra na piscina', () => {
    const r = resolve(0, 10, -21, {});
    expect(r.z < -25 || r.z > -18 || r.x < 0 || r.x > 20).toBe(true);
  });

  it('no superior só anda sobre lajes (não cai no vazio do estar)', () => {
    expect(isWalkable(1, 0, -5)).toBe(true); // suíte master
    expect(isWalkable(1, 12, -5)).toBe(false); // pé-direito duplo do estar
    expect(isWalkable(1, 12, 5)).toBe(true); // terraço
  });

  it('a altura na escada varia de 0 a 4 m', () => {
    expect(stairHeight(STAIR.zBottom)).toBeCloseTo(0);
    expect(stairHeight(STAIR.zTop)).toBeCloseTo(4);
    expect(stairHeight((STAIR.zBottom + STAIR.zTop) / 2)).toBeCloseTo(2);
    expect(inStairZone(-7, 6)).toBe(true);
    expect(inStairZone(-3, 6)).toBe(false);
  });

  it('encontra a porta ou o elevador mais próximo', () => {
    expect(nearestInteractable(4.5, 5, 0)?.id).toBe('officeDoor');
    expect(nearestInteractable(-7.85, 2.8, 1)?.kind).toBe('elevator');
    expect(nearestInteractable(-30, 0, 0)).toBeNull();
  });
});

describe('geometria', () => {
  it('divide a parede ao redor de janelas (peitoril e verga)', () => {
    const w = WALLS.find((x) => x.id === 'g-front-office')!;
    const pieces = wallSolidPieces(w);
    // dois trechos cheios + peitoril + verga
    expect(pieces).toHaveLength(4);
  });

  it('identifica o lado externo das paredes de fachada', () => {
    expect(exteriorSide(WALLS.find((x) => x.id === 'g-front-cinema')!)).toBe(1); // rua em +z
    expect(exteriorSide(WALLS.find((x) => x.id === 'g-west-garage')!)).toBe(-1); // oeste em −x
    expect(exteriorSide(WALLS.find((x) => x.id === 'g-office-cinema')!)).toBe(0);
  });

  it('subtrai retângulos', () => {
    const parts = subtractRects({ x0: 0, x1: 10, z0: 0, z1: 10 }, [{ x0: 2, x1: 4, z0: 2, z1: 4 }]);
    const area = parts.reduce((s, p) => s + (p.x1 - p.x0) * (p.z1 - p.z0), 0);
    expect(area).toBeCloseTo(96);
  });

  it('gira pegadas como o three.js (rotação em y)', () => {
    const pts = rotatedRect(0, 0, 2, 1, 90);
    const xs = pts.map((p) => p[0]);
    const zs = pts.map((p) => p[1]);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(1);
    expect(Math.max(...zs) - Math.min(...zs)).toBeCloseTo(2);
  });
});

describe('corte casa de bonecas', () => {
  it('esconde o pavimento certo', () => {
    expect(levelVisibility(null)).toEqual({ L0: true, L0up: true, L1: true, roof: true, ceil0: true, ceil1: true, explode: false });
    expect(levelVisibility(0)).toMatchObject({ L1: false, roof: false, ceil0: false });
    expect(levelVisibility(1)).toMatchObject({ L1: true, roof: false, ceil0: true, ceil1: false });
  });

  it('prancha: sem cobertura e forros, pé-direito duplo cortado e layout por pavimento', () => {
    expect(levelVisibility(null, true)).toMatchObject({ L0: true, L0up: false, L1: true, roof: false, ceil0: false, ceil1: false, explode: true });
    expect(levelVisibility(0, true)).toMatchObject({ L0: true, L1: false });
    expect(levelVisibility(1, true)).toMatchObject({ L0: false, L1: true });
  });
});
