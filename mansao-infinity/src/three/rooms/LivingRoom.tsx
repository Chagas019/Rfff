import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMaterials, roomLedMaterial, TILE } from '../../materials/library';
import { useExperience } from '../../store/useExperience';
import { useLevelVisibility } from '../structure/visibility';
import { B, Cyl, Sph } from '../furniture/primitives';
import { Artwork, Curtain, RoomFurniture, RoomGroup } from './common';

/**
 * Sala de estar com pé-direito duplo: painel de 9 × 7 m em mármore Nero
 * Marquina com lareira linear e TV, lustre de globos suspensos, cortinas altas
 * nas duas fachadas de vidro e obra de grande formato.
 */
export function LivingRoom() {
  const vis = useLevelVisibility();
  return (
    <RoomGroup id="living">
      <RoomFurniture id="living" />
      <FeatureWall />
      <group visible={vis.L1}>
        <GlobeChandelier />
        <Artwork x={4.2} y={5.3} z={-6.5} w={3.2} h={2.0} rot={Math.PI / 2} art={1} />
      </group>
      <group visible={vis.L1}>
      {/* cortinas recolhidas nos cantos dos panos de vidro (6,8 m de altura) */}
      <Curtain x={19.6} z={-9.0} y={0.02} width={1.6} height={6.85} rot={-Math.PI / 2} />
      <Curtain x={19.6} z={-1.0} y={0.02} width={1.4} height={6.85} rot={-Math.PI / 2} />
      <Curtain x={5.0} z={-9.6} y={0.02} width={1.6} height={6.85} />
      <Curtain x={19.0} z={-9.6} y={0.02} width={1.2} height={6.85} />
      </group>
    </RoomGroup>
  );
}

function FeatureWall() {
  const m = useMaterials();
  const vis = useLevelVisibility();
  const x0 = 5;
  const x1 = 14;
  const cx = (x0 + x1) / 2;
  const w = x1 - x0;
  const z = -0.11;
  return (
    <group>
      <B s={[w, 3.6, 0.06]} p={[cx, 1.8, z]} m={m.marbleBlack} tile={TILE.marbleBlack} />
      <group visible={vis.L1}>
        <B s={[w, 3.38, 0.06]} p={[cx, 5.29, z]} m={m.marbleBlack} tile={TILE.marbleBlack} />
        <B s={[0.02, 3.3, 0.02]} p={[x1 + 0.02, 5.29, z + 0.02]} m={roomLedMaterial('living')} shadow={false} />
      </group>
      {/* nicho da lareira */}
      <B s={[2.6, 0.55, 0.02]} p={[cx, 0.85, z + 0.035]} m={m.blackMetal} />
      <Fire x={cx} y={0.62} z={z + 0.06} width={2.4} />
      <B s={[2.6, 0.55, 0.01]} p={[cx, 0.85, z + 0.09]} m={m.glass} shadow={false} />
      <B s={[2.7, 0.03, 0.12]} p={[cx, 1.14, z + 0.06]} m={m.steel} />
      {/* banco flutuante em nogueira */}
      <B s={[w - 0.8, 0.3, 0.45]} p={[cx, 0.3, z + 0.25]} m={m.walnut} tile={TILE.walnut} />
      <B s={[1.2, 0.1, 0.3]} p={[cx - 3, 0.5, z + 0.25]} m={m.lacquerSand} />
      <Sph radius={0.12} p={[cx + 3.2, 0.57, z + 0.25]} m={m.brass} />
      {/* TV 85" */}
      <B s={[1.92, 1.1, 0.04]} p={[cx, 2.25, z + 0.06]} m={m.screen} />
      <B s={[1.88, 1.06, 0.005]} p={[cx, 2.25, z + 0.083]} m={m.screenGlow} shadow={false} />
      {/* rasgo de LED vertical lateral */}
      <B s={[0.02, 3.55, 0.02]} p={[x1 + 0.02, 1.8, z + 0.02]} m={roomLedMaterial('living')} shadow={false} />
    </group>
  );
}

/** Chamas da lareira: lâminas aditivas com cintilação. */
function Fire({ x, y, z, width }: { x: number; y: number; z: number; width: number }) {
  const m = useMaterials();
  const group = useRef<THREE.Group>(null);
  const time = useExperience((s) => s.time);
  const lit = useExperience((s) => s.lights.living);
  const flames = useMemo(() => Array.from({ length: 14 }, (_, i) => ({ x: -width / 2 + 0.1 + (i / 13) * (width - 0.2), phase: i * 1.7, h: 0.18 + (i % 4) * 0.04 })), [width]);
  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.children.forEach((c, i) => {
      const f = flames[i];
      c.scale.y = 0.75 + 0.35 * Math.sin(t * 7 + f.phase) * Math.sin(t * 3.1 + f.phase * 0.5) + 0.15 * Math.sin(t * 13 + i);
      c.position.y = (f.h * c.scale.y) / 2;
    });
  });
  const visible = lit && time !== 'day';
  return (
    <group ref={group} position={[x, y, z]} visible={visible}>
      {flames.map((f, i) => (
        <mesh key={i} position={[f.x, f.h / 2, 0]} material={m.fire}>
          <planeGeometry args={[0.16, f.h]} />
        </mesh>
      ))}
    </group>
  );
}

/** Lustre escultural de globos de vidro em alturas diferentes (pé-direito duplo). */
function GlobeChandelier() {
  const m = useMaterials();
  const glow = roomLedMaterial('living');
  const globes = useMemo(
    () =>
      Array.from({ length: 21 }, (_, i) => {
        const a = i * 2.39996;
        const r = 0.35 + Math.sqrt(i / 21) * 1.15;
        return { x: Math.cos(a) * r, z: Math.sin(a) * r * 0.75, y: 4.6 + ((i * 37) % 11) / 11 * 1.5, s: 0.07 + ((i * 13) % 5) * 0.012 };
      }),
    [],
  );
  return (
    <group position={[9.4, 0, -3.8]}>
      <Cyl rt={0.9} h={0.03} p={[0, 6.985, 0]} m={m.brass} seg={40} shadow={false} />
      {globes.map((g, i) => (
        <group key={i}>
          <Cyl rt={0.003} h={7 - g.y} p={[g.x, (7 + g.y) / 2, g.z]} m={m.blackMetal} seg={4} shadow={false} />
          <Sph radius={g.s} p={[g.x, g.y - g.s, g.z]} m={glow} shadow={false} />
        </group>
      ))}
    </group>
  );
}
