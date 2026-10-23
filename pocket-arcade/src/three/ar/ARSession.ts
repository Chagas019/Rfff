import * as THREE from 'three';
import type { ArcadeStage } from '../ArcadeStage';
import { mapSessionError } from '../../services/arSupport';

export type ARPhase = 'starting' | 'scanning' | 'placed' | 'ended';

export interface ARCallbacks {
  onPhase: (p: ARPhase) => void;
  onInfo?: (info: { anchors: boolean; domOverlay: boolean }) => void;
}

const CM_TO_M = 0.01;
const MIN_SCALE = 0.5;
const MAX_SCALE = 4;

/**
 * Sessão WebXR "immersive-ar": o MESMO modelo do modo 3D (mesmos materiais e peças,
 * e a tela continua rodando os jogos) é posicionado sobre uma superfície real.
 *
 * - Detecção de superfície por hit-test e retícula de posicionamento.
 * - Âncora (quando o navegador oferece "anchors") para o objeto ficar preso à mesa.
 * - Toque rápido: posiciona/move. Arrastar com um dedo: gira. Pinça: redimensiona.
 */
export class ARSession {
  private session: XRSession | null = null;
  private hitSource: XRHitTestSource | null = null;
  private scene = new THREE.Scene();
  private reticle: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  private anchorGroup = new THREE.Group();
  private holder = new THREE.Group();
  private anchor: XRAnchor | null = null;
  private lastHit: XRHitTestResult | null = null;
  private placed = false;
  private userScale = 1;
  private userRotation = 0;
  private prevParent: THREE.Object3D | null = null;
  private supportsAnchors = false;
  private domOverlay = false;
  private gesture: { startDist: number; startScale: number; lastX: number; moved: number; startTime: number; touches: number } | null = null;
  private placeRequested = false;

  constructor(
    private stage: ArcadeStage,
    private overlayRoot: HTMLElement,
    private cb: ARCallbacks,
  ) {
    this.reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.045, 0.06, 40).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9 }),
    );
    this.reticle.matrixAutoUpdate = false;
    this.reticle.visible = false;
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.008, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
    this.reticle.add(dot);
    this.scene.add(this.reticle);

    this.anchorGroup.matrixAutoUpdate = false;
    this.anchorGroup.visible = false;
    this.anchorGroup.add(this.holder);
    this.scene.add(this.anchorGroup);

    // luz neutra + o mesmo ambiente do estúdio para os reflexos
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#b9b2c4', 1.2));
    const sun = new THREE.DirectionalLight('#ffffff', 1.6);
    sun.position.set(0.3, 1, 0.4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = sun.shadow.camera.bottom = -0.3;
    sun.shadow.camera.right = sun.shadow.camera.top = 0.3;
    sun.target = this.holder;
    this.holder.add(sun);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: 0.25 }));
    shadow.receiveShadow = true;
    this.holder.add(shadow);
    this.scene.environment = stage.lighting.environment;
  }

  async start() {
    const xr = (navigator as Navigator & { xr?: XRSystem }).xr;
    if (!xr) throw mapSessionError({ name: 'NotSupportedError' });
    this.cb.onPhase('starting');
    let session: XRSession;
    try {
      session = await xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay', 'anchors', 'local-floor'],
        domOverlay: { root: this.overlayRoot },
      } as XRSessionInit);
    } catch (err) {
      this.cb.onPhase('ended');
      throw mapSessionError(err);
    }
    this.session = session;
    this.domOverlay = !!(session as XRSession & { domOverlayState?: unknown }).domOverlayState;
    this.supportsAnchors =
      typeof XRHitTestResult !== 'undefined' && typeof (XRHitTestResult.prototype as unknown as { createAnchor?: unknown }).createAnchor === 'function';
    this.cb.onInfo?.({ anchors: this.supportsAnchors, domOverlay: this.domOverlay });

    const renderer = this.stage.renderer;
    renderer.xr.setReferenceSpaceType('local');
    await renderer.xr.setSession(session);
    const viewer = await session.requestReferenceSpace('viewer');
    this.hitSource = (await session.requestHitTestSource?.({ space: viewer })) ?? null;

    // o mesmo objeto 3D do visualizador vai para a cena de RA
    const model = this.stage.model.root;
    this.prevParent = model.parent;
    model.position.set(0, 0, 0);
    this.holder.add(model);
    model.rotation.set(-Math.PI / 2, 0, 0); // deitado sobre a mesa, tela para cima
    model.position.y = 0.0128; // pés de borracha encostando na superfície
    this.stage.model.setCableResting(true);
    this.applyTransform();

    session.addEventListener('end', this.handleEnd);
    session.addEventListener('select', this.handleSelect);
    this.overlayRoot.addEventListener('beforexrselect', this.preventOverlaySelect);
    this.overlayRoot.addEventListener('touchstart', this.onTouchStart, { passive: true });
    this.overlayRoot.addEventListener('touchmove', this.onTouchMove, { passive: true });
    this.overlayRoot.addEventListener('touchend', this.onTouchEnd);
    this.stage.setXRFrameHandler(this.onXRFrame);
    this.cb.onPhase('scanning');
  }

  get anchored() {
    return !!this.anchor;
  }

  rotate(delta: number) {
    this.userRotation += delta;
    this.applyTransform();
  }

  scaleBy(f: number) {
    this.userScale = THREE.MathUtils.clamp(this.userScale * f, MIN_SCALE, MAX_SCALE);
    this.applyTransform();
  }

  get scale() {
    return this.userScale;
  }

  /** Coloca (ou move) o aparelho onde a retícula está. */
  placeAtReticle() {
    this.placeRequested = true;
  }

  end() {
    void this.session?.end();
  }

  private applyTransform() {
    this.holder.rotation.y = this.userRotation;
    this.holder.scale.setScalar(this.userScale);
    this.stage.model.root.scale.setScalar(CM_TO_M);
  }

  private preventOverlaySelect = (e: Event) => {
    // com a sobreposição DOM, os toques são tratados pelos gestos abaixo
    e.preventDefault();
  };

  private handleSelect = () => {
    if (!this.domOverlay) this.placeRequested = true;
  };

  private onTouchStart = (e: TouchEvent) => {
    if ((e.target as HTMLElement).closest('[data-xr-ui]')) return;
    const t = e.touches;
    this.gesture = {
      startDist: t.length >= 2 ? dist(t[0], t[1]) : 0,
      startScale: this.userScale,
      lastX: t[0].clientX,
      moved: 0,
      startTime: performance.now(),
      touches: t.length,
    };
  };

  private onTouchMove = (e: TouchEvent) => {
    const g = this.gesture;
    if (!g) return;
    const t = e.touches;
    g.touches = Math.max(g.touches, t.length);
    if (t.length >= 2) {
      if (!g.startDist) {
        g.startDist = dist(t[0], t[1]);
        g.startScale = this.userScale;
      }
      this.userScale = THREE.MathUtils.clamp((g.startScale * dist(t[0], t[1])) / g.startDist, MIN_SCALE, MAX_SCALE);
      g.moved += 10;
      this.applyTransform();
    } else if (t.length === 1 && g.touches === 1) {
      const dx = t[0].clientX - g.lastX;
      g.lastX = t[0].clientX;
      g.moved += Math.abs(dx);
      if (g.moved > 8) this.rotate(dx * 0.012);
    }
  };

  private onTouchEnd = (e: TouchEvent) => {
    const g = this.gesture;
    if (!g || e.touches.length) return;
    this.gesture = null;
    const tap = g.moved < 8 && g.touches === 1 && performance.now() - g.startTime < 400;
    if (tap) this.placeRequested = true;
  };

  private onXRFrame = (frame: XRFrame) => {
    const renderer = this.stage.renderer;
    const ref = renderer.xr.getReferenceSpace();
    if (!ref) return;
    if (this.hitSource) {
      const results = frame.getHitTestResults(this.hitSource);
      const hit = results[0];
      const pose = hit?.getPose(ref);
      if (hit && pose) {
        this.lastHit = hit;
        this.reticle.visible = true;
        this.reticle.matrix.fromArray(pose.transform.matrix);
      } else {
        this.reticle.visible = false;
        this.lastHit = null;
      }
    }

    if (this.placeRequested) {
      this.placeRequested = false;
      if (this.reticle.visible && this.lastHit) void this.place(this.lastHit);
    }

    if (this.anchor) {
      const pose = frame.getPose(this.anchor.anchorSpace, ref);
      if (pose) this.anchorGroup.matrix.fromArray(pose.transform.matrix);
    }
    // a retícula some depois de posicionado (volta ao tocar de novo para mover)
    this.reticle.material.opacity = this.placed ? 0.35 : 0.9;
    renderer.render(this.scene, this.stage.camera);
  };

  private async place(hit: XRHitTestResult) {
    this.anchor?.delete();
    this.anchor = null;
    // sem âncora: posição fixa no espaço de referência
    this.anchorGroup.matrix.copy(this.reticle.matrix);
    this.anchorGroup.visible = true;
    // virado para a pessoa: alinha a rotação inicial com a câmera
    if (!this.placed) {
      const camPos = new THREE.Vector3().setFromMatrixPosition(this.stage.renderer.xr.getCamera().matrixWorld);
      const objPos = new THREE.Vector3().setFromMatrixPosition(this.reticle.matrix);
      this.userRotation = Math.atan2(camPos.x - objPos.x, camPos.z - objPos.z);
      this.applyTransform();
    }
    this.placed = true;
    this.cb.onPhase('placed');
    if (this.supportsAnchors) {
      try {
        this.anchor = (await (hit as XRHitTestResult & { createAnchor: () => Promise<XRAnchor> }).createAnchor()) ?? null;
      } catch {
        this.anchor = null;
      }
    }
  }

  private handleEnd = () => {
    this.stage.setXRFrameHandler(null);
    this.hitSource?.cancel();
    this.hitSource = null;
    this.anchor?.delete();
    this.anchor = null;
    this.overlayRoot.removeEventListener('beforexrselect', this.preventOverlaySelect);
    this.overlayRoot.removeEventListener('touchstart', this.onTouchStart);
    this.overlayRoot.removeEventListener('touchmove', this.onTouchMove);
    this.overlayRoot.removeEventListener('touchend', this.onTouchEnd);
    // devolve o modelo ao estúdio 3D, exatamente como estava
    const model = this.stage.model.root;
    model.scale.setScalar(1);
    model.rotation.set(0, 0, 0);
    model.position.set(0, 0, 0);
    this.stage.model.setCableResting(false);
    (this.prevParent ?? this.stage.pose).add(model);
    this.session = null;
    this.cb.onPhase('ended');
  };
}

const dist = (a: Touch, b: Touch) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
