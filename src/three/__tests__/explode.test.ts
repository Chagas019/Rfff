import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'three';
import { applyExplode, classifyPart, prepareExplode } from '../explode';

// carro de 5 m em X (frente em +X), 1 m de altura, 2 m de largura
const car = { minX: -2.5, maxX: 2.5, minY: 0, maxY: 1, minZ: -1, maxZ: 1 };

describe('vista explodida', () => {
  it('usa o nome da peça quando o modelo nomeia as malhas', () => {
    expect(classifyPart('FL_Tyre', { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }, car)).toBe('rodas');
    expect(classifyPart('halo_frame', { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }, car)).toBe('cockpit');
    expect(classifyPart('RearWing_Main', { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }, car)).toBe('asaTraseira');
  });
  it('sem nome, classifica pela posição no carro', () => {
    expect(classifyPart('m1', { x: 2.3, y: 0.15, z: 0 }, { x: 0.5, y: 0.2, z: 1.8 }, car)).toBe('asaDianteira');
    expect(classifyPart('m2', { x: -2.3, y: 0.8, z: 0 }, { x: 0.4, y: 0.4, z: 1.2 }, car)).toBe('asaTraseira');
    expect(classifyPart('m3', { x: 1.6, y: 0.33, z: 0.8 }, { x: 0.7, y: 0.66, z: 0.4 }, car)).toBe('rodas');
    expect(classifyPart('m4', { x: 0, y: 0.05, z: 0 }, { x: 3.5, y: 0.1, z: 1.4 }, car)).toBe('assoalho');
    expect(classifyPart('m5', { x: 0, y: 0.45, z: 0 }, { x: 3, y: 0.6, z: 1 }, car)).toBe('carroceria');
  });
  it('afasta as peças e as devolve ao lugar exato ao montar', () => {
    const g = new Group();
    const mk = (name: string, x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
      const m = new Mesh(new BoxGeometry(sx, sy, sz), new MeshBasicMaterial());
      m.name = name; m.position.set(x, y, z); g.add(m); return m;
    };
    const wheel = mk('tyre_fr', 1.6, 0.33, 0.8, 0.7, 0.66, 0.4);
    const wing = mk('front_wing', 2.3, 0.15, 0, 0.5, 0.2, 1.8);
    const parts = prepareExplode(g, 5);
    applyExplode(parts, 1);
    expect(wheel.position.z).toBeGreaterThan(0.8 + 1); // roda direita vai para fora
    expect(wing.position.x).toBeGreaterThan(2.3 + 1); // asa dianteira vai para a frente
    applyExplode(parts, 0);
    expect(wheel.position.toArray()).toEqual([1.6, 0.33, 0.8]);
    expect(wing.position.toArray()).toEqual([2.3, 0.15, 0]);
  });
});
