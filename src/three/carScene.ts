import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
// Modelo procedural do F1 Rules Explorer (ver ./README.md)
import { buildCar } from './car/build.js';
import { setLiveryColor } from './car/materials.js';
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
  resize(): void;
  frame(time: number): void;
  dispose(): void;
}

export function createCarScene(canvas: HTMLCanvasElement, opts: { livery?: string; shiftRight?: boolean } = {}): CarScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  const coarse = window.matchMedia('(pointer: coarse)').matches; // celulares/tablets
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
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
  const car = buildCar();
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
  gtao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.5, thickness: 1, scale: 1.2, samples: 16 });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
  gtao.blendIntensity = 0.9;
  gtao.enabled = !coarse; // pesado demais para a maioria dos celulares
  composer.addPass(gtao);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uAspect: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uAspect; varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = (vUv-0.5)*vec2(uAspect,1.0);
        c.rgb *= mix(0.6, 1.0, smoothstep(1.25, 0.35, length(d)));
        c.rgb += (hash(gl_FragCoord.xy)-0.5)/255.0; gl_FragColor = c; }`,
  });
  composer.addPass(grade);
  const target = new THREE.Vector3(0, 0.4, 0);
  let progress = 0;
  let aero = 0;

  const setAero = (a: number) => {
    car.aero.frontWing.flapPivots.forEach((pv: THREE.Object3D, i: number) => (pv.rotation.z = a * car.aero.frontWing.flapAngles[i]));
    car.aero.rearWing.flapPivots.forEach((pv: THREE.Object3D, i: number) => (pv.rotation.z = a * car.aero.rearWing.flapAngles[i]));
  };

  const resize = () => {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(w, h);
    grade.uniforms.uAspect.value = w / h;
    camera.aspect = w / h;
    // em telas largas, desloca o carro para a direita (texto fica à esquerda)
    camera.filmOffset = opts.shiftRight && w / h > 1.2 ? -2.6 : 0;
    camera.updateProjectionMatrix();
    studio.setSize(w, h);
  };
  resize();

  return {
    setProgress(u) { progress = u; },
    resize,
    frame(time) {
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
      composer.render();
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
}
