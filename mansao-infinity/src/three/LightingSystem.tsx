import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Cloud, Clouds, Environment, Lightformer, Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { LIGHTING, type LightingPreset } from '../config/lighting';
import { QUALITY } from '../config/quality';
import { ROOMS, LEVEL_Y, POOL, roomHeight } from '../data/plan';
import { useMaterials, roomLightMaterials } from '../materials/library';
import { useExperience } from '../store/useExperience';

/** Pontos de luz artificial candidatos: um por cômodo (no forro) + áreas externas. */
interface LightSource {
  id: string;
  room?: string;
  exterior?: boolean;
  pos: THREE.Vector3;
  color: THREE.Color;
  intensity: number;
  distance: number;
}

const WARM = new THREE.Color('#ffc58a');
const POOL_BLUE = new THREE.Color('#5fd2ff');

const SOURCES: LightSource[] = [
  ...ROOMS.filter((rm) => !rm.outdoor).flatMap((rm) => {
    const { x0, x1, z0, z1 } = rm.rect;
    const w = x1 - x0;
    const d = z1 - z0;
    const area = w * d;
    const y = LEVEL_Y[rm.level] + roomHeight(rm) - 0.6;
    // cômodos grandes recebem dois pontos ao longo do maior eixo
    const pts = area > 60 ? (w >= d ? [x0 + w * 0.3, x0 + w * 0.7].map((x) => [x, (z0 + z1) / 2]) : [z0 + d * 0.3, z0 + d * 0.7].map((z) => [(x0 + x1) / 2, z])) : [[(x0 + x1) / 2, (z0 + z1) / 2]];
    return pts.map(([x, z], i) => ({
      id: `${rm.id}-${i}`,
      room: rm.id,
      pos: new THREE.Vector3(x, y, z),
      color: WARM,
      intensity: Math.min(60, 10 + Math.sqrt(area / pts.length) * 5) * (rm.height && rm.height > 5 ? 2.2 : 1),
      distance: Math.max(8, Math.sqrt(area / pts.length) * 2.2) * (rm.height && rm.height > 5 ? 1.6 : 1),
    }));
  }),
  { id: 'pool', exterior: true, pos: new THREE.Vector3((POOL.x0 + POOL.x1) / 2, -0.6, (POOL.z0 + POOL.z1) / 2), color: POOL_BLUE, intensity: 45, distance: 16 },
  { id: 'gourmet', exterior: true, pos: new THREE.Vector3(-15, 2.8, -20), color: WARM, intensity: 40, distance: 14 },
  { id: 'marquise', exterior: true, pos: new THREE.Vector3(-3, 4.0, 13.5), color: WARM, intensity: 50, distance: 14 },
  { id: 'terraceGround', exterior: true, pos: new THREE.Vector3(8, 3.2, -13.5), color: WARM, intensity: 30, distance: 14 },
  { id: 'frontGarden', exterior: true, pos: new THREE.Vector3(-1, 1.5, 22), color: WARM, intensity: 22, distance: 12 },
];

const tmpColor = new THREE.Color();

/**
 * Sistema de iluminação: céu físico (dia e pôr do sol) ou céu noturno com
 * estrelas, mapa de ambiente gerado a partir do próprio céu, sol direcional
 * com sombras suaves, luz de céu (hemisférica), luzes artificiais e emissivos.
 */
export function LightingSystem() {
  const time = useExperience((s) => s.time);
  const quality = useExperience((s) => s.quality);
  const q = QUALITY[quality];
  const preset = LIGHTING[time];
  const sunDir = useMemo(() => new THREE.Vector3(...preset.sunDir).normalize(), [preset]);
  const sunPos = useMemo(() => sunDir.clone().multiplyScalar(400), [sunDir]);

  return (
    <>
      <SunAndSky preset={preset} shadowSize={q.shadowMapSize} shadows={q.shadows} />
      {time === 'night' ? (
        <>
          <NightSky />
          <Stars radius={600} depth={80} count={2500} factor={6} saturation={0} fade speed={0.3} />
          <Moon dir={sunDir} />
        </>
      ) : (
        <>
          <GradientSky preset={preset} sunDir={sunDir} />
          {quality !== 'low' && <SkyClouds sunset={time === 'sunset'} />}
        </>
      )}
      <Environment key={`${time}-${q.envResolution}`} frames={1} resolution={q.envResolution} background={false}>
        {time === 'night' ? (
          <>
            <NightSky radius={400} />
            <Lightformer form="rect" intensity={0.6} color="#ffc58a" position={[0, 3, 30]} scale={[30, 4, 1]} />
            <Lightformer form="rect" intensity={0.3} color="#8fa8ff" position={[0, 40, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[60, 60, 1]} />
          </>
        ) : (
          <>
            <Sky distance={450} sunPosition={sunPos} {...preset.sky} />
            <Lightformer form="rect" intensity={time === 'day' ? 0.6 : 0.4} color={time === 'day' ? '#ffffff' : '#ffd0a8'} position={[0, 60, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[120, 120, 1]} />
          </>
        )}
      </Environment>
      <LightPool count={q.lightPool} />
      <EmissiveDriver />
      <Downlights />
    </>
  );
}

/** Sol direcional (sombra cobrindo a propriedade) + luz hemisférica, com transição suave entre horários. */
function SunAndSky({ preset, shadowSize, shadows }: { preset: LightingPreset; shadowSize: number; shadows: boolean }) {
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const { scene, gl } = useThree();
  const target = useMemo(() => new THREE.Object3D(), []);
  const cur = useRef({ dir: new THREE.Vector3(...preset.sunDir).normalize(), sunI: preset.sunIntensity, hemiI: preset.hemiIntensity, env: preset.envIntensity, exp: preset.exposure, fogD: preset.fogDensity });
  const colors = useRef({ sun: new THREE.Color(preset.sunColor), sky: new THREE.Color(preset.hemiSky), ground: new THREE.Color(preset.hemiGround), fog: new THREE.Color(preset.fogColor) });

  useLayoutEffect(() => {
    target.position.set(-2, 0, -4);
    scene.add(target);
    scene.fog = new THREE.FogExp2(preset.fogColor, preset.fogDensity);
    return () => {
      scene.remove(target);
      scene.fog = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, target]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const k = 2.2;
    const c = cur.current;
    // dentro de casa o céu chega filtrado pelas aberturas: menos luz de ambiente
    const inside = useExperience.getState().mode === 'walk' ? 0.55 : 1;
    const goal = new THREE.Vector3(...preset.sunDir).normalize();
    c.dir.lerp(goal, 1 - Math.exp(-k * dt)).normalize();
    c.sunI = THREE.MathUtils.damp(c.sunI, preset.sunIntensity * (inside < 1 ? 0.8 : 1), k, dt);
    c.hemiI = THREE.MathUtils.damp(c.hemiI, preset.hemiIntensity * inside, k, dt);
    c.env = THREE.MathUtils.damp(c.env, preset.envIntensity * inside, k, dt);
    c.exp = THREE.MathUtils.damp(c.exp, preset.exposure * (inside < 1 ? 0.88 : 1), k, dt);
    c.fogD = THREE.MathUtils.damp(c.fogD, preset.fogDensity, k, dt);
    const a = 1 - Math.exp(-k * dt);
    colors.current.sun.lerp(tmpColor.set(preset.sunColor), a);
    colors.current.sky.lerp(tmpColor.set(preset.hemiSky), a);
    colors.current.ground.lerp(tmpColor.set(preset.hemiGround), a);
    colors.current.fog.lerp(tmpColor.set(preset.fogColor), a);
    if (sun.current) {
      sun.current.position.copy(target.position).addScaledVector(c.dir, 90);
      sun.current.intensity = c.sunI;
      sun.current.color.copy(colors.current.sun);
    }
    if (hemi.current) {
      hemi.current.intensity = c.hemiI;
      hemi.current.color.copy(colors.current.sky);
      hemi.current.groundColor.copy(colors.current.ground);
    }
    scene.environmentIntensity = c.env;
    gl.toneMappingExposure = c.exp;
    const fog = scene.fog as THREE.FogExp2 | null;
    if (fog) {
      fog.color.copy(colors.current.fog);
      fog.density = c.fogD;
    }
  });

  return (
    <>
      <directionalLight
        ref={sun}
        target={target}
        castShadow={shadows}
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.035}
        shadow-radius={4}
        shadow-camera-left={-42}
        shadow-camera-right={42}
        shadow-camera-top={42}
        shadow-camera-bottom={-42}
        shadow-camera-near={1}
        shadow-camera-far={220}
      />
      <hemisphereLight ref={hemi} />
    </>
  );
}

/**
 * Céu visível: gradiente zênite → horizonte com disco e halo do sol. O céu
 * físico (Sky) continua sendo usado só para gerar o mapa de ambiente — no
 * fundo ele estoura no tone mapping e fica quase branco.
 */
function GradientSky({ preset, sunDir }: { preset: LightingPreset; sunDir: THREE.Vector3 }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          zenith: { value: new THREE.Color(preset.dome.zenith) },
          horizon: { value: new THREE.Color(preset.dome.horizon) },
          glow: { value: new THREE.Color(preset.dome.glow) },
          sunDir: { value: sunDir.clone() },
        },
        vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w; }`,
        fragmentShader: `uniform vec3 zenith; uniform vec3 horizon; uniform vec3 glow; uniform vec3 sunDir; varying vec3 vDir;
          void main(){
            vec3 d = normalize(vDir);
            float h = max(d.y, 0.0);
            vec3 col = mix(horizon, zenith, pow(h, 0.5));
            col = mix(col, horizon * 0.92, smoothstep(0.0, -0.08, d.y));
            float s = max(dot(d, normalize(sunDir)), 0.0);
            col += glow * (pow(s, 7.0) * 0.35 + pow(s, 60.0) * 0.6) + glow * smoothstep(0.9993, 0.9997, s) * 6.0;
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useFrame((_, dt) => {
    const a = 1 - Math.exp(-2.2 * Math.min(dt, 0.05));
    mat.uniforms.zenith.value.lerp(tmpColor.set(preset.dome.zenith), a);
    mat.uniforms.horizon.value.lerp(tmpColor.set(preset.dome.horizon), a);
    mat.uniforms.glow.value.lerp(tmpColor.set(preset.dome.glow), a);
    (mat.uniforms.sunDir.value as THREE.Vector3).lerp(sunDir, a).normalize();
  });
  return (
    <mesh material={mat} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[1500, 48, 24]} />
    </mesh>
  );
}

/** Nuvens volumétricas (sprites) distantes, sobre o mar e nas laterais. */
function SkyClouds({ sunset }: { sunset: boolean }) {
  const color = sunset ? '#f3c7aa' : '#f4f6fa';
  const clouds: { p: [number, number, number]; seed: number; b: [number, number, number] }[] = [
    { p: [-160, 150, -420], seed: 1, b: [90, 14, 30] },
    { p: [120, 170, -520], seed: 2, b: [120, 16, 36] },
    { p: [320, 140, -260], seed: 3, b: [80, 12, 30] },
    { p: [-360, 160, -140], seed: 4, b: [90, 14, 30] },
    { p: [20, 190, -700], seed: 5, b: [160, 20, 40] },
    { p: [-260, 150, 260], seed: 6, b: [80, 12, 30] },
    { p: [300, 170, 320], seed: 7, b: [90, 14, 30] },
  ];
  return (
    <Clouds texture="/textures/cloud.webp" limit={260} material={THREE.MeshBasicMaterial} frustumCulled={false}>
      {clouds.map((c) => (
        <Cloud key={c.seed} seed={c.seed} position={c.p} bounds={c.b} segments={32} volume={70} smallestVolume={0.3} growth={6} speed={0.08} opacity={sunset ? 0.85 : 0.75} color={color} fade={300} />
      ))}
    </Clouds>
  );
}

/** Céu noturno em gradiente (zênite azul-profundo → horizonte azul-acinzentado). */
function NightSky({ radius = 1700 }: { radius?: number }) {
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(radius, 32, 16);
    const pos = g.getAttribute('position') as THREE.BufferAttribute;
    const cols = new Float32Array(pos.count * 3);
    const top = new THREE.Color('#040814');
    const mid = new THREE.Color('#0d1631');
    const hor = new THREE.Color('#24304f');
    for (let i = 0; i < pos.count; i++) {
      const t = THREE.MathUtils.clamp(pos.getY(i) / radius, -1, 1);
      const c = t > 0.15 ? mid.clone().lerp(top, (t - 0.15) / 0.85) : hor.clone().lerp(mid, Math.max(0, (t + 0.05) / 0.2));
      cols.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    return g;
  }, [radius]);
  return (
    <mesh geometry={geo} renderOrder={-10}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} depthWrite={false} fog={false} />
    </mesh>
  );
}

function Moon({ dir }: { dir: THREE.Vector3 }) {
  const p = dir.clone().multiplyScalar(1200);
  return (
    <mesh position={p}>
      <sphereGeometry args={[22, 24, 16]} />
      <meshBasicMaterial color="#e8ecff" fog={false} toneMapped={false} />
    </mesh>
  );
}

/**
 * Conjunto fixo de luzes pontuais reais distribuído a cada 0,3 s entre as
 * fontes acesas mais próximas da câmera. A quantidade de luzes nunca muda
 * (evita recompilar shaders) e o custo fica constante.
 */
function LightPool({ count }: { count: number }) {
  const refs = useRef<(THREE.PointLight | null)[]>([]);
  const last = useRef(0);
  const assigned = useRef<(LightSource | null)[]>([]);
  useFrame(({ camera, clock }, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const st = useExperience.getState();
    const preset = LIGHTING[st.time];
    if (clock.elapsedTime - last.current > 0.3) {
      last.current = clock.elapsedTime;
      const cut = st.mode === 'walk' ? null : st.cutLevel;
      const lit = SOURCES.filter((s) => {
        if (s.exterior) return st.exteriorLights && preset.artificial > 0;
        if (!st.lights[s.room!]) return false;
        if (cut === 0 && s.pos.y > 4) return false;
        return true;
      });
      lit.sort((a, b) => a.pos.distanceToSquared(camera.position) - b.pos.distanceToSquared(camera.position));
      assigned.current = lit.slice(0, count);
    }
    refs.current.forEach((l, i) => {
      if (!l) return;
      const src = assigned.current[i];
      if (!src) {
        l.intensity = THREE.MathUtils.damp(l.intensity, 0, 6, dt);
        return;
      }
      const factor = src.exterior ? preset.artificial : Math.max(preset.artificial, 0.15);
      if (l.position.distanceToSquared(src.pos) > 0.01) {
        l.position.copy(src.pos);
        l.intensity = 0;
      }
      l.color.copy(src.color);
      l.distance = src.distance;
      l.intensity = THREE.MathUtils.damp(l.intensity, src.intensity * factor, 6, dt);
    });
  });
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <pointLight key={i} ref={(el) => (refs.current[i] = el)} decay={2} intensity={0} position={[0, -50, 0]} />
      ))}
    </>
  );
}

/** Ajusta o brilho dos materiais emissivos (LEDs, cúpulas, forros, água) conforme horário e interruptores. */
function EmissiveDriver() {
  const m = useMaterials();
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const st = useExperience.getState();
    const preset = LIGHTING[st.time];
    const ext = st.exteriorLights ? preset.artificial : 0;
    m.led.emissiveIntensity = THREE.MathUtils.damp(m.led.emissiveIntensity, 0.15 + ext * 3.2, 3, dt);
    m.ledCool.emissiveIntensity = THREE.MathUtils.damp(m.ledCool.emissiveIntensity, ext * 3, 3, dt);
    m.water.emissiveIntensity = THREE.MathUtils.damp(m.water.emissiveIntensity, preset.poolGlow * (st.exteriorLights ? 0.55 : 0), 3, dt);
    for (const [id, mat] of roomLightMaterials.glow) {
      const on = st.lights[id] ? Math.max(preset.artificial, 0.4) : 0;
      mat.emissiveIntensity = THREE.MathUtils.damp(mat.emissiveIntensity, on * 3.5, 4, dt);
    }
    for (const [id, mat] of roomLightMaterials.shade) {
      const on = st.lights[id] ? Math.max(preset.artificial, 0.4) : 0;
      mat.emissiveIntensity = THREE.MathUtils.damp(mat.emissiveIntensity, on * 1.4, 4, dt);
    }
    for (const [id, mat] of roomLightMaterials.ceiling) {
      const on = st.lights[id] ? preset.artificial : 0;
      mat.emissiveIntensity = THREE.MathUtils.damp(mat.emissiveIntensity, on * 0.22, 4, dt);
    }
  });
  return null;
}

/** Spots embutidos em todos os forros (uma única malha instanciada; cor por cômodo = aceso/apagado). */
function Downlights() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const vis = useExperience((s) => (s.mode === 'walk' ? null : s.cutLevel));
  const spots = useMemo(() => {
    const out: { room: string; level: number; x: number; y: number; z: number }[] = [];
    for (const rm of ROOMS) {
      if (rm.outdoor) continue;
      const { x0, x1, z0, z1 } = rm.rect;
      const w = x1 - x0;
      const d = z1 - z0;
      const nx = Math.max(1, Math.round(w / 2.2));
      const nz = Math.max(1, Math.round(d / 2.2));
      const y = LEVEL_Y[rm.level] + roomHeight(rm) - 0.012;
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) out.push({ room: rm.id, level: rm.level, x: x0 + (w / nx) * (i + 0.5), y, z: z0 + (d / nz) * (j + 0.5) });
    }
    return out;
  }, []);
  const geo = useMemo(() => {
    const g = new THREE.CircleGeometry(0.055, 16);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    spots.forEach((s, i) => {
      o.position.set(s.x, s.y, s.z);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
      mesh.setColorAt(i, new THREE.Color(0.5, 0.5, 0.5));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [spots]);
  const lastSig = useRef('');
  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const st = useExperience.getState();
    const art = LIGHTING[st.time].artificial;
    const sig = `${st.time}|${JSON.stringify(st.lights)}|${vis}`;
    if (sig === lastSig.current) return;
    lastSig.current = sig;
    const on = new THREE.Color(1.6, 1.32, 0.95).multiplyScalar(0.7 + art * 1.4);
    const off = new THREE.Color(0.42, 0.42, 0.42);
    const hidden = new THREE.Matrix4().makeScale(0, 0, 0);
    const o = new THREE.Object3D();
    spots.forEach((s, i) => {
      mesh.setColorAt(i, st.lights[s.room] ? on : off);
      // corte: forros escondidos levam os spots junto
      const hide = (vis === 0 && s.level >= 0) || (vis === 1 && s.level === 1);
      if (hide) mesh.setMatrixAt(i, hidden);
      else {
        o.position.set(s.x, s.y, s.z);
        o.updateMatrix();
        mesh.setMatrixAt(i, o.matrix);
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });
  useEffect(() => () => geo.dispose(), [geo]);
  return <instancedMesh ref={ref} args={[geo, mat, spots.length]} frustumCulled={false} />;
}

