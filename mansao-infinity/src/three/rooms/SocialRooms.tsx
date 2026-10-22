import { useMemo } from 'react';
import * as THREE from 'three';
import { useMaterials, roomLedMaterial, TILE } from '../../materials/library';
import { B, Cyl } from '../furniture/primitives';
import { Artwork, Pendant, RoomFurniture, RoomGroup } from './common';
import { useLevelVisibility } from '../structure/visibility';

/** Sala de jantar: mesa para 12 sob lustre linear escultural em latão. */
export function DiningRoom() {
  const m = useMaterials();
  const glow = roomLedMaterial('dining');
  return (
    <RoomGroup id="dining">
      <RoomFurniture id="dining" />
      <group position={[-1, 0, -6.5]}>
        {[-1.3, 1.3].map((x) => (
          <Cyl key={x} rt={0.004} h={0.7} p={[x, 3.25, 0]} m={m.blackMetal} seg={4} shadow={false} />
        ))}
        <B s={[3.2, 0.05, 0.08]} p={[0, 2.88, 0]} m={m.brass} shadow={false} />
        {Array.from({ length: 9 }, (_, i) => (
          <group key={i} position={[-1.4 + i * 0.35, 0, 0]}>
            <Cyl rt={0.006} h={0.22} p={[0, 2.75, 0]} m={m.brass} seg={6} shadow={false} />
            <mesh position={[0, 2.6, 0]} material={glow}>
              <sphereGeometry args={[0.055, 18, 12]} />
            </mesh>
          </group>
        ))}
        <B s={[3.1, 0.012, 0.04]} p={[0, 2.85, 0]} m={glow} shadow={false} />
      </group>
    </RoomGroup>
  );
}

/** Cozinha: mobiliário + coifa suspensa sobre o cooktop e três pendentes sobre a ilha. */
export function Kitchen() {
  const m = useMaterials();
  return (
    <RoomGroup id="kitchen">
      <RoomFurniture id="kitchen" />
      <group position={[-12.7, 0, -6.6]}>
        <B s={[1.1, 0.5, 0.65]} p={[0, 2.55, 0]} m={m.steel} />
        <B s={[0.32, 0.8, 0.32]} p={[0, 3.2, 0]} m={m.steel} />
        <B s={[1.0, 0.01, 0.55]} p={[0, 2.295, 0]} m={roomLedMaterial('kitchen')} shadow={false} />
      </group>
      {[-11.0, -10.1, -9.2].map((x) => (
        <Pendant key={x} room="kitchen" x={x} z={-6.4} ceilingY={3.6} drop={1.35} shape="cone" size={0.15} />
      ))}
    </RoomGroup>
  );
}

/** Hall de entrada e galeria: lustre em cascata, obras de arte e banco. */
export function FoyerGallery() {
  const m = useMaterials();
  const vis = useLevelVisibility();
  const glow = roomLedMaterial('foyer');
  const rods = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => {
        const a = (i / 36) * Math.PI * 2;
        const r = 0.9 + ((i * 7) % 5) * 0.06;
        return { x: Math.cos(a) * r, z: Math.sin(a) * r, len: 1.4 + ((i * 11) % 9) * 0.18 };
      }),
    [],
  );
  return (
    <>
      <RoomGroup id="foyer">
        <RoomFurniture id="foyer" />
        <group position={[-2.2, 0, 6.6]} visible={vis.L1}>
          <Cyl rt={1.15} h={0.03} p={[0, 6.98, 0]} m={m.brass} seg={48} shadow={false} />
          {rods.map((r, i) => (
            <group key={i}>
              <Cyl rt={0.003} h={7 - 5.2} p={[r.x, 6.1, r.z]} m={m.blackMetal} seg={3} shadow={false} />
              <mesh position={[r.x, 5.2 - r.len / 2, r.z]} material={glow}>
                <cylinderGeometry args={[0.012, 0.012, r.len, 6]} />
              </mesh>
            </group>
          ))}
        </group>
        <group visible={vis.L1}>
          <Artwork x={-9.86} y={5.4} z={7} w={2.6} h={1.7} rot={Math.PI / 2} art={0} />
        </group>
      </RoomGroup>
      <RoomGroup id="gallery">
        <RoomFurniture id="gallery" />
        <Artwork x={-6.88} y={1.6} z={-1.6} w={1.4} h={1.0} rot={Math.PI / 2} art={2} />
      </RoomGroup>
    </>
  );
}

/** Escritório: estante, mesa executiva, obra de arte e pendente. */
export function Office() {
  return (
    <RoomGroup id="office">
      <RoomFurniture id="office" />
      <Artwork x={4.12} y={1.7} z={7.6} w={1.4} h={1.9} rot={Math.PI / 2} art={2} />
      <Pendant room="office" x={8} z={6.1} ceilingY={3.6} drop={1.4} shape="disc" size={0.32} />
    </RoomGroup>
  );
}

/** Cinema: tela com moldura negra, caixas acústicas, painéis de tecido e teto estrelado. */
export function Cinema() {
  const m = useMaterials();
  const vis = useLevelVisibility();
  const stars = useMemo(() => {
    const pts: number[] = [];
    let s = 11;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 420; i++) pts.push(12.2 + rnd() * 7.6, 3.585, 0.2 + rnd() * 9.6);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  const panels = useMemo(() => Array.from({ length: 12 }, (_, i) => 0.6 + i * 0.78), []);
  return (
    <RoomGroup id="cinema">
      <RoomFurniture id="cinema" />
      <group>
        <B s={[5.9, 2.9, 0.06]} p={[16, 2.05, 9.8]} m={m.blackMetal} />
        <B s={[5.5, 2.6, 0.01]} p={[16, 2.05, 9.765]} m={m.ceramic} />
        <mesh position={[16, 2.05, 9.758]} rotation={[0, Math.PI, 0]} material={m.screenGlow}>
          <planeGeometry args={[5.5, 2.6]} />
        </mesh>
        {[12.7, 19.3].map((x) => (
          <group key={x}>
            <B s={[0.55, 1.4, 0.45]} p={[x, 0.7, 9.5]} m={m.plasticDark} />
            <Cyl rt={0.16} h={0.02} p={[x, 0.9, 9.27]} r={[Math.PI / 2, 0, 0]} m={m.blackMetal} />
          </group>
        ))}
        {panels.map((z) => (
          <group key={z}>
            <B s={[0.06, 2.4, 0.7]} p={[12.11, 1.6, z + 0.35]} m={m.acoustic} tile={TILE.linen} />
            <B s={[0.06, 2.4, 0.7]} p={[19.82, 1.6, z + 0.35]} m={m.acoustic} tile={TILE.linen} />
          </group>
        ))}
        <B s={[0.02, 0.02, 9.6]} p={[12.15, 3.0, 5]} m={roomLedMaterial('cinema')} shadow={false} />
        <B s={[0.02, 0.02, 9.6]} p={[19.78, 3.0, 5]} m={roomLedMaterial('cinema')} shadow={false} />
        <points geometry={stars} material={starMaterial} visible={vis.ceil0} />
      </group>
    </RoomGroup>
  );
}

const starMaterial = new THREE.PointsMaterial({ color: '#fff3d6', size: 0.035, sizeAttenuation: true, toneMapped: false });
