import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Html, Lightformer, OrbitControls, Sky } from '@react-three/drei';
import { EffectComposer, Bloom, BrightnessContrast, N8AO, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import type { OrbitControls as OrbitImpl } from 'three-stdlib';
import * as THREE from 'three';
import { H, ROOMS, roomCenter } from '../data/plan';
import { MaterialsProvider } from '../materials/materials';
import { useStore, type View } from '../store';
import { Furniture } from './Furniture';
import { House, PIT_Y } from './House';
import { Site } from './Site';

interface Shot {
  pos: [number, number, number];
  target: [number, number, number];
  fov: number;
}

/** Enquadramentos de cada vista (o retrato estreito afasta a câmera). */
export const SHOTS: Record<View, Shot> = {
  aerea: { pos: [0, 31, 27], target: [0, 0.5, 0.5], fov: 36 },
  corte: { pos: [0, 36, 18.5], target: [0, -0.4, 0.4], fov: 34 },
  interior: { pos: [0.6, 1.55, 3.35], target: [-0.6, 0.0, -2.2], fov: 62 },
};

function CameraRig() {
  const view = useStore((s) => s.view);
  const shot = useStore((s) => s.shot);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const controls = useRef<OrbitImpl>(null);
  const anim = useRef({ t: 1, fromPos: new THREE.Vector3(), fromTarget: new THREE.Vector3(), fromFov: 40 });

  const goal = useMemo(() => {
    const s = SHOTS[view];
    const aspect = size.width / Math.max(size.height, 1);
    const k = view === 'interior' ? 1 : Math.min(2.1, Math.max(1, 1.05 / aspect));
    const t = new THREE.Vector3(...s.target);
    const p = new THREE.Vector3(...s.pos).sub(t).multiplyScalar(k).add(t);
    return { pos: p, target: t, fov: s.fov };
  }, [view, size.width, size.height]);

  useEffect(() => {
    const a = anim.current;
    a.fromPos.copy(camera.position);
    a.fromTarget.copy(controls.current ? controls.current.target : goal.target);
    a.fromFov = camera.fov;
    a.t = shot === 0 ? 1 : 0;
    if (shot === 0) {
      camera.position.copy(goal.pos);
      camera.fov = goal.fov;
      camera.updateProjectionMatrix();
      controls.current?.target.copy(goal.target);
      controls.current?.update();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shot, goal]);

  useFrame((_, dt) => {
    const a = anim.current;
    if (a.t >= 1 || !controls.current) return;
    a.t = Math.min(1, a.t + dt / 1.6);
    const e = a.t < 0.5 ? 4 * a.t ** 3 : 1 - (-2 * a.t + 2) ** 3 / 2;
    camera.position.lerpVectors(a.fromPos, goal.pos, e);
    controls.current.target.lerpVectors(a.fromTarget, goal.target, e);
    camera.fov = THREE.MathUtils.lerp(a.fromFov, goal.fov, e);
    camera.updateProjectionMatrix();
    controls.current.update();
  });

  const interior = view === 'interior';
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={interior ? 0.5 : 8}
      maxDistance={interior ? 6 : 90}
      maxPolarAngle={interior ? Math.PI * 0.62 : Math.PI * 0.47}
      target={goal.target}
    />
  );
}

/** Luzes dos ambientes, do fogo e o sol/lua conforme a vista e a hora. */
function Lights() {
  const view = useStore((s) => s.view);
  const light = useStore((s) => s.light);
  const night = light === 'noite';
  const studio = view === 'corte' && !night;
  const fire = useRef<THREE.PointLight[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    fire.current.forEach((l, i) => {
      if (!l) return;
      l.intensity = (night ? 9 : 3.5) * (0.85 + 0.1 * Math.sin(t * 9 + i) + 0.06 * Math.sin(t * 23 + i * 3));
    });
  });
  const sunDir = studio ? new THREE.Vector3(-0.42, 0.86, 0.5) : night ? new THREE.Vector3(0.45, 0.6, -0.5) : new THREE.Vector3(-0.62, 0.5, 0.6);
  sunDir.normalize();
  const roomI = night ? 14 : studio ? 6 : 3.5;
  return (
    <>
      <directionalLight
        position={sunDir.clone().multiplyScalar(60).toArray()}
        intensity={night ? 0.35 : studio ? 2.2 : 3.4}
        color={night ? '#9fb2ff' : studio ? '#fff3e4' : '#ffd6a2'}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={4}
        shadow-camera-left={-34}
        shadow-camera-right={34}
        shadow-camera-top={34}
        shadow-camera-bottom={-34}
        shadow-camera-near={10}
        shadow-camera-far={140}
      />
      <hemisphereLight args={[night ? '#22304f' : studio ? '#ffffff' : '#c9d6e8', night ? '#0b0a08' : studio ? '#d6cfc4' : '#5c4a33', night ? 0.2 : studio ? 0.85 : 0.55]} />
      {ROOMS.map((r) => {
        const [x, z] = roomCenter(r.k);
        return <pointLight key={r.id} position={[x, H - 0.55, z]} intensity={roomI} color="#ffc98c" decay={2} distance={8} />;
      })}
      <pointLight position={[0, H - 0.2, 0]} intensity={night ? 14 : 2} color="#ffd2a0" decay={2} distance={12} />
      <pointLight ref={(el) => void (el && (fire.current[0] = el))} position={[0, PIT_Y + 0.9, 0]} color="#ff9a4a" decay={2} distance={9} />
      {(() => {
        const [x, z] = roomCenter(0);
        const d = Math.hypot(x, z);
        return <pointLight ref={(el) => void (el && (fire.current[1] = el))} position={[(x / d) * 4.9, 0.6, (z / d) * 4.9]} color="#ff9a4a" decay={2} distance={7} />;
      })()}
    </>
  );
}

function Backdrop() {
  const view = useStore((s) => s.view);
  const light = useStore((s) => s.light);
  const scene = useThree((s) => s.scene);
  const night = light === 'noite';
  const board = view === 'corte';
  useEffect(() => {
    scene.background = new THREE.Color(board ? (night ? '#16171a' : '#e6e4df') : night ? '#0a0f1c' : '#d9c7ad');
    scene.fog = board ? null : new THREE.FogExp2(night ? '#0a0f1c' : '#cdbb9f', night ? 0.012 : 0.0075);
  }, [board, night, scene]);
  return (
    <>
      {!board && !night && <Sky distance={450} sunPosition={[-0.62, 0.18, 0.6]} turbidity={6} rayleigh={1.6} mieCoefficient={0.006} mieDirectionalG={0.85} />}
      {board && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.62, 0]} receiveShadow>
          <planeGeometry args={[400, 400]} />
          <shadowMaterial opacity={night ? 0.5 : 0.16} />
        </mesh>
      )}
      <Environment key={`${board}-${night}`} frames={1} resolution={128} background={false}>
        {night ? (
          <>
            <Lightformer form="rect" intensity={0.35} color="#8fa8ff" position={[0, 40, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[80, 80, 1]} />
          </>
        ) : board ? (
          <>
            <Lightformer form="rect" intensity={1.3} color="#ffffff" position={[0, 50, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[120, 120, 1]} />
            <Lightformer form="rect" intensity={0.7} color="#fff1df" position={[60, 25, 60]} rotation={[-0.3, Math.PI / 4, 0]} scale={[70, 35, 1]} />
            <Lightformer form="rect" intensity={0.4} color="#eef2ff" position={[-60, 25, -50]} rotation={[-0.3, 0.9, 0]} scale={[70, 35, 1]} />
          </>
        ) : (
          <>
            <Sky distance={450} sunPosition={[-0.62, 0.18, 0.6]} turbidity={6} rayleigh={1.6} />
            <Lightformer form="rect" intensity={0.5} color="#ffd9b0" position={[0, 60, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[120, 120, 1]} />
          </>
        )}
      </Environment>
    </>
  );
}

function Labels() {
  const view = useStore((s) => s.view);
  const on = useStore((s) => s.labels);
  if (view !== 'corte' || !on) return null;
  return (
    <>
      {ROOMS.map((r) => {
        const [x, z] = roomCenter(r.k);
        return (
          <Html key={r.id} position={[x * 1.02, H + 0.3, z * 1.02]} center zIndexRange={[10, 0]} className="pointer-events-none">
            <span className="room-label">{r.name}</span>
          </Html>
        );
      })}
      <Html position={[0, H + 0.3, 0]} center zIndexRange={[10, 0]} className="pointer-events-none">
        <span className="room-label">Sala rebaixada</span>
      </Html>
    </>
  );
}

function PostFX() {
  const light = useStore((s) => s.light);
  const view = useStore((s) => s.view);
  const night = light === 'noite';
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <N8AO halfRes aoRadius={view === 'interior' ? 1.2 : 2.0} distanceFalloff={1} intensity={view === 'interior' ? 2.2 : 2.6} quality="medium" />
      <Bloom mipmapBlur luminanceThreshold={night ? 0.9 : 1.2} luminanceSmoothing={0.3} intensity={night ? 0.9 : 0.4} radius={0.7} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <BrightnessContrast brightness={0} contrast={view === 'corte' ? 0.06 : 0.1} />
      <SMAA />
      <Vignette eskil={false} offset={0.3} darkness={view === 'corte' ? 0.25 : 0.45} />
    </EffectComposer>
  );
}

export function Scene() {
  const view = useStore((s) => s.view);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.toneMapping = THREE.NoToneMapping;
    gl.shadowMap.type = THREE.PCFShadowMap;
  }, [gl]);
  return (
    <>
      <CameraRig />
      <Backdrop />
      <Lights />
      <MaterialsProvider>
        <House />
        <Furniture />
        <group visible={view !== 'corte'}>
          <Site />
        </group>
      </MaterialsProvider>
      <Labels />
      <PostFX />
    </>
  );
}
