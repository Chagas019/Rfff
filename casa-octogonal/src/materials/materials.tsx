import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Materiais PBR compartilhados. As geometrias têm UV em metros; cada material
 * recebe cópias das texturas com `repeat = 1 / metros por repetição`.
 */
const SETS = ['flagstone', 'flagstone_roof', 'gravel', 'forest_floor', 'oak_floor', 'walnut', 'linen', 'boucle', 'marble_white', 'rug', 'bark', 'porcelain', 'travertine'] as const;

export const TEXTURE_URLS: Record<string, string> = Object.fromEntries([
  ...SETS.flatMap((s) => ['color', 'normal', 'rough'].map((c) => [`${s}_${c}`, `/textures/${s}_${c}.webp`])),
  ...['leaves', 'art_0', 'art_1', 'art_2', 'books'].map((n) => [n, `/textures/${n}.webp`]),
]);

function build(tx: Record<string, THREE.Texture>, aniso: number) {
  for (const [key, t] of Object.entries(tx)) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = aniso;
    t.colorSpace = key.endsWith('_normal') || key.endsWith('_rough') ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    t.needsUpdate = true;
  }
  const rep = (t: THREE.Texture, m: number) => {
    const c = t.clone();
    c.repeat.set(1 / m, 1 / m);
    c.needsUpdate = true;
    return c;
  };
  /** Material PBR com a textura cobrindo `m` metros por repetição. */
  const pbr = (set: string, m: number, p: THREE.MeshStandardMaterialParameters = {}, ns = 1) =>
    new THREE.MeshStandardMaterial({
      map: rep(tx[`${set}_color`], m),
      normalMap: rep(tx[`${set}_normal`], m),
      roughnessMap: rep(tx[`${set}_rough`], m),
      normalScale: new THREE.Vector2(ns, ns),
      roughness: 1,
      ...p,
    });
  const std = (color: string, roughness: number, metalness = 0, p: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...p });

  return {
    stone: pbr('flagstone', 2.6, {}, 1.4),
    stoneRoof: pbr('flagstone_roof', 5.5, { color: '#f3eadb' }, 1.2),
    stoneFire: pbr('flagstone', 1.6, { color: '#e9e2d6' }, 1.4),
    gravel: pbr('gravel', 1.6, {}, 1.0),
    forest: pbr('forest_floor', 5, {}, 1.0),
    mulch: pbr('forest_floor', 2.2, { color: '#8a7a68' }, 1.0),
    oak: pbr('oak_floor', 2.0, { color: '#e9dccb' }, 0.6),
    oakFloorDark: pbr('oak_floor', 2.0, { color: '#d2c1aa' }, 0.6),
    walnut: pbr('walnut', 1.2, {}, 0.5),
    oakLight: pbr('oak_floor', 1.2, { color: '#f7ead8' }, 0.4),
    marble: pbr('marble_white', 1.6, { envMapIntensity: 1.1 }, 0.3),
    porcelain: pbr('porcelain', 2.4, { color: '#efe9df' }, 0.4),
    travertine: pbr('travertine', 1.4, {}, 1.0),
    bark: pbr('bark', 1.0, { color: '#7d6f60' }, 1.2),
    plaster: std('#efe9df', 0.92),
    ceiling: std('#f4f0e8', 0.95),
    cap: std('#151515', 0.85),
    linen: pbr('linen', 0.3, { color: '#f4efe6' }, 0.6),
    linenSand: pbr('linen', 0.3, { color: '#d6c6aa' }, 0.6),
    linenOlive: pbr('linen', 0.3, { color: '#8d8a6c' }, 0.6),
    linenRust: pbr('linen', 0.3, { color: '#b47a56' }, 0.6),
    linenCharcoal: pbr('linen', 0.3, { color: '#57534e' }, 0.6),
    boucle: pbr('boucle', 0.22, { color: '#ece6da' }, 1.0),
    boucleGray: pbr('boucle', 0.22, { color: '#c9c3b8' }, 1.0),
    curtain: pbr('linen', 0.4, { color: '#ece4d6', side: THREE.DoubleSide }, 0.4),
    rug: pbr('rug', 2.0, { color: '#e2dbcf' }, 1.0),
    rugDark: pbr('rug', 2.0, { color: '#8e877c' }, 1.0),
    leather: std('#8a5a3a', 0.55),
    blackMetal: std('#1c1c1d', 0.42, 0.7),
    frame: std('#161718', 0.4, 0.6),
    brass: std('#b5925a', 0.3, 1),
    steel: std('#c9ccd0', 0.3, 1),
    ceramic: std('#f4f3f0', 0.15, 0, { envMapIntensity: 0.9 }),
    lacquer: std('#e9e4da', 0.4),
    stoneDark: std('#2a2927', 0.7),
    soil: std('#3a2f25', 1),
    pot: std('#b9ad9c', 0.85),
    potDark: std('#3c3935', 0.7),
    glass: new THREE.MeshPhysicalMaterial({ color: '#e4eef0', roughness: 0.03, transparent: true, opacity: 0.16, envMapIntensity: 1.4, side: THREE.DoubleSide, depthWrite: false }),
    skyGlass: new THREE.MeshPhysicalMaterial({ color: '#cfdbe0', roughness: 0.04, transparent: true, opacity: 0.3, envMapIntensity: 2.0, side: THREE.DoubleSide, depthWrite: false }),
    showerGlass: new THREE.MeshPhysicalMaterial({ color: '#e8f0f0', roughness: 0.05, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }),
    mirror: std('#dfe3e6', 0.03, 1, { envMapIntensity: 1.4 }),
    leaves: new THREE.MeshStandardMaterial({ map: tx.leaves, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 }),
    plant: std('#4b6a35', 0.75),
    shade: std('#f1e6d2', 0.9, 0, { emissive: new THREE.Color('#ffc27e'), emissiveIntensity: 0.6, side: THREE.DoubleSide }),
    bulb: std('#fff4e0', 0.4, 0, { emissive: new THREE.Color('#ffcf94'), emissiveIntensity: 2 }),
    fire: new THREE.MeshBasicMaterial({ color: '#ff9a45', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    ember: std('#2a1a12', 0.9, 0, { emissive: new THREE.Color('#ff5a1a'), emissiveIntensity: 0.45 }),
    books: new THREE.MeshStandardMaterial({ map: tx.books, roughness: 0.85 }),
    art0: new THREE.MeshStandardMaterial({ map: tx.art_0, roughness: 0.8 }),
    art1: new THREE.MeshStandardMaterial({ map: tx.art_1, roughness: 0.8 }),
    art2: new THREE.MeshStandardMaterial({ map: tx.art_2, roughness: 0.8 }),
  };
}

export type Materials = ReturnType<typeof build>;

const Ctx = createContext<Materials | null>(null);

export function MaterialsProvider({ children }: { children: ReactNode }) {
  const tx = useTexture(TEXTURE_URLS) as Record<string, THREE.Texture>;
  const gl = useThree((s) => s.gl);
  const m = useMemo(() => build(tx, Math.min(8, gl.capabilities.getMaxAnisotropy())), [tx, gl]);
  return <Ctx.Provider value={m}>{children}</Ctx.Provider>;
}

export function useMaterials(): Materials {
  const m = useContext(Ctx);
  if (!m) throw new Error('useMaterials fora do MaterialsProvider');
  return m;
}
