import { useMemo } from 'react';
import * as THREE from 'three';
import { TILE, useMaterials, roomLedMaterial, roomShadeMaterial, type Materials } from '../../materials/library';
import { B, Cyl, RB, Sph, cylGeo } from './primitives';
import type { PieceProps } from './seating';

const bedFabric = (m: Materials, v?: string) =>
  ({ sage: m.sage, terracotta: m.terracotta, petrol: m.petrol, sand: m.sand, king: m.boucle } as Record<string, THREE.Material>)[v ?? ''] ?? m.linen;

/**
 * Cama com base estofada, colchão, edredom com dobra, manta nos pés,
 * travesseiros e cabeceira. A king tem cabeceira de parede com gomos.
 */
export function Bed({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  const king = item.variant === 'king';
  const accent = bedFabric(m, item.variant);
  const t = TILE.linen;
  const pillows = king ? [-0.62, 0, 0.62] : [-0.38, 0.38];
  return (
    <group>
      <B s={[w + 0.06, 0.06, d - 0.1]} p={[0, 0.03, 0]} m={m.blackMetal} />
      <RB s={[w + 0.12, 0.28, d + 0.04]} p={[0, 0.2, 0.02]} m={king ? m.charcoalFabric : accent} radius={0.04} tile={t} />
      <RB s={[w, 0.24, d - 0.06]} p={[0, 0.45, 0.02]} m={m.linenWhite} radius={0.06} tile={t} seg={4} />
      {/* edredom com volume e a dobra superior */}
      <RB s={[w + 0.06, 0.08, d * 0.68]} p={[0, 0.6, d * 0.15]} m={m.linenWhite} radius={0.04} tile={t} seg={4} />
      <RB s={[w + 0.07, 0.07, 0.32]} p={[0, 0.615, d * 0.15 - d * 0.34 + 0.14]} m={m.linenWhite} radius={0.03} tile={t} seg={4} />
      <RB s={[w + 0.1, 0.07, 0.55]} p={[0, 0.655, d / 2 - 0.36]} m={accent} radius={0.03} tile={t} />
      {pillows.map((x, i) => (
        <group key={i}>
          <RB s={[king ? 0.6 : 0.66, 0.17, 0.42]} p={[x, 0.66, -d / 2 + 0.3]} r={[-0.5, 0, 0]} m={m.linenWhite} radius={0.08} tile={t} seg={4} />
          <RB s={[0.42, 0.36, 0.12]} p={[x * 0.9, 0.78, -d / 2 + 0.52]} r={[-0.3, 0, 0]} m={i % 2 ? accent : m.boucle} radius={0.05} tile={t} seg={3} />
        </group>
      ))}
      {king ? (
        <group position={[0, 0, -d / 2 - 0.07]}>
          {Array.from({ length: 11 }, (_, i) => (
            <RB key={i} s={[0.38, 1.3, 0.1]} p={[-1.9 + i * 0.38, 0.95, 0]} m={m.boucle} radius={0.045} tile={TILE.boucle} seg={3} />
          ))}
          <B s={[4.4, 0.04, 0.16]} p={[0, 1.62, 0.02]} m={m.walnut} tile={TILE.walnut} />
          {/* luminárias pendentes dos dois lados */}
          {[-1.45, 1.45].map((x) => (
            <group key={x}>
              <Cyl rt={0.003} h={1.0} p={[x, 2.45, 0.35]} m={m.blackMetal} seg={4} />
              <Sph radius={0.12} p={[x, 1.85, 0.35]} m={roomShadeMaterial(item.room)} shadow={false} />
            </group>
          ))}
        </group>
      ) : (
        <>
          <RB s={[w + 0.3, 1.05, 0.1]} p={[0, 0.72, -d / 2 - 0.05]} m={accent} radius={0.04} tile={t} />
          {/* painel ripado de destaque na parede da cabeceira */}
          <B s={[w + 1.6, 2.5, 0.03]} p={[0, 1.25, -d / 2 - 0.13]} m={m.fluted} tile={TILE.fluted} />
          <B s={[w + 1.6, 0.012, 0.02]} p={[0, 2.49, -d / 2 - 0.1]} m={roomLedMaterial(item.room)} shadow={false} />
        </>
      )}
    </group>
  );
}

/** Tapete com espessura real e textura de fibras. */
export function Rug({ item }: PieceProps) {
  const m = useMaterials();
  const geo = useMemo(() => new THREE.BoxGeometry(item.w, 0.014, item.d), [item.w, item.d]);
  return <mesh geometry={geo} material={item.variant === 'outdoor' ? m.rugOutdoor : m.rug} position={[0, 0.007, 0]} receiveShadow />;
}

/** Folhagem em cartões cruzados (atlas de folhas com transparência). */
export function Foliage({ h, r, count = 4, y = 0, seed = 0 }: { h: number; r: number; count?: number; y?: number; seed?: number }) {
  const m = useMaterials();
  const geos = useMemo(() => {
    const out: { g: THREE.BufferGeometry; rot: number; tilt: number }[] = [];
    for (let i = 0; i < count; i++) {
      const g = new THREE.PlaneGeometry(r * 2, h);
      const q = (i + seed) % 4;
      const uv = g.getAttribute('uv') as THREE.BufferAttribute;
      for (let k = 0; k < uv.count; k++) uv.setXY(k, (q % 2) * 0.5 + uv.getX(k) * 0.5, (1 - Math.floor(q / 2)) * 0.5 + uv.getY(k) * 0.5);
      out.push({ g, rot: (i / count) * Math.PI + seed * 0.3, tilt: ((i % 3) - 1) * 0.12 });
    }
    return out;
  }, [h, r, count, seed]);
  return (
    <group position={[0, y + h / 2, 0]}>
      {geos.map(({ g, rot, tilt }, i) => (
        <mesh key={i} geometry={g} material={m.leaves} rotation={[tilt, rot, 0]} castShadow />
      ))}
    </group>
  );
}

/** Vaso com planta: cachepô em pedra, terra e folhagem; plantas altas ganham tronco. */
export function Plant({ item }: PieceProps) {
  const m = useMaterials();
  const H = item.h ?? 1.5;
  const r = Math.min(item.w, item.d) / 2;
  const potH = Math.min(0.55, H * 0.28);
  const tall = H > 1.8;
  return (
    <group>
      <Cyl rt={r * 0.85} rb={r * 0.7} h={potH} p={[0, potH / 2, 0]} m={tall ? m.stoneDark : m.concrete} seg={28} />
      <Cyl rt={r * 0.8} h={0.02} p={[0, potH - 0.01, 0]} m={m.soil} seg={20} />
      {tall && <Cyl rt={0.03} rb={0.045} h={H * 0.55} p={[0, potH + H * 0.27, 0]} m={m.bark} seg={8} />}
      <Foliage h={tall ? H * 0.6 : H - potH} r={tall ? r * 1.4 : r * 1.2} y={tall ? H * 0.4 : potH - 0.05} count={tall ? 5 : 4} seed={Math.round(item.x * 7 + item.z * 3)} />
    </group>
  );
}

/** Luminária de piso em arco (base de mármore, haste de aço e cúpula). */
export function FloorLamp({ item }: PieceProps) {
  const m = useMaterials();
  const arc = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0.1, 0), new THREE.Vector3(0, 2.4, 0.4), new THREE.Vector3(0, 1.85, 1.3));
    return new THREE.TubeGeometry(curve, 32, 0.012, 8, false);
  }, []);
  return (
    <group rotation={[0, Math.PI, 0]}>
      <RB s={[0.34, 0.12, 0.26]} p={[0, 0.06, 0]} m={m.marble} radius={0.02} tile={TILE.marble} />
      <mesh geometry={arc} material={m.steel} castShadow />
      <mesh geometry={cylGeo(0.06, 0.24, 0.2, 28, true)} material={roomShadeMaterial(item.room)} position={[0, 1.76, 1.3]} />
      <Sph radius={0.035} p={[0, 1.72, 1.3]} m={m.led} shadow={false} />
    </group>
  );
}

/** Piano de cauda em laca preta: caixa em curva, tampa aberta, teclado e banqueta. */
export function Piano() {
  const m = useMaterials();
  const black = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#08080a', roughness: 0.12, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.08 }), []);
  const { body, lid } = useMemo(() => {
    // contorno visto de cima (x = largura 1,5 m, y = comprimento 2,0 m), teclado em y = 0
    const s = new THREE.Shape();
    s.moveTo(-0.75, 0);
    s.lineTo(0.75, 0);
    s.lineTo(0.75, 0.55);
    s.bezierCurveTo(0.75, 1.3, 0.1, 1.15, 0.05, 1.7);
    s.bezierCurveTo(0.02, 2.05, -0.6, 2.1, -0.75, 1.75);
    s.lineTo(-0.75, 0);
    const bodyG = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2, curveSegments: 24 });
    const lidG = new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: false, curveSegments: 24 });
    return { body: bodyG, lid: lidG };
  }, []);
  return (
    <group position={[0, 0, 0.58]}>
      {/* caixa: a forma (vista de cima) é extrudada para cima; o comprimento segue para −z */}
      <mesh geometry={body} material={black} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.62, 0]} castShadow receiveShadow />
      <group position={[-0.75, 0.93, 0]} rotation={[0, 0, 0.62]}>
        <mesh geometry={lid} material={black} position={[0.75, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow />
      </group>
      <Cyl rt={0.01} h={0.95} p={[0.5, 1.3, -1.0]} r={[0, 0, -0.35]} m={m.brass} seg={6} />
      {[
        [-0.6, -0.15],
        [0.6, -0.15],
        [-0.3, -1.8],
      ].map(([x, z], i) => (
        <Cyl key={i} rt={0.05} rb={0.035} h={0.62} p={[x, 0.31, z]} m={black} seg={14} />
      ))}
      {/* teclado */}
      <B s={[1.42, 0.12, 0.3]} p={[0, 0.7, 0.14]} m={black} />
      <B s={[1.3, 0.025, 0.16]} p={[0, 0.77, 0.2]} m={m.ceramic} />
      {Array.from({ length: 36 }, (_, i) => (i % 7 === 2 || i % 7 === 6 ? null : <B key={i} s={[0.012, 0.018, 0.09]} p={[-0.63 + i * 0.036, 0.79, 0.16]} m={black} shadow={false} />))}
      <B s={[0.7, 0.24, 0.02]} p={[0, 0.92, 0.04]} r={[-0.25, 0, 0]} m={black} />
      {/* banqueta */}
      <RB s={[0.8, 0.08, 0.36]} p={[0, 0.5, 0.75]} m={m.leatherDark} radius={0.02} />
      {[-0.34, 0.34].map((x) => (
        <B key={x} s={[0.05, 0.46, 0.3]} p={[x, 0.23, 0.75]} m={black} />
      ))}
    </group>
  );
}

/** Jardineira de concreto com arbustos. */
export function Planter({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  const n = Math.max(1, Math.round(Math.max(w, d) / 0.9));
  const along = w >= d;
  return (
    <group>
      <B s={[w, 0.5, d]} p={[0, 0.25, 0]} m={m.concrete} tile={TILE.concrete} />
      <B s={[w - 0.1, 0.02, d - 0.1]} p={[0, 0.49, 0]} m={m.soil} />
      {Array.from({ length: n }, (_, i) => {
        const t = -0.5 + (i + 0.5) / n;
        return (
          <group key={i} position={along ? [t * w, 0.45, 0] : [0, 0.45, t * d]}>
            <Foliage h={0.7 + (i % 3) * 0.2} r={0.45} count={3} seed={i} />
          </group>
        );
      })}
    </group>
  );
}

/** Ombrelone de piscina. */
export function Umbrella({ item }: PieceProps) {
  const m = useMaterials();
  const r = item.w / 2;
  return (
    <group>
      <Cyl rt={0.03} h={2.5} p={[0, 1.05, 0]} m={m.teak} seg={10} />
      <mesh geometry={cylGeo(0.02, r, 0.45, 8, true)} material={m.linenWhite} position={[0, 2.3, 0]} castShadow />
      <Cyl rt={0.25} h={0.08} p={[0, -0.26, 0]} m={m.stoneDark} />
    </group>
  );
}

/** Spa aquecido com borda de concreto e água iluminada. */
export function Spa({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  return (
    <group>
      <RB s={[w, 0.55, d]} p={[0, 0.275, 0]} m={m.concreteWhite} radius={0.05} tile={TILE.concrete} />
      <RB s={[w - 0.3, 0.02, d - 0.3]} p={[0, 0.5, 0]} m={m.water} radius={0.04} shadow={false} />
      <B s={[0.6, 0.25, 0.4]} p={[0, 0.125, d / 2 + 0.2]} m={m.concreteWhite} tile={TILE.concrete} />
    </group>
  );
}

/** Ducha externa em aço inox. */
export function OutdoorShower() {
  const m = useMaterials();
  return (
    <group>
      <B s={[0.6, 0.03, 0.6]} p={[0, 0.015, 0]} m={m.teak} />
      <B s={[0.08, 2.3, 0.08]} p={[0, 1.15, -0.2]} m={m.steel} />
      <B s={[0.06, 0.04, 0.4]} p={[0, 2.28, 0]} m={m.steel} />
      <Cyl rt={0.12} h={0.02} p={[0, 2.25, 0.18]} m={m.steel} seg={24} />
    </group>
  );
}

/** Degrau (praticável) das poltronas do fundo do cinema, com LED de marcação. */
export function CinemaRiser({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  return (
    <group>
      <B s={[w, 0.4, d]} p={[0, 0.2, 0]} m={m.carpet} tile={1.2} />
      <B s={[w, 0.015, 0.015]} p={[0, 0.39, d / 2 + 0.005]} m={m.led} shadow={false} />
    </group>
  );
}
