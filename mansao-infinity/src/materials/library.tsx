import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Biblioteca de materiais PBR. Todas as texturas são carregadas uma vez (com
 * progresso real na tela de carregamento) e compartilhadas por todos os
 * objetos — cada material abaixo é uma única instância reaproveitada.
 *
 * As geometrias usam UV em metros; `TILE[chave]` informa quantos metros uma
 * repetição da textura cobre, para que a escala dos materiais seja real.
 */

const T = (name: string) => `/textures/${name}.webp`;

const PBR_SETS = ['concrete', 'polished_concrete', 'travertine', 'oak_floor', 'walnut', 'teak', 'marble_white', 'marble_black', 'porcelain', 'grass', 'pavers', 'driveway', 'pool_tiles', 'linen', 'boucle', 'velvet_dark', 'rug', 'bark', 'stone_dark', 'battens', 'fluted'] as const;

export const TEXTURE_URLS: Record<string, string> = Object.fromEntries([
  ...PBR_SETS.flatMap((s) => [
    [`${s}_color`, T(`${s}_color`)],
    [`${s}_normal`, T(`${s}_normal`)],
    [`${s}_rough`, T(`${s}_rough`)],
  ]),
  ['water_normal', T('water_normal')],
  ['leaves', T('leaves')],
  ['palm_frond', T('palm_frond')],
  ['books', T('books')],
  ['art_0', T('art_0')],
  ['art_1', T('art_1')],
  ['art_2', T('art_2')],
]);

/** Metros cobertos por uma repetição de cada textura. */
export const TILE = {
  concrete: 2.4,
  polished: 4,
  travertine: 2.0,
  oak: 2.0,
  walnut: 1.2,
  teak: 1.0,
  marble: 1.6,
  marbleBlack: 1.6,
  porcelain: 2.4,
  grass: 3.5,
  pavers: 2.4,
  driveway: 3.0,
  poolTiles: 1.0,
  linen: 0.3,
  boucle: 0.22,
  velvet: 0.3,
  stoneDark: 0.8,
  bark: 1.0,
  battens: 1.0,
  fluted: 0.8,
} as const;

export type Materials = ReturnType<typeof buildMaterials>;

function buildMaterials(tx: Record<string, THREE.Texture>, anisotropy: number) {
  for (const [key, t] of Object.entries(tx)) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = anisotropy;
    if (key.endsWith('_color') || key === 'leaves' || key === 'palm_frond' || key === 'books' || key.startsWith('art_')) {
      t.colorSpace = THREE.SRGBColorSpace;
    } else {
      t.colorSpace = THREE.NoColorSpace;
    }
    t.needsUpdate = true;
  }

  const pbr = (set: string, params: THREE.MeshStandardMaterialParameters = {}, normalScale = 1) =>
    new THREE.MeshStandardMaterial({
      map: tx[`${set}_color`],
      normalMap: tx[`${set}_normal`],
      roughnessMap: tx[`${set}_rough`],
      normalScale: new THREE.Vector2(normalScale, normalScale),
      roughness: 1,
      metalness: 0,
      ...params,
    });

  const std = (color: string, roughness: number, metalness = 0, extra: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });

  const fabric = (set: 'linen' | 'boucle' | 'velvet_dark', color: string, normalScale = 0.6) =>
    pbr(set, { color, roughness: 1 }, normalScale);

  const m = {
    // --- estrutura e revestimentos
    plaster: std('#ebe6dd', 0.9, 0, { normalMap: tx.concrete_normal, normalScale: new THREE.Vector2(0.08, 0.08) }),
    ceiling: std('#f2efe9', 0.95),
    concrete: pbr('concrete', { color: '#f2f0ec' }, 0.9),
    concreteWhite: pbr('concrete', { color: '#ffffff' }, 0.5),
    travertine: pbr('travertine', {}, 1.0),
    teak: pbr('teak', {}, 0.7),
    walnut: pbr('walnut', {}, 0.5),
    oak: pbr('oak_floor', {}, 0.6),
    marble: pbr('marble_white', { envMapIntensity: 1.1 }, 0.3),
    marbleBlack: pbr('marble_black', { envMapIntensity: 1.2 }, 0.3),
    porcelain: pbr('porcelain', {}, 0.5),
    polished: pbr('polished_concrete', { envMapIntensity: 1.0 }, 0.4),
    stoneDark: pbr('stone_dark', {}, 0.6),
    grass: pbr('grass', { color: '#d8e0cf' }, 1.2),
    pavers: pbr('pavers', {}, 1.0),
    driveway: pbr('driveway', {}, 1.0),
    poolTiles: pbr('pool_tiles', {}, 0.8),
    bark: pbr('bark', {}, 1.0),
    deck: pbr('teak', { color: '#c9b39a' }, 0.9),
    battens: pbr('battens', {}, 1.0),
    fluted: pbr('fluted', {}, 1.0),
    carpet: pbr('velvet_dark', { color: '#5a5550' }, 1.4),
    acoustic: pbr('linen', { color: '#4a4744' }, 1.2),

    // --- tecidos e couros
    linen: fabric('linen', '#ffffff'),
    linenWhite: fabric('linen', '#f6f2ea'),
    boucle: fabric('boucle', '#ffffff', 1.0),
    velvet: fabric('velvet_dark', '#ffffff', 0.8),
    sage: fabric('linen', '#a3ad93'),
    terracotta: fabric('linen', '#c08566'),
    petrol: fabric('linen', '#4f6d74'),
    sand: fabric('linen', '#d8c9ad'),
    charcoalFabric: fabric('linen', '#5b5956'),
    leather: pbr('velvet_dark', { color: '#8a5a3a', roughness: 0.55, roughnessMap: null }, 0.25),
    leatherDark: pbr('velvet_dark', { color: '#3a2a22', roughness: 0.5, roughnessMap: null }, 0.25),
    rug: new THREE.MeshStandardMaterial({ map: tx.rug_color, normalMap: tx.rug_normal, roughness: 1, normalScale: new THREE.Vector2(1.2, 1.2) }),
    rugOutdoor: new THREE.MeshStandardMaterial({ map: tx.rug_color, normalMap: tx.rug_normal, color: '#9d988f', roughness: 1 }),

    // --- marcenaria
    lacquerGraphite: std('#2c2c2e', 0.42),
    lacquerWhite: std('#ebe8e1', 0.38),
    lacquerSand: std('#cbbfac', 0.45),

    // --- metais
    steel: std('#c9ccd0', 0.32, 1),
    chrome: std('#e8eaec', 0.06, 1),
    brass: std('#b5925a', 0.28, 1),
    blackMetal: std('#1f1f21', 0.45, 0.7),
    frame: std('#1b1c1e', 0.38, 0.6),
    aluminum: std('#9ea3a8', 0.35, 1),

    // --- vidros e espelhos
    glass: new THREE.MeshPhysicalMaterial({
      color: '#e6f0f2',
      metalness: 0,
      roughness: 0.02,
      transparent: true,
      opacity: 0.11,
      envMapIntensity: 1.2,
      side: THREE.DoubleSide,
      depthWrite: false,
      specularIntensity: 1,
    }),
    glassGuard: new THREE.MeshPhysicalMaterial({
      color: '#dbe9ea',
      roughness: 0.04,
      transparent: true,
      opacity: 0.22,
      envMapIntensity: 1.6,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    glassTinted: new THREE.MeshPhysicalMaterial({ color: '#2a2f33', roughness: 0.05, transparent: true, opacity: 0.55, envMapIntensity: 1.5, side: THREE.DoubleSide, depthWrite: false }),
    mirror: std('#dfe3e6', 0.02, 1, { envMapIntensity: 1.4 }),
    screen: std('#0b0c0e', 0.18, 0.2),

    // --- louças e acessórios
    ceramic: std('#f4f3f0', 0.18, 0, { envMapIntensity: 0.9 }),
    rubber: std('#151515', 0.85),
    plasticDark: std('#202022', 0.5),
    paperShade: std('#f1e9da', 0.9, 0, { emissive: new THREE.Color('#ffcf94'), emissiveIntensity: 0 }),
    books: new THREE.MeshStandardMaterial({ map: tx.books, roughness: 0.85 }),
    art0: new THREE.MeshStandardMaterial({ map: tx.art_0, roughness: 0.8 }),
    art1: new THREE.MeshStandardMaterial({ map: tx.art_1, roughness: 0.8 }),
    art2: new THREE.MeshStandardMaterial({ map: tx.art_2, roughness: 0.8 }),
    soil: std('#3a2f25', 1),
    leaves: new THREE.MeshStandardMaterial({ map: tx.leaves, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 }),
    frond: new THREE.MeshStandardMaterial({ map: tx.palm_frond, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.75 }),
    plantGreen: std('#3f5f2e', 0.7),

    // --- água
    water: new THREE.MeshPhysicalMaterial({
      color: '#2f8fa3',
      roughness: 0.04,
      metalness: 0,
      transparent: true,
      opacity: 0.72,
      normalMap: tx.water_normal,
      normalScale: new THREE.Vector2(0.35, 0.35),
      envMapIntensity: 1.6,
      emissive: new THREE.Color('#1aa7c4'),
      emissiveIntensity: 0,
      depthWrite: false,
    }),
    sea: new THREE.MeshPhysicalMaterial({
      color: '#1d4f63',
      roughness: 0.08,
      metalness: 0,
      normalMap: tx.water_normal,
      normalScale: new THREE.Vector2(0.25, 0.25),
      envMapIntensity: 1.2,
    }),

    // --- carros
    tire: std('#161616', 0.9),

    // --- luz (emissivos controlados pelo sistema de iluminação)
    led: std('#fff2de', 0.4, 0, { emissive: new THREE.Color('#ffcf94'), emissiveIntensity: 0, toneMapped: true }),
    ledCool: std('#e8f2ff', 0.4, 0, { emissive: new THREE.Color('#d8e8ff'), emissiveIntensity: 0 }),
    fire: new THREE.MeshBasicMaterial({ color: '#ff9b4a', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }),
    starDots: new THREE.MeshBasicMaterial({ color: '#fff4dd' }),
    screenGlow: new THREE.MeshBasicMaterial({ color: '#1a2a3a' }),
  };

  return m;
}

const MaterialsContext = createContext<Materials | null>(null);

export function MaterialsProvider({ children }: { children: ReactNode }) {
  const tx = useTexture(TEXTURE_URLS) as Record<string, THREE.Texture>;
  const gl = useThree((s) => s.gl);
  const mats = useMemo(() => buildMaterials(tx, Math.min(8, gl.capabilities.getMaxAnisotropy())), [tx, gl]);
  return <MaterialsContext.Provider value={mats}>{children}</MaterialsContext.Provider>;
}

export function useMaterials(): Materials {
  const m = useContext(MaterialsContext);
  if (!m) throw new Error('useMaterials precisa estar dentro de <MaterialsProvider>');
  return m;
}

// ------------------------------------------------------------------ luzes por cômodo
/**
 * Cada cômodo tem o próprio material emissivo (forro iluminado, LEDs e cúpulas)
 * para que acender/apagar um cômodo não afete os outros. O sistema de
 * iluminação ajusta `emissiveIntensity` de acordo com o horário e o interruptor.
 */
const roomGlow = new Map<string, THREE.MeshStandardMaterial>();
const roomShade = new Map<string, THREE.MeshStandardMaterial>();
const roomCeiling = new Map<string, THREE.MeshStandardMaterial>();

export function roomLedMaterial(roomId: string): THREE.MeshStandardMaterial {
  let m = roomGlow.get(roomId);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color: '#fff2de', roughness: 0.4, emissive: new THREE.Color('#ffc98f'), emissiveIntensity: 0 });
    roomGlow.set(roomId, m);
  }
  return m;
}

export function roomShadeMaterial(roomId: string): THREE.MeshStandardMaterial {
  let m = roomShade.get(roomId);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color: '#efe6d6', roughness: 0.9, emissive: new THREE.Color('#ffc485'), emissiveIntensity: 0, side: THREE.DoubleSide });
    roomShade.set(roomId, m);
  }
  return m;
}

export function roomCeilingMaterial(roomId: string): THREE.MeshStandardMaterial {
  let m = roomCeiling.get(roomId);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color: '#f3f1ec', roughness: 0.95, emissive: new THREE.Color('#ffd8a8'), emissiveIntensity: 0 });
    roomCeiling.set(roomId, m);
  }
  return m;
}

export const roomLightMaterials = { glow: roomGlow, shade: roomShade, ceiling: roomCeiling };
