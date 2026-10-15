import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { City } from '../data/types';
import { arcControlPoints } from '../lib/geo';
import { arcFragment, uvVertex } from './globe/shaders';

export interface ArcSpec {
  id: string;
  from: City;
  to: City;
  /** `ambient`: ciclo contínuo de desenhar/apagar. `active`: desenha uma vez e permanece. */
  variant: 'ambient' | 'active';
  delay: number;
}

const COLORS = {
  ambient: new THREE.Color('#7fa8ff'),
  active: new THREE.Color('#ffb547'),
};

const AMBIENT_PERIOD = 7.5;

interface ArcProps {
  spec: ArcSpec;
  quality: 'high' | 'low';
  reduced: boolean;
  /** Progresso global do storytelling (0 → 1), usado para "desenhar" as linhas com o scroll. */
  drawScale?: () => number;
  onArrive?: (city: City) => void;
}

function Arc({ spec, quality, reduced, drawScale, onArrive }: ArcProps) {
  const { from, to, variant, delay } = spec;
  const born = useRef<number | null>(null);
  const arrived = useRef(false);
  const particle = useRef<THREE.Mesh>(null);

  const { curve, geometry } = useMemo(() => {
    const pts = arcControlPoints(from, to, 1.003).map(([x, y, z]) => new THREE.Vector3(x, y, z));
    const c = new THREE.CubicBezierCurve3(pts[0], pts[1], pts[2], pts[3]);
    const radius = variant === 'active' ? 0.0046 : 0.0032;
    const g = new THREE.TubeGeometry(c, quality === 'high' ? 72 : 40, radius, quality === 'high' ? 6 : 4, false);
    return { curve: c, geometry: g };
  }, [from, to, variant, quality]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: uvVertex,
        fragmentShader: arcFragment,
        uniforms: {
          uColor: { value: COLORS[variant].clone() },
          uDraw: { value: 0 },
          uOpacity: { value: 0 },
          uHead: { value: -1 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [variant],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (born.current === null) born.current = t;
    const local = t - born.current - delay;
    const u = material.uniforms;
    let draw = 0;
    let opacity = 0;

    if (reduced) {
      draw = local >= 0 ? 1 : 0;
      opacity = draw;
    } else if (variant === 'active') {
      draw = THREE.MathUtils.clamp(local / 1.1, 0, 1);
      draw = 1 - Math.pow(1 - draw, 3);
      opacity = local >= 0 ? 1 : 0;
    } else if (local >= 0) {
      const cyc = local % AMBIENT_PERIOD;
      draw = THREE.MathUtils.smoothstep(cyc, 0, 1.8);
      opacity = 1 - THREE.MathUtils.smoothstep(cyc, AMBIENT_PERIOD - 1.4, AMBIENT_PERIOD);
    }

    const scale = drawScale ? drawScale() : 1;
    u.uDraw.value = draw * scale;
    u.uOpacity.value = opacity * (0.35 + 0.65 * scale);

    const traveling = !reduced && draw >= 0.999 && opacity > 0.05;
    const head = traveling ? (local * (variant === 'active' ? 0.45 : 0.3)) % 1 : -1;
    u.uHead.value = head;

    if (particle.current) {
      particle.current.visible = traveling;
      if (traveling) particle.current.position.copy(curve.getPointAt(head));
    }

    if (variant === 'active' && draw >= 0.999 && !arrived.current) {
      arrived.current = true;
      onArrive?.(to);
    }
  });

  return (
    <group>
      <mesh geometry={geometry} material={material} raycast={() => null} />
      <mesh ref={particle} visible={false} raycast={() => null}>
        <sphereGeometry args={[variant === 'active' ? 0.009 : 0.006, 10, 10]} />
        <meshBasicMaterial
          color={variant === 'active' ? '#ffe2b0' : '#dbe7ff'}
          toneMapped={false}
          transparent
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

interface ConnectionLinesProps {
  arcs: ArcSpec[];
  quality: 'high' | 'low';
  reduced: boolean;
  drawScale?: () => number;
  onArrive?: (city: City) => void;
}

/** Arcos animados entre cidades, com partículas percorrendo as linhas. */
export function ConnectionLines({ arcs, quality, reduced, drawScale, onArrive }: ConnectionLinesProps) {
  return (
    <group>
      {arcs.map((spec) => (
        <Arc key={spec.id} spec={spec} quality={quality} reduced={reduced} drawScale={drawScale} onArrive={onArrive} />
      ))}
    </group>
  );
}
