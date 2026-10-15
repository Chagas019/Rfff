import { PerformanceMonitor } from '@react-three/drei';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { City, ContinentId, Route } from '../data/types';
import { useCountries } from '../hooks/useCountries';
import { continentAt } from '../lib/continents';
import { maxDpr, type Quality } from '../lib/device';
import { clamp, vec3ToLatLon } from '../lib/geo';
import type { GlobeController } from '../lib/globeController';
import { otherEnd, routesOf } from '../lib/network';
import { introState, storyState } from '../lib/sceneState';
import { ConnectionLines, type ArcSpec } from './ConnectionLines';
import { CityMarkers } from './globe/CityMarkers';
import { Atmosphere, Backdrop, Earth, createLightState, type LightState } from './globe/Earth';
import { ContinentHighlight, OrbitRings, Particles, Ripples, type HighlightSpec, type RippleSpec } from './globe/Effects';

export interface GlobeSceneProps {
  mode: 'hero' | 'explore';
  controller: GlobeController;
  /** Cidades com marcador visível (já filtradas). */
  cities: City[];
  routes: Route[];
  byId: Map<string, City>;
  selectedId: string | null;
  highlight: HighlightSpec | null;
  active: boolean;
  quality: Quality;
  reduced: boolean;
  onHoverCity: (city: City | null, x: number, y: number) => void;
  onSelectCity: (city: City) => void;
  onContinent: (continent: ContinentId, lat: number, lon: number) => void;
  onDoubleClick: () => void;
  /** Rolagem sem Ctrl/⌘ sobre o globo (modo explore): a página rola e mostramos uma dica. */
  onWheelHint?: () => void;
  onContextLost?: () => void;
  /** Chamado quando as texturas carregaram e o globo está pronto para ser exibido. */
  onReady?: () => void;
}

/* ------------------------------------------------------------------ */
/* Storytelling: posições do globo ao longo da rolagem (modo hero)     */
/* ------------------------------------------------------------------ */

interface StoryFrame {
  p: number;
  x: number;
  y: number;
  dist: number;
  sunAz: number;
  sunEl: number;
  warm: number;
  night: number;
  exposure: number;
}

const STORY: StoryFrame[] = [
  // topo: globo baixo e central, com "Reimagined." aparecendo atrás dele
  { p: 0.0, x: 0.0, y: -0.66, dist: 4.5, sunAz: -1.25, sunEl: 0.28, warm: 0.0, night: 1.1, exposure: 1 },
  // capítulo 1 (texto à esquerda): globo à direita, dia
  { p: 0.33, x: 1.05, y: 0.0, dist: 3.7, sunAz: -0.6, sunEl: 0.25, warm: 0.05, night: 1.0, exposure: 1 },
  // capítulo 2 (texto à direita): globo à esquerda, lado noturno com luzes em âmbar
  { p: 0.66, x: -1.05, y: 0.0, dist: 3.6, sunAz: 2.35, sunEl: 0.15, warm: 0.6, night: 1.6, exposure: 1 },
  // capítulo 3 (frase central): globo afastado e mais escuro para a leitura
  { p: 1.0, x: 0.0, y: 0.0, dist: 5.6, sunAz: 1.85, sunEl: 0.3, warm: 0.35, night: 1.35, exposure: 0.7 },
];

const ease = (t: number) => t * t * (3 - 2 * t);

function sampleStory(p: number): StoryFrame {
  const q = clamp(p, 0, 1);
  let i = 0;
  while (i < STORY.length - 2 && q > STORY[i + 1].p) i++;
  const a = STORY[i];
  const b = STORY[i + 1];
  const t = ease(clamp((q - a.p) / (b.p - a.p), 0, 1));
  const mix = (k: keyof StoryFrame) => a[k] + (b[k] - a[k]) * t;
  return {
    p: q,
    x: mix('x'),
    y: mix('y'),
    dist: mix('dist'),
    sunAz: mix('sunAz'),
    sunEl: mix('sunEl'),
    warm: mix('warm'),
    night: mix('night'),
    exposure: mix('exposure'),
  };
}

const BLUE = new THREE.Color('#3d7bff');
const AMBER = new THREE.Color('#ff9f1c');
const RIM_BLUE = new THREE.Color('#5b8fff');
const RIM_AMBER = new THREE.Color('#ffb547');

/* ------------------------------------------------------------------ */
/* Controle por ponteiro: arrastar, pinça e roda do mouse              */
/* ------------------------------------------------------------------ */

function PointerControls({
  controller,
  allowZoom,
  onWheelHint,
}: {
  controller: GlobeController;
  allowZoom: boolean;
  onWheelHint?: () => void;
}) {
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    const el = gl.domElement;
    const pointers = new Map<number, { x: number; y: number }>();
    let pinchStart = 0;
    let pinchZoom = controller.zoomTarget;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        controller.beginDrag();
        el.style.cursor = 'grabbing';
      } else if (pointers.size === 2 && allowZoom) {
        const [a, b] = [...pointers.values()];
        pinchStart = Math.hypot(a.x - b.x, a.y - b.y);
        pinchZoom = controller.zoomTarget;
      }
    };
    const onMove = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      const next = { x: e.clientX, y: e.clientY };
      pointers.set(e.pointerId, next);
      if (pointers.size === 1) {
        controller.drag(next.x - prev.x, next.y - prev.y);
      } else if (pointers.size === 2 && allowZoom && pinchStart > 0) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        controller.setZoom(pinchZoom * (pinchStart / Math.max(1, d)));
      }
    };
    const onUp = (e: PointerEvent) => {
      if (!pointers.delete(e.pointerId)) return;
      if (pointers.size === 0) {
        controller.endDrag();
        el.style.cursor = '';
      }
      pinchStart = 0;
    };
    const onWheel = (e: WheelEvent) => {
      if (!allowZoom) return;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        controller.zoomBy(Math.exp(clamp(e.deltaY, -60, 60) * 0.004));
      } else {
        onWheelHint?.();
      }
    };

    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      el.removeEventListener('wheel', onWheel);
      controller.endDrag();
    };
  }, [gl, controller, allowZoom, onWheelHint]);

  return null;
}

/* ------------------------------------------------------------------ */
/* Cena                                                                 */
/* ------------------------------------------------------------------ */

function Scene(props: GlobeSceneProps) {
  const { mode, controller, cities, routes, byId, selectedId, highlight, quality, reduced } = props;
  const { onHoverCity, onSelectCity, onContinent, onDoubleClick } = props;
  const light = useMemo<LightState>(createLightState, []);
  const stage = useRef<THREE.Group>(null);
  const globe = useRef<THREE.Group>(null);
  const countries = useCountries();
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const narrow = size.width < 768;

  const [ripples, setRipples] = useState<RippleSpec[]>([]);
  const rippleId = useRef(0);
  const addRipple = useCallback((lat: number, lon: number, color: string) => {
    const id = ++rippleId.current;
    setRipples((r) => [...r.slice(-10), { id, lat, lon, color }]);
  }, []);
  const removeRipple = useCallback((id: number) => setRipples((r) => r.filter((x) => x.id !== id)), []);

  useEffect(() => {
    controller.instant = reduced;
  }, [controller, reduced]);

  const onReady = props.onReady;
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  // seleção: onda na origem e arcos ativos para os destinos
  const selected = selectedId ? (byId.get(selectedId) ?? null) : null;
  useEffect(() => {
    if (selected) addRipple(selected.lat, selected.lon, '#ffb547');
  }, [selected, addRipple]);

  const linkedIds = useMemo(() => {
    if (!selected) return new Set<string>();
    return new Set(routesOf(selected.id, routes).map((r) => otherEnd(r, selected.id)));
  }, [selected, routes]);

  const arcs = useMemo<ArcSpec[]>(() => {
    const out: ArcSpec[] = [];
    if (selected) {
      routesOf(selected.id, routes).forEach((r, i) => {
        const to = byId.get(otherEnd(r, selected.id));
        if (to) out.push({ id: `sel-${selected.id}-${to.id}`, from: selected, to, variant: 'active', delay: 0.15 + i * 0.12 });
      });
      return out;
    }
    const max = quality === 'high' ? 16 : 9;
    const step = Math.max(1, Math.floor(routes.length / max));
    routes
      .filter((_, i) => i % step === 0)
      .slice(0, max)
      .forEach((r, i) => {
        const from = byId.get(r.from);
        const to = byId.get(r.to);
        if (from && to) out.push({ id: `amb-${r.id}`, from, to, variant: 'ambient', delay: (i * 0.47) % 7 });
      });
    return out;
  }, [selected, routes, byId, quality]);

  const onArrive = useCallback((city: City) => addRipple(city.lat, city.lon, '#ffd08a'), [addRipple]);

  // clique na superfície: destaca o continente
  const handleSurfaceClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (e.delta > 6 || !globe.current || !countries) return;
      const local = globe.current.worldToLocal(e.point.clone());
      const { lat, lon } = vec3ToLatLon([local.x, local.y, local.z]);
      const continent = continentAt(countries, lat, lon);
      if (continent) {
        onContinent(continent, lat, lon);
        addRipple(lat, lon, '#8fb4ff');
      }
    },
    [countries, onContinent, addRipple],
  );
  const handleDoubleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onDoubleClick();
    },
    [onDoubleClick],
  );

  const story = useRef<StoryFrame>(sampleStory(0));
  const drawScale = useCallback(() => (mode === 'hero' ? 0.5 + 0.5 * ease(clamp((story.current.p - 0.45) / 0.5, 0, 1)) : 1), [mode]);
  const introGlobe = useCallback(() => (mode === 'hero' ? introState.globe : 1), [mode]);
  const introParticles = useCallback(() => (mode === 'hero' ? introState.particles : 0.8), [mode]);

  useFrame((_, dt) => {
    controller.update(dt);
    const aspect = size.width / Math.max(1, size.height);
    // em telas estreitas o globo precisa de mais distância para caber na largura
    const fit = clamp(1.05 / aspect, 1, 2.3);

    let sunAz = -0.55;
    let sunEl = 0.32;
    let warm = 0;
    let night = 1;
    let exposure = 1;
    let x = 0;
    let y = 0;
    let dist = controller.distance;

    if (mode === 'hero') {
      const f = sampleStory(storyState.progress);
      story.current = f;
      ({ sunAz, sunEl, warm, night, exposure } = f);
      x = narrow ? 0 : f.x;
      y = narrow ? Math.min(f.y, 0) * 0.5 - 0.35 : f.y;
      dist = f.dist * (controller.distance / controller.initialView.distance);
    }

    camera.position.set(0, 0, dist * fit);
    camera.lookAt(0, 0, 0);

    if (stage.current) {
      stage.current.position.x = THREE.MathUtils.damp(stage.current.position.x, x, 6, dt);
      stage.current.position.y = THREE.MathUtils.damp(stage.current.position.y, y, 6, dt);
      stage.current.scale.setScalar(0.9 + 0.1 * introGlobe());
    }
    if (globe.current) {
      globe.current.rotation.set(controller.rotX, controller.rotY, 0);
    }

    light.sun.set(Math.sin(sunAz) * Math.cos(sunEl), Math.sin(sunEl), Math.cos(sunAz) * Math.cos(sunEl)).normalize();
    light.exposure = introGlobe() * exposure;
    light.nightBoost = night;
    light.atmosphere = mode === 'hero' ? introState.atmosphere : 1;
    light.atmosphereColor.copy(BLUE).lerp(AMBER, warm * 0.55);
    light.rim.copy(RIM_BLUE).lerp(RIM_AMBER, warm * 0.6);
  });

  const segments = quality === 'high' ? 96 : 64;

  return (
    <>
      <group ref={stage}>
        <Backdrop light={light} />
        <group ref={globe}>
          <Earth segments={segments} light={light} onSurfaceClick={handleSurfaceClick} onSurfaceDoubleClick={handleDoubleClick} />
          <ContinentHighlight countries={countries} highlight={highlight} quality={quality} reduced={reduced} />
          <ConnectionLines arcs={arcs} quality={quality} reduced={reduced} drawScale={drawScale} onArrive={onArrive} />
          <CityMarkers
            cities={cities}
            selectedId={selectedId}
            linkedIds={linkedIds}
            hitRadius={quality === 'low' ? 0.05 : 0.034}
            reduced={reduced}
            onHover={(city, cx, cy) => {
              controller.setHoverPause(city !== null);
              onHoverCity(city, cx, cy);
            }}
            onSelect={onSelectCity}
          />
          <Ripples ripples={ripples} onDone={removeRipple} />
        </group>
        <Atmosphere light={light} segments={segments} />
        <OrbitRings reduced={reduced} intensity={introGlobe} />
      </group>
      <Particles count={quality === 'high' ? 700 : 260} reduced={reduced} opacity={introParticles} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Canvas                                                               */
/* ------------------------------------------------------------------ */

export default function GlobeScene(props: GlobeSceneProps) {
  const { active, quality, controller, mode, onWheelHint, onContextLost } = props;
  const ceiling = maxDpr(quality);
  const [dpr, setDpr] = useState(ceiling);

  return (
    <Canvas
      className="!absolute inset-0"
      style={{ touchAction: 'pan-y' }}
      frameloop={active ? 'always' : 'never'}
      dpr={dpr}
      flat
      camera={{ fov: 35, near: 0.1, far: 60, position: [0, 0, 3.4] }}
      gl={{ antialias: quality === 'high', alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          onContextLost?.();
        });
      }}
      aria-hidden="true"
    >
      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.max(1, d - 0.5))}
        onIncline={() => setDpr((d) => Math.min(ceiling, d + 0.25))}
      />
      <PointerControls controller={controller} allowZoom={mode === 'explore'} onWheelHint={onWheelHint} />
      <Suspense fallback={null}>
        <Scene {...props} />
      </Suspense>
    </Canvas>
  );
}
