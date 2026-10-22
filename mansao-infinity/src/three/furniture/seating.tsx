import * as THREE from 'three';
import type { FurnitureItem } from '../../data/furniture';
import { TILE, useMaterials, type Materials } from '../../materials/library';
import { B, Cyl, RB, torusGeo } from './primitives';

export interface PieceProps {
  item: FurnitureItem;
}

const fabricFor = (m: Materials, variant?: string): THREE.Material => {
  switch (variant) {
    case 'boucle':
      return m.boucle;
    case 'leather':
      return m.leather;
    case 'velvet':
      return m.velvet;
    case 'linen':
    default:
      return m.linen;
  }
};

/** Sofá contemporâneo de base recuada: plataforma, almofadas soltas e braços largos. */
export function Sofa({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  const fab = fabricFor(m, item.variant);
  const arm = 0.22;
  const n = w > 2.8 ? 3 : 2;
  const cw = (w - arm * 2) / n;
  const t = TILE.linen;
  return (
    <group>
      <B s={[w - 0.12, 0.08, d - 0.12]} p={[0, 0.04, 0]} m={m.lacquerGraphite} />
      <RB s={[w, 0.22, d]} p={[0, 0.19, 0]} m={fab} radius={0.05} tile={t} />
      {Array.from({ length: n }, (_, i) => (
        <RB key={`s${i}`} s={[cw - 0.015, 0.17, d - 0.3]} p={[-w / 2 + arm + cw * (i + 0.5), 0.385, 0.12]} m={fab} radius={0.07} tile={t} seg={4} />
      ))}
      <RB s={[w, 0.4, 0.2]} p={[0, 0.5, -d / 2 + 0.1]} m={fab} radius={0.06} tile={t} />
      {Array.from({ length: n }, (_, i) => (
        <RB key={`b${i}`} s={[cw - 0.02, 0.44, 0.2]} p={[-w / 2 + arm + cw * (i + 0.5), 0.62, -d / 2 + 0.29]} r={[-0.16, 0, 0]} m={fab} radius={0.08} tile={t} seg={4} />
      ))}
      <RB s={[arm, 0.58, d]} p={[-w / 2 + arm / 2, 0.37, 0]} m={fab} radius={0.07} tile={t} />
      <RB s={[arm, 0.58, d]} p={[w / 2 - arm / 2, 0.37, 0]} m={fab} radius={0.07} tile={t} />
      <RB s={[0.46, 0.44, 0.14]} p={[-w / 2 + arm + 0.32, 0.7, -d / 2 + 0.42]} r={[-0.2, 0.25, 0.05]} m={m.terracotta} radius={0.06} tile={t} seg={4} />
      <RB s={[0.46, 0.44, 0.14]} p={[w / 2 - arm - 0.32, 0.7, -d / 2 + 0.42]} r={[-0.2, -0.3, -0.04]} m={m.charcoalFabric} radius={0.06} tile={t} seg={4} />
    </group>
  );
}

/** Poltrona estofada de linhas curvas. */
export function Armchair({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  const fab = fabricFor(m, item.variant);
  const t = TILE.boucle;
  return (
    <group>
      <RB s={[w, 0.4, d]} p={[0, 0.2, 0]} m={fab} radius={0.14} tile={t} seg={5} />
      <RB s={[w - 0.16, 0.12, d - 0.2]} p={[0, 0.44, 0.06]} m={fab} radius={0.06} tile={t} seg={4} />
      <RB s={[w, 0.46, 0.18]} p={[0, 0.6, -d / 2 + 0.09]} r={[-0.1, 0, 0]} m={fab} radius={0.08} tile={t} seg={4} />
      <RB s={[0.14, 0.26, d - 0.1]} p={[-w / 2 + 0.07, 0.52, 0.02]} m={fab} radius={0.06} tile={t} />
      <RB s={[0.14, 0.26, d - 0.1]} p={[w / 2 - 0.07, 0.52, 0.02]} m={fab} radius={0.06} tile={t} />
    </group>
  );
}

/** Poltrona lounge com concha em nogueira e almofadas de couro, base giratória. */
export function LoungeChair({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  const fab = item.variant === 'boucle' ? m.boucle : m.leatherDark;
  return (
    <group>
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return <B key={i} s={[0.04, 0.03, 0.36]} p={[Math.sin(a) * 0.17, 0.04, Math.cos(a) * 0.17]} r={[0, a, 0]} m={m.blackMetal} />;
      })}
      <Cyl rt={0.03} h={0.26} p={[0, 0.17, 0]} m={m.blackMetal} />
      <group position={[0, 0.34, 0.04]} rotation={[-0.1, 0, 0]}>
        <RB s={[w * 0.92, 0.06, d * 0.72]} p={[0, 0, 0]} m={m.walnut} radius={0.03} />
        <RB s={[w * 0.86, 0.12, d * 0.66]} p={[0, 0.08, 0.01]} m={fab} radius={0.05} seg={4} />
      </group>
      <group position={[0, 0.66, -d / 2 + 0.12]} rotation={[-0.32, 0, 0]}>
        <RB s={[w * 0.92, 0.62, 0.06]} p={[0, 0, -0.04]} m={m.walnut} radius={0.03} />
        <RB s={[w * 0.86, 0.56, 0.12]} p={[0, 0, 0.04]} m={fab} radius={0.05} seg={4} />
      </group>
      <RB s={[0.08, 0.05, d * 0.6]} p={[-w / 2 + 0.03, 0.55, 0.02]} m={m.walnut} radius={0.02} />
      <RB s={[0.08, 0.05, d * 0.6]} p={[w / 2 - 0.03, 0.55, 0.02]} m={m.walnut} radius={0.02} />
    </group>
  );
}

/** Cadeira de jantar estofada com pés cônicos em nogueira. */
export function DiningChair({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  const legs: [number, number][] = [
    [-w / 2 + 0.05, -d / 2 + 0.06],
    [w / 2 - 0.05, -d / 2 + 0.06],
    [-w / 2 + 0.05, d / 2 - 0.05],
    [w / 2 - 0.05, d / 2 - 0.05],
  ];
  return (
    <group>
      {legs.map(([x, z], i) => (
        <Cyl key={i} rt={0.018} rb={0.012} h={0.42} p={[x, 0.21, z]} m={m.walnut} seg={10} />
      ))}
      <RB s={[w, 0.09, d - 0.04]} p={[0, 0.465, 0.01]} m={m.linen} radius={0.035} tile={TILE.linen} />
      <RB s={[w, 0.52, 0.07]} p={[0, 0.79, -d / 2 + 0.04]} r={[-0.1, 0, 0]} m={m.linen} radius={0.03} tile={TILE.linen} />
      <B s={[w - 0.04, 0.03, 0.03]} p={[0, 0.4, -d / 2 + 0.06]} m={m.walnut} />
    </group>
  );
}

/** Banqueta alta da ilha: assento em couro e base em aço escovado. */
export function Stool() {
  const m = useMaterials();
  return (
    <group>
      <Cyl rt={0.2} h={0.012} p={[0, 0.006, 0]} m={m.steel} seg={28} />
      <Cyl rt={0.022} h={0.68} p={[0, 0.35, 0]} m={m.steel} seg={12} />
      <mesh geometry={torusGeo(0.16, 0.01, 8, 28)} material={m.steel} position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow />
      <RB s={[0.4, 0.07, 0.4]} p={[0, 0.72, 0]} m={m.leather} radius={0.03} />
      <RB s={[0.4, 0.16, 0.05]} p={[0, 0.82, -0.18]} r={[-0.15, 0, 0]} m={m.leather} radius={0.02} />
    </group>
  );
}

/** Cadeira de escritório executiva (ou simples, para os quartos). */
export function OfficeChair({ item }: PieceProps) {
  const m = useMaterials();
  const simple = item.variant === 'simple';
  const mat = simple ? m.boucle : m.leatherDark;
  if (simple) {
    return (
      <group>
        {[-1, 1].flatMap((sx) =>
          [-1, 1].map((sz) => <Cyl key={`${sx}${sz}`} rt={0.014} h={0.44} p={[sx * 0.2, 0.22, sz * 0.2]} m={m.brass} seg={8} />),
        )}
        <RB s={[0.48, 0.08, 0.46]} p={[0, 0.47, 0]} m={mat} radius={0.035} />
        <RB s={[0.48, 0.34, 0.06]} p={[0, 0.72, -0.21]} r={[-0.08, 0, 0]} m={mat} radius={0.03} />
      </group>
    );
  }
  return (
    <group>
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, a, 0]}>
            <B s={[0.04, 0.035, 0.32]} p={[0, 0.07, 0.16]} m={m.aluminum} />
            <Cyl rt={0.025} h={0.04} p={[0, 0.025, 0.31]} m={m.rubber} seg={10} />
          </group>
        );
      })}
      <Cyl rt={0.03} h={0.36} p={[0, 0.27, 0]} m={m.aluminum} seg={12} />
      <RB s={[0.56, 0.1, 0.52]} p={[0, 0.48, 0.02]} m={mat} radius={0.04} />
      <RB s={[0.54, 0.72, 0.08]} p={[0, 0.92, -0.24]} r={[-0.12, 0, 0]} m={mat} radius={0.04} seg={4} />
      <B s={[0.05, 0.03, 0.34]} p={[-0.3, 0.68, 0.0]} m={m.aluminum} />
      <B s={[0.05, 0.03, 0.34]} p={[0.3, 0.68, 0.0]} m={m.aluminum} />
      <B s={[0.03, 0.18, 0.03]} p={[-0.3, 0.59, -0.12]} m={m.aluminum} />
      <B s={[0.03, 0.18, 0.03]} p={[0.3, 0.59, -0.12]} m={m.aluminum} />
    </group>
  );
}

/** Poltrona reclinável do cinema, em veludo grafite com porta-copos. */
export function CinemaSeat({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  return (
    <group>
      <RB s={[w - 0.3, 0.42, d - 0.1]} p={[0, 0.21, 0.04]} m={m.velvet} radius={0.06} tile={TILE.velvet} />
      <RB s={[w - 0.3, 0.14, d - 0.3]} p={[0, 0.48, 0.12]} m={m.velvet} radius={0.06} tile={TILE.velvet} seg={4} />
      <RB s={[w - 0.28, 0.72, 0.26]} p={[0, 0.78, -d / 2 + 0.16]} r={[-0.22, 0, 0]} m={m.velvet} radius={0.08} tile={TILE.velvet} seg={4} />
      <RB s={[0.16, 0.62, d]} p={[-w / 2 + 0.08, 0.31, 0]} m={m.velvet} radius={0.05} tile={TILE.velvet} />
      <RB s={[0.16, 0.62, d]} p={[w / 2 - 0.08, 0.31, 0]} m={m.velvet} radius={0.05} tile={TILE.velvet} />
      <Cyl rt={0.04} h={0.02} p={[w / 2 - 0.08, 0.625, d / 2 - 0.14]} m={m.steel} seg={16} />
      <B s={[w - 0.3, 0.02, 0.02]} p={[0, 0.04, d / 2 - 0.02]} m={m.led} shadow={false} />
    </group>
  );
}

/** Sofá externo em teca com almofadas brancas (tecido náutico). */
export function OutdoorSofa({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  return (
    <group>
      <B s={[w, 0.3, d]} p={[0, 0.15, 0]} m={m.teak} tile={TILE.teak} />
      <RB s={[w - 0.1, 0.16, d - 0.2]} p={[0, 0.38, 0.06]} m={m.linenWhite} radius={0.05} tile={TILE.linen} />
      <B s={[w, 0.42, 0.08]} p={[0, 0.51, -d / 2 + 0.04]} m={m.teak} tile={TILE.teak} />
      <RB s={[w - 0.12, 0.38, 0.16]} p={[0, 0.62, -d / 2 + 0.17]} r={[-0.18, 0, 0]} m={m.linenWhite} radius={0.06} tile={TILE.linen} />
      <RB s={[0.42, 0.4, 0.13]} p={[-w / 2 + 0.4, 0.62, -d / 2 + 0.32]} r={[-0.2, 0.2, 0]} m={m.sage} radius={0.05} />
    </group>
  );
}

/** Cadeira externa (refeição) ou poltrona lounge externa. */
export function OutdoorChair({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  if (item.variant === 'lounge') {
    return (
      <group>
        <B s={[w, 0.24, d]} p={[0, 0.12, 0]} m={m.teak} />
        <RB s={[w - 0.08, 0.14, d - 0.12]} p={[0, 0.31, 0.04]} m={m.linenWhite} radius={0.05} />
        <RB s={[w - 0.08, 0.44, 0.14]} p={[0, 0.56, -d / 2 + 0.1]} r={[-0.2, 0, 0]} m={m.linenWhite} radius={0.05} />
      </group>
    );
  }
  return (
    <group>
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <B key={`${sx}${sz}`} s={[0.035, 0.44, 0.035]} p={[sx * (w / 2 - 0.03), 0.22, sz * (d / 2 - 0.03)]} m={m.teak} />))}
      <B s={[w, 0.03, d]} p={[0, 0.45, 0]} m={m.teak} />
      <RB s={[w - 0.04, 0.05, d - 0.06]} p={[0, 0.49, 0.02]} m={m.linenWhite} radius={0.02} />
      <B s={[w, 0.36, 0.03]} p={[0, 0.66, -d / 2 + 0.02]} r={[-0.12, 0, 0]} m={m.teak} />
    </group>
  );
}

/** Espreguiçadeira em teca com colchonete; variante "water" é uma peça única para a prainha. */
export function Sunbed({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  if (item.variant === 'water') {
    return (
      <group>
        <RB s={[w, 0.18, d * 0.62]} p={[0, 0.09, d * 0.17]} m={m.lacquerWhite} radius={0.06} />
        <RB s={[w, 0.16, d * 0.42]} p={[0, 0.25, -d * 0.26]} r={[0.42, 0, 0]} m={m.lacquerWhite} radius={0.06} />
      </group>
    );
  }
  return (
    <group>
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <B key={`${sx}${sz}`} s={[0.05, 0.22, 0.05]} p={[sx * (w / 2 - 0.04), 0.11, sz * (d / 2 - 0.08)]} m={m.teak} />))}
      {Array.from({ length: 9 }, (_, i) => (
        <B key={i} s={[w, 0.03, 0.12]} p={[0, 0.24, d / 2 - 0.1 - i * 0.135]} m={m.teak} />
      ))}
      <RB s={[w - 0.06, 0.08, d * 0.62]} p={[0, 0.3, d * 0.18]} m={m.linenWhite} radius={0.035} />
      <group position={[0, 0.3, -d * 0.18]} rotation={[0.55, 0, 0]}>
        <B s={[w, 0.03, d * 0.4]} p={[0, 0, -d * 0.2]} m={m.teak} />
        <RB s={[w - 0.06, 0.08, d * 0.38]} p={[0, 0.05, -d * 0.2]} m={m.linenWhite} radius={0.035} />
      </group>
      <RB s={[w * 0.7, 0.04, 0.4]} p={[0, 0.36, d / 2 - 0.4]} m={m.sand} radius={0.015} />
    </group>
  );
}

/** Banco: tampo maciço em nogueira sobre dois blocos de travertino. */
export function Bench({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  return (
    <group>
      <B s={[0.3, 0.4, d]} p={[-w / 2 + 0.25, 0.2, 0]} m={m.travertine} tile={TILE.travertine} />
      <B s={[0.3, 0.4, d]} p={[w / 2 - 0.25, 0.2, 0]} m={m.travertine} tile={TILE.travertine} />
      <RB s={[w, 0.06, d]} p={[0, 0.43, 0]} m={m.walnut} radius={0.01} tile={TILE.walnut} />
    </group>
  );
}
