import { useMemo } from 'react';
import { TILE, useMaterials, roomShadeMaterial } from '../../materials/library';
import { B, Cyl, RB, Sph } from './primitives';
import type { PieceProps } from './seating';

/** Livros empilhados e um objeto decorativo (vaso/esfera) sobre tampos. */
export function TableDecor({ y, x = 0, z = 0 }: { y: number; x?: number; z?: number }) {
  const m = useMaterials();
  return (
    <group position={[x, y, z]}>
      <B s={[0.3, 0.035, 0.22]} p={[-0.1, 0.018, 0]} m={m.lacquerSand} />
      <B s={[0.27, 0.03, 0.2]} p={[-0.1, 0.05, 0.005]} r={[0, 0.12, 0]} m={m.charcoalFabric} />
      <Sph radius={0.06} p={[-0.1, 0.12, 0]} m={m.brass} />
      <Cyl rt={0.06} rb={0.085} h={0.2} p={[0.22, 0.1, 0.02]} m={m.ceramic} seg={20} />
    </group>
  );
}

/** Mesa de centro em dois volumes: base em nogueira e tampo em mármore Nero Marquina. */
export function CoffeeTable({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  if (item.variant === 'outdoor') {
    return (
      <group>
        <RB s={[w, 0.34, d]} p={[0, 0.17, 0]} m={m.travertine} radius={0.03} tile={TILE.travertine} />
        <Cyl rt={0.14} rb={0.1} h={0.12} p={[0.1, 0.4, 0]} m={m.stoneDark} seg={20} />
      </group>
    );
  }
  return (
    <group>
      <RB s={[w - 0.3, 0.3, d - 0.25]} p={[0, 0.15, 0]} m={m.walnut} radius={0.02} tile={TILE.walnut} />
      <RB s={[w, 0.06, d]} p={[0, 0.33, 0]} m={m.marbleBlack} radius={0.015} tile={TILE.marbleBlack} />
      <TableDecor y={0.36} x={0.2} />
    </group>
  );
}

/** Mesa lateral: base cilíndrica em latão e tampo de mármore. */
export function SideTable({ item }: PieceProps) {
  const m = useMaterials();
  const r = Math.min(item.w, item.d) / 2;
  const outdoor = item.variant === 'outdoor';
  return (
    <group>
      <Cyl rt={r * 0.5} rb={r * 0.6} h={0.02} p={[0, 0.01, 0]} m={outdoor ? m.teak : m.brass} />
      <Cyl rt={0.03} h={0.5} p={[0, 0.27, 0]} m={outdoor ? m.teak : m.brass} seg={12} />
      <Cyl rt={r} h={0.035} p={[0, 0.54, 0]} m={outdoor ? m.teak : m.marble} seg={32} />
      <Cyl rt={0.04} rb={0.05} h={0.16} p={[0.04, 0.64, 0.02]} m={m.ceramic} seg={16} />
    </group>
  );
}

/** Mesa de jantar em nogueira maciça com dois pés-lâmina e louças em cada lugar. */
export function DiningTable({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  const places = useMemo(() => {
    const out: { x: number; z: number; rot: number }[] = [];
    const n = Math.max(2, Math.round((w - 0.4) / 0.85));
    for (let i = 0; i < n; i++) {
      const x = -((n - 1) * 0.85) / 2 + i * 0.85;
      out.push({ x, z: -d / 2 + 0.24, rot: 0 }, { x, z: d / 2 - 0.24, rot: Math.PI });
    }
    out.push({ x: -w / 2 + 0.24, z: 0, rot: Math.PI / 2 }, { x: w / 2 - 0.24, z: 0, rot: -Math.PI / 2 });
    return out;
  }, [w, d]);
  return (
    <group>
      <B s={[0.1, 0.7, d - 0.35]} p={[-w / 2 + 0.55, 0.35, 0]} m={m.walnut} tile={TILE.walnut} />
      <B s={[0.1, 0.7, d - 0.35]} p={[w / 2 - 0.55, 0.35, 0]} m={m.walnut} tile={TILE.walnut} />
      <B s={[w - 1.2, 0.06, 0.08]} p={[0, 0.62, 0]} m={m.walnut} tile={TILE.walnut} />
      <RB s={[w, 0.06, d]} p={[0, 0.73, 0]} m={m.walnut} radius={0.012} tile={TILE.walnut} />
      {places.map((pl, i) => (
        <group key={i} position={[pl.x, 0.762, pl.z]} rotation={[0, pl.rot, 0]}>
          <Cyl rt={0.14} h={0.012} p={[0, 0.006, 0]} m={m.ceramic} seg={28} />
          <Cyl rt={0.1} h={0.014} p={[0, 0.018, 0]} m={m.ceramic} seg={24} />
          <Cyl rt={0.035} rb={0.03} h={0.11} p={[0.16, 0.06, -0.12]} m={m.glass} seg={14} shadow={false} />
          <B s={[0.012, 0.004, 0.18]} p={[-0.17, 0.003, 0]} m={m.brass} />
          <B s={[0.012, 0.004, 0.18]} p={[0.17, 0.003, 0]} m={m.brass} />
        </group>
      ))}
      <B s={[w * 0.55, 0.004, 0.36]} p={[0, 0.762, 0]} m={m.linen} tile={TILE.linen} />
      {[-0.6, 0, 0.6].map((x, i) => (
        <group key={i} position={[x, 0.76, 0]}>
          <Cyl rt={0.06 + i * 0.01} rb={0.08} h={0.18 + (i % 2) * 0.12} p={[0, 0.1 + (i % 2) * 0.06, 0]} m={i === 1 ? m.stoneDark : m.ceramic} seg={20} />
        </group>
      ))}
    </group>
  );
}

/** Mesa executiva (ou escrivaninha simples nos quartos), com objetos de trabalho. */
export function Desk({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  const small = item.variant === 'small';
  const shade = roomShadeMaterial(item.room);
  if (small) {
    return (
      <group>
        <RB s={[w, 0.04, d]} p={[0, 0.74, 0]} m={m.oak} radius={0.008} tile={TILE.oak} />
        {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Cyl key={`${sx}${sz}`} rt={0.015} h={0.72} p={[sx * (w / 2 - 0.06), 0.36, sz * (d / 2 - 0.06)]} m={m.blackMetal} seg={8} />))}
        <Cyl rt={0.07} h={0.02} p={[-w / 2 + 0.2, 0.77, -d / 2 + 0.15]} m={m.blackMetal} />
        <Cyl rt={0.008} h={0.35} p={[-w / 2 + 0.2, 0.95, -d / 2 + 0.15]} m={m.blackMetal} seg={6} />
        <Cyl rt={0.05} rb={0.09} h={0.12} p={[-w / 2 + 0.2, 1.12, -d / 2 + 0.15]} m={shade} seg={18} shadow={false} />
        <B s={[0.32, 0.02, 0.22]} p={[0.1, 0.77, 0.05]} m={m.aluminum} />
      </group>
    );
  }
  return (
    <group>
      <B s={[0.06, 0.72, d - 0.05]} p={[-w / 2 + 0.03, 0.36, 0]} m={m.walnut} tile={TILE.walnut} />
      <B s={[0.5, 0.6, d - 0.1]} p={[w / 2 - 0.3, 0.3, 0]} m={m.walnut} tile={TILE.walnut} />
      {[0.12, 0.32, 0.5].map((y) => (
        <B key={y} s={[0.46, 0.006, 0.01]} p={[w / 2 - 0.3, y, d / 2 - 0.045]} m={m.blackMetal} />
      ))}
      <B s={[w - 0.1, 0.4, 0.02]} p={[0, 0.48, -d / 2 + 0.1]} m={m.walnut} tile={TILE.walnut} />
      <RB s={[w, 0.05, d]} p={[0, 0.745, 0]} m={m.walnut} radius={0.01} tile={TILE.walnut} />
      <B s={[0.9, 0.003, 0.5]} p={[0, 0.772, 0.12]} m={m.leatherDark} />
      {/* monitor */}
      <B s={[0.68, 0.4, 0.015]} p={[0, 1.08, -0.18]} m={m.screen} />
      <B s={[0.68, 0.4, 0.004]} p={[0, 1.08, -0.172]} m={m.screenGlow} shadow={false} />
      <B s={[0.05, 0.22, 0.03]} p={[0, 0.88, -0.2]} m={m.aluminum} />
      <B s={[0.24, 0.01, 0.18]} p={[0, 0.775, -0.2]} m={m.aluminum} />
      <B s={[0.42, 0.012, 0.13]} p={[0, 0.778, 0.1]} m={m.aluminum} />
      {/* luminária de mesa */}
      <Cyl rt={0.07} h={0.02} p={[-w / 2 + 0.25, 0.78, -0.2]} m={m.brass} />
      <Cyl rt={0.008} h={0.4} p={[-w / 2 + 0.25, 0.98, -0.2]} m={m.brass} seg={6} />
      <Cyl rt={0.05} rb={0.11} h={0.14} p={[-w / 2 + 0.25, 1.2, -0.2]} m={shade} seg={20} shadow={false} />
      <TableDecor y={0.77} x={w / 2 - 0.45} z={-0.15} />
    </group>
  );
}

/** Aparador/console em nogueira com objetos. */
export function Console({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  return (
    <group>
      <B s={[0.05, 0.8, d]} p={[-w / 2 + 0.025, 0.4, 0]} m={m.walnut} tile={TILE.walnut} />
      <B s={[0.05, 0.8, d]} p={[w / 2 - 0.025, 0.4, 0]} m={m.walnut} tile={TILE.walnut} />
      <B s={[w, 0.04, d]} p={[0, 0.82, 0]} m={m.walnut} tile={TILE.walnut} />
      <B s={[w - 0.1, 0.03, d - 0.05]} p={[0, 0.2, 0]} m={m.marble} tile={TILE.marble} />
      <TableDecor y={0.84} x={-0.2} />
      <Cyl rt={0.11} rb={0.07} h={0.36} p={[w / 2 - 0.3, 1.02, 0]} m={m.stoneDark} seg={20} />
    </group>
  );
}

/** Buffet de sala de jantar: laca com frentes em nogueira. */
export function Sideboard({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  const doors = Math.max(2, Math.round(w / 0.6));
  return (
    <group>
      <B s={[w - 0.1, 0.1, d - 0.08]} p={[0, 0.05, 0]} m={m.blackMetal} />
      <B s={[w, 0.66, d]} p={[0, 0.43, 0]} m={m.lacquerGraphite} />
      {Array.from({ length: doors }, (_, i) => (
        <B key={i} s={[w / doors - 0.012, 0.6, 0.02]} p={[-w / 2 + (w / doors) * (i + 0.5), 0.43, d / 2 + 0.005]} m={m.walnut} tile={TILE.walnut} />
      ))}
      <B s={[w, 0.03, d]} p={[0, 0.775, 0]} m={m.marble} tile={TILE.marble} />
      <TableDecor y={0.79} x={-w / 4} />
      <Cyl rt={0.09} rb={0.12} h={0.42} p={[w / 3, 1.0, 0]} m={m.ceramic} seg={22} />
    </group>
  );
}

/** Mesa externa: tampo em granito sobre base de teca. */
export function OutdoorTable({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  return (
    <group>
      <B s={[0.12, 0.7, d - 0.3]} p={[-w / 2 + 0.4, 0.35, 0]} m={m.teak} />
      <B s={[0.12, 0.7, d - 0.3]} p={[w / 2 - 0.4, 0.35, 0]} m={m.teak} />
      <RB s={[w, 0.05, d]} p={[0, 0.74, 0]} m={m.stoneDark} radius={0.01} tile={TILE.stoneDark} />
      <Cyl rt={0.18} rb={0.12} h={0.1} p={[0, 0.82, 0]} m={m.ceramic} seg={24} />
    </group>
  );
}

