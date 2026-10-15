import { useTexture } from '@react-three/drei';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { atmosphereFragment, atmosphereVertex, backdropFragment, earthFragment, earthVertex, uvVertex } from './shaders';

export const TEXTURES = {
  day: `${import.meta.env.BASE_URL}textures/earth-day.webp`,
  night: `${import.meta.env.BASE_URL}textures/earth-night.webp`,
  water: `${import.meta.env.BASE_URL}textures/earth-water.webp`,
};

/** Parâmetros de luz que a cena altera a cada quadro (storytelling e abertura). */
export interface LightState {
  sun: THREE.Vector3;
  exposure: number;
  nightBoost: number;
  atmosphere: number;
  atmosphereColor: THREE.Color;
  rim: THREE.Color;
}

export function createLightState(): LightState {
  return {
    sun: new THREE.Vector3(-0.6, 0.3, 0.8).normalize(),
    exposure: 1,
    nightBoost: 1,
    atmosphere: 1,
    atmosphereColor: new THREE.Color('#3d7bff'),
    rim: new THREE.Color('#5b8fff'),
  };
}

interface EarthProps {
  segments: number;
  light: LightState;
  onSurfaceClick?: (e: ThreeEvent<MouseEvent>) => void;
  onSurfaceDoubleClick?: (e: ThreeEvent<MouseEvent>) => void;
}

/** Esfera da Terra com dia/noite, reflexo na água e borda luminosa. */
export function Earth({ segments, light, onSurfaceClick, onSurfaceDoubleClick }: EarthProps) {
  const gl = useThree((s) => s.gl);
  const [day, night, water] = useTexture([TEXTURES.day, TEXTURES.night, TEXTURES.water]);

  useLayoutEffect(() => {
    const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy());
    for (const t of [day, night]) {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = aniso;
      t.needsUpdate = true;
    }
    water.colorSpace = THREE.NoColorSpace;
    water.needsUpdate = true;
  }, [day, night, water, gl]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: earthVertex,
        fragmentShader: earthFragment,
        uniforms: {
          uDay: { value: day },
          uNight: { value: night },
          uWater: { value: water },
          uSun: { value: new THREE.Vector3() },
          uRim: { value: new THREE.Color() },
          uExposure: { value: 1 },
          uNightBoost: { value: 1 },
        },
      }),
    [day, night, water],
  );
  const geometry = useMemo(() => new THREE.SphereGeometry(1, segments, Math.round(segments / 2)), [segments]);

  useLayoutEffect(
    () => () => {
      material.dispose();
      geometry.dispose();
    },
    [material, geometry],
  );

  useFrame(() => {
    const u = material.uniforms;
    (u.uSun.value as THREE.Vector3).copy(light.sun);
    (u.uRim.value as THREE.Color).copy(light.rim);
    u.uExposure.value = light.exposure;
    u.uNightBoost.value = light.nightBoost;
  });

  return (
    <mesh
      geometry={geometry}
      material={material}
      userData={{ earth: true }}
      onClick={onSurfaceClick}
      onDoubleClick={onSurfaceDoubleClick}
    />
  );
}

/** Halo atmosférico ao redor do planeta. */
export function Atmosphere({ light, segments }: { light: LightState; segments: number }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVertex,
        fragmentShader: atmosphereFragment,
        uniforms: { uColor: { value: new THREE.Color() }, uIntensity: { value: 1 } },
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  useLayoutEffect(() => () => material.dispose(), [material]);
  useFrame(() => {
    (material.uniforms.uColor.value as THREE.Color).copy(light.atmosphereColor);
    material.uniforms.uIntensity.value = light.atmosphere;
  });
  return (
    <mesh scale={1.16} material={material} raycast={() => null}>
      <sphereGeometry args={[1, segments, Math.round(segments / 2)]} />
    </mesh>
  );
}

/** Brilho volumétrico simulado atrás do globo. */
export function Backdrop({ light }: { light: LightState }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: uvVertex,
        fragmentShader: backdropFragment,
        uniforms: {
          uColor: { value: new THREE.Color() },
          uColor2: { value: new THREE.Color('#ffb547') },
          uIntensity: { value: 1 },
        },
        transparent: true,
        depthWrite: false,
        // soma a cor sem escrever alfa: o canvas continua transparente e o título atrás dele aparece
        blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneFactor,
        blendSrcAlpha: THREE.ZeroFactor,
        blendDstAlpha: THREE.OneFactor,
      }),
    [],
  );
  useLayoutEffect(() => () => material.dispose(), [material]);
  useFrame(() => {
    (material.uniforms.uColor.value as THREE.Color).copy(light.atmosphereColor);
    material.uniforms.uIntensity.value = light.atmosphere * 0.9;
  });
  return (
    <mesh position={[0, 0, -2.2]} material={material} raycast={() => null}>
      <planeGeometry args={[9, 9]} />
    </mesh>
  );
}
