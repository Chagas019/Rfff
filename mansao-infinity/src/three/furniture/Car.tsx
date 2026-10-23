import { useMemo } from 'react';
import * as THREE from 'three';
import { useMaterials } from '../../materials/library';
import { B, Cyl, cylGeo } from './primitives';
import type { PieceProps } from './seating';

const PAINT: Record<string, { color: string; metal: number; rough: number }> = {
  black: { color: '#0b0c0e', metal: 0.6, rough: 0.28 },
  white: { color: '#e9e8e4', metal: 0.2, rough: 0.3 },
  silver: { color: '#9aa0a6', metal: 0.85, rough: 0.3 },
  green: { color: '#1f3b30', metal: 0.7, rough: 0.28 },
};

const paintCache = new Map<string, THREE.MeshPhysicalMaterial>();
function paint(v: string) {
  let mm = paintCache.get(v);
  if (!mm) {
    const p = PAINT[v] ?? PAINT.black;
    mm = new THREE.MeshPhysicalMaterial({ color: p.color, metalness: p.metal, roughness: p.rough, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.3 });
    paintCache.set(v, mm);
  }
  return mm;
}

let carGeo: { body: THREE.BufferGeometry; cabin: THREE.BufferGeometry } | null = null;

/** Perfil lateral de um GT de quatro portas (comprimento no eixo z, frente em +z), com caixas de roda recortadas. */
function carGeometry() {
  if (carGeo) return carGeo;
  const W = 1.9;
  const WR = 0.42; // raio da caixa de roda
  const AX = [-1.42, 1.48]; // eixos traseiro e dianteiro
  const body = new THREE.Shape();
  body.moveTo(-2.3, 0.3);
  // traseira: para-choque arredondado e tampa do porta-malas
  body.bezierCurveTo(-2.42, 0.36, -2.44, 0.62, -2.36, 0.78);
  body.bezierCurveTo(-2.3, 0.9, -2.1, 0.95, -1.8, 0.96);
  body.lineTo(1.0, 0.95);
  // capô descendo até o bico
  body.bezierCurveTo(1.55, 0.92, 2.05, 0.84, 2.3, 0.7);
  body.bezierCurveTo(2.43, 0.62, 2.44, 0.42, 2.36, 0.33);
  body.lineTo(AX[1] + WR + 0.04, 0.3);
  // caixa de roda dianteira
  body.absarc(AX[1], 0.36, WR, 0.05, Math.PI - 0.05, false);
  body.lineTo(AX[0] + WR + 0.04, 0.3);
  // caixa de roda traseira
  body.absarc(AX[0], 0.36, WR, 0.05, Math.PI - 0.05, false);
  body.lineTo(-2.3, 0.3);
  const bodyG = new THREE.ExtrudeGeometry(body, { depth: W - 0.2, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.09, bevelSegments: 6, curveSegments: 20 });
  bodyG.translate(0, 0, -(W - 0.2) / 2);
  bodyG.rotateY(-Math.PI / 2);
  const cab = new THREE.Shape();
  cab.moveTo(-1.62, 0.95);
  cab.bezierCurveTo(-1.2, 1.12, -0.95, 1.3, -0.55, 1.33);
  cab.lineTo(0.2, 1.34);
  cab.bezierCurveTo(0.55, 1.32, 0.8, 1.15, 1.08, 0.96);
  cab.lineTo(-1.62, 0.95);
  const cabG = new THREE.ExtrudeGeometry(cab, { depth: W - 0.56, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 5, curveSegments: 16 });
  cabG.translate(0, 0, -(W - 0.56) / 2);
  cabG.rotateY(-Math.PI / 2);
  carGeo = { body: bodyG, cabin: cabG };
  return carGeo;
}

/** Roda com pneu, aro de liga leve de cinco raios e pinça de freio. */
function Wheel({ x, z }: { x: number; z: number }) {
  const m = useMaterials();
  const side = Math.sign(x);
  return (
    <group position={[x, 0.36, z]} rotation={[0, 0, Math.PI / 2]}>
      <mesh geometry={cylGeo(0.36, 0.36, 0.26, 32)} material={m.tire} castShadow />
      <mesh geometry={cylGeo(0.25, 0.25, 0.02, 28)} material={m.aluminum} position={[0, -side * 0.125, 0]} />
      {Array.from({ length: 5 }, (_, i) => (
        <B key={i} s={[0.05, 0.02, 0.44]} p={[0, -side * 0.135, 0]} r={[0, (i / 5) * Math.PI, 0]} m={m.chrome} shadow={false} />
      ))}
      <Cyl rt={0.05} h={0.03} p={[0, -side * 0.14, 0]} m={m.blackMetal} seg={12} />
      <B s={[0.1, 0.04, 0.16]} p={[0.12, -side * 0.1, 0.05]} m={m.terracotta} shadow={false} />
    </group>
  );
}

/** Carro de luxo procedural (escala 1:1, 4,75 m). */
export function Car({ item }: PieceProps) {
  const m = useMaterials();
  const g = useMemo(() => carGeometry(), []);
  const mat = paint(item.variant ?? 'black');
  return (
    <group>
      <mesh geometry={g.body} material={mat} castShadow receiveShadow />
      <mesh geometry={g.cabin} material={m.glassTinted} castShadow />
      <B s={[1.7, 0.08, 4.4]} p={[0, 0.3, 0]} m={m.plasticDark} />
      {[
        [-0.84, 1.48],
        [0.84, 1.48],
        [-0.84, -1.42],
        [0.84, -1.42],
      ].map(([x, z]) => (
        <Wheel key={`${x}${z}`} x={x} z={z} />
      ))}
      {/* faróis e lanternas */}
      <B s={[0.5, 0.05, 0.04]} p={[-0.55, 0.72, 2.36]} m={m.chrome} shadow={false} />
      <B s={[0.5, 0.05, 0.04]} p={[0.55, 0.72, 2.36]} m={m.chrome} shadow={false} />
      <B s={[1.6, 0.04, 0.04]} p={[0, 0.84, -2.32]} m={m.terracotta} shadow={false} />
      {/* grade, retrovisores e maçanetas */}
      <B s={[0.8, 0.14, 0.03]} p={[0, 0.48, 2.38]} m={m.blackMetal} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <B s={[0.16, 0.08, 0.1]} p={[s * 1.0, 1.0, 0.85]} m={mat} />
          <B s={[0.02, 0.025, 0.14]} p={[s * 0.97, 0.84, 0.2]} m={m.chrome} shadow={false} />
          <B s={[0.02, 0.025, 0.14]} p={[s * 0.97, 0.84, -0.75]} m={m.chrome} shadow={false} />
        </group>
      ))}
    </group>
  );
}
