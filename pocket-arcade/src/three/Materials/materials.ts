import * as THREE from 'three';
import { makeNoiseTexture, makeNormalFromNoise } from './proceduralTextures';

/**
 * Paleta tirada da fotografia (valores médios amostrados nas áreas iluminadas
 * e corrigidos para a iluminação neutra do estúdio 3D).
 */
export const PALETTE = {
  shell: '#d9cac6', // branco perolado levemente rosado
  seam: '#9a8783',
  bezel: '#0c0c0f',
  blue: '#2c57d6',
  yellow: '#f4c22e',
  red: '#e2402c',
  joystickHousing: '#26262c',
  chrome: '#dadadf',
  capYellow: '#f7cc3a',
  clover: '#a9d3ee',
  magenta: '#c4357c',
  sliderRed: '#dd4436',
  cartridgeYellow: '#f5c536',
  memoryBlue: '#4a5ee0',
  tabRed: '#f0573a',
  cable: '#f3f3f1',
  metal: '#c8c8cc',
  dark: '#2b2427',
  pill: '#fbfbfa',
  background: '#dcd9e4',
} as const;

export interface ArcadeMaterials {
  shell: THREE.MeshPhysicalMaterial;
  seam: THREE.MeshStandardMaterial;
  bezel: THREE.MeshPhysicalMaterial;
  glass: THREE.MeshPhysicalMaterial;
  dark: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  chrome: THREE.MeshStandardMaterial;
  gunmetal: THREE.MeshPhysicalMaterial;
  pill: THREE.MeshPhysicalMaterial;
  cable: THREE.MeshPhysicalMaterial;
  gold: THREE.MeshStandardMaterial;
  plastic: (color: string, opts?: { roughness?: number; clearcoat?: number }) => THREE.MeshPhysicalMaterial;
  dispose: () => void;
}

export function createMaterials(): ArcadeMaterials {
  const created: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];
  const track = <M extends THREE.Material>(m: M) => {
    created.push(m);
    return m;
  };

  // Microtextura do plástico: ruído suave para rugosidade e um normal map bem leve.
  const noise = makeNoiseTexture(256, 7);
  const normal = makeNormalFromNoise(256, 11);
  for (const t of [noise, normal]) {
    if (!t) continue;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(0.35, 0.35);
    textures.push(t);
  }

  const shell = track(
    new THREE.MeshPhysicalMaterial({
      name: 'shell-pearl',
      color: PALETTE.shell,
      roughness: 0.46,
      metalness: 0,
      roughnessMap: noise ?? null,
      normalMap: normal ?? null,
      normalScale: new THREE.Vector2(0.06, 0.06),
      clearcoat: 0.32,
      clearcoatRoughness: 0.38,
      sheen: 0.5,
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color('#f4eeee'),
      iridescence: 0.08,
      iridescenceIOR: 1.3,
    }),
  );

  const plasticCache = new Map<string, THREE.MeshPhysicalMaterial>();
  const plastic = (color: string, opts: { roughness?: number; clearcoat?: number } = {}) => {
    const key = `${color}|${opts.roughness ?? ''}|${opts.clearcoat ?? ''}`;
    const hit = plasticCache.get(key);
    if (hit) return hit;
    const m = track(
      new THREE.MeshPhysicalMaterial({
        name: `plastic-${color}`,
        color,
        roughness: opts.roughness ?? 0.28,
        metalness: 0,
        clearcoat: opts.clearcoat ?? 0.8,
        clearcoatRoughness: 0.18,
      }),
    );
    plasticCache.set(key, m);
    return m;
  };

  return {
    shell,
    seam: track(new THREE.MeshStandardMaterial({ name: 'seam', color: PALETTE.seam, roughness: 0.7 })),
    bezel: track(
      new THREE.MeshPhysicalMaterial({
        name: 'bezel',
        color: PALETTE.bezel,
        roughness: 0.3,
        clearcoat: 0.6,
        clearcoatRoughness: 0.1,
        envMapIntensity: 0.35,
      }),
    ),
    glass: track(
      new THREE.MeshPhysicalMaterial({
        name: 'screen-glass',
        color: '#ffffff',
        roughness: 0.04,
        metalness: 0,
        transparent: true,
        opacity: 0.035,
        clearcoat: 1,
        depthWrite: false,
      }),
    ),
    dark: track(new THREE.MeshStandardMaterial({ name: 'dark-recess', color: PALETTE.dark, roughness: 0.85 })),
    metal: track(new THREE.MeshStandardMaterial({ name: 'metal', color: PALETTE.metal, metalness: 1, roughness: 0.3 })),
    chrome: track(new THREE.MeshStandardMaterial({ name: 'chrome', color: PALETTE.chrome, metalness: 1, roughness: 0.12 })),
    gunmetal: track(
      new THREE.MeshPhysicalMaterial({
        name: 'joystick-housing',
        color: PALETTE.joystickHousing,
        metalness: 0.75,
        roughness: 0.28,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
      }),
    ),
    pill: track(
      new THREE.MeshPhysicalMaterial({ name: 'pill', color: PALETTE.pill, roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.1 }),
    ),
    cable: track(new THREE.MeshPhysicalMaterial({ name: 'cable', color: PALETTE.cable, roughness: 0.5, sheen: 0.3 })),
    gold: track(new THREE.MeshStandardMaterial({ name: 'contacts', color: '#d9b25a', metalness: 1, roughness: 0.3 })),
    plastic,
    dispose: () => {
      created.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}
