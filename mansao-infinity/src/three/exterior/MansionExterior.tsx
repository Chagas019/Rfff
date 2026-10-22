import { useMemo } from 'react';
import * as THREE from 'three';
import { furnitureForRoom } from '../../data/furniture';
import { TILE, useMaterials } from '../../materials/library';
import { FurniturePiece } from '../furniture/registry';
import { B, Cyl } from '../furniture/primitives';
import { useLevelVisibility } from '../structure/visibility';

/**
 * Elementos de fachada e áreas externas ligadas à casa: marquise em balanço
 * sobre a entrada, lâmina de travertino, brises de teca, frisos de LED,
 * terraço superior, varanda, área gourmet com pérgola e mobiliário externo.
 */
export function MansionExterior() {
  const vis = useLevelVisibility();
  return (
    <group name="MansionExterior">
      <Marquise visible={vis.roof} />
      <BladeWall />
      <SlatScreen visible={vis.L1} />
      <FacadeLights visible={vis.roof} />
      <Gourmet />
      <OutdoorFurniture ids={['pool', 'terraceGround', 'gourmet']} />
      <group visible={vis.L1}>
        <OutdoorFurniture ids={['terrace', 'balcony']} />
      </group>
      <RoofDetails visible={vis.roof} />
    </group>
  );
}

function OutdoorFurniture({ ids }: { ids: string[] }) {
  const items = useMemo(() => ids.flatMap((id) => furnitureForRoom(id)), [ids]);
  return (
    <>
      {items.map((it) => (
        <FurniturePiece key={it.id} item={it} />
      ))}
    </>
  );
}

/** Marquise de concreto branco com 6,5 m de balanço, frisos de LED e spots embutidos. */
function Marquise({ visible }: { visible: boolean }) {
  const m = useMaterials();
  const x0 = -12.5;
  const x1 = 5.5;
  const z0 = 9.6;
  const z1 = 16.5;
  const y0 = 4.45;
  const y1 = 4.9;
  const spots = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let x = x0 + 1.5; x < x1 - 1; x += 2.2) for (const z of [12.2, 14.8]) out.push([x, y0 - 0.005, z]);
    return out;
  }, []);
  return (
    <group visible={visible}>
      <B s={[x1 - x0, y1 - y0, z1 - z0]} p={[(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]} m={m.concreteWhite} tile={TILE.concrete} />
      <B s={[x1 - x0 - 0.3, 0.02, 0.04]} p={[(x0 + x1) / 2, y0 - 0.01, z1 - 0.2]} m={m.led} shadow={false} />
      {spots.map((p, i) => (
        <mesh key={i} position={p} rotation={[Math.PI / 2, 0, 0]} material={m.led}>
          <circleGeometry args={[0.06, 16]} />
        </mesh>
      ))}
    </group>
  );
}

/** Lâmina de travertino que organiza o acesso e esconde a garagem. */
function BladeWall() {
  const m = useMaterials();
  return (
    <group>
      <B s={[0.5, 7.4, 6.5]} p={[-10.6, 3.7, 13.4]} m={m.travertine} tile={TILE.travertine} />
      <B s={[0.02, 7.2, 0.03]} p={[-10.34, 3.7, 16.6]} m={m.led} shadow={false} />
      {/* número da casa em latão */}
      <B s={[0.03, 0.5, 0.9]} p={[-10.33, 2.2, 15.2]} m={m.brass} />
    </group>
  );
}

/** Brise vertical de ripas de teca diante da janela do quarto 5 (fachada da rua). */
function SlatScreen({ visible }: { visible: boolean }) {
  const m = useMaterials();
  const ref = useMemo(() => {
    const g = new THREE.BoxGeometry(0.06, 3.3, 0.14);
    return g;
  }, []);
  const count = 34;
  const matrices = useMemo(() => {
    const o = new THREE.Object3D();
    return Array.from({ length: count }, (_, i) => {
      o.position.set(-14.8 + i * 0.145, 5.7, 10.42);
      o.updateMatrix();
      return o.matrix.clone();
    });
  }, []);
  return (
    <group visible={visible}>
      <instancedMesh
        args={[ref, m.teak, count]}
        castShadow
        receiveShadow
        ref={(mesh) => {
          if (!mesh) return;
          matrices.forEach((mt, i) => mesh.setMatrixAt(i, mt));
          mesh.instanceMatrix.needsUpdate = true;
          mesh.computeBoundingSphere();
        }}
      />
      <B s={[5.0, 0.08, 0.3]} p={[-12.4, 4.02, 10.4]} m={m.frame} />
      <B s={[5.0, 0.08, 0.3]} p={[-12.4, 7.38, 10.4]} m={m.frame} />
    </group>
  );
}

/** Frisos de LED sob os beirais e arandelas de facho na fachada. */
function FacadeLights({ visible }: { visible: boolean }) {
  const m = useMaterials();
  return (
    <group visible={visible}>
      <B s={[28.4, 0.03, 0.05]} p={[-10.3, 7.39, 11.7]} m={m.led} shadow={false} />
      <B s={[17.8, 0.03, 0.05]} p={[12.7, 7.39, -12.6]} m={m.led} shadow={false} />
      <B s={[0.05, 0.03, 12.8]} p={[21.6, 7.39, -6.2]} m={m.led} shadow={false} />
      <B s={[28.4, 0.03, 0.05]} p={[-10.3, 7.39, -10.6]} m={m.led} shadow={false} />
      {/* arandelas de facho no travertino do cinema */}
      {[13.5, 16, 18.5].map((x) => (
        <group key={x}>
          <B s={[0.12, 0.3, 0.12]} p={[x, 3.0, 10.25]} m={m.frame} />
          <B s={[0.1, 0.02, 0.1]} p={[x, 2.85, 10.25]} m={m.led} shadow={false} />
        </group>
      ))}
    </group>
  );
}

/** Pérgola de concreto sobre a área gourmet, com pilares de aço e forro de teca. */
function Gourmet() {
  const m = useMaterials();
  const x0 = -24.4;
  const x1 = -6.5;
  const z0 = -23.4;
  const z1 = -16.6;
  return (
    <group name="Gourmet">
      <B s={[x1 - x0, 0.32, z1 - z0]} p={[(x0 + x1) / 2, 3.36, (z0 + z1) / 2]} m={m.concreteWhite} tile={TILE.concrete} />
      <B s={[x1 - x0 - 0.4, 0.02, z1 - z0 - 0.4]} p={[(x0 + x1) / 2, 3.19, (z0 + z1) / 2]} m={m.teak} tile={TILE.teak} />
      {[
        [x1 - 0.4, z0 + 0.4],
        [x1 - 0.4, z1 - 0.4],
        [-15.5, z0 + 0.4],
        [-15.5, z1 - 0.4],
      ].map(([x, z], i) => (
        <B key={i} s={[0.16, 3.2, 0.16]} p={[x, 1.6, z]} m={m.frame} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[x0 + 2 + i * 3, 3.17, (z0 + z1) / 2]} rotation={[Math.PI / 2, 0, 0]} material={m.led}>
          <circleGeometry args={[0.07, 16]} />
        </mesh>
      ))}
      {/* pendentes sobre a mesa */}
      {[-18, -17, -16].map((x) => (
        <group key={x}>
          <Cyl rt={0.004} h={1.2} p={[x, 2.6, -20]} m={m.blackMetal} seg={4} shadow={false} />
          <Cyl rt={0.03} rb={0.18} h={0.2} p={[x, 1.9, -20]} m={m.brass} seg={22} shadow={false} />
          <Cyl rt={0.16} h={0.01} p={[x, 1.79, -20]} m={m.led} seg={22} shadow={false} />
        </group>
      ))}
    </group>
  );
}

/** Cobertura: platibanda, seixos, casa de máquinas discreta e placas solares. */
function RoofDetails({ visible }: { visible: boolean }) {
  const m = useMaterials();
  const gravel = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b7b2a8', roughness: 1, normalMap: m.grass.normalMap, normalScale: new THREE.Vector2(0.6, 0.6) }), [m]);
  return (
    <group visible={visible}>
      <B s={[27.6, 0.04, 21.4]} p={[-10.3, 7.87, 0.6]} m={gravel} tile={1.5} />
      <B s={[17.0, 0.04, 12.2]} p={[12.7, 8.07, -6.25]} m={gravel} tile={1.5} />
      {Array.from({ length: 4 }, (_, r) =>
        Array.from({ length: 6 }, (_, c) => (
          <group key={`${r}${c}`} position={[-22 + c * 2.1, 8.15, -7 + r * 1.3]} rotation={[-0.18, 0, 0]}>
            <B s={[2.0, 0.04, 1.2]} p={[0, 0, 0]} m={m.glassTinted} />
            <B s={[2.04, 0.03, 1.24]} p={[0, -0.03, 0]} m={m.aluminum} />
          </group>
        )),
      )}
      <B s={[3.2, 1.2, 2.2]} p={[-2, 8.45, 6.5]} m={m.concrete} tile={TILE.concrete} />
    </group>
  );
}
