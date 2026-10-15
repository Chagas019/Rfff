import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { City } from '../../data/types';
import { latLonToVec3 } from '../../lib/geo';

const AMBER = new THREE.Color('#ffb547');
const WHITE = new THREE.Color('#eaf1ff');
const BLUE = new THREE.Color('#8fb4ff');

interface CityMarkersProps {
  cities: City[];
  selectedId: string | null;
  linkedIds: Set<string>;
  hitRadius: number;
  reduced: boolean;
  onHover: (city: City | null, x: number, y: number) => void;
  onSelect: (city: City) => void;
}

interface MarkerRefs {
  dot: THREE.Mesh;
  halo: THREE.Mesh;
  beam: THREE.Mesh;
}

/** `true` se a Terra estiver na frente do ponto (ponto do outro lado do planeta). */
function isOccluded(e: ThreeEvent<PointerEvent | MouseEvent>): boolean {
  return e.intersections.some((i) => i.object.userData.earth === true && i.distance < e.distance - 1e-4);
}

/** Pontos luminosos das cidades, com halo pulsante, feixe de luz no selecionado e área de toque ampliada. */
export function CityMarkers({ cities, selectedId, linkedIds, hitRadius, reduced, onHover, onSelect }: CityMarkersProps) {
  const refs = useRef(new Map<string, MarkerRefs>());
  const hovered = useRef<string | null>(null);

  const geo = useMemo(
    () => ({
      dot: new THREE.CircleGeometry(0.0095, 20),
      halo: new THREE.RingGeometry(0.012, 0.0145, 40),
      beam: new THREE.CylinderGeometry(0.0016, 0.0035, 0.16, 8, 1, true).translate(0, 0.08, 0).rotateX(Math.PI / 2),
      hit: new THREE.SphereGeometry(1, 10, 10),
    }),
    [],
  );
  const hitMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }),
    [],
  );
  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => g.dispose());
      hitMaterial.dispose();
    },
    [geo, hitMaterial],
  );

  const placed = useMemo(
    () =>
      cities.map((c) => {
        const [x, y, z] = latLonToVec3(c.lat, c.lon, 1.002);
        const pos = new THREE.Vector3(x, y, z);
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize());
        return { city: c, pos, quat, phase: (c.lat * 13.37 + c.lon * 7.1) % 3 };
      }),
    [cities],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (const { city, phase } of placed) {
      const r = refs.current.get(city.id);
      if (!r) continue;
      const selected = city.id === selectedId;
      const linked = linkedIds.has(city.id);
      const isHover = hovered.current === city.id;
      const base = selected ? 1.9 : isHover ? 1.6 : linked ? 1.3 : 1;
      r.dot.scale.setScalar(THREE.MathUtils.lerp(r.dot.scale.x, base, 0.18));
      const dotMat = r.dot.material as THREE.MeshBasicMaterial;
      dotMat.color.copy(selected || linked ? AMBER : isHover ? WHITE : BLUE);

      const cycle = reduced ? 0.35 : ((t * 0.55 + phase) % 1.6) / 1.6;
      r.halo.scale.setScalar(base * (1 + cycle * 1.8));
      const haloMat = r.halo.material as THREE.MeshBasicMaterial;
      haloMat.opacity = (1 - cycle) * (selected ? 0.95 : 0.55);
      haloMat.color.copy(selected || linked ? AMBER : BLUE);

      r.beam.visible = selected || isHover;
      (r.beam.material as THREE.MeshBasicMaterial).opacity = selected ? 0.75 : 0.4;
    }
  });

  return (
    <group>
      {placed.map(({ city, pos, quat }) => (
        <group key={city.id} position={pos} quaternion={quat}>
          <mesh
            geometry={geo.dot}
            ref={(m) => {
              if (!m) return;
              const prev = refs.current.get(city.id);
              refs.current.set(city.id, { ...(prev ?? ({} as MarkerRefs)), dot: m });
            }}
            raycast={() => null}
          >
            <meshBasicMaterial transparent toneMapped={false} depthWrite={false} />
          </mesh>
          <mesh
            geometry={geo.halo}
            ref={(m) => {
              if (!m) return;
              const prev = refs.current.get(city.id);
              refs.current.set(city.id, { ...(prev ?? ({} as MarkerRefs)), halo: m });
            }}
            raycast={() => null}
          >
            <meshBasicMaterial
              transparent
              toneMapped={false}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh
            geometry={geo.beam}
            visible={false}
            ref={(m) => {
              if (!m) return;
              const prev = refs.current.get(city.id);
              refs.current.set(city.id, { ...(prev ?? ({} as MarkerRefs)), beam: m });
            }}
            raycast={() => null}
          >
            <meshBasicMaterial color="#ffd08a" transparent toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
          {/* área de clique maior que o ponto visível (melhor para toque) */}
          <mesh
            geometry={geo.hit}
            material={hitMaterial}
            scale={hitRadius}
            onPointerOver={(e) => {
              if (isOccluded(e)) return;
              e.stopPropagation();
              hovered.current = city.id;
              onHover(city, e.nativeEvent.clientX, e.nativeEvent.clientY);
            }}
            onPointerMove={(e) => {
              if (isOccluded(e)) {
                if (hovered.current === city.id) {
                  hovered.current = null;
                  onHover(null, 0, 0);
                }
                return;
              }
              e.stopPropagation();
              hovered.current = city.id;
              onHover(city, e.nativeEvent.clientX, e.nativeEvent.clientY);
            }}
            onPointerOut={() => {
              if (hovered.current === city.id) {
                hovered.current = null;
                onHover(null, 0, 0);
              }
            }}
            onClick={(e) => {
              if (isOccluded(e) || e.delta > 8) return;
              e.stopPropagation();
              onSelect(city);
            }}
          />
        </group>
      ))}
    </group>
  );
}
