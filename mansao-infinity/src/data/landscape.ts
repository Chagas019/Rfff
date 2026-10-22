/**
 * Projeto paisagístico: posições de palmeiras, árvores, arbustos e capins,
 * canteiros, caminhos e iluminação externa. Tudo em metros, no mesmo sistema
 * da planta (x leste, z sul/rua).
 */
import { rng } from '../three/exterior/vegetationGeometry';

export interface Plant {
  x: number;
  z: number;
  y?: number;
  s: number;
  rot: number;
  v: number;
}

const R = rng(2026);
const jitter = (a: number) => (R() - 0.5) * a;

/** Platô principal e terraço inferior junto ao mar. */
export const TERRAIN = {
  plateauTop: -0.12,
  lowerTop: -3.0,
  edgeZ: -25.5,
  cliffZ: -44,
  seaY: -7.5,
};

export const PALMS: Plant[] = [
  // alameda do caminho social
  ...[17.5, 21.5, 25.5].flatMap((z, i) => [
    { x: -4.2, z, s: 7.5 + i * 0.6, rot: R() * 6, v: i % 3 },
    { x: 2.2, z: z + 1.2, s: 8.0 + i * 0.4, rot: R() * 6, v: (i + 1) % 3 },
  ]),
  // lateral leste e fundos
  ...[-20, -12, -4, 4, 12, 20].map((z, i) => ({ x: 29.5 + jitter(1.2), z, s: 8.5 + (i % 3) * 1.2, rot: R() * 6, v: i % 3 })),
  ...[-22, -14, 22].map((z, i) => ({ x: -31 + jitter(1), z, s: 8 + i, rot: R() * 6, v: (i + 2) % 3 })),
  // junto à piscina
  { x: 23.8, z: -23.6, s: 9.5, rot: 1, v: 0 },
  { x: 24.5, z: -19.2, s: 7.8, rot: 2, v: 1 },
  { x: -3.6, z: -24.4, s: 8.6, rot: 3, v: 2 },
  // terraço inferior, perto do mar
  ...[-28, -16, -4, 8, 20, 28].map((x, i) => ({ x: x + jitter(2), z: -40 + jitter(3), y: -3.0, s: 9 + (i % 3), rot: R() * 6, v: i % 3 })),
];

export const TREES: Plant[] = [
  { x: -30, z: 25, s: 1.15, rot: 0.3, v: 0 },
  { x: 27, z: 25.5, s: 1.0, rot: 1.2, v: 1 },
  { x: 12, z: 22, s: 0.9, rot: 2.2, v: 0 },
  { x: -15, z: 26, s: 0.75, rot: 0.8, v: 1 },
  { x: -30.5, z: 4, s: 1.05, rot: 2.6, v: 1 },
  { x: 27.5, z: -0.5, s: 0.95, rot: 0.4, v: 0 },
  { x: -29.5, z: -9, s: 0.9, rot: 1.9, v: 0 },
  { x: -20, z: -34, y: -3.0, s: 1.1, rot: 0.6, v: 1 },
  { x: 14, z: -36, y: -3.0, s: 1.0, rot: 1.4, v: 0 },
];

/** Cerca viva ao longo dos muros e canteiros junto às fachadas. */
export const SHRUBS: Plant[] = [
  ...Array.from({ length: 38 }, (_, i) => ({ x: -33.1, z: -24 + i * 1.45, s: 1.4 + R() * 0.4, rot: R() * 6, v: i % 3 })),
  ...Array.from({ length: 38 }, (_, i) => ({ x: 31.1, z: -24 + i * 1.45, s: 1.4 + R() * 0.4, rot: R() * 6, v: i % 3 })),
  ...Array.from({ length: 20 }, (_, i) => -33 + i * 1.5)
    .filter((x) => x < -25.5 || (x > -8.5 && x < -3.5) || x > 1.5)
    .map((x, i) => ({ x, z: 29.6, s: 1.3 + R() * 0.3, rot: R() * 6, v: i % 3 })),
  ...Array.from({ length: 22 }, (_, i) => 3 + i * 1.3)
    .filter((x) => x < 31)
    .map((x, i) => ({ x, z: 29.6, s: 1.3 + R() * 0.3, rot: R() * 6, v: i % 3 })),
  // canteiro na frente do escritório e do cinema
  ...Array.from({ length: 11 }, (_, i) => ({ x: 6 + i * 1.3, z: 11.1 + jitter(0.3), s: 1.0 + R() * 0.4, rot: R() * 6, v: i % 3 })),
  // canteiro lateral oeste (garagem/serviço)
  ...Array.from({ length: 12 }, (_, i) => ({ x: -27.3, z: -8 + i * 1.5, s: 1.1 + R() * 0.4, rot: R() * 6, v: i % 3 })),
  // borda do platô (fundos), fora da área da piscina
  ...Array.from({ length: 16 }, (_, i) => ({ x: -32 + i * 1.8, z: -25.0, s: 0.9 + R() * 0.3, rot: R() * 6, v: i % 3 })).filter((p) => p.x < -6 || p.x > 24),
];

export const GRASSES: Plant[] = [
  ...Array.from({ length: 14 }, (_, i) => ({ x: -2.6 + jitter(0.3), z: 17 + i * 0.95, s: 0.9 + R() * 0.3, rot: R() * 6, v: 0 })),
  ...Array.from({ length: 14 }, (_, i) => ({ x: 0.6 + jitter(0.3), z: 17.4 + i * 0.95, s: 0.9 + R() * 0.3, rot: R() * 6, v: 0 })),
  ...Array.from({ length: 16 }, (_, i) => ({ x: -9.4 + jitter(0.2), z: 11.5 + i * 1.2, s: 0.8 + R() * 0.3, rot: R() * 6, v: 0 })),
  ...Array.from({ length: 12 }, (_, i) => ({ x: 22.6 + jitter(0.2), z: -24 + i * 0.8, s: 0.8 + R() * 0.3, rot: R() * 6, v: 0 })),
  ...Array.from({ length: 10 }, (_, i) => ({ x: -5 + i * 0.9, z: 16.9 + jitter(0.2), s: 0.7 + R() * 0.3, rot: R() * 6, v: 0 })),
];

/** Pisos externos (topo em y = 0). */
export const PAVING: { id: string; x0: number; x1: number; z0: number; z1: number; mat: 'travertine' | 'driveway' | 'pavers' }[] = [
  { id: 'terrace', x0: -24.6, x1: 20.6, z0: -16, z1: -10.15, mat: 'travertine' },
  { id: 'gourmet', x0: -24.6, x1: -2, z0: -24, z1: -16, mat: 'travertine' },
  { id: 'poolWest', x0: -2, x1: 0, z0: -25, z1: -16, mat: 'travertine' },
  { id: 'poolEast', x0: 20, x1: 22.5, z0: -25, z1: -16, mat: 'travertine' },
  { id: 'poolSouth', x0: 0, x1: 20, z0: -18, z1: -16, mat: 'travertine' },
  { id: 'plaza', x0: -12.5, x1: 5.5, z0: 10.15, z1: 16.5, mat: 'travertine' },
  { id: 'driveway', x0: -24.4, x1: -10, z0: 10.15, z1: 30.6, mat: 'driveway' },
  { id: 'sidePath', x0: -26.2, x1: -24.6, z0: -24, z1: 10.15, mat: 'pavers' },
  { id: 'eastPath', x0: 20.6, x1: 22.5, z0: -16, z1: 10.6, mat: 'pavers' },
];

/** Pisantes do caminho social (do portão à porta pivotante). */
export const STEPPING_STONES = Array.from({ length: 13 }, (_, i) => ({ x: -1, z: 17.2 + i * 1.0, w: 2.0, d: 0.62 }));

/** Balizadores de iluminação dos caminhos. */
export const BOLLARDS = [
  ...[18, 21, 24, 27].flatMap((z) => [
    { x: -2.4, z },
    { x: 0.4, z },
  ]),
  ...[13, 17, 21, 25, 29].map((z) => ({ x: -9.6, z })),
  ...[-14, -6, 2, 8].map((z) => ({ x: 22.8, z })),
];

/** Muro perimetral (frente e laterais) e portões. */
export const BOUNDARY = {
  frontZ: 30.6,
  height: 2.4,
  westX: -34,
  eastX: 32,
  streetGate: { x0: -24, x1: -10 },
  pedGate: { x0: -2, x1: 0 },
};
