import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ROOMS, LEVEL_Y } from '../../data/plan';
import { QUALITY } from '../../config/quality';
import { useExperience } from '../../store/useExperience';
import { useRoomLOD } from './common';
import { LivingRoom } from './LivingRoom';
import { Cinema, DiningRoom, FoyerGallery, Kitchen, Office } from './SocialRooms';
import { Bathrooms, Bedrooms, Garage, MasterSuite, ServiceAreas } from './PrivateRooms';

/** Cômodos com grandes panos de vidro: o mobiliário aparece de fora a qualquer distância. */
const ALWAYS_VISIBLE = new Set(['living', 'dining', 'kitchen', 'foyer', 'gallery', 'master', 'office']);

/**
 * Todos os ambientes internos. Um LOD por cômodo desliga o mobiliário de
 * cômodos distantes e sem vista de fora (economiza milhares de draw calls) e
 * respeita o corte por pavimento da vista "casa de bonecas".
 */
export function InteriorRooms() {
  useRoomLodUpdater();
  return (
    <group name="InteriorRooms">
      <LivingRoom />
      <DiningRoom />
      <Kitchen />
      <FoyerGallery />
      <Office />
      <Cinema />
      <MasterSuite />
      <Bedrooms />
      <Bathrooms />
      <Garage />
      <ServiceAreas />
    </group>
  );
}

function useRoomLodUpdater() {
  const last = useRef(0);
  const prev = useRef('');
  useFrame(({ camera, clock }) => {
    if (clock.elapsedTime - last.current < 0.25) return;
    last.current = clock.elapsedTime;
    const { mode, cutLevel, quality } = useExperience.getState();
    const maxDist = QUALITY[quality].furnitureDistance;
    const cut = mode === 'walk' ? null : cutLevel;
    const vis: Record<string, boolean> = {};
    let sig = '';
    for (const rm of ROOMS) {
      let v: boolean;
      if (mode === 'explode') v = cut === null || rm.level === cut;
      else if (cut === 0 && rm.level === 1) v = false;
      else if ((mode === 'interior' || mode === 'top') && cut !== null) v = rm.level <= cut;
      else if (ALWAYS_VISIBLE.has(rm.id) && mode !== 'walk') v = true;
      else {
        const cx = (rm.rect.x0 + rm.rect.x1) / 2;
        const cz = (rm.rect.z0 + rm.rect.z1) / 2;
        const half = Math.hypot(rm.rect.x1 - rm.rect.x0, rm.rect.z1 - rm.rect.z0) / 2;
        const d = Math.hypot(camera.position.x - cx, camera.position.y - (LEVEL_Y[rm.level] + 1.5), camera.position.z - cz) - half;
        v = d < (mode === 'walk' ? Math.min(maxDist, 30) : maxDist);
      }
      vis[rm.id] = v;
      sig += v ? '1' : '0';
    }
    if (sig !== prev.current) {
      prev.current = sig;
      useRoomLOD.getState().set(vis);
    }
  });
}
