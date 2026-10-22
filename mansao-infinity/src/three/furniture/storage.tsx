import { useMemo } from 'react';
import * as THREE from 'three';
import { TILE, useMaterials, roomLedMaterial, roomShadeMaterial } from '../../materials/library';
import { B, Cyl, Sph } from './primitives';
import type { PieceProps } from './seating';

const bookRowCache = new Map<string, THREE.BufferGeometry>();
/** Fileira de livros: plano frontal mapeado numa das 4 faixas do atlas de lombadas. */
function bookRow(w: number, h: number, row: number) {
  const key = `${w.toFixed(2)}|${h.toFixed(2)}|${row}`;
  let g = bookRowCache.get(key);
  if (!g) {
    g = new THREE.BoxGeometry(w, h, 0.22);
    const uv = g.getAttribute('uv') as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, uv.getX(i) * (w / 0.7) + row * 0.37, row * 0.25 + uv.getY(i) * 0.25);
    }
    bookRowCache.set(key, g);
  }
  return g;
}

/** Estante de nogueira do piso ao teto, com livros e objetos. */
export function Bookshelf({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  const H = item.h ?? 3.3;
  const bays = Math.round(w / 0.95);
  const bw = w / bays;
  const shelfYs = useMemo(() => Array.from({ length: 7 }, (_, i) => 0.1 + i * 0.46), []);
  return (
    <group>
      <B s={[w, H, 0.03]} p={[0, H / 2, -d / 2 + 0.015]} m={m.walnut} tile={TILE.walnut} />
      {Array.from({ length: bays + 1 }, (_, i) => (
        <B key={`v${i}`} s={[0.035, H, d]} p={[-w / 2 + i * bw, H / 2, 0]} m={m.walnut} tile={TILE.walnut} />
      ))}
      {shelfYs.map((y) => (
        <B key={`s${y}`} s={[w, 0.03, d]} p={[0, y, 0]} m={m.walnut} tile={TILE.walnut} />
      ))}
      {shelfYs.slice(0, -1).flatMap((y, si) =>
        Array.from({ length: bays }, (_, bi) => {
          const seed = (si * 7 + bi * 3) % 5;
          const cx = -w / 2 + bw * (bi + 0.5);
          if (seed === 2) {
            return (
              <group key={`d${si}-${bi}`}>
                <Cyl rt={0.07} rb={0.1} h={0.26} p={[cx - 0.15, y + 0.145, 0]} m={m.ceramic} seg={18} />
                <Sph radius={0.07} p={[cx + 0.18, y + 0.085, 0]} m={m.brass} />
              </group>
            );
          }
          const fill = seed === 4 ? 0.5 : 0.82;
          const bwid = (bw - 0.06) * fill;
          return (
            <mesh
              key={`b${si}-${bi}`}
              geometry={bookRow(bwid, 0.3, (si + bi) % 4)}
              material={m.books}
              position={[cx - (bw - 0.06 - bwid) / 2, y + 0.165, 0.01]}
              castShadow
              receiveShadow
            />
          );
        }),
      )}
      <B s={[w - 0.04, 0.02, 0.02]} p={[0, H - 0.03, d / 2 - 0.02]} m={roomLedMaterial(item.room)} shadow={false} />
    </group>
  );
}

const CLOTHES = ['#ece7de', '#2d3138', '#7d8a96', '#c9b49a', '#58423a', '#d9d2c6', '#1f1f22', '#8c6f5a'];
const clothMats = new Map<string, THREE.MeshStandardMaterial>();
const clothMat = (c: string) => {
  let mm = clothMats.get(c);
  if (!mm) {
    mm = new THREE.MeshStandardMaterial({ color: c, roughness: 0.95 });
    clothMats.set(c, mm);
  }
  return mm;
};

/** Armário: em laca com puxadores de latão, ou vitrine de nogueira iluminada (closet master). */
export function Wardrobe({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  const H = item.h ?? 2.6;
  const doors = Math.max(2, Math.round(w / 0.6));
  const dw = w / doors;
  if (item.variant === 'walnut') {
    return (
      <group>
        <B s={[w, H, d]} p={[0, H / 2, 0]} m={m.walnut} tile={TILE.walnut} />
        <B s={[w - 0.08, H - 0.2, 0.02]} p={[0, H / 2, d / 2 - 0.04]} m={m.lacquerSand} />
        {Array.from({ length: doors }, (_, i) => {
          const cx = -w / 2 + dw * (i + 0.5);
          return (
            <group key={i}>
              <B s={[dw - 0.02, 0.02, d - 0.1]} p={[cx, H - 0.5, 0]} m={m.walnut} />
              <Cyl rt={0.008} h={dw - 0.1} p={[cx, H - 0.62, 0.02]} r={[0, 0, Math.PI / 2]} m={m.brass} seg={8} />
              {Array.from({ length: 6 }, (_, k) => (
                <B key={k} s={[0.035, 0.9 + ((i + k) % 3) * 0.15, 0.42]} p={[cx - dw / 2 + 0.1 + k * ((dw - 0.2) / 5), H - 0.62 - 0.5 - ((i + k) % 3) * 0.075, 0.02]} m={clothMat(CLOTHES[(i * 3 + k) % CLOTHES.length])} />
              ))}
              <B s={[dw - 0.06, 0.02, d - 0.1]} p={[cx, 0.35, 0]} m={m.walnut} />
              {Array.from({ length: 3 }, (_, k) => (
                <B key={`sh${k}`} s={[0.1, 0.08, 0.26]} p={[cx - dw / 4 + k * (dw / 4), 0.4, 0.02]} m={clothMat(CLOTHES[(i + k * 2 + 1) % CLOTHES.length])} />
              ))}
              <B s={[dw - 0.04, H - 0.06, 0.012]} p={[cx, H / 2, d / 2 - 0.006]} m={m.glassTinted} shadow={false} />
              <B s={[0.02, H - 0.06, 0.03]} p={[cx - dw / 2 + 0.01, H / 2, d / 2 - 0.01]} m={m.walnut} />
            </group>
          );
        })}
        <B s={[w - 0.06, 0.015, 0.015]} p={[0, H - 0.1, d / 2 - 0.08]} m={roomLedMaterial(item.room)} shadow={false} />
      </group>
    );
  }
  return (
    <group>
      <B s={[w, H, d]} p={[0, H / 2, 0]} m={m.lacquerWhite} />
      {Array.from({ length: doors - 1 }, (_, i) => (
        <B key={i} s={[0.006, H - 0.02, 0.01]} p={[-w / 2 + dw * (i + 1), H / 2, d / 2 + 0.002]} m={m.plasticDark} shadow={false} />
      ))}
      {Array.from({ length: doors }, (_, i) => (
        <B key={`h${i}`} s={[0.012, 0.5, 0.025]} p={[-w / 2 + dw * (i + 0.5) + (i % 2 ? -1 : 1) * (dw / 2 - 0.06), 1.1, d / 2 + 0.012]} m={m.brass} />
      ))}
    </group>
  );
}

/** Ilha do closet: gavetas em nogueira e tampo de vidro sobre bandejas de veludo. */
export function ClosetIsland({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  return (
    <group>
      <B s={[w, 0.85, d]} p={[0, 0.425, 0]} m={m.walnut} tile={TILE.walnut} />
      {[0.2, 0.45, 0.68].map((y) =>
        [-1, 1].map((s) => <B key={`${y}${s}`} s={[w - 0.04, 0.006, 0.01]} p={[0, y, (s * d) / 2 + s * 0.003]} m={m.plasticDark} shadow={false} />),
      )}
      <B s={[w - 0.1, 0.02, d - 0.1]} p={[0, 0.83, 0]} m={m.velvet} />
      {Array.from({ length: 6 }, (_, i) => (
        <Sph key={i} radius={0.02} p={[-w / 2 + 0.2 + i * 0.24, 0.85, (i % 2) * 0.12 - 0.06]} m={i % 2 ? m.brass : m.chrome} />
      ))}
      <B s={[w + 0.02, 0.012, d + 0.02]} p={[0, 0.9, 0]} m={m.glass} shadow={false} />
    </group>
  );
}

/** Cômoda em nogueira com luminária e objeto. */
export function Dresser({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  return (
    <group>
      <B s={[w, 0.8, d]} p={[0, 0.42, 0]} m={m.walnut} tile={TILE.walnut} />
      <B s={[w - 0.1, 0.04, d - 0.06]} p={[0, 0.02, 0]} m={m.blackMetal} />
      {[0.3, 0.55].map((y) => (
        <B key={y} s={[w - 0.04, 0.006, 0.01]} p={[0, y, d / 2 + 0.003]} m={m.plasticDark} shadow={false} />
      ))}
      <TableLamp room={item.room} x={-w / 2 + 0.3} y={0.82} />
      <B s={[0.7, 0.9, 0.03]} p={[w / 2 - 0.5, 1.27, -d / 2 + 0.06]} r={[-0.08, 0, 0]} m={m.art1} />
    </group>
  );
}

/** Luminária de mesa com cúpula de tecido (brilha quando a luz do cômodo está acesa). */
export function TableLamp({ room, x = 0, y = 0, z = 0 }: { room: string; x?: number; y?: number; z?: number }) {
  const m = useMaterials();
  return (
    <group position={[x, y, z]}>
      <Cyl rt={0.07} rb={0.09} h={0.26} p={[0, 0.13, 0]} m={m.ceramic} seg={20} />
      <Cyl rt={0.012} h={0.12} p={[0, 0.32, 0]} m={m.brass} seg={8} />
      <Cyl rt={0.13} rb={0.17} h={0.2} p={[0, 0.46, 0]} m={roomShadeMaterial(room)} seg={24} shadow={false} />
    </group>
  );
}

/** Criado-mudo com gaveta, luminária e livro. */
export function Nightstand({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  return (
    <group>
      <B s={[w, 0.48, d]} p={[0, 0.3, 0]} m={m.walnut} tile={TILE.walnut} />
      <B s={[w - 0.06, 0.06, d - 0.06]} p={[0, 0.03, 0]} m={m.blackMetal} />
      <B s={[w - 0.04, 0.006, 0.01]} p={[0, 0.42, d / 2 + 0.003]} m={m.plasticDark} shadow={false} />
      <TableLamp room={item.room} x={-0.05} y={0.54} z={-0.02} />
      <B s={[0.22, 0.03, 0.16]} p={[0.14, 0.555, 0.06]} r={[0, 0.3, 0]} m={m.terracotta} />
    </group>
  );
}

const JAR_COLORS = ['#c4a77d', '#8a6a4a', '#e8e0d0', '#6b7b5a', '#b23a2e'];

/** Estantes: despensa (madeira com potes), lavanderia (armários brancos) ou metálicas (depósito). */
export function Shelving({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  if (item.variant === 'laundry') {
    return (
      <group>
        <B s={[w, 0.86, d]} p={[0, 0.43, 0]} m={m.lacquerWhite} />
        <B s={[w, 0.03, d + 0.02]} p={[0, 0.875, 0]} m={m.marble} tile={TILE.marble} />
        <B s={[w, 0.8, d * 0.75]} p={[0, 2.1, -d * 0.12]} m={m.lacquerWhite} />
        {Array.from({ length: Math.round(w / 0.6) - 1 }, (_, i) => (
          <B key={i} s={[0.005, 0.84, 0.01]} p={[-w / 2 + (i + 1) * (w / Math.round(w / 0.6)), 0.43, d / 2 + 0.002]} m={m.plasticDark} shadow={false} />
        ))}
      </group>
    );
  }
  const metal = item.variant === 'metal';
  const H = metal ? 2.2 : 2.4;
  const levels = metal ? 5 : 6;
  return (
    <group>
      {!metal && <B s={[w, H, 0.02]} p={[0, H / 2, -d / 2 + 0.01]} m={m.lacquerWhite} />}
      {[-1, 1].map((s) => (
        <B key={s} s={[metal ? 0.04 : 0.03, H, d]} p={[(s * (w - 0.03)) / 2, H / 2, 0]} m={metal ? m.blackMetal : m.oak} tile={TILE.oak} />
      ))}
      {Array.from({ length: levels }, (_, i) => {
        const y = 0.12 + i * ((H - 0.2) / (levels - 1));
        return (
          <group key={i}>
            <B s={[w, 0.025, d]} p={[0, y, 0]} m={metal ? m.blackMetal : m.oak} tile={TILE.oak} />
            {i < levels - 1 &&
              Array.from({ length: Math.floor(w / 0.32) }, (_, k) => {
                const c = JAR_COLORS[(i + k) % JAR_COLORS.length];
                const x = -w / 2 + 0.2 + k * 0.32;
                return metal ? (
                  <B key={k} s={[0.26, 0.22, d - 0.08]} p={[x, y + 0.125, 0]} m={k % 2 ? m.lacquerSand : m.charcoalFabric} />
                ) : (
                  <Cyl key={k} rt={0.06} h={0.18 + (k % 3) * 0.05} p={[x, y + 0.1 + (k % 3) * 0.025, 0]} m={clothMat(c)} seg={14} />
                );
              })}
          </group>
        );
      })}
    </group>
  );
}

/** Armários de ferramentas da garagem (ou quadro elétrico no depósito). */
export function ToolCabinet({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  if (item.variant === 'panel') {
    return (
      <group>
        <B s={[0.9, 1.2, 0.18]} p={[-w / 2 + 0.5, 1.4, 0]} m={m.lacquerWhite} />
        <B s={[0.86, 1.16, 0.01]} p={[-w / 2 + 0.5, 1.4, 0.095]} m={m.aluminum} />
        <B s={[0.5, 0.7, 0.14]} p={[w / 2 - 0.4, 1.5, 0]} m={m.plasticDark} />
        <Cyl rt={0.03} h={2.6} p={[-w / 2 + 1.05, 1.3, -0.05]} m={m.steel} seg={10} />
      </group>
    );
  }
  const n = Math.round(w / 0.6);
  return (
    <group>
      <B s={[w, 0.9, d]} p={[0, 0.45, 0]} m={m.lacquerGraphite} />
      <B s={[w, 0.04, d + 0.02]} p={[0, 0.92, 0]} m={m.walnut} tile={TILE.walnut} />
      <B s={[w, 0.9, 0.35]} p={[0, 2.25, -d / 2 + 0.175]} m={m.lacquerGraphite} />
      <B s={[w - 0.1, 0.8, 0.02]} p={[0, 1.38, -d / 2 + 0.01]} m={m.aluminum} />
      {Array.from({ length: n - 1 }, (_, i) => (
        <group key={i}>
          <B s={[0.005, 0.86, 0.01]} p={[-w / 2 + (i + 1) * (w / n), 0.45, d / 2 + 0.002]} m={m.blackMetal} shadow={false} />
          <B s={[0.005, 0.86, 0.01]} p={[-w / 2 + (i + 1) * (w / n), 2.25, -d / 2 + 0.352]} m={m.blackMetal} shadow={false} />
        </group>
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <B key={`t${i}`} s={[0.03, 0.22 + (i % 3) * 0.06, 0.02]} p={[-w / 2 + 0.4 + i * (w / 9), 1.45, -d / 2 + 0.035]} m={i % 2 ? m.steel : m.plasticDark} />
      ))}
      <B s={[w - 0.04, 0.015, 0.015]} p={[0, 1.8, -d / 2 + 0.3]} m={roomLedMaterial(item.room)} shadow={false} />
    </group>
  );
}
