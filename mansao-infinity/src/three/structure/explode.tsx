import { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Level } from '../../data/plan';
import { useExperience } from '../../store/useExperience';

/**
 * Deslocamento vertical animado do pavimento superior na prancha de
 * apresentação. Um único "driver" calcula o valor; cada grupo do superior só
 * o copia, então todos sobem e descem juntos.
 */
export const explodeState = { y: 0 };

export function ExplodeDriver() {
  useFrame((_, dt) => {
    const st = useExperience.getState();
    const target = st.mode === 'explode' && st.cutLevel === null ? st.explodeAmount : 0;
    explodeState.y = THREE.MathUtils.damp(explodeState.y, target, 3.2, Math.min(dt, 0.05));
    if (Math.abs(explodeState.y - target) < 0.001) explodeState.y = target;
  });
  return null;
}

/** Grupo que acompanha o deslocamento do pavimento (o térreo nunca se move). */
export function ExplodeLevel({ level, children }: { level: Level; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current && level === 1) ref.current.position.y = explodeState.y;
  });
  return <group ref={ref}>{children}</group>;
}
