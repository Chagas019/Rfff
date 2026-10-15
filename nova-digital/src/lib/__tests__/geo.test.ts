import { classifyCountry } from '../continents';
import { greatCircleKm, latLonToVec3, nearestAngle, rotationToFace, vec3ToLatLon, wrapAngle } from '../geo';
import { GlobeController } from '../globeController';
import { parseDataset } from '../network';

describe('geo', () => {
  it('latLonToVec3 e vec3ToLatLon são inversas', () => {
    for (const [lat, lon] of [
      [0, 0],
      [-23.55, -46.63],
      [35.68, 139.69],
      [64.15, -21.94],
      [-33.87, 151.21],
    ]) {
      const r = vec3ToLatLon(latLonToVec3(lat, lon));
      expect(r.lat).toBeCloseTo(lat, 6);
      expect(r.lon).toBeCloseTo(lon, 6);
    }
  });

  it('rotationToFace coloca o ponto de frente para a câmera (+Z)', () => {
    const [lat, lon] = [35.68, 139.69];
    const { x, y } = rotationToFace(lat, lon);
    let [px, py, pz] = latLonToVec3(lat, lon);
    // ordem XYZ do Three.js: aplica Y e depois X
    [px, pz] = [px * Math.cos(y) + pz * Math.sin(y), -px * Math.sin(y) + pz * Math.cos(y)];
    [py, pz] = [py * Math.cos(x) - pz * Math.sin(x), py * Math.sin(x) + pz * Math.cos(x)];
    expect(px).toBeCloseTo(0, 6);
    expect(py).toBeCloseTo(0, 6);
    expect(pz).toBeCloseTo(1, 6);
  });

  it('distância São Paulo–Lisboa ≈ 7.900 km', () => {
    const km = greatCircleKm({ lat: -23.55, lon: -46.63 }, { lat: 38.72, lon: -9.14 });
    expect(km).toBeGreaterThan(7850);
    expect(km).toBeLessThan(8000);
  });

  it('nearestAngle escolhe o caminho mais curto', () => {
    expect(wrapAngle(3 * Math.PI)).toBeCloseTo(Math.PI);
    expect(nearestAngle(0.1, 2 * Math.PI)).toBeCloseTo(0);
  });
});

describe('continentes', () => {
  it('classifica países pelo centróide e pelas exceções', () => {
    expect(classifyCountry('Brazil', -53, -10)).toBe('south-america');
    expect(classifyCountry('Panama', -80, 8.5)).toBe('north-america');
    expect(classifyCountry('Egypt', 30, 26)).toBe('africa');
    expect(classifyCountry('Saudi Arabia', 44, 24)).toBe('asia');
    expect(classifyCountry('France', 2, 46)).toBe('europe');
    expect(classifyCountry('Australia', 134, -25)).toBe('oceania');
    expect(classifyCountry('Indonesia', 117, -2)).toBe('asia');
    expect(classifyCountry('Russia', 97, 62)).toBe('split');
  });
});

describe('GlobeController', () => {
  it('foco aproxima a rotação do alvo e reset volta ao início', () => {
    const c = new GlobeController({ x: 0.2, y: 0, distance: 4 }, { autoRotate: false });
    c.focus(10, 20, 3);
    for (let i = 0; i < 200; i++) c.update(1 / 60);
    const t = rotationToFace(10, 20);
    expect(c.rotX).toBeCloseTo(t.x, 3);
    expect(Math.abs(wrapAngle(c.rotY - t.y))).toBeLessThan(1e-3);
    expect(c.distance).toBeCloseTo(3, 2);
    c.reset();
    for (let i = 0; i < 200; i++) c.update(1 / 60);
    expect(c.distance).toBeCloseTo(4, 2);
  });

  it('zoom respeita os limites', () => {
    const c = new GlobeController({ x: 0, y: 0, distance: 4 }, { minDistance: 2, maxDistance: 6 });
    c.zoomBy(0.01);
    expect(c.zoomTarget).toBe(2);
    c.zoomBy(100);
    expect(c.zoomTarget).toBe(6);
  });
});

describe('parseDataset', () => {
  it('descarta itens inválidos e rotas para cidades inexistentes', () => {
    const ds = parseDataset(
      {
        cities: [
          { id: 'a', name: 'A', country: 'X', continent: 'europe', region: 'emea', lat: 10, lon: 10 },
          { id: 'b', name: 'B', country: 'Y', continent: 'asia', region: 'apac', lat: 200, lon: 0 },
        ],
        routes: [{ from: 'a', to: 'b' }],
      },
      'teste',
    );
    expect(ds?.cities.map((c) => c.id)).toEqual(['a']);
    expect(ds?.routes).toEqual([]);
    expect(parseDataset({ nope: true }, 'x')).toBeNull();
  });
});

describe('fusos', () => {
  it('diferença de fuso entre São Paulo e Tóquio é +12 h', async () => {
    const { formatTzDiff } = await import('../time');
    expect(formatTzDiff('America/Sao_Paulo', 'Asia/Tokyo', new Date('2026-07-01T12:00:00Z'))).toBe('+12 h');
    expect(formatTzDiff('Asia/Kolkata', 'Asia/Kolkata')).toBe('mesmo fuso');
  });
});

describe('física estilo Apple', () => {
  it('project segue a fórmula de desaceleração da Apple', async () => {
    const { project } = await import('../motion');
    // 1000 px/s com 0.998 → 0.998 / 0.002 = 499 px
    expect(project(1000)).toBeCloseTo(499, 5);
    expect(project(0)).toBe(0);
  });

  it('rubberband resiste cada vez mais e nunca passa da dimensão', async () => {
    const { rubberband, rubberbandClamp } = await import('../motion');
    const a = rubberband(50, 100);
    const b = rubberband(500, 100);
    expect(a).toBeLessThan(50);
    expect(b).toBeLessThan(100);
    expect(b).toBeGreaterThan(a);
    expect(rubberbandClamp(0.5, -1, 1, 0.6)).toBe(0.5);
    expect(rubberbandClamp(1.5, -1, 1, 0.6)).toBeLessThan(1.5);
  });

  it('GlobeController estica o tilt além do limite e volta ao soltar', () => {
    const c = new GlobeController({ x: 1.2, y: 0, distance: 3.2 }, { autoRotate: false });
    c.beginDrag();
    c.drag(0, 400);
    expect(c.rotX).toBeGreaterThan(1.25);
    expect(c.rotX).toBeLessThan(1.25 + 0.6);
    c.endDrag();
    for (let i = 0; i < 300; i++) c.update(1 / 60);
    expect(c.rotX).toBeCloseTo(1.25, 3);
  });
});
