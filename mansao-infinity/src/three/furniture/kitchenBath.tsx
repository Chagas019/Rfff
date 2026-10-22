import { TILE, useMaterials, roomLedMaterial } from '../../materials/library';
import { B, Cyl, RB, torusGeo } from './primitives';
import type { PieceProps } from './seating';

/** Torneira gourmet: corpo cilíndrico e bica curva cromada. */
export function Faucet({ x = 0, y = 0, z = 0, rot = 0, tall = 0.32 }: { x?: number; y?: number; z?: number; rot?: number; tall?: number }) {
  const m = useMaterials();
  return (
    <group position={[x, y, z]} rotation={[0, rot, 0]}>
      <Cyl rt={0.028} h={0.03} p={[0, 0.015, 0]} m={m.chrome} seg={18} />
      <Cyl rt={0.016} h={tall} p={[0, tall / 2, 0]} m={m.chrome} seg={14} />
      <mesh geometry={torusGeo(0.09, 0.016, 10, 20, Math.PI)} material={m.chrome} position={[0, tall, 0.09]} rotation={[0, Math.PI / 2, 0]} castShadow />
      <Cyl rt={0.016} h={0.06} p={[0, tall - 0.03, 0.18]} m={m.chrome} seg={14} />
      <B s={[0.012, 0.012, 0.07]} p={[0.03, 0.06, 0]} m={m.chrome} />
    </group>
  );
}

/** Ilha central: laca grafite, tampo e cascatas em mármore, cooktop por indução e cuba de apoio. */
export function Island({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  return (
    <group>
      <B s={[w - 0.2, 0.08, d - 0.5]} p={[0, 0.04, -0.12]} m={m.blackMetal} />
      <B s={[w - 0.14, 0.84, d - 0.42]} p={[0, 0.5, -0.14]} m={m.lacquerGraphite} />
      {Array.from({ length: 6 }, (_, i) => (
        <B key={i} s={[0.005, 0.8, 0.01]} p={[-w / 2 + 0.07 + ((w - 0.14) / 6) * (i + 1), 0.5, -d / 2 + 0.065]} m={m.plasticDark} shadow={false} />
      ))}
      <B s={[w, 0.06, d]} p={[0, 0.92, 0]} m={m.marble} tile={TILE.marble} />
      <B s={[0.06, 0.89, d]} p={[-w / 2 + 0.03, 0.445, 0]} m={m.marble} tile={TILE.marble} />
      <B s={[0.06, 0.89, d]} p={[w / 2 - 0.03, 0.445, 0]} m={m.marble} tile={TILE.marble} />
      {/* cooktop por indução */}
      <B s={[0.9, 0.006, 0.52]} p={[-w / 4, 0.953, -0.2]} m={m.screen} />
      {[-0.2, 0.2].flatMap((dx) => [-0.11, 0.11].map((dz) => (
        <mesh key={`${dx}${dz}`} geometry={torusGeo(0.09, 0.004, 4, 32)} material={m.steel} position={[-w / 4 + dx, 0.957, -0.2 + dz]} rotation={[Math.PI / 2, 0, 0]} />
      )))}
      {/* cuba de apoio */}
      <B s={[0.6, 0.004, 0.42]} p={[w / 4 + 0.2, 0.952, -0.2]} m={m.steel} />
      <Faucet x={w / 4 + 0.2} y={0.95} z={-0.48} />
      {/* frutas e tábua */}
      <RB s={[0.5, 0.03, 0.3]} p={[0.1, 0.965, 0.25]} m={m.walnut} radius={0.01} />
      <Cyl rt={0.16} rb={0.1} h={0.08} p={[0.6, 0.99, 0.25]} m={m.ceramic} seg={22} />
    </group>
  );
}

/** Bancada de parede com gavetões, tampo em mármore e cuba (cozinha) ou tanque (lavanderia). */
export function Counter({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  const laundry = item.variant === 'laundry';
  const body = laundry ? m.lacquerWhite : m.lacquerGraphite;
  const n = Math.round(w / 0.6);
  return (
    <group>
      <B s={[w, 0.08, d - 0.1]} p={[0, 0.04, -0.05]} m={m.blackMetal} />
      <B s={[w, 0.82, d - 0.04]} p={[0, 0.49, -0.02]} m={body} />
      {Array.from({ length: n - 1 }, (_, i) => (
        <B key={i} s={[0.005, 0.78, 0.01]} p={[-w / 2 + (w / n) * (i + 1), 0.49, d / 2 - 0.035]} m={m.plasticDark} shadow={false} />
      ))}
      {Array.from({ length: n }, (_, i) => (
        <B key={`h${i}`} s={[(w / n) * 0.5, 0.012, 0.02]} p={[-w / 2 + (w / n) * (i + 0.5), 0.84, d / 2 - 0.02]} m={m.steel} />
      ))}
      <B s={[w, 0.04, d]} p={[0, 0.92, 0]} m={m.marble} tile={TILE.marble} />
      {!laundry && <B s={[w, 0.08, 0.02]} p={[0, 0.98, -d / 2 + 0.01]} m={m.marble} tile={TILE.marble} />}
      {/* cuba */}
      <B s={laundry ? [0.5, 0.004, 0.42] : [0.8, 0.004, 0.42]} p={[laundry ? 0.3 : 0.2, 0.942, 0.02]} m={m.steel} />
      <Faucet x={laundry ? 0.3 : 0.2} y={0.94} z={-d / 2 + 0.1} tall={laundry ? 0.28 : 0.36} />
      {!laundry && (
        <>
          <B s={[w - 0.1, 0.015, 0.015]} p={[0, 0.9, d / 2 - 0.02]} m={roomLedMaterial(item.room)} shadow={false} />
          <Cyl rt={0.07} rb={0.06} h={0.18} p={[-w / 2 + 0.6, 1.03, -0.1]} m={m.ceramic} seg={18} />
          <B s={[0.32, 0.4, 0.26]} p={[-w / 2 + 1.2, 1.14, -0.12]} m={m.steel} />
          <B s={[0.24, 0.2, 0.012]} p={[-w / 2 + 1.2, 1.16, 0.012]} m={m.screen} />
        </>
      )}
    </group>
  );
}

/**
 * Coluna de torres quentes e frias: refrigerador e freezer em inox, dois fornos
 * embutidos, adega climatizada e armários de nogueira até o forro.
 */
export function TallUnits({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  const H = 2.6;
  // módulos ao longo do eixo local x (de −w/2 a +w/2)
  const mods: { w: number; kind: 'fridge' | 'freezer' | 'oven' | 'wine' | 'cab' }[] = [
    { w: 0.9, kind: 'fridge' },
    { w: 0.6, kind: 'freezer' },
    { w: 0.6, kind: 'oven' },
    { w: 0.6, kind: 'oven' },
    { w: 0.6, kind: 'wine' },
  ];
  const used = mods.reduce((s, md) => s + md.w, 0);
  const rest = w - used;
  const cabs = Math.max(1, Math.round(rest / 0.6));
  for (let i = 0; i < cabs; i++) mods.push({ w: rest / cabs, kind: 'cab' });
  let x = -w / 2;
  return (
    <group>
      <B s={[w, H, d - 0.03]} p={[0, H / 2, -0.015]} m={m.lacquerGraphite} />
      <B s={[w, 3.6 - H, d - 0.05]} p={[0, H + (3.6 - H) / 2, -0.02]} m={m.lacquerGraphite} />
      {mods.map((md, i) => {
        const cx = x + md.w / 2;
        x += md.w;
        const fz = d / 2 - 0.01;
        switch (md.kind) {
          case 'fridge':
          case 'freezer':
            return (
              <group key={i}>
                <B s={[md.w - 0.01, H - 0.12, 0.02]} p={[cx, H / 2 + 0.04, fz]} m={m.steel} />
                <B s={[0.02, 1.2, 0.04]} p={[cx + (md.kind === 'fridge' ? -md.w / 2 + 0.06 : md.w / 2 - 0.06), 1.35, fz + 0.03]} m={m.chrome} />
              </group>
            );
          case 'oven':
            return (
              <group key={i}>
                <B s={[md.w - 0.02, H - 0.12, 0.02]} p={[cx, H / 2 + 0.04, fz]} m={m.walnut} tile={TILE.walnut} />
                <B s={[md.w - 0.04, 0.58, 0.03]} p={[cx, i === 2 ? 1.0 : 1.62, fz + 0.01]} m={m.screen} />
                <B s={[md.w - 0.1, 0.012, 0.03]} p={[cx, i === 2 ? 1.25 : 1.87, fz + 0.035]} m={m.steel} />
              </group>
            );
          case 'wine':
            return (
              <group key={i}>
                <B s={[md.w - 0.02, 1.5, 0.02]} p={[cx, 1.2, fz]} m={m.glassTinted} shadow={false} />
                {Array.from({ length: 10 }, (_, k) => (
                  <Cyl key={k} rt={0.035} h={0.3} p={[cx - 0.18 + (k % 5) * 0.09, 0.62 + Math.floor(k / 5) * 0.55, fz - 0.15]} r={[Math.PI / 2, 0, 0]} m={m.plasticDark} seg={10} />
                ))}
                <B s={[md.w - 0.06, 0.012, 0.012]} p={[cx, 1.92, fz - 0.03]} m={roomLedMaterial(item.room)} shadow={false} />
              </group>
            );
          default:
            return (
              <group key={i}>
                <B s={[md.w - 0.01, H - 0.12, 0.02]} p={[cx, H / 2 + 0.04, fz]} m={m.walnut} tile={TILE.walnut} />
                <B s={[0.012, 0.6, 0.02]} p={[cx - md.w / 2 + 0.05, 1.2, fz + 0.02]} m={m.steel} />
              </group>
            );
        }
      })}
    </group>
  );
}

/** Banheira de imersão independente com misturador de piso. */
export function Bathtub({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  return (
    <group>
      <RB s={[w, 0.58, d]} p={[0, 0.29, 0]} m={m.ceramic} radius={0.28} seg={6} />
      <RB s={[w - 0.12, 0.04, d - 0.12]} p={[0, 0.555, 0]} m={m.water} radius={0.24} seg={6} shadow={false} />
      <Cyl rt={0.018} h={0.95} p={[w / 2 + 0.2, 0.475, 0]} m={m.chrome} seg={12} />
      <mesh geometry={torusGeo(0.12, 0.018, 10, 18, Math.PI)} material={m.chrome} position={[w / 2 + 0.08, 0.95, 0]} rotation={[0, 0, 0]} castShadow />
      <Cyl rt={0.07} h={0.012} p={[w / 2 + 0.2, 0.006, 0]} m={m.chrome} />
      <RB s={[0.5, 0.05, 0.3]} p={[-w / 2 + 0.4, 0.62, 0]} m={m.linenWhite} radius={0.02} />
    </group>
  );
}

/** Box de vidro: piso em pedra com ralo linear, painel fixo, ducha de teto, registro e nicho. */
export function Shower({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  const H = 2.25;
  return (
    <group>
      <B s={[w, 0.03, d]} p={[0, 0.015, 0]} m={m.stoneDark} tile={TILE.stoneDark} />
      <B s={[w - 0.2, 0.004, 0.05]} p={[0, 0.032, -d / 2 + 0.12]} m={m.steel} />
      <B s={[w * 0.62, H, 0.012]} p={[-w / 2 + w * 0.31, H / 2 + 0.03, d / 2 - 0.01]} m={m.glass} shadow={false} />
      <B s={[0.02, H, 0.03]} p={[-w / 2 + 0.01, H / 2 + 0.03, d / 2 - 0.01]} m={m.chrome} />
      <B s={[w * 0.62, 0.02, 0.02]} p={[-w / 2 + w * 0.31, H + 0.03, d / 2 - 0.01]} m={m.chrome} />
      {/* ducha de teto e braço */}
      <B s={[0.3, 0.012, 0.3]} p={[0, 2.38, -d / 2 + 0.45]} m={m.chrome} />
      <Cyl rt={0.012} h={0.4} p={[0, 2.4, -d / 2 + 0.25]} r={[Math.PI / 2, 0, 0]} m={m.chrome} seg={10} />
      {/* registro e ducha manual */}
      <Cyl rt={0.045} h={0.02} p={[w / 2 - 0.35, 1.1, -d / 2 + 0.01]} r={[Math.PI / 2, 0, 0]} m={m.chrome} seg={20} />
      <Cyl rt={0.045} h={0.02} p={[w / 2 - 0.55, 1.1, -d / 2 + 0.01]} r={[Math.PI / 2, 0, 0]} m={m.chrome} seg={20} />
      <B s={[0.02, 0.6, 0.02]} p={[w / 2 - 0.2, 1.4, -d / 2 + 0.02]} m={m.chrome} />
      {/* nicho embutido */}
      <B s={[0.6, 0.32, 0.012]} p={[-w / 2 + 0.6, 1.25, -d / 2 + 0.006]} m={m.stoneDark} tile={TILE.stoneDark} />
      <B s={[0.56, 0.012, 0.012]} p={[-w / 2 + 0.6, 1.25, -d / 2 + 0.01]} m={roomLedMaterial(item.room)} shadow={false} />
      <Cyl rt={0.03} h={0.18} p={[-w / 2 + 0.45, 1.18, -d / 2 + 0.06]} m={m.lacquerSand} seg={12} />
      <Cyl rt={0.03} h={0.15} p={[-w / 2 + 0.55, 1.165, -d / 2 + 0.06]} m={m.ceramic} seg={12} />
    </group>
  );
}

/** Bancada suspensa (simples, dupla ou em pedra) com cubas de apoio, metais e espelho retroiluminado. */
export function Vanity({ item }: PieceProps) {
  const m = useMaterials();
  const { w, d } = item;
  const double = item.variant === 'double';
  const stone = item.variant === 'stone';
  const sinks = double ? [-w / 4, w / 4] : [0];
  const glow = roomLedMaterial(item.room);
  return (
    <group>
      {stone ? (
        <B s={[w, 0.18, d]} p={[0, 0.78, 0]} m={m.marbleBlack} tile={TILE.marbleBlack} />
      ) : (
        <>
          <B s={[w, 0.42, d - 0.02]} p={[0, 0.6, -0.01]} m={m.walnut} tile={TILE.walnut} />
          <B s={[w - 0.04, 0.006, 0.01]} p={[0, 0.6, d / 2 - 0.015]} m={m.plasticDark} shadow={false} />
          <B s={[w, 0.03, d]} p={[0, 0.835, 0]} m={m.marble} tile={TILE.marble} />
        </>
      )}
      {sinks.map((sx) => (
        <group key={sx}>
          <Cyl rt={0.2} rb={0.16} h={0.13} p={[sx, stone ? 0.935 : 0.915, 0.03]} m={m.ceramic} seg={32} />
          <B s={[0.03, 0.03, 0.2]} p={[sx, 1.12, -d / 2 + 0.1]} m={m.brass} />
          <Cyl rt={0.025} h={0.02} p={[sx + 0.14, 1.12, -d / 2 + 0.01]} r={[Math.PI / 2, 0, 0]} m={m.brass} seg={14} />
          {/* espelho com halo de LED */}
          <B s={[double ? w / 2 - 0.2 : w - 0.2, 0.9, 0.02]} p={[sx, 1.72, -d / 2 + 0.02]} m={m.mirror} />
          <B s={[double ? w / 2 - 0.14 : w - 0.14, 0.96, 0.01]} p={[sx, 1.72, -d / 2 + 0.008]} m={glow} shadow={false} />
        </group>
      ))}
      <Cyl rt={0.03} h={0.14} p={[w / 2 - 0.12, 0.92, -0.1]} m={m.stoneDark} seg={12} />
      <B s={[0.18, 0.01, 0.12]} p={[w / 2 - 0.25, 0.856, 0.05]} m={m.linenWhite} />
      {/* toalheiro */}
      <B s={[0.5, 0.02, 0.02]} p={[0, 0.3, d / 2 - 0.05]} m={m.chrome} />
      <B s={[0.4, 0.25, 0.03]} p={[0, 0.2, d / 2 - 0.04]} m={m.linenWhite} />
    </group>
  );
}

/** Bacia suspensa com caixa embutida, placa de acionamento e papeleira. */
export function Toilet({ item }: PieceProps) {
  const m = useMaterials();
  const { d } = item;
  return (
    <group>
      <RB s={[0.38, 0.3, 0.54]} p={[0, 0.3, -d / 2 + 0.3]} m={m.ceramic} radius={0.13} seg={5} />
      <RB s={[0.38, 0.025, 0.5]} p={[0, 0.465, -d / 2 + 0.31]} m={m.ceramic} radius={0.011} seg={3} />
      <B s={[0.36, 0.3, 0.1]} p={[0, 0.3, -d / 2 + 0.05]} m={m.ceramic} />
      <B s={[0.22, 0.15, 0.012]} p={[0, 1.05, -d / 2 + 0.006]} m={m.chrome} />
      <Cyl rt={0.012} h={0.14} p={[0.4, 0.7, -d / 2 + 0.06]} r={[0, 0, Math.PI / 2]} m={m.chrome} seg={8} />
      <Cyl rt={0.055} h={0.11} p={[0.4, 0.65, -d / 2 + 0.06]} r={[0, 0, Math.PI / 2]} m={m.linenWhite} seg={16} />
    </group>
  );
}
