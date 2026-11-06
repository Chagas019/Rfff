import {
  ACESFilmicToneMapping, Box3, CircleGeometry, Color, DirectionalLight, Fog, Group, HemisphereLight, Mesh, MeshStandardMaterial,
  PCFSoftShadowMap, PerspectiveCamera, PMREMGenerator, Scene, SRGBColorSpace, Vector3, WebGLRenderer, type Object3D,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { PART_LABELS, applyExplode, prepareExplode, type ExplodePart, type PartGroup } from './explode';

export type View = 'tresQuartos' | 'lateral' | 'superior' | 'frontal' | 'traseira';

/** Posições de câmera (em comprimentos de carro), com o carro alinhado ao eixo X. */
const VIEWS: Record<View, [number, number, number]> = {
  tresQuartos: [0.78, 0.36, 0.86],
  lateral: [0, 0.16, 1.18],
  superior: [0.001, 1.45, 0.001],
  frontal: [1.2, 0.18, 0],
  traseira: [-1.2, 0.22, 0],
};

export interface PartLabel { group: PartGroup; label: string; x: number; y: number; visible: boolean }
export interface StudioOptions {
  reducedMotion: boolean; accent: string; background?: string;
  onProgress?: (p: number) => void;
  /** Posição na tela dos rótulos das peças (vista explodida). */
  onLabels?: (labels: PartLabel[]) => void;
}

/**
 * Estúdio 3D do configurador: iluminação de estúdio com reflexos (ambiente PMREM),
 * luz principal com sombra suave, piso brilhante, materiais PBR do próprio modelo.
 * Renderiza só quando algo muda (economiza bateria e não trava a página).
 */
export function createCarStudio(container: HTMLElement, opts: StudioOptions) {
  const mobile = matchMedia('(max-width: 768px)').matches;
  const renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.touchAction = 'none';

  const scene = new Scene();
  const bg = new Color(opts.background ?? '#0b0f1d');
  scene.background = bg;
  // o piso some no fundo: sem linha de horizonte
  scene.fog = new Fog(bg, 9, 22);
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.9;

  const camera = new PerspectiveCamera(32, 1, 0.05, 200);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.maxPolarAngle = Math.PI / 2 - 0.04; // nunca abaixo do piso
  controls.autoRotate = !opts.reducedMotion;
  controls.autoRotateSpeed = 0.6;

  // luz principal (sombra suave) + preenchimento + contraluz na cor do evento
  const key = new DirectionalLight('#ffffff', 2.2);
  key.position.set(4, 8, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  key.shadow.radius = 6;
  key.shadow.bias = -0.0004;
  // contraluz: cor do evento misturada ao branco, para não tingir o carro
  const rim = new DirectionalLight(new Color(opts.accent).lerp(new Color('#ffffff'), 0.55), 0.9);
  rim.position.set(-6, 3, -4);
  scene.add(key, rim, new HemisphereLight('#bcd3ff', '#0b0f1d', 0.35));

  // piso de estúdio: brilho sutil e sombra de contato
  const floor = new Mesh(new CircleGeometry(30, 64), new MeshStandardMaterial({ color: bg.clone().multiplyScalar(1.25), roughness: 0.55, metalness: 0.1, envMapIntensity: 0.35 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const stage = new Group();
  scene.add(stage);

  let size = 5;
  let dirty = true;
  let parts: ExplodePart[] = [];
  let explodeT = 0;
  let explodeTarget = 0;
  // animações por tempo (independem de quantos quadros por segundo o aparelho consegue)
  let target: { from: Vector3; pos: Vector3; start: number; dur: number } | null = null;
  let explodeAnim: { from: number; to: number; start: number; dur: number } | null = null;
  const markDirty = () => { dirty = true; };
  controls.addEventListener('change', markDirty);
  controls.addEventListener('start', () => { controls.autoRotate = false; target = null; });

  const resize = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    dirty = true;
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  // pausa fora da tela e com a aba oculta
  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(container);

  let raf = 0;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    if (!visible || document.hidden) return;
    const now = performance.now();
    if (target) {
      const k = Math.min(1, (now - target.start) / target.dur);
      const e = 1 - (1 - k) ** 3; // easeOutCubic
      camera.position.lerpVectors(target.from, target.pos, e);
      if (k >= 1) target = null;
      dirty = true;
    }
    if (explodeAnim) {
      const k = Math.min(1, (now - explodeAnim.start) / explodeAnim.dur);
      explodeT = explodeAnim.from + (explodeAnim.to - explodeAnim.from) * k;
      applyExplode(parts, explodeT);
      if (k >= 1) explodeAnim = null;
      dirty = true;
    }
    if (controls.update()) dirty = true;
    if (controls.autoRotate) dirty = true;
    if (dirty) { renderer.render(scene, camera); dirty = false; emitLabels(); }
  };
  loop();

  /** Um rótulo por grupo, no centro das peças daquele grupo, projetado na tela. */
  function emitLabels() {
    if (!opts.onLabels) return;
    if (explodeT < 0.6 || !parts.length) { opts.onLabels([]); return; }
    const groups = new Map<PartGroup, Vector3[]>();
    for (const p of parts) {
      const c = new Vector3();
      new Box3().setFromObject(p.object).getCenter(c);
      groups.set(p.group, [...(groups.get(p.group) ?? []), c]);
    }
    const w = container.clientWidth, h = container.clientHeight;
    opts.onLabels([...groups.entries()].map(([group, pts]) => {
      // rótulo na peça do grupo mais próxima da câmera (ex.: a roda da frente, não o meio das quatro)
      const c = pts.reduce((best, p) => (p.distanceTo(camera.position) < best.distanceTo(camera.position) ? p : best)).clone().project(camera);
      return { group, label: PART_LABELS[group], x: (c.x * 0.5 + 0.5) * w, y: (-c.y * 0.5 + 0.5) * h, visible: c.z < 1 };
    }));
  };

  const setView = (v: View, instant = false) => {
    const [x, y, z] = VIEWS[v];
    const pos = new Vector3(x, y, z).multiplyScalar(size * 1.55);
    controls.autoRotate = false;
    if (instant || opts.reducedMotion) { camera.position.copy(pos); controls.update(); dirty = true; } else target = { from: camera.position.clone(), pos, start: performance.now(), dur: 900 };
  };

  const draco = new DRACOLoader().setDecoderPath('/draco/');
  const loader = new GLTFLoader().setDRACOLoader(draco).setMeshoptDecoder(MeshoptDecoder);

  /** Carrega o GLB, alinha o comprimento ao eixo X, apoia no piso e centraliza. */
  const load = (url: string) => new Promise<void>((resolve, reject) => {
    loader.load(url, (gltf) => {
      stage.clear();
      const car: Object3D = gltf.scene;
      car.traverse((o) => {
        const m = o as Mesh;
        if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; }
      });
      let box = new Box3().setFromObject(car);
      let s = box.getSize(new Vector3());
      if (s.z > s.x) { car.rotation.y = Math.PI / 2; box = new Box3().setFromObject(car); s = box.getSize(new Vector3()); }
      // frente em +X: a ponta com peças mais altas (asa traseira) fica em -X
      const tip = (fromMax: boolean) => {
        let top = -Infinity;
        car.updateMatrixWorld(true);
        car.traverse((o) => {
          if (!(o as Mesh).isMesh) return;
          const b = new Box3().setFromObject(o);
          const cx = (b.min.x + b.max.x) / 2;
          const inEnd = fromMax ? cx > box.max.x - s.x * 0.14 : cx < box.min.x + s.x * 0.14;
          if (inEnd) top = Math.max(top, b.max.y);
        });
        return top;
      };
      if (tip(true) > tip(false)) { car.rotation.y += Math.PI; box = new Box3().setFromObject(car); s = box.getSize(new Vector3()); }
      const scale = 5 / Math.max(s.x, 0.001);
      car.scale.multiplyScalar(scale);
      box = new Box3().setFromObject(car);
      const c = box.getCenter(new Vector3());
      car.position.sub(new Vector3(c.x, box.min.y, c.z));
      stage.add(car);
      size = 5;
      parts = prepareExplode(car, size);
      explodeT = 0; explodeTarget = 0; explodeAnim = null;
      const d = key.shadow.camera;
      d.left = -4; d.right = 4; d.top = 4; d.bottom = -4; d.near = 1; d.far = 20; d.updateProjectionMatrix();
      controls.minDistance = size * 0.7;
      controls.maxDistance = size * 3.4;
      setView('tresQuartos', true);
      controls.autoRotate = !opts.reducedMotion;
      dirty = true;
      resolve();
    }, (e) => { if (e.total) opts.onProgress?.(e.loaded / e.total); }, reject);
  });

  const setExploded = (on: boolean) => {
    explodeTarget = on ? 1 : 0;
    explodeAnim = { from: explodeT, to: explodeTarget, start: performance.now(), dur: opts.reducedMotion ? 1 : 1100 };
    controls.autoRotate = false;
    dirty = true;
  };
  /** Aproxima (< 1) ou afasta (> 1) a câmera, respeitando os limites. */
  const zoom = (factor: number) => {
    const dir = camera.position.clone().sub(controls.target);
    const len = Math.min(controls.maxDistance, Math.max(controls.minDistance, dir.length() * factor));
    target = { from: camera.position.clone(), pos: controls.target.clone().add(dir.setLength(len)), start: performance.now(), dur: 450 };
    controls.autoRotate = false;
  };
  const partCount = () => new Set(parts.map((p) => p.group)).size;
  const setAccent = (hex: string) => { rim.color.set(hex).lerp(new Color('#ffffff'), 0.55); dirty = true; };

  const dispose = () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    controls.dispose();
    draco.dispose();
    pmrem.dispose();
    scene.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh) {
        m.geometry.dispose();
        (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => mat.dispose());
      }
    });
    renderer.dispose();
    renderer.domElement.remove();
  };

  return { load, setView, setAccent, setExploded, zoom, partCount, dispose };
}
