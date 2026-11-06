import { Box3, Vector3, type Mesh, type Object3D } from 'three';

/** Grupos de peças mostrados na vista explodida. */
export type PartGroup = 'asaDianteira' | 'asaTraseira' | 'rodas' | 'suspensao' | 'cockpit' | 'assoalho' | 'carroceria';

export const PART_LABELS: Record<PartGroup, string> = {
  asaDianteira: 'Asa dianteira',
  asaTraseira: 'Asa traseira',
  rodas: 'Pneus e rodas',
  suspensao: 'Suspensão',
  cockpit: 'Cockpit e halo',
  assoalho: 'Assoalho e difusor',
  carroceria: 'Chassi e carroceria',
};

/** Pistas pelo nome da peça (modelos costumam nomear as malhas). */
const NAME_HINTS: [RegExp, PartGroup][] = [
  [/(tyre|tire|wheel|rim|pneu|roda|hub)/i, 'rodas'],
  [/(susp|wishbone|pushrod|pullrod|arm|upright|track.?rod)/i, 'suspensao'],
  [/(halo|cockpit|seat|steer|driver|helmet|visor|mirror)/i, 'cockpit'],
  [/(front.?wing|fw_|nose.?wing|asa.?d)/i, 'asaDianteira'],
  [/(rear.?wing|rw_|beam.?wing|drs|asa.?t)/i, 'asaTraseira'],
  [/(floor|diffuser|plank|skid|underbody|assoalho)/i, 'assoalho'],
];

export interface Bounds { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number }

/**
 * Classifica uma peça pelo nome e, sem pista no nome, pela posição dentro do carro
 * (comprimento no eixo X, frente em +X; altura no eixo Y; largura no eixo Z).
 */
export function classifyPart(name: string, center: { x: number; y: number; z: number }, size: { x: number; y: number; z: number }, car: Bounds): PartGroup {
  for (const [re, g] of NAME_HINTS) if (re.test(name)) return g;
  const L = car.maxX - car.minX || 1;
  const H = car.maxY - car.minY || 1;
  const W = car.maxZ - car.minZ || 1;
  const fx = (center.x - car.minX) / L; // 0 traseira → 1 frente
  const fy = (center.y - car.minY) / H; // 0 chão → 1 topo
  const fz = Math.abs(center.z - (car.minZ + car.maxZ) / 2) / (W / 2); // 0 centro → 1 lateral
  // rodas: peças roliças perto dos cantos, com altura e comprimento parecidos
  if (fz > 0.55 && Math.abs(size.x - size.y) < 0.35 * Math.max(size.x, size.y) && size.y > 0.25 * H) return 'rodas';
  if (fx > 0.82 && fy < 0.45) return 'asaDianteira';
  if (fx < 0.14 && fy > 0.45) return 'asaTraseira';
  if (fy < 0.16 && size.x > 0.25 * L) return 'assoalho';
  if (fz > 0.45 && fy < 0.6 && size.y < 0.3 * H) return 'suspensao';
  if (fx > 0.4 && fx < 0.7 && fy > 0.55 && fz < 0.4) return 'cockpit';
  return 'carroceria';
}

/** Direção (em comprimentos de carro) para onde cada grupo se afasta. */
export function explodeOffset(group: PartGroup, center: { x: number; z: number }): Vector3 {
  const side = Math.sign(center.z) || 1;
  const fore = Math.sign(center.x) || 1;
  switch (group) {
    case 'asaDianteira': return new Vector3(0.32, 0.04, 0);
    case 'asaTraseira': return new Vector3(-0.3, 0.16, 0);
    case 'rodas': return new Vector3(0.06 * fore, 0.02, 0.32 * side);
    case 'suspensao': return new Vector3(0.02 * fore, 0.1, 0.18 * side);
    case 'cockpit': return new Vector3(0, 0.22, 0);
    case 'assoalho': return new Vector3(0, -0.12, 0);
    default: return new Vector3(0, 0.06, 0);
  }
}

export interface ExplodePart { object: Object3D; group: PartGroup; home: Vector3; offset: Vector3; worldCenter: Vector3 }

/** Prepara as peças de um carro já posicionado (comprimento em X) e normalizado. */
export function prepareExplode(car: Object3D, length: number): ExplodePart[] {
  const carBox = new Box3().setFromObject(car);
  const b: Bounds = { minX: carBox.min.x, maxX: carBox.max.x, minY: carBox.min.y, maxY: carBox.max.y, minZ: carBox.min.z, maxZ: carBox.max.z };
  const carCenter = carBox.getCenter(new Vector3());
  const parts: ExplodePart[] = [];
  car.updateMatrixWorld(true);
  car.traverse((o) => {
    if (!(o as Mesh).isMesh) return;
    const box = new Box3().setFromObject(o);
    const c = box.getCenter(new Vector3());
    const s = box.getSize(new Vector3());
    const name = `${o.name} ${o.parent?.name ?? ''}`;
    const group = classifyPart(name, c, s, b);
    const dirWorld = explodeOffset(group, { x: c.x - carCenter.x, z: c.z - carCenter.z }).multiplyScalar(length);
    // converte o deslocamento do espaço do mundo para o espaço do pai da peça
    const parent = o.parent ?? car;
    const p0 = parent.worldToLocal(c.clone());
    const p1 = parent.worldToLocal(c.clone().add(dirWorld));
    parts.push({ object: o, group, home: o.position.clone(), offset: p1.sub(p0), worldCenter: c });
  });
  return parts;
}

/** Aplica o quanto o carro está desmontado (0 montado → 1 explodido). */
export function applyExplode(parts: ExplodePart[], t: number) {
  const e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2; // easeInOutCubic
  for (const p of parts) p.object.position.copy(p.home).addScaledVector(p.offset, e);
}
