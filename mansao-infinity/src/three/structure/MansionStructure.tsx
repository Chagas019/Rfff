import { useMemo } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { ROOMS, LEVEL_Y, roomHeight, type FloorFinish, type Room } from '../../data/plan';
import { useMaterials, roomCeilingMaterial, TILE, type Materials } from '../../materials/library';
import { useExperience } from '../../store/useExperience';
import { applyWorldUV } from '../../utils/geometry';
import { buildStructure, type VisGroup } from './structureGeometry';
import { useLevelVisibility } from './visibility';
import { ExplodeLevel } from './explode';

type Bucket = VisGroup | 'L0cap' | 'L1cap';
const capMaterial = new THREE.MeshStandardMaterial({ color: '#161616', roughness: 0.85 });

const FLOOR_MAT: Record<FloorFinish, { key: keyof Materials; tile: number }> = {
  oak: { key: 'oak', tile: TILE.oak },
  marble: { key: 'marble', tile: TILE.marble },
  porcelain: { key: 'porcelain', tile: TILE.porcelain },
  polished: { key: 'polished', tile: TILE.polished },
  stone: { key: 'marbleBlack', tile: TILE.marbleBlack },
  carpet: { key: 'carpet', tile: TILE.velvet * 4 },
  travertine: { key: 'travertine', tile: TILE.travertine },
  deck: { key: 'deck', tile: TILE.teak },
};

/**
 * Estrutura da mansão: paredes, revestimentos, caixilhos, lajes, coberturas,
 * pisos (clicáveis para abrir o cômodo) e forros iluminados.
 */
export function MansionStructure() {
  const mats = useMaterials();
  const geo = useMemo(() => buildStructure(), []);
  const vis = useLevelVisibility();

  const byGroup = useMemo(() => {
    const out: Record<Bucket, { key: string; mat: string; geometry: THREE.BufferGeometry }[]> = { L0: [], L0up: [], L1: [], roof: [], L0cap: [], L1cap: [] };
    for (const [key, geometry] of geo.merged) {
      const [group, mat] = key.split('|') as [Bucket, string];
      out[group].push({ key, mat, geometry });
    }
    return out;
  }, [geo]);

  const render = (group: Bucket) =>
    byGroup[group].map(({ key, mat, geometry }) => {
      const material = mat === 'cap' ? capMaterial : (mats[mat as keyof Materials] as THREE.Material);
      const isGlass = mat === 'glass';
      return <mesh key={key} geometry={geometry} material={material} castShadow={!isGlass} receiveShadow={!isGlass} renderOrder={isGlass ? 2 : 0} />;
    });

  return (
    <group name="MansionStructure">
      <group visible={vis.L0}>{render('L0')}</group>
      <group visible={vis.L0 && vis.L0up}>{render('L0up')}</group>
      {/* topo preto das paredes cortadas: térreo só quando o superior não está em cima */}
      <group visible={vis.L0 && (!vis.L1 || vis.explode)}>{render('L0cap')}</group>
      <ExplodeLevel level={1}>
        <group visible={vis.L1}>{render('L1')}</group>
        <group visible={vis.L1 && !vis.roof}>{render('L1cap')}</group>
      </ExplodeLevel>
      <group visible={vis.roof}>{render('roof')}</group>
      <Floors />
      <Ceilings />
    </group>
  );
}

function Floors() {
  const mats = useMaterials();
  const vis = useLevelVisibility();
  const focusRoom = useExperience((s) => s.focusRoom);
  const hoverRoom = useExperience((s) => s.hoverRoom);
  const mode = useExperience((s) => s.mode);
  const pickable = mode === 'interior' || mode === 'top' || mode === 'explode';

  const floors = useMemo(
    () =>
      ROOMS.filter((rm) => !(rm.outdoor && rm.level === 0)).map((rm) => {
        const { x0, x1, z0, z1 } = rm.rect;
        const spec = FLOOR_MAT[rm.floor];
        const g = new THREE.BoxGeometry(x1 - x0, 0.04, z1 - z0);
        g.translate((x0 + x1) / 2, LEVEL_Y[rm.level] - 0.02, (z0 + z1) / 2);
        applyWorldUV(g, spec.tile);
        return { rm, g, material: mats[spec.key] as THREE.Material };
      }),
    [mats],
  );

  const onClick = (rm: Room) => (e: ThreeEvent<MouseEvent>) => {
    if (!pickable) return;
    e.stopPropagation();
    focusRoom(rm.id);
  };

  return (
    <group name="Floors">
      {([0, 1] as const).map((lv) => (
        <ExplodeLevel key={lv} level={lv}>
      {floors.filter(({ rm }) => rm.level === lv).map(({ rm, g, material }) => (
        <mesh
          key={rm.id}
          geometry={g}
          material={material}
          receiveShadow
          visible={rm.level === 0 ? vis.L0 : vis.L1}
          onClick={onClick(rm)}
          onPointerOver={(e) => {
            if (!pickable) return;
            e.stopPropagation();
            hoverRoom(rm.id);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            hoverRoom(null);
            document.body.style.cursor = '';
          }}
          userData={{ roomId: rm.id }}
        />
      ))}
          <RoomHighlight level={lv} />
        </ExplodeLevel>
      ))}
    </group>
  );
}

/** Contorno luminoso no piso do cômodo selecionado ou sob o cursor. */
function RoomHighlight({ level }: { level: 0 | 1 }) {
  const selected = useExperience((s) => s.selectedRoom);
  const hovered = useExperience((s) => s.hoveredRoom);
  const mode = useExperience((s) => s.mode);
  const vis = useLevelVisibility();
  if (mode !== 'interior' && mode !== 'top' && mode !== 'explode') return null;
  const ids = [...new Set([selected, hovered].filter(Boolean) as string[])].filter((id) => ROOMS.find((r) => r.id === id)?.level === level);
  return (
    <>
      {ids.map((id) => {
        const rm = ROOMS.find((r) => r.id === id);
        if (!rm) return null;
        if ((rm.level === 0 && !vis.L0) || (rm.level === 1 && !vis.L1)) return null;
        const { x0, x1, z0, z1 } = rm.rect;
        const y = LEVEL_Y[rm.level] + 0.012;
        const pts = [
          [x0 + 0.1, y, z0 + 0.1],
          [x1 - 0.1, y, z0 + 0.1],
          [x1 - 0.1, y, z1 - 0.1],
          [x0 + 0.1, y, z1 - 0.1],
          [x0 + 0.1, y, z0 + 0.1],
        ].map((p) => new THREE.Vector3(...(p as [number, number, number])));
        const g = new THREE.BufferGeometry().setFromPoints(pts);
        const isSel = id === selected;
        return (
          <group key={id}>
            <lineLoop geometry={g}>
              <lineBasicMaterial color={isSel ? '#e9d7b0' : '#ffffff'} transparent opacity={isSel ? 0.95 : 0.6} toneMapped={false} />
            </lineLoop>
            <mesh position={[(x0 + x1) / 2, y - 0.002, (z0 + z1) / 2]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
              <planeGeometry args={[x1 - x0 - 0.2, z1 - z0 - 0.2]} />
              <meshBasicMaterial color={isSel ? '#e9d7b0' : '#ffffff'} transparent opacity={isSel ? 0.1 : 0.06} depthWrite={false} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

/** Forros: um plano por cômodo, com material próprio que brilha quando a luz do cômodo está acesa. */
function Ceilings() {
  const vis = useLevelVisibility();
  const ceilings = useMemo(
    () =>
      ROOMS.filter((rm) => !rm.outdoor).map((rm) => {
        const { x0, x1, z0, z1 } = rm.rect;
        return { rm, y: LEVEL_Y[rm.level] + roomHeight(rm), cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0 };
      }),
    [],
  );
  return (
    <group name="Ceilings">
      {([0, 1] as const).map((lv) => (
        <ExplodeLevel key={lv} level={lv}>
      {ceilings.filter(({ rm }) => rm.level === lv).map(({ rm, y, cx, cz, w, d }) => (
        <mesh
          key={rm.id}
          position={[cx, y - 0.005, cz]}
          rotation={[Math.PI / 2, 0, 0]}
          material={roomCeilingMaterial(rm.id)}
          visible={rm.level === 0 ? vis.ceil0 : vis.ceil1}
          receiveShadow
          raycast={() => null}
        >
          <planeGeometry args={[w, d]} />
        </mesh>
      ))}
        </ExplodeLevel>
      ))}
    </group>
  );
}
