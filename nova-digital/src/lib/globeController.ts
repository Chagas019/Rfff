import { clamp, damp, nearestAngle, rotationToFace } from './geo';

export interface GlobeView {
  x: number;
  y: number;
  distance: number;
}

type Listener = () => void;

const MAX_TILT = 1.25;

/**
 * Estado de câmera/rotação do globo, independente de React e de Three.js.
 * A cena lê os valores a cada quadro (`update`) e a interface chama os métodos públicos.
 */
export class GlobeController {
  rotX: number;
  rotY: number;
  distance: number;
  readonly minDistance: number;
  readonly maxDistance: number;

  private velX = 0;
  private velY = 0;
  private targetRot: { x: number; y: number } | null = null;
  private targetDistance: number;
  private focused = false;
  private dragging = false;
  private lastDragTime = 0;
  private hoverPause = false;
  private autoRotate: boolean;
  private readonly listeners = new Set<Listener>();
  private readonly initial: GlobeView;

  /** Velocidade da rotação automática (rad/s). */
  autoSpeed = 0.06;
  /** `true` aplica mudanças sem transição (prefers-reduced-motion). */
  instant = false;

  constructor(initial: GlobeView, opts: { minDistance?: number; maxDistance?: number; autoRotate?: boolean } = {}) {
    this.initial = { ...initial };
    this.rotX = initial.x;
    this.rotY = initial.y;
    this.distance = initial.distance;
    this.targetDistance = initial.distance;
    this.minDistance = opts.minDistance ?? 1.7;
    this.maxDistance = opts.maxDistance ?? 6;
    this.autoRotate = opts.autoRotate ?? true;
  }

  // ---------- assinatura (para a interface React refletir o estado) ----------
  subscribe = (fn: Listener) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  get isAutoRotating() {
    return this.autoRotate;
  }
  get isDragging() {
    return this.dragging;
  }
  get zoomTarget() {
    return this.targetDistance;
  }

  setAutoRotate(on: boolean) {
    if (this.autoRotate === on) return;
    this.autoRotate = on;
    if (on) this.focused = false;
    this.emit();
  }
  toggleAutoRotate() {
    this.setAutoRotate(!this.autoRotate);
  }

  /** Pausa a rotação automática enquanto o cursor está sobre um ponto. */
  setHoverPause(on: boolean) {
    this.hoverPause = on;
  }

  // ---------- arrastar ----------
  beginDrag() {
    this.dragging = true;
    this.targetRot = null;
    this.focused = false;
    this.velX = 0;
    this.velY = 0;
    this.lastDragTime = performance.now();
  }

  /** Recebe o deslocamento do ponteiro em pixels. */
  drag(dxPx: number, dyPx: number) {
    if (!this.dragging) return;
    const k = 0.0042 * (this.distance / 3.2);
    const dy = dxPx * k;
    const dx = dyPx * k;
    this.rotY += dy;
    this.rotX = clamp(this.rotX + dx, -MAX_TILT, MAX_TILT);
    const now = performance.now();
    const dt = Math.max(1, now - this.lastDragTime) / 1000;
    this.lastDragTime = now;
    // velocidade suavizada para a inércia ao soltar
    this.velY = this.velY * 0.6 + (dy / dt) * 0.4;
    this.velX = this.velX * 0.6 + (dx / dt) * 0.4;
  }

  endDrag() {
    if (!this.dragging) return;
    this.dragging = false;
    // soltar depois de parar o ponteiro não gera inércia
    if (performance.now() - this.lastDragTime > 90) {
      this.velX = 0;
      this.velY = 0;
    }
    this.velY = clamp(this.velY, -4, 4);
    this.velX = clamp(this.velX, -3, 3);
  }

  /** Giro por teclado (radianos). */
  nudge(dx: number, dy: number) {
    const base = this.targetRot ?? { x: this.rotX, y: this.rotY };
    this.targetRot = { x: clamp(base.x + dx, -MAX_TILT, MAX_TILT), y: base.y + dy };
    this.focused = true;
  }

  // ---------- zoom ----------
  setZoom(distance: number) {
    this.targetDistance = clamp(distance, this.minDistance, this.maxDistance);
    this.emit();
  }
  /** `factor` < 1 aproxima, > 1 afasta. */
  zoomBy(factor: number) {
    this.setZoom(this.targetDistance * factor);
  }

  // ---------- foco e reset ----------
  focus(lat: number, lon: number, distance?: number) {
    const r = rotationToFace(lat, lon);
    this.targetRot = { x: clamp(r.x, -MAX_TILT, MAX_TILT), y: nearestAngle(this.rotY, r.y) };
    this.velX = 0;
    this.velY = 0;
    this.focused = true;
    if (distance !== undefined) this.setZoom(distance);
  }

  /** Libera o globo depois de um foco, para a rotação automática voltar. */
  release() {
    this.focused = false;
    this.targetRot = null;
  }

  reset() {
    this.targetRot = { x: this.initial.x, y: nearestAngle(this.rotY, this.initial.y) };
    this.targetDistance = this.initial.distance;
    this.velX = 0;
    this.velY = 0;
    this.focused = false;
    this.emit();
  }

  get initialView(): GlobeView {
    return { ...this.initial };
  }

  // ---------- quadro a quadro ----------
  update(dt: number) {
    const step = Math.min(dt, 0.05);
    const lambda = this.instant ? 60 : 4.2;

    if (!this.dragging) {
      if (this.targetRot) {
        this.rotX = damp(this.rotX, this.targetRot.x, lambda, step);
        this.rotY = damp(this.rotY, this.targetRot.y, lambda, step);
        const done = Math.abs(this.rotX - this.targetRot.x) < 1e-3 && Math.abs(this.rotY - this.targetRot.y) < 1e-3;
        if (done) {
          this.rotX = this.targetRot.x;
          this.rotY = this.targetRot.y;
          this.targetRot = null;
        }
      } else {
        // inércia
        this.rotY += this.velY * step;
        this.rotX = clamp(this.rotX + this.velX * step, -MAX_TILT, MAX_TILT);
        const decay = Math.exp(-3.2 * step);
        this.velY *= decay;
        this.velX *= decay;
        if (this.autoRotate && !this.focused && !this.hoverPause) this.rotY += this.autoSpeed * step;
      }
    }

    this.distance = damp(this.distance, this.targetDistance, this.instant ? 60 : 5, step);
  }
}
