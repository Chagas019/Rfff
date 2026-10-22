import { useMemo, type ReactNode } from 'react';
import { create } from 'zustand';
import * as THREE from 'three';
import { furnitureForRoom } from '../../data/furniture';
import { FurniturePiece } from '../furniture/registry';
import { useMaterials, roomLedMaterial } from '../../materials/library';
import { B, Cyl, Sph } from '../furniture/primitives';

/** Visibilidade de cada cômodo calculada pelo LOD (InteriorRooms). */
export const useRoomLOD = create<{ vis: Record<string, boolean>; set: (v: Record<string, boolean>) => void }>((set) => ({
  vis: {},
  set: (vis) => set({ vis }),
}));

/** Agrupa tudo o que pertence a um cômodo para ligar/desligar pelo LOD. */
export function RoomGroup({ id, children }: { id: string; children: ReactNode }) {
  const visible = useRoomLOD((s) => s.vis[id] ?? true);
  return (
    <group name={`room:${id}`} visible={visible}>
      {children}
    </group>
  );
}

/** Mobiliário do cômodo vindo da lista de dados (a mesma usada na planta). */
export function RoomFurniture({ id }: { id: string }) {
  const items = useMemo(() => furnitureForRoom(id), [id]);
  return (
    <>
      {items.map((it) => (
        <FurniturePiece key={it.id} item={it} />
      ))}
    </>
  );
}

const curtainMat = new THREE.MeshStandardMaterial({ color: '#f5f2ec', roughness: 1, transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false });
const curtainCache = new Map<string, THREE.BufferGeometry>();

/** Cortina com pregas (geometria ondulada), pendurada a partir do trilho embutido. */
export function Curtain({ x, z, y = 0, width, height, rot = 0 }: { x: number; z: number; y?: number; width: number; height: number; rot?: number }) {
  const geo = useMemo(() => {
    const key = `${width.toFixed(2)}|${height.toFixed(2)}`;
    let g = curtainCache.get(key);
    if (!g) {
      const segX = Math.max(8, Math.round(width * 14));
      g = new THREE.PlaneGeometry(width, height, segX, 1);
      const pos = g.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i);
        pos.setZ(i, Math.sin(px * 18) * 0.045 + Math.sin(px * 7.3) * 0.02);
      }
      g.computeVertexNormals();
      curtainCache.set(key, g);
    }
    return g;
  }, [width, height]);
  return (
    <group position={[x, y, z]} rotation={[0, rot, 0]}>
      <mesh geometry={geo} material={curtainMat} position={[0, height / 2, 0]} castShadow={false} receiveShadow />
    </group>
  );
}

/** Quadro emoldurado (moldura em nogueira escura e tela com obra gerativa). */
export function Artwork({ x, y, z, w, h, rot = 0, art = 0 }: { x: number; y: number; z: number; w: number; h: number; rot?: number; art?: 0 | 1 | 2 }) {
  const m = useMaterials();
  const mat = [m.art0, m.art1, m.art2][art];
  return (
    <group position={[x, y, z]} rotation={[0, rot, 0]}>
      <B s={[w + 0.08, h + 0.08, 0.04]} p={[0, 0, 0.02]} m={m.blackMetal} />
      <mesh position={[0, 0, 0.042]} material={mat}>
        <planeGeometry args={[w, h]} />
      </mesh>
    </group>
  );
}

/** Pendente: fio fino, cúpula e lâmpada (emissiva do cômodo). */
export function Pendant({ room, x, z, ceilingY, drop, shape = 'globe', size = 0.18 }: { room: string; x: number; z: number; ceilingY: number; drop: number; shape?: 'globe' | 'cone' | 'disc'; size?: number }) {
  const m = useMaterials();
  const glow = roomLedMaterial(room);
  const y = ceilingY - drop;
  return (
    <group position={[x, 0, z]}>
      <Cyl rt={0.004} h={drop} p={[0, ceilingY - drop / 2, 0]} m={m.blackMetal} seg={4} shadow={false} />
      <Cyl rt={0.05} h={0.02} p={[0, ceilingY - 0.01, 0]} m={m.brass} shadow={false} />
      {shape === 'globe' && <Sph radius={size} p={[0, y - size, 0]} m={glow} shadow={false} />}
      {shape === 'cone' && (
        <>
          <Cyl rt={0.04} rb={size} h={size * 1.1} p={[0, y - size * 0.55, 0]} m={m.brass} seg={24} shadow={false} />
          <Cyl rt={size - 0.01} h={0.01} p={[0, y - size * 1.1, 0]} m={glow} seg={24} shadow={false} />
        </>
      )}
      {shape === 'disc' && (
        <>
          <Cyl rt={size} h={0.03} p={[0, y, 0]} m={m.brass} seg={32} shadow={false} />
          <Cyl rt={size - 0.02} h={0.01} p={[0, y - 0.02, 0]} m={glow} seg={32} shadow={false} />
        </>
      )}
    </group>
  );
}
