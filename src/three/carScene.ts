import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
// Modelo do F1 Rules Explorer (ver ./README.md), pré-gerado em public/models/f1-2026.glb
import { createMaterials, setLiveryColor } from './car/materials.js';
import { createStudio } from './studio.js';

/**
 * Cena 3D do carro para as transições: estúdio escuro, carro procedural de
 * 2026 e uma câmera que percorre um caminho controlado pelo progresso (0–1).
 */

interface Key { u: number; az: number; el: number; dist: number; ty: number }

// Caminho da câmera: frente 3/4 → lateral → traseira 3/4 → vista aérea
const PATH: Key[] = [
  { u: 0.0, az: 32, el: 7, dist: 7.0, ty: 0.42 },
  { u: 0.3, az: 90, el: 4, dist: 6.4, ty: 0.4 },
  { u: 0.5, az: 148, el: 13, dist: 6.6, ty: 0.4 },
  { u: 0.75, az: 200, el: 55, dist: 7.4, ty: 0.3 },
  { u: 1.0, az: 270, el: 86, dist: 8.2, ty: 0.2 },
];

const smooth = (x: number) => x * x * (3 - 2 * x);

function sample(u: number) {
  const v = Math.min(1, Math.max(0, u));
  let i = 0;
  while (i < PATH.length - 2 && v > PATH[i + 1].u) i++;
  const a = PATH[i], b = PATH[i + 1];
  const t = smooth((v - a.u) / (b.u - a.u));
  const L = (x: number, y: number) => x + (y - x) * t;
  return { az: L(a.az, b.az), el: L(a.el, b.el), dist: L(a.dist, b.dist), ty: L(a.ty, b.ty) };
}

export interface CarScene {
  setProgress(u: number): void;
  /** Reduz a qualidade quando o aparelho não acompanha (sem AO, menos pixels). */
  degrade(): boolean;
  resize(): void;
  /** `settled`: rolagem parada — renderiza o quadro em qualidade máxima (com AO). */
  frame(time: number, settled?: boolean): void;
  dispose(): void;
}

const MODEL_URL = '/models/f1-2026.glb';

/** Carrega o modelo pré-gerado e reaplica os materiais (pintura, carbono, pneus…) pelo nome. */
async function loadCar() {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const [gltf, M] = await Promise.all([loader.loadAsync(MODEL_URL), Promise.resolve(createMaterials() as Record<string, THREE.Material>)]);
  const root = gltf.scene;
  const front: { pv: THREE.Object3D; angle: number }[] = [];
  const rear: { pv: THREE.Object3D; angle: number }[] = [];
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) {
      const name = (mesh.material as THREE.Material).name;
      if (name && M[name]) mesh.material = M[name];
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
    if (/^fwFlap\d+$/.test(o.name)) front.push({ pv: o, angle: o.userData.flapAngle ?? 0 });
    if (/^rwFlap\d+$/.test(o.name)) rear.push({ pv: o, angle: o.userData.flapAngle ?? 0 });
  });
  return { root, front, rear };
}

export async function createCarScene(canvas: HTMLCanvasElement, opts: { livery?: string; shiftRight?: boolean } = {}): Promise<CarScene> {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  const coarse = window.matchMedia('(pointer: coarse)').matches; // celulares/tablets
  let maxDpr = coarse ? 1.25 : 1.5;
  // orçamento de pixels: telas grandes (tablet/computador) não renderizam mais que ~1,6 milhão de pixels
  const PIXEL_BUDGET = 1.3e6;
  const dprFor = (w: number, h: number) => Math.max(0.75, Math.min(window.devicePixelRatio || 1, maxDpr, Math.sqrt(PIXEL_BUDGET / Math.max(1, w * h))));
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  const scene = new THREE.Scene();
  const studio = createStudio(renderer, scene);

  // luz de recorte vermelha, na identidade do site
  const redRim = new THREE.SpotLight(0xff2a1f, 140, 20, 0.5, 1);
  redRim.position.set(-5, 2.5, 5);
  redRim.target.position.set(0, 0.4, 0);
  scene.add(redRim, redRim.target);

  setLiveryColor(opts.livery ?? '#9c0e0a');
  const car = await loadCar();
  scene.add(car.root);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 100);

  // ---------- pós-processamento (realismo) ----------
  // MSAA 4x + oclusão de ambiente (frestas e passagens de roda escurecem) +
  // saída com tone mapping + vinheta/dither suaves.
  const rt = new THREE.WebGLRenderTarget(1, 1, { samples: 4, type: THREE.HalfFloatType });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  const gtao = new GTAOPass(scene, camera, 1, 1);
  gtao.normalMaterial.side = THREE.DoubleSide;
  const gtaoSetSize = gtao.setSize.bind(gtao);
  gtao.setSize = (w: number, h: number) => gtaoSetSize(Math.max(1, Math.round(w * 0.5)), Math.max(1, Math.round(h * 0.5)));
  gtao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.5, thickness: 1, scale: 1.2, samples: 8 });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 8 });
  gtao.blendIntensity = 0.9;
  let aoAllowed = !coarse; // pesado demais para a maioria dos celulares
  gtao.enabled = false; // ligado só no quadro final, quando a rolagem para
  composer.addPass(gtao);
  composer.addPass(new OutputPass());
  // (vinheta feita em CSS sobre o canvas, igual nos dois caminhos de renderização)
  const target = new THREE.Vector3(0, 0.4, 0);
  let progress = 0;
  let aero = 0;

  const setAero = (a: number) => {
    car.front.forEach(({ pv, angle }) => (pv.rotation.z = a * angle));
    car.rear.forEach(({ pv, angle }) => (pv.rotation.z = a * angle));
  };

  const resize = () => {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setPixelRatio(dprFor(w, h));
    renderer.setSize(w, h, false);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(w, h);
    camera.aspect = w / h;
    // em telas largas, desloca o carro para a direita (texto fica à esquerda)
    camera.filmOffset = opts.shiftRight && w / h > 1.2 ? -2.6 : 0;
    camera.updateProjectionMatrix();
    studio.setSize(w, h);
  };
  resize();
  // compila os shaders em paralelo (sem travar a página) antes do primeiro quadro
  try { await renderer.compileAsync(scene, camera); } catch { /* navegador sem suporte: compila no 1º quadro */ }
  try { renderer.setRenderTarget(rt); await renderer.compileAsync(scene, camera); } catch { /* idem */ } finally { renderer.setRenderTarget(null); }

  const api: CarScene = {
    setProgress(u) { progress = u; },
    degrade() {
      if (aoAllowed) { aoAllowed = false; return true; }
      if (maxDpr > 0.85) { maxDpr = 0.85; resize(); return true; }
      return false;
    },
    resize,
    frame(time, settled = false) {
      const k = sample(progress);
      const aspect = camera.aspect;
      const dist = k.dist * (aspect < 1.2 ? Math.min(2.5, 1.12 / Math.max(aspect, 0.4)) : 1.4);
      void time;
      const az = THREE.MathUtils.degToRad(k.az);
      const el = THREE.MathUtils.degToRad(k.el);
      target.y = k.ty;
      camera.position.set(
        target.x + dist * Math.cos(el) * Math.cos(az),
        target.y + dist * Math.sin(el),
        target.z + dist * Math.cos(el) * Math.sin(az),
      );
      camera.up.set(0, 1, 0);
      camera.lookAt(target);
      // asas móveis abrem na "vista aérea" (modo reta)
      const a = smooth(Math.min(1, Math.max(0, (progress - 0.4) / 0.25)));
      if (Math.abs(a - aero) > 1e-3) {
        aero = a;
        setAero(aero);
        studio.invalidate();
        renderer.shadowMap.needsUpdate = true;
      }
      studio.update();
      (studio.floor as unknown as { throttle: boolean }).throttle = !settled;
      if (settled && aoAllowed) {
        // quadro parado: qualidade máxima (MSAA 4x + oclusão de ambiente)
        gtao.enabled = true;
        composer.render();
      } else {
        // em movimento: caminho leve, direto na tela (MSAA nativo do canvas)
        renderer.setRenderTarget(null);
        renderer.render(scene, camera);
      }
    },
    dispose() {
      composer.dispose();
      rt.dispose();
      renderer.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        mats.forEach((mat) => mat.dispose());
      });
    },
  };
  // aquecimento: desenha os dois caminhos (movimento e parado) e o reflexo uma vez
  // agora, antes de o carro aparecer — evita o engasgo do 1º quadro ao rolar.
  api.frame(0, false);
  api.setProgress(0.002);
  api.frame(0, false);
  api.frame(0, true);
  api.setProgress(0);
  return api;
}
