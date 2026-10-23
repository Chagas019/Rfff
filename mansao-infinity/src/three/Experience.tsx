import { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { AdaptiveDpr, PerformanceMonitor, Preload } from '@react-three/drei';
import * as THREE from 'three';
import { QUALITY, QUALITY_ORDER } from '../config/quality';
import { MaterialsProvider } from '../materials/library';
import { useExperience } from '../store/useExperience';
import { MansionStructure } from './structure/MansionStructure';
import { Doors } from './structure/Doors';
import { Stairs } from './structure/Stairs';
import { InteriorRooms } from './rooms/InteriorRooms';
import { MansionExterior } from './exterior/MansionExterior';
import { SwimmingPool } from './exterior/SwimmingPool';
import { Landscape } from './exterior/Landscape';
import { LightingSystem } from './LightingSystem';
import { CameraController } from './controls/CameraController';
import { FirstPersonController } from './controls/FirstPersonController';
import { TourController } from './controls/TourController';
import { PostFX } from './PostFX';
import { ExplodeDriver } from './structure/explode';
import { PresentationBoard } from './PresentationBoard';

/** Toda a propriedade (casa + implantação), dentro do provedor de materiais. */
function Mansion() {
  return (
    <MaterialsProvider>
      <ExplodeDriver />
      <MansionStructure />
      <Doors />
      <Stairs />
      <InteriorRooms />
      <MansionExterior />
      <Site />
      <PresentationBoard />
      <LightingSystem />
      <PostFX />
      <Preload all />
    </MaterialsProvider>
  );
}

/** Implantação (terreno, piscina, paisagismo) — some na prancha de apresentação. */
function Site() {
  const explode = useExperience((s) => s.mode === 'explode');
  return (
    <group visible={!explode}>
      <SwimmingPool />
      <Landscape />
    </group>
  );
}

function Controls() {
  const mode = useExperience((s) => s.mode);
  return (
    <>
      {mode === 'walk' ? <FirstPersonController /> : <CameraController />}
      <TourController />
    </>
  );
}

/** Ajusta tone mapping e sombras conforme o perfil de qualidade. */
function RendererSettings() {
  const gl = useThree((s) => s.gl);
  const quality = useExperience((s) => s.quality);
  useEffect(() => {
    const q = QUALITY[quality];
    gl.toneMapping = q.postprocessing ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
    gl.shadowMap.enabled = q.shadows;
    // sombras macias (VSM) nos perfis alta e ultra; PCF nos demais
    gl.shadowMap.type = quality === 'high' || quality === 'ultra' ? THREE.VSMShadowMap : THREE.PCFShadowMap;
    gl.shadowMap.needsUpdate = true;
  }, [gl, quality]);
  return null;
}

/**
 * Canvas WebGL. O perfil de qualidade define resolução, sombras e efeitos; no
 * modo automático, o PerformanceMonitor sobe ou desce o perfil conforme o FPS
 * medido no aparelho.
 */
export default function Experience() {
  const quality = useExperience((s) => s.quality);
  const qualityAuto = useExperience((s) => s.qualityAuto);
  const setQuality = useExperience((s) => s.setQuality);
  const q = QUALITY[quality];

  const step = (dir: 1 | -1) => {
    if (!useExperience.getState().qualityAuto) return;
    const i = QUALITY_ORDER.indexOf(useExperience.getState().quality);
    const next = QUALITY_ORDER[Math.min(QUALITY_ORDER.length - 2, Math.max(0, i + dir))];
    if (next !== useExperience.getState().quality) setQuality(next, true);
  };

  return (
    <Canvas
      shadows
      dpr={q.dpr}
      gl={{ antialias: q.antialias, powerPreference: 'high-performance', stencil: false, preserveDrawingBuffer: false }}
      camera={{ fov: 50, near: 0.1, far: 3200, position: [88, 46, 96] }}
      onCreated={(state) => {
        state.gl.outputColorSpace = THREE.SRGBColorSpace;
        if (new URLSearchParams(window.location.search).has('qa')) (window as unknown as { r3f: unknown }).r3f = state;
      }}
      aria-label="Modelo 3D interativo da Mansão Infinity"
    >
      <RendererSettings />
      {qualityAuto && <PerformanceMonitor onIncline={() => step(1)} onDecline={() => step(-1)} flipflops={3} />}
      <AdaptiveDpr pixelated={false} />
      <Suspense fallback={null}>
        <Mansion />
      </Suspense>
      <Controls />
    </Canvas>
  );
}
