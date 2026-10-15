import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { ContinentId } from '../../data/types';
import { drawContinent, type CountryFeature } from '../../lib/continents';
import { latLonToVec3 } from '../../lib/geo';
import { highlightFragment, highlightVertex, particlesFragment, particlesVertex } from './shaders';

/* ------------------------------------------------------------------ */
/* Ondas de expansão (ativação de conexões e cliques)                  */
/* ------------------------------------------------------------------ */

export interface RippleSpec {
  id: number;
  lat: number;
  lon: number;
  color: string;
}

function Ripple({ spec, onDone }: { spec: RippleSpec; onDone: (id: number) => void }) {
  const ref = useRef<THREE.Mesh>(null);
  const born = useRef<number | null>(null);
  const done = useRef(false);
  const { pos, quat } = useMemo(() => {
    const [x, y, z] = latLonToVec3(spec.lat, spec.lon, 1.004);
    const p = new THREE.Vector3(x, y, z);
    return { pos: p, quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), p.clone().normalize()) };
  }, [spec.lat, spec.lon]);

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    if (born.current === null) born.current = clock.elapsedTime;
    const age = (clock.elapsedTime - born.current) / 1.5;
    mesh.scale.setScalar(1 + age * 7);
    (mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - age) ** 2;
    if (age >= 1 && !done.current) {
      done.current = true;
      onDone(spec.id);
    }
  });

  return (
    <mesh ref={ref} position={pos} quaternion={quat} raycast={() => null}>
      <ringGeometry args={[0.012, 0.017, 48]} />
      <meshBasicMaterial
        color={spec.color}
        transparent
        toneMapped={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export function Ripples({ ripples, onDone }: { ripples: RippleSpec[]; onDone: (id: number) => void }) {
  return (
    <group>
      {ripples.map((r) => (
        <Ripple key={r.id} spec={r} onDone={onDone} />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Destaque luminoso de continente                                     */
/* ------------------------------------------------------------------ */

export interface HighlightSpec {
  continent: ContinentId;
  lat: number;
  lon: number;
  key: number;
}

export function ContinentHighlight({
  countries,
  highlight,
  quality,
  reduced,
}: {
  countries: CountryFeature[] | null;
  highlight: HighlightSpec | null;
  quality: 'high' | 'low';
  reduced: boolean;
}) {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = quality === 'high' ? 2048 : 1024;
    c.height = c.width / 2;
    return c;
  }, [quality]);
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.NoColorSpace;
    return t;
  }, [canvas]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: highlightVertex,
        fragmentShader: highlightFragment,
        uniforms: {
          uMask: { value: texture },
          uOrigin: { value: new THREE.Vector3(0, 0, 1) },
          uProgress: { value: 0 },
          uOpacity: { value: 0 },
          uTime: { value: 0 },
          uColorA: { value: new THREE.Color('#b8743c') },
          uColorB: { value: new THREE.Color('#ffcf9e') },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [texture],
  );

  useEffect(
    () => () => {
      texture.dispose();
      material.dispose();
    },
    [texture, material],
  );

  const state = useRef({ start: -1, visible: false, opacity: 0 });

  // redesenha a máscara (R = preenchimento, G = contorno) quando o continente muda
  useEffect(() => {
    if (!highlight || !countries) {
      state.current.visible = false;
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgb(255,0,0)';
    ctx.strokeStyle = 'rgba(0,0,0,0)';
    drawContinent(ctx, countries, highlight.continent);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.strokeStyle = 'rgb(0,255,0)';
    ctx.lineWidth = canvas.width / 1024;
    drawContinent(ctx, countries, highlight.continent);
    texture.needsUpdate = true;

    const [x, y, z] = latLonToVec3(highlight.lat, highlight.lon, 1);
    (material.uniforms.uOrigin.value as THREE.Vector3).set(x, y, z).normalize();
    state.current.start = -1;
    state.current.visible = true;
  }, [highlight, countries, canvas, texture, material]);

  const mesh = useRef<THREE.Mesh>(null);

  useFrame(({ clock }, dt) => {
    const s = state.current;
    const u = material.uniforms;
    u.uTime.value = clock.elapsedTime;
    if (s.visible && s.start < 0) s.start = clock.elapsedTime;
    const age = s.start < 0 ? 0 : clock.elapsedTime - s.start;
    u.uProgress.value = reduced ? 4 : Math.min(4, age * 2.6);
    s.opacity = THREE.MathUtils.damp(s.opacity, s.visible ? 1 : 0, 6, dt);
    u.uOpacity.value = s.opacity;
    if (mesh.current) mesh.current.visible = s.opacity > 0.01;
  });

  return (
    <mesh ref={mesh} material={material} scale={1.0035} visible={false} raycast={() => null}>
      <sphereGeometry args={[1, quality === 'high' ? 96 : 64, quality === 'high' ? 48 : 32]} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Anéis orbitais                                                       */
/* ------------------------------------------------------------------ */

function DottedRing({ radius, count, color, opacity }: { radius: number; count: number; color: string; opacity: number }) {
  const geometry = useMemo(() => {
    const pts = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      pts[i * 3] = Math.cos(a) * radius;
      pts[i * 3 + 1] = Math.sin(a) * radius;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    return g;
  }, [radius, count]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <points geometry={geometry} raycast={() => null}>
      <pointsMaterial color={color} size={0.012} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </points>
  );
}

export function OrbitRings({ reduced, intensity }: { reduced: boolean; intensity: () => number }) {
  const a = useRef<THREE.Group>(null);
  const b = useRef<THREE.Group>(null);
  const sat = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const t = reduced ? 0 : clock.elapsedTime;
    if (a.current) a.current.rotation.z = t * 0.05;
    if (b.current) b.current.rotation.z = -t * 0.03;
    if (sat.current) {
      const ang = t * 0.35;
      sat.current.position.set(Math.cos(ang) * 1.42, Math.sin(ang) * 1.42, 0);
    }
    if (ringMat.current) ringMat.current.opacity = 0.22 * intensity();
  });

  return (
    <group>
      <group rotation={[1.28, 0.22, 0]}>
        <group ref={a}>
          <mesh raycast={() => null}>
            <ringGeometry args={[1.418, 1.422, 160]} />
            <meshBasicMaterial
              ref={ringMat}
              color="#ffedd7"
              transparent
              opacity={0.22}
              side={THREE.DoubleSide}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <mesh ref={sat} raycast={() => null}>
            <sphereGeometry args={[0.012, 12, 12]} />
            <meshBasicMaterial color="#f07a2c" toneMapped={false} />
          </mesh>
        </group>
      </group>
      <group rotation={[1.9, -0.55, 0.35]}>
        <group ref={b}>
          <DottedRing radius={1.72} count={220} color="#6c5f51" opacity={0.35} />
        </group>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Partículas flutuantes                                               */
/* ------------------------------------------------------------------ */

export function Particles({ count, reduced, opacity }: { count: number; reduced: boolean; opacity: () => number }) {
  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const col = new Float32Array(count * 3);
    const blue = new THREE.Color('#e9d3b8');
    const white = new THREE.Color('#ffffff');
    const amber = new THREE.Color('#f07a2c');
    for (let i = 0; i < count; i++) {
      // casca esférica ao redor do planeta
      const r = 1.35 + Math.pow(Math.random(), 1.6) * 3.4;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph) * 0.75;
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      seed[i] = Math.random();
      const roll = Math.random();
      const c = roll < 0.1 ? amber : roll < 0.55 ? blue : white;
      col.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    return g;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: particlesVertex,
        fragmentShader: particlesFragment,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: 26 },
          uPixelRatio: { value: 1 },
          uOpacity: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(({ clock, gl }) => {
    material.uniforms.uTime.value = reduced ? 0 : clock.elapsedTime;
    material.uniforms.uPixelRatio.value = gl.getPixelRatio();
    material.uniforms.uOpacity.value = opacity();
  });

  return <points geometry={geometry} material={material} raycast={() => null} />;
}
