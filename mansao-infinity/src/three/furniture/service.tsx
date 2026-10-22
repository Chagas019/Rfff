import { useMemo } from 'react';
import * as THREE from 'three';
import { TILE, useMaterials } from '../../materials/library';
import { B, Cyl, torusGeo } from './primitives';
import type { PieceProps } from './seating';

/** Lavadora ou secadora de abertura frontal. */
export function Washer({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  return (
    <group>
      <B s={[w, 0.85, d]} p={[0, 0.425, 0]} m={m.lacquerWhite} />
      <B s={[w - 0.04, 0.1, 0.01]} p={[0, 0.77, d / 2 + 0.005]} m={m.plasticDark} />
      <mesh geometry={torusGeo(0.2, 0.03, 10, 32)} material={m.aluminum} position={[0, 0.42, d / 2 + 0.02]} castShadow />
      <Cyl rt={0.19} h={0.02} p={[0, 0.42, d / 2 + 0.015]} r={[Math.PI / 2, 0, 0]} m={item.variant === 'dryer' ? m.glassTinted : m.glass} seg={32} shadow={false} />
    </group>
  );
}

/** Boiler de aquecimento (reservatório vertical) com tubulações. */
export function Boiler() {
  const m = useMaterials();
  return (
    <group>
      <Cyl rt={0.3} h={1.9} p={[0, 0.95, 0]} m={m.lacquerWhite} seg={28} />
      <Cyl rt={0.31} h={0.04} p={[0, 1.9, 0]} m={m.aluminum} seg={28} />
      <Cyl rt={0.025} h={1.2} p={[0.15, 2.5, 0]} m={m.steel} seg={10} />
      <Cyl rt={0.025} h={1.2} p={[-0.15, 2.5, 0]} m={m.steel} seg={10} />
      <B s={[0.12, 0.12, 0.03]} p={[0, 1.2, 0.3]} m={m.plasticDark} />
    </group>
  );
}

/** Bicicleta estilizada (quadro, rodas e guidão). */
function Bike({ color }: { color: THREE.Material }) {
  const m = useMaterials();
  return (
    <group>
      {[-0.52, 0.52].map((z) => (
        <group key={z}>
          <mesh geometry={torusGeo(0.34, 0.02, 8, 36)} material={m.rubber} position={[0, 0.36, z]} rotation={[0, Math.PI / 2, 0]} castShadow />
          <mesh geometry={torusGeo(0.3, 0.006, 4, 30)} material={m.aluminum} position={[0, 0.36, z]} rotation={[0, Math.PI / 2, 0]} />
        </group>
      ))}
      <B s={[0.03, 0.03, 0.62]} p={[0, 0.58, 0.02]} r={[-0.08, 0, 0]} m={color} />
      <B s={[0.03, 0.5, 0.03]} p={[0, 0.58, -0.18]} r={[0.35, 0, 0]} m={color} />
      <B s={[0.03, 0.45, 0.03]} p={[0, 0.58, 0.4]} r={[-0.3, 0, 0]} m={color} />
      <B s={[0.12, 0.03, 0.24]} p={[0, 0.86, -0.28]} m={m.leatherDark} />
      <B s={[0.5, 0.025, 0.025]} p={[0, 0.9, 0.42]} m={m.blackMetal} />
    </group>
  );
}

/** Suporte de parede com duas bicicletas e prateleira de equipamentos. */
export function BikeRack({ item }: PieceProps) {
  const m = useMaterials();
  const red = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8f1f1f', roughness: 0.35, metalness: 0.4 }), []);
  const { w } = item;
  return (
    <group>
      <B s={[w + 0.4, 0.04, 0.05]} p={[0, 1.8, -0.2]} m={m.blackMetal} />
      <group position={[-0.55, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Bike color={red} />
      </group>
      <group position={[0.55, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Bike color={m.blackMetal} />
      </group>
      <B s={[w + 0.6, 0.03, 0.35]} p={[0, 2.05, -0.1]} m={m.oak} tile={TILE.oak} />
      <Cyl rt={0.12} h={0.25} p={[-0.6, 2.2, -0.1]} m={m.lacquerSand} />
      <B s={[0.5, 0.3, 0.3]} p={[0.4, 2.22, -0.1]} m={m.charcoalFabric} />
    </group>
  );
}

/** Churrasqueira gourmet: bancada em granito, grelha em inox com coifa e cuba. */
export function Bbq({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  return (
    <group>
      <B s={[w, 0.88, d]} p={[0, 0.44, 0]} m={m.stoneDark} tile={TILE.stoneDark} />
      <B s={[w + 0.04, 0.05, d + 0.04]} p={[0, 0.905, 0]} m={m.stoneDark} tile={TILE.stoneDark} />
      {Array.from({ length: Math.round(w / 0.7) }, (_, i) => (
        <B key={i} s={[0.55, 0.7, 0.02]} p={[-w / 2 + 0.35 + i * 0.7, 0.45, d / 2 + 0.005]} m={m.teak} tile={TILE.teak} />
      ))}
      {/* grelha */}
      <B s={[1.0, 0.04, 0.6]} p={[-w / 4, 0.95, 0]} m={m.steel} />
      {Array.from({ length: 12 }, (_, i) => (
        <B key={`g${i}`} s={[0.008, 0.012, 0.56]} p={[-w / 4 - 0.45 + i * 0.082, 0.976, 0]} m={m.blackMetal} shadow={false} />
      ))}
      <B s={[1.1, 0.5, 0.65]} p={[-w / 4, 1.8, -d / 2 + 0.34]} m={m.steel} />
      <B s={[0.4, 1.2, 0.4]} p={[-w / 4, 2.65, -d / 2 + 0.25]} m={m.steel} />
      {/* cuba */}
      <B s={[0.55, 0.004, 0.4]} p={[w / 4, 0.932, 0]} m={m.steel} />
      <Cyl rt={0.016} h={0.32} p={[w / 4, 1.09, -d / 2 + 0.1]} m={m.chrome} seg={10} />
      {/* parede de fundo em travertino */}
      <B s={[w, 1.4, 0.06]} p={[0, 1.6, -d / 2 - 0.03]} m={m.travertine} tile={TILE.travertine} />
    </group>
  );
}
