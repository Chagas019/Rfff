import { DOORS } from '../data/doors';
import type { Level } from '../data/plan';
import { ELEVATOR_STOP, nearElevator } from './collision';

/** Esquadria ou elevador mais próximo para a ação "interagir" (tecla E ou botão). */
export function nearestInteractable(x: number, z: number, level: Level): { kind: 'door' | 'elevator'; id: string; dist: number } | null {
  let best: { kind: 'door' | 'elevator'; id: string; dist: number } | null = null;
  for (const d of DOORS) {
    if (d.level !== level) continue;
    const dist = Math.hypot(x - d.cx, z - d.cz);
    const reach = d.kind === 'garage' ? 4.5 : d.kind === 'slide' ? 2.6 : 2.0;
    if (dist < reach && (!best || dist < best.dist)) best = { kind: 'door', id: d.id, dist };
  }
  for (const [id, gx, gz, reach] of [
    ['streetGate', -17, 30.6, 6],
    ['pedestrianGate', -1, 30.6, 2.5],
  ] as const) {
    if (level !== 0) continue;
    const dist = Math.hypot(x - gx, z - gz);
    if (dist < reach && (!best || dist < best.dist)) best = { kind: 'door', id, dist };
  }
  if (nearElevator(x, z)) {
    const dist = Math.hypot(x - ELEVATOR_STOP.x, z - ELEVATOR_STOP.z);
    if (!best || dist < best.dist) best = { kind: 'elevator', id: 'elevator', dist };
  }
  return best;
}

