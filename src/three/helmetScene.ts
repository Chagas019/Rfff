import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
// Capacete procedural do F1 Rules Explorer (ver ./README.md)
import { buildHelmet, HELMET } from './car/cockpit.js';
import { createMaterials } from './car/materials.js';

/**
 * Capacete 3D com transição futurística controlada pelo progresso (0–1):
 *  - começa como holograma (malha de linhas vermelhas);
 *  - um plano de varredura sobe e "materializa" o casco sólido;
 *  - anéis de energia giram em volta e o capacete dá um giro de 360°.
 */
export interface HelmetScene {
  setProgress(u: number): void;
  resize(): void;
  frame(): void;
  dispose(): void;
}

const smooth = (x: number) => { const v = Math.min(1, Math.max(0, x)); return v * v * (3 - 2 * v); };
const SCALE = 10; // capacete real ≈ 0,3 m → ~3 unidades na cena

export function createHelmetScene(canvas: HTMLCanvasElement): HelmetScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.localClippingEnabled = true;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  // luzes: chave branca, recorte vermelho e azul (identidade "pit lane")
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 5, 4);
  const red = new THREE.PointLight(0xff2a1f, 40, 20);
  red.position.set(-4, 1, 2);
  const blue = new THREE.PointLight(0x3b82f6, 30, 20);
  blue.position.set(4, -1, -3);
  scene.add(key, red, blue, new THREE.AmbientLight(0xffffff, 0.15));

  // ---------- capacete sólido ----------
  const M = createMaterials();
  const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0); // mostra o que está abaixo do plano
  const shell = new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.28, metalness: 0.4, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide, clippingPlanes: [clip] });
  const visor = new THREE.MeshPhysicalMaterial({ color: 0x0b0d16, roughness: 0.04, metalness: 1, iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [180, 620], clearcoat: 1, side: THREE.DoubleSide, clippingPlanes: [clip] });
  const seal = M.satinBlack.clone(); seal.clippingPlanes = [clip];
  const inlet = M.inlet.clone(); inlet.clippingPlanes = [clip];
  const mats = { ...M, helmet: shell, visor, satinBlack: seal, inlet };

  const solid = new THREE.Group();
  buildHelmet(solid, mats);
  // pintura: casco preto brilhante, faixa central e base vermelhas (cores por vértice)
  const black = new THREE.Color(0x0d0d10), redC = new THREE.Color(0xd4140e), white = new THREE.Color(0xe9ecef);
  solid.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || m.material !== shell) return;
    const pos = m.geometry.attributes.position;
    const cols = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) - HELMET.x, y = pos.getY(i) - HELMET.y, z = pos.getZ(i);
      const ss = THREE.MathUtils.smoothstep;
      const edge = -0.05 + 0.03 * Math.max(0, x / 0.14);                // base vermelha subindo para o queixo
      const base = 1 - ss(y, edge - 0.006, edge + 0.006);
      const stripe = (1 - ss(Math.abs(z), 0.011, 0.016)) * ss(y, -0.03, -0.01); // faixa central
      const pin = (1 - ss(Math.abs(Math.abs(z) - 0.028), 0.0015, 0.004)) * ss(y, -0.01, 0.01) * (1 - base); // filetes
      c.copy(black).lerp(white, pin).lerp(redC, Math.max(base, stripe));
      cols.set([c.r, c.g, c.b], i * 3);
    }
    m.geometry.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  });
  // o visor e a vedação usam alphaMap próprio, preservado no clone
  solid.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const mat = m.material as THREE.MeshPhysicalMaterial;
    if (mat.clippingPlanes == null) { const c = mat.clone(); c.clippingPlanes = [clip]; m.material = c; }
  });

  // ---------- holograma (malha de linhas) ----------
  const holo = new THREE.Group();
  const holoMat = new THREE.LineBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
  solid.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const edges = new THREE.LineSegments(new THREE.WireframeGeometry(m.geometry), holoMat);
    holo.add(edges);
  });

  // centraliza: a geometria original está no espaço do carro
  const pivot = new THREE.Group();
  const inner = new THREE.Group();
  inner.add(solid, holo);
  inner.position.set(-HELMET.x, -HELMET.y, 0);
  pivot.add(inner);
  pivot.scale.setScalar(SCALE);
  pivot.rotation.y = Math.PI / 2; // viseira voltada para a câmera
  scene.add(pivot);

  // ---------- anel de varredura + anéis de energia ----------
  const scanRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.0, 0.012, 8, 128),
    new THREE.MeshBasicMaterial({ color: 0xff4d3d, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending }),
  );
  scanRing.rotation.x = Math.PI / 2;
  scene.add(scanRing);
  const scanDisc = new THREE.Mesh(
    new THREE.CircleGeometry(2.0, 64),
    new THREE.MeshBasicMaterial({ color: 0xff2a1f, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
  );
  scanDisc.rotation.x = -Math.PI / 2;
  scene.add(scanDisc);

  const rings = [2.35, 2.75, 3.15].map((r, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, i === 1 ? 0.006 : 0.01, 6, 160, Math.PI * (1.2 + i * 0.3)),
      new THREE.MeshBasicMaterial({ color: i === 1 ? 0x60a5fa : 0xff3b30, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending }),
    );
    scene.add(ring);
    return ring;
  });

  // partículas de dados em volta
  const N = 260;
  const pts = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = 2 + Math.random() * 2.2, a = Math.random() * Math.PI * 2, y = (Math.random() - 0.5) * 3.4;
    pts.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3);
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  const particles = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xff6a5f, size: 0.03, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(particles);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  let progress = 0;

  const resize = () => {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();

  return {
    setProgress(u) { progress = u; },
    resize,
    frame() {
      const u = progress;
      const reveal = smooth(u / 0.45);                 // varredura de baixo para cima
      const yMin = -1.7, yMax = 1.7;
      const scanY = yMin + (yMax - yMin) * reveal;
      clip.constant = scanY;                           // sólido visível abaixo de scanY
      scanRing.position.y = scanY; scanDisc.position.y = scanY;
      const scanVis = reveal > 0.001 && reveal < 0.999 ? 1 : 0;
      (scanRing.material as THREE.MeshBasicMaterial).opacity = 0.9 * scanVis;
      (scanDisc.material as THREE.MeshBasicMaterial).opacity = 0.1 * scanVis;
      holoMat.opacity = 0.55 * (1 - smooth((u - 0.35) / 0.25)) + 0.04;

      // giro de 360° + leve flutuação
      pivot.rotation.y = Math.PI / 2 + smooth((u - 0.1) / 0.8) * (Math.PI * 2 - 0.3); // termina quase de frente, viseira visível
      pivot.rotation.x = Math.sin(u * Math.PI * 2) * 0.08;
      pivot.position.y = Math.sin(u * Math.PI * 3) * 0.08;

      rings.forEach((ring, i) => {
        ring.rotation.x = Math.PI / 2 + Math.sin(u * 4 + i) * 0.5;
        ring.rotation.y = u * (i % 2 ? -6 : 6) + i;
        ring.rotation.z = u * 3 * (i + 1);
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - smooth((u - 0.75) / 0.25) * 0.6);
      });
      particles.rotation.y = u * 2.5;

      // câmera: aproxima levemente; em telas estreitas recua
      const far = camera.aspect < 1 ? 1.25 / Math.max(camera.aspect, 0.45) : 1;
      const dist = (12.5 - u * 2) * Math.min(far, 2.2);
      camera.position.set(0, 0.6 - u * 0.4, dist);
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    },
    dispose() {
      renderer.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const ms = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        ms.forEach((x) => x.dispose());
      });
    },
  };
}
