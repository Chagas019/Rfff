import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ArcadeModel, type ControlId } from './ArcadeModel/ArcadeModel';
import { createStudioLighting, type StudioLighting } from './Lighting/lighting';
import { VIEWS, cameraPositionFor, easeInOutCubic, fitDistance, type ViewId } from './CameraControls/views';

export interface StageOptions {
  /** Menor resolução e sombras para celulares. */
  lowPower?: boolean;
  reducedMotion?: boolean;
}

export interface ControlEvent {
  control: ControlId;
  phase: 'down' | 'move' | 'up';
  pointerId: number;
  /** Para o joystick: deslocamento normalizado (−1…1) a partir do centro. */
  axis?: { x: number; y: number };
}

type FrameListener = (dt: number, time: number) => void;
type XRFrameHandler = (frame: XRFrame, dt: number) => void;

/**
 * Palco 3D: renderizador, cena de estúdio, câmera com interpolação entre vistas,
 * órbita livre de 360° e interação direta com os controles do modelo
 * (clique, toque e vários dedos ao mesmo tempo).
 */
export class ArcadeStage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  readonly pose = new THREE.Group();
  readonly lighting: StudioLighting;
  model!: ArcadeModel;
  /** Quadros renderizados (os testes esperam por quadros, não por tempo). */
  frameCount = 0;

  onControl: (e: ControlEvent) => void = () => {};
  /** Chamado quando a pessoa gira/afasta a câmera manualmente. */
  onUserOrbit: () => void = () => {};

  private frameListeners = new Set<FrameListener>();
  private xrHandler: XRFrameHandler | null = null;
  private timer = new THREE.Timer();
  private raycaster = new THREE.Raycaster();
  private activePointers = new Map<number, ControlId>();
  private view: ViewId = 'hero';
  private tween: null | {
    from: THREE.Vector3;
    to: THREE.Vector3;
    fromTarget: THREE.Vector3;
    toTarget: THREE.Vector3;
    fromPose: THREE.Quaternion;
    toPose: THREE.Quaternion;
    t: number;
    duration: number;
  } = null;
  private interactive = true;
  private resizeObserver: ResizeObserver;
  private floatEnabled = true;
  private time = 0;
  private disposed = false;
  /** Qualidade adaptativa: 2 = completa, 1 = resolução menor, 0 = sem sombras. */
  quality = 2;
  /** Margem extra no enquadramento (ex.: cartucho fora do encaixe). */
  private framePadding = 0;
  private userOrbited = false;
  private perf = { frames: 0, time: 0 };

  constructor(private container: HTMLElement, private opts: StageOptions = {}) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.lowPower ? 1.5 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 0.88;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.domElement.className = 'stage-canvas';
    this.renderer.domElement.setAttribute('aria-label', 'Modelo 3D interativo do Pocket Arcade');
    this.renderer.domElement.setAttribute('role', 'img');
    // focável: com o foco no 3D, Enter/Espaço vão para o jogo (e não para um botão da interface)
    this.renderer.domElement.tabIndex = 0;
    this.renderer.xr.enabled = true;
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(20, 1, 1, 600);
    this.lighting = createStudioLighting(this.renderer, { shadowMapSize: opts.lowPower ? 1024 : 2048 });
    this.scene.environment = this.lighting.environment;
    this.scene.environmentIntensity = 0.85;
    this.scene.add(this.lighting.group);
    this.pose.name = 'device-pose';
    this.scene.add(this.pose);
    this.floatEnabled = !opts.reducedMotion;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minDistance = 22;
    this.controls.maxDistance = 140;
    this.controls.rotateSpeed = 0.8;
    this.controls.zoomSpeed = 0.9;
    this.controls.addEventListener('start', () => {
      this.tween = null;
      this.userOrbited = true;
      this.onUserOrbit();
    });

    const el = this.renderer.domElement;
    // fase de captura: se o toque acertar um controle do aparelho, a órbita não recebe o evento
    el.addEventListener('pointerdown', this.handlePointerDown, { capture: true });
    el.addEventListener('pointermove', this.handlePointerMove);
    el.addEventListener('pointerup', this.handlePointerUp);
    el.addEventListener('pointercancel', this.handlePointerUp);
    el.addEventListener('pointerleave', this.handlePointerHover);
    el.addEventListener('pointermove', this.handlePointerHover);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
  }

  async load(screenTexture: THREE.Texture, progress?: (step: string, f: number) => void | Promise<void>) {
    this.model = await ArcadeModel.create(screenTexture, progress);
    this.pose.add(this.model.root);
    this.setView('hero', true);
    await progress?.('Compilando shaders', 0.8);
    try {
      await this.renderer.compileAsync(this.scene, this.camera);
    } catch {
      /* compileAsync não existe em todos os contextos; o primeiro quadro compila */
    }
    await progress?.('Pronto', 1);
    this.renderer.setAnimationLoop(this.frame);
  }

  get currentView() {
    return this.view;
  }

  setInteractive(on: boolean) {
    this.interactive = on;
  }

  /** Órbita livre ligada/desligada (no modo Jogar a câmera fica fixa de frente). */
  setOrbitEnabled(on: boolean) {
    this.controls.enabled = on;
  }

  addFrameListener(fn: FrameListener) {
    this.frameListeners.add(fn);
    return () => this.frameListeners.delete(fn);
  }

  setXRFrameHandler(fn: XRFrameHandler | null) {
    this.xrHandler = fn;
  }

  /** Vai para uma vista com movimento suave (ou instantâneo). */
  setView(id: ViewId, instant = false) {
    this.view = id;
    this.userOrbited = false;
    const v = VIEWS[id];
    const pad = id === 'play' ? 0 : this.framePadding;
    const dist = fitDistance(this.camera.fov, this.camera.aspect || 1, v.frameWidth + pad, v.frameHeight + pad);
    const to = cameraPositionFor(v, dist);
    const toTarget = new THREE.Vector3(...v.target);
    if (instant || this.opts.reducedMotion) {
      this.tween = null;
      this.camera.position.copy(to);
      this.controls.target.copy(toTarget);
      this.pose.rotation.set(...v.pose);
      this.camera.lookAt(toTarget);
      this.controls.update();
      return;
    }
    this.tween = {
      from: this.camera.position.clone(),
      to,
      fromTarget: this.controls.target.clone(),
      toTarget,
      fromPose: this.pose.quaternion.clone(),
      toPose: new THREE.Quaternion().setFromEuler(new THREE.Euler(...v.pose)),
      t: 0,
      duration: 0.9,
    };
  }

  /** Abre (ou fecha) o enquadramento para caber peças fora do aparelho. */
  setFramePadding(cm: number) {
    if (cm === this.framePadding) return;
    this.framePadding = cm;
    if (!this.userOrbited && this.view !== 'play') this.setView(this.view);
  }

  /** Reenquadra a vista atual (usado no redimensionamento). */
  refit() {
    if (!this.tween) this.setView(this.view, true);
  }

  private resize() {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (!this.renderer.xr.isPresenting) this.renderer.setSize(w, h, false);
    if (this.model) this.refit();
  }

  private frame = (time: number, xrFrame?: XRFrame) => {
    if (this.disposed) return;
    this.frameCount++;
    this.timer.update(time);
    const dt = Math.min(this.timer.getDelta(), 0.1);
    this.time = time / 1000;
    this.adaptQuality(dt);
    this.frameListeners.forEach((fn) => fn(dt, this.time));
    this.model?.update(dt);

    if (this.renderer.xr.isPresenting && xrFrame && this.xrHandler) {
      this.xrHandler(xrFrame, dt);
      return; // a sessão de RA renderiza a própria cena
    }

    if (this.tween) {
      const tw = this.tween;
      tw.t = Math.min(1, tw.t + dt / tw.duration);
      const e = easeInOutCubic(tw.t);
      this.camera.position.lerpVectors(tw.from, tw.to, e);
      this.controls.target.lerpVectors(tw.fromTarget, tw.toTarget, e);
      this.pose.quaternion.slerpQuaternions(tw.fromPose, tw.toPose, e);
      if (tw.t >= 1) this.tween = null;
    }
    // flutuação suave de vitrine (desligada com "reduzir movimento" e no modo Jogar)
    const float = this.floatEnabled && this.view !== 'play' ? Math.sin(this.time * 0.9) * 0.12 : 0;
    // a sombra no chão só faz sentido vista de lado/de frente (de cima ela vira uma mancha)
    this.lighting.ground.visible = this.camera.position.y - this.controls.target.y < 0.55 * this.camera.position.distanceTo(this.controls.target);
    this.pose.position.y = THREE.MathUtils.lerp(this.pose.position.y, float, 0.1);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Mede o tempo dos quadros e, se o aparelho não acompanhar (~22 qps), reduz a resolução
   * e depois desliga as sombras. Nunca volta a subir sozinho (evita ficar oscilando).
   */
  private adaptQuality(dt: number) {
    if (this.quality === 0 || this.renderer.xr.isPresenting) return;
    this.perf.frames++;
    this.perf.time += dt;
    if (this.perf.frames < 45) return;
    const avg = this.perf.time / this.perf.frames;
    this.perf = { frames: 0, time: 0 };
    if (avg < 0.045) return;
    if (this.quality === 2) {
      this.quality = 1;
      this.renderer.setPixelRatio(1);
      this.resize();
    } else {
      this.quality = 0;
      this.renderer.shadowMap.enabled = false;
      this.scene.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.Material | undefined;
        if (m) m.needsUpdate = true;
      });
    }
  }

  // ------------------------------------------------------------------ picking

  private ndc(e: PointerEvent) {
    const r = this.renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }

  pick(e: PointerEvent): ControlId | null {
    if (!this.model) return null;
    this.raycaster.setFromCamera(this.ndc(e), this.camera);
    const hits = this.raycaster.intersectObjects([this.pose], true);
    for (const h of hits) {
      let o: THREE.Object3D | null = h.object;
      while (o && !o.userData.control) o = o.parent;
      if (o?.userData.control) return o.userData.control as ControlId;
      // a primeira superfície opaca atingida bloqueia o resto
      if ((h.object as THREE.Mesh).isMesh && h.object.visible) return null;
    }
    return null;
  }

  private joystickAxis(e: PointerEvent) {
    const stickWorld = new THREE.Vector3();
    const group = this.model.root.getObjectByName('joystick')!;
    group.getWorldPosition(stickWorld);
    const edge = new THREE.Vector3(1.4, 0, 0);
    group.localToWorld(edge);
    const c = stickWorld.clone().project(this.camera);
    const ed = edge.project(this.camera);
    const r = this.renderer.domElement.getBoundingClientRect();
    const toPx = (v: THREE.Vector3) => new THREE.Vector2(((v.x + 1) / 2) * r.width, ((1 - v.y) / 2) * r.height);
    const cp = toPx(c);
    const radius = Math.max(12, toPx(ed).distanceTo(cp));
    const px = new THREE.Vector2(e.clientX - r.left, e.clientY - r.top);
    let x = (px.x - cp.x) / radius;
    let y = -(px.y - cp.y) / radius;
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    return { x, y };
  }

  private handlePointerDown = (e: PointerEvent) => {
    if (!this.interactive || this.renderer.xr.isPresenting) return;
    const control = this.pick(e);
    if (!control) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    this.renderer.domElement.setPointerCapture?.(e.pointerId);
    this.activePointers.set(e.pointerId, control);
    this.onControl({
      control,
      phase: 'down',
      pointerId: e.pointerId,
      axis: control === 'joystick' ? this.joystickAxis(e) : undefined,
    });
  };

  private handlePointerMove = (e: PointerEvent) => {
    const control = this.activePointers.get(e.pointerId);
    if (control !== 'joystick') return;
    this.onControl({ control, phase: 'move', pointerId: e.pointerId, axis: this.joystickAxis(e) });
  };

  private handlePointerUp = (e: PointerEvent) => {
    const control = this.activePointers.get(e.pointerId);
    if (!control) return;
    this.activePointers.delete(e.pointerId);
    this.onControl({ control, phase: 'up', pointerId: e.pointerId, axis: { x: 0, y: 0 } });
  };

  private handlePointerHover = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || this.activePointers.size) return;
    const over = e.type === 'pointerleave' ? null : this.pick(e);
    this.renderer.domElement.style.cursor = over ? 'pointer' : 'grab';
  };

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.model?.dispose();
    this.lighting.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
