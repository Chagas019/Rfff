import { useEffect, useState, useSyncExternalStore } from 'react';
import { GlobeController, type GlobeView } from '../lib/globeController';
import { prefersReducedMotion } from './useReducedMotion';

/** Cria um controlador estável para um globo. */
export function useGlobeController(initial: GlobeView, opts?: { minDistance?: number; maxDistance?: number }) {
  const [controller] = useState(() => new GlobeController(initial, { ...opts, autoRotate: !prefersReducedMotion() }));
  return controller;
}

/** Estado reativo (para a interface) da rotação automática. */
export function useAutoRotate(controller: GlobeController): boolean {
  return useSyncExternalStore(controller.subscribe, () => controller.isAutoRotating);
}

/** Pausa a rotação automática quando o usuário pede menos movimento. */
export function useSyncReducedMotion(controller: GlobeController, reduced: boolean) {
  useEffect(() => {
    if (reduced) controller.setAutoRotate(false);
  }, [controller, reduced]);
}
