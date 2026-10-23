import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createMaterials, type ArcadeMaterials } from '../Materials/materials';
import {
  buildButtons,
  buildCable,
  buildCartridges,
  buildFrontDetails,
  buildJoystick,
  buildScreen,
  buildScrews,
  buildShell,
  buildSides,
  buildTopLoop,
  type CartridgePart,
  type CartridgeSlot,
} from './parts';

export type ButtonId = 'blue' | 'yellow' | 'red' | 'start';
export type ControlId = ButtonId | 'joystick' | `cart:${CartridgeSlot}`;

export interface BuildProgress {
  (step: string, fraction: number): void | Promise<void>;
}

const PRESS_DEPTH: Record<ButtonId, number> = { blue: 0.17, yellow: 0.17, red: 0.17, start: 0.06 };
const STICK_MAX_TILT = 0.32; // rad

/**
 * Modelo 3D procedural do aparelho. Toda a geometria é real (extrusões, tornos e tubos),
 * então qualquer ângulo é renderizado a partir dela — nada de imagem plana girando.
 *
 * O grupo `root` está em centímetros; a sessão de RA aplica a escala para metros.
 */
export class ArcadeModel {
  readonly root = new THREE.Group();
  readonly materials: ArcadeMaterials;
  readonly pickables: THREE.Object3D[] = [];
  readonly cartridges: CartridgePart[];
  readonly display: THREE.Mesh;

  private buttonGroups: Record<ButtonId, THREE.Object3D>;
  private buttonOffset: Record<ButtonId, number> = { blue: 0, yellow: 0, red: 0, start: 0 };
  private pressed: Record<ButtonId, boolean> = { blue: false, yellow: false, red: false, start: false };
  private stick: THREE.Object3D;
  private stickTarget = new THREE.Vector2();
  private stickCurrent = new THREE.Vector2();
  private cartState = new Map<CartridgeSlot, { target: number; value: number }>();
  private cableHanging!: THREE.Object3D;
  private cableResting!: THREE.Object3D;

  private constructor(screenTexture: THREE.Texture) {
    this.root.name = 'pocket-arcade';
    this.materials = createMaterials();
    const m = this.materials;

    this.root.add(buildShell(m));
    this.root.add(buildScrews(m));
    const screen = buildScreen(m, screenTexture);
    this.display = screen.display;
    this.root.add(screen.group);
    const front = buildFrontDetails(m);
    this.root.add(front.group);
    const buttons = buildButtons(m);
    Object.values(buttons).forEach((b) => this.root.add(b));
    const joy = buildJoystick(m);
    this.root.add(joy.group);
    this.stick = joy.stick;
    this.root.add(buildSides(m));
    this.cartridges = buildCartridges(m);
    this.cartridges.forEach((c) => {
      this.root.add(c.group);
      this.cartState.set(c.slot, { target: 0, value: 0 });
    });
    this.root.add(buildTopLoop(m));
    const cable = buildCable(m);
    this.cableHanging = cable.hanging;
    this.cableResting = cable.resting;
    this.root.add(cable.group);

    this.buttonGroups = {
      blue: buttons.blue,
      yellow: buttons.yellow,
      red: buttons.red,
      start: front.pill,
    };

    // Solda vértices idênticos (geometria indexada): ~3× menos memória na GPU e arquivos GLB/USDZ menores.
    const welded = new Map<THREE.BufferGeometry, THREE.BufferGeometry>();
    this.root.traverse((o) => {
      if (o.userData.control) this.pickables.push(o);
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || mesh.geometry.index) return;
      let g = welded.get(mesh.geometry);
      if (!g) {
        g = mergeVertices(mesh.geometry, 1e-5);
        welded.set(mesh.geometry, g);
        mesh.geometry.dispose();
      }
      mesh.geometry = g;
    });
  }

  /** Monta o modelo em etapas (para o indicador de carregamento poder avançar entre elas). */
  static async create(screenTexture: THREE.Texture, progress?: BuildProgress) {
    await progress?.('Preparando materiais e texturas', 0.15);
    const model = new ArcadeModel(screenTexture);
    await progress?.('Carcaça, botões, joystick e cartuchos montados', 0.6);
    return model;
  }

  /** Versão síncrona (testes e exportação). */
  static createSync(screenTexture: THREE.Texture) {
    return new ArcadeModel(screenTexture);
  }

  setPressed(id: ButtonId, down: boolean) {
    this.pressed[id] = down;
  }

  isPressed(id: ButtonId) {
    return this.pressed[id];
  }

  /** Inclinação do joystick, x/y em −1…1 (y positivo = para cima). */
  setStick(x: number, y: number) {
    this.stickTarget.set(THREE.MathUtils.clamp(x, -1, 1), THREE.MathUtils.clamp(y, -1, 1));
  }

  /** Cabo pendurado (vitrine) ou apoiado na mesa (aparelho deitado na RA). */
  setCableResting(resting: boolean) {
    this.cableHanging.visible = !resting;
    this.cableResting.visible = resting;
  }

  isCartridgeInserted(slot: CartridgeSlot) {
    return (this.cartState.get(slot)?.target ?? 0) === 0;
  }

  /** Remove (true) ou reinsere (false) um cartucho, com animação. */
  setCartridgeOut(slot: CartridgeSlot, out: boolean) {
    const s = this.cartState.get(slot);
    if (s) s.target = out ? 1 : 0;
  }

  /** Avança as animações (molas dos botões, joystick e cartuchos). */
  update(dt: number) {
    const k = 1 - Math.exp(-dt * 28);
    for (const id of Object.keys(this.buttonGroups) as ButtonId[]) {
      const target = this.pressed[id] ? -PRESS_DEPTH[id] : 0;
      this.buttonOffset[id] += (target - this.buttonOffset[id]) * k;
      const g = this.buttonGroups[id];
      g.position.z = (g.userData.baseZ ??= g.position.z) + this.buttonOffset[id];
    }

    const ks = 1 - Math.exp(-dt * 18);
    this.stickCurrent.lerp(this.stickTarget, ks);
    this.stick.rotation.x = -this.stickCurrent.y * STICK_MAX_TILT;
    this.stick.rotation.y = this.stickCurrent.x * STICK_MAX_TILT;

    const kc = 1 - Math.exp(-dt * 7);
    for (const c of this.cartridges) {
      const s = this.cartState.get(c.slot)!;
      s.value += (s.target - s.value) * kc;
      if (Math.abs(s.target - s.value) < 1e-4) s.value = s.target;
      const t = s.value;
      // Desliza para fora do encaixe; depois de solto, se afasta um pouco e gira para mostrar a peça inteira.
      const slide = Math.min(1, t * 1.25) * c.travel;
      const away = Math.max(0, t - 0.8) * 5 * 0.9;
      c.group.position.copy(c.home).addScaledVector(c.direction, slide + away);
      c.group.position.z = c.home.z + Math.max(0, t - 0.8) * 5 * 1.4;
      c.group.rotation.set(0, Math.max(0, t - 0.8) * 5 * 0.35, 0);
    }
  }

  dispose() {
    this.root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.geometry.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat) => {
          const map = (mat as THREE.MeshStandardMaterial).map;
          if (map && !(map as THREE.CanvasTexture).userData?.shared) map.dispose();
          mat.dispose();
        });
      }
    });
    this.materials.dispose();
  }
}
