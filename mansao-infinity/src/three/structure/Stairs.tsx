import { useMemo } from 'react';
import { STAIR, ELEVATOR, LEVEL_Y, GUARDRAILS } from '../../data/plan';
import { TILE, useMaterials, roomLedMaterial } from '../../materials/library';
import { B } from '../furniture/primitives';
import { useLevelVisibility } from './visibility';
import { ExplodeLevel } from './explode';

/**
 * Escada escultural: degraus maciços de nogueira em balanço, presos a uma
 * longarina de aço oculta junto ao vazio, com guarda-corpo de vidro e LED
 * sob cada degrau.
 */
export function Stairs() {
  const m = useMaterials();
  const vis = useLevelVisibility();
  const steps = useMemo(() => {
    const n = STAIR.risers;
    const rise = (LEVEL_Y[1] - LEVEL_Y[0]) / n;
    const run = (STAIR.zBottom - STAIR.zTop) / (n - 1);
    return Array.from({ length: n - 1 }, (_, i) => ({ y: rise * (i + 1), z: STAIR.zBottom - run * (i + 0.5), run }));
  }, []);
  const w = STAIR.x1 - STAIR.x0;
  const cx = (STAIR.x0 + STAIR.x1) / 2;
  const led = roomLedMaterial('foyer');
  return (
    <group name="Stairs" visible={vis.L0}>
      {steps.map((s, i) => (
        <group key={i}>
          <B s={[w, 0.075, s.run + 0.02]} p={[cx, s.y - 0.0375, s.z]} m={m.walnut} tile={TILE.walnut} />
          <B s={[w - 0.1, 0.008, 0.012]} p={[cx, s.y - 0.08, s.z + s.run / 2 - 0.02]} m={led} shadow={false} />
        </group>
      ))}
      {/* longarina de aço do lado do vazio */}
      <mesh position={[STAIR.x1 + 0.04, LEVEL_Y[1] / 2 - 0.1, (STAIR.zBottom + STAIR.zTop) / 2]} rotation={[Math.atan2(LEVEL_Y[1], STAIR.zBottom - STAIR.zTop), 0, 0]} material={m.frame} castShadow>
        <boxGeometry args={[0.08, 0.32, Math.hypot(LEVEL_Y[1], STAIR.zBottom - STAIR.zTop) + 0.2]} />
      </mesh>
      {/* guarda-corpo de vidro inclinado */}
      <mesh position={[STAIR.x1 + 0.1, LEVEL_Y[1] / 2 + 0.5, (STAIR.zBottom + STAIR.zTop) / 2]} rotation={[Math.atan2(LEVEL_Y[1], STAIR.zBottom - STAIR.zTop), 0, 0]} material={m.glassGuard} renderOrder={2}>
        <boxGeometry args={[0.02, 1.0, Math.hypot(LEVEL_Y[1], STAIR.zBottom - STAIR.zTop)]} />
      </mesh>
      <ExplodeLevel level={1}>
        <group visible={vis.L1}>
          <Guardrails />
        </group>
      </ExplodeLevel>
      <Elevator />
    </group>
  );
}

/** Guarda-corpos de vidro laminado com perfil de base em aço. */
function Guardrails() {
  const m = useMaterials();
  return (
    <group name="Guardrails">
      {GUARDRAILS.map((g, i) => {
        const len = g.to - g.from;
        const mid = (g.from + g.to) / 2;
        const y = LEVEL_Y[g.level];
        const pos = (h: number): [number, number, number] => (g.axis === 'x' ? [mid, y + h, g.at] : [g.at, y + h, mid]);
        const size = (t: number, h: number): [number, number, number] => (g.axis === 'x' ? [len, h, t] : [t, h, len]);
        return (
          <group key={i}>
            <B s={size(0.06, 0.1)} p={pos(0.05)} m={m.frame} />
            <mesh position={pos(0.62)} material={m.glassGuard} renderOrder={2}>
              <boxGeometry args={size(0.02, 1.05)} />
            </mesh>
            <B s={size(0.05, 0.03)} p={pos(1.15)} m={m.steel} />
          </group>
        );
      })}
    </group>
  );
}

/** Elevador residencial panorâmico em vidro e aço, atendendo os dois pavimentos. */
function Elevator() {
  const m = useMaterials();
  const { x0, x1, z0, z1 } = ELEVATOR;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const w = x1 - x0;
  const d = z1 - z0;
  return (
    <group name="Elevator">
      {[
        [x0 + 0.04, z0 + 0.04],
        [x0 + 0.04, z1 - 0.04],
        [x1 - 0.04, z0 + 0.04],
        [x1 - 0.04, z1 - 0.04],
      ].map(([x, z], i) => (
        <B key={i} s={[0.08, 7.0, 0.08]} p={[x, 3.5, z]} m={m.frame} />
      ))}
      <mesh position={[cx, 3.5, z1 - 0.02]} material={m.glassGuard} renderOrder={2}>
        <boxGeometry args={[w - 0.1, 7.0, 0.02]} />
      </mesh>
      <mesh position={[x0 + 0.02, 3.5, cz]} material={m.glassGuard} renderOrder={2}>
        <boxGeometry args={[0.02, 7.0, d - 0.1]} />
      </mesh>
      {/* cabine parada no térreo */}
      <B s={[w - 0.2, 0.08, d - 0.2]} p={[cx, 0.04, cz]} m={m.steel} />
      <B s={[w - 0.2, 0.05, d - 0.2]} p={[cx, 2.45, cz]} m={m.steel} />
      <B s={[w - 0.3, 0.01, d - 0.3]} p={[cx, 2.42, cz]} m={roomLedMaterial('foyer')} shadow={false} />
      <B s={[0.03, 0.1, 0.4]} p={[cx, 1.0, z0 + 0.12]} m={m.chrome} />
      {/* botoeiras nos dois pavimentos */}
      {[0, LEVEL_Y[1]].map((y) => (
        <B key={y} s={[0.02, 0.18, 0.08]} p={[x1 + 0.02, y + 1.1, z0 + 0.25]} m={m.steel} />
      ))}
    </group>
  );
}
