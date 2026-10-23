import * as THREE from 'three';
import { ArcadeStage, type ControlEvent } from '../three/ArcadeStage';
import type { ViewId } from '../three/CameraControls/views';
import type { CartridgeSlot } from '../three/ArcadeModel/parts';
import { ScreenSurface } from '../games/console/ScreenSurface';
import { ArcadeConsole } from '../games/console/ArcadeConsole';
import { CATALOG, catalogEntry, gameForCartridge } from '../games/catalog';
import type { GameId, PadState } from '../games/engine/types';
import { AudioEngine } from '../services/audio';
import { InputManager, type ButtonKey, type InputSource } from '../services/input';
import { createHighscores } from '../services/storage';
import { mulberry32 } from '../games/engine/random';

export type AppMode = 'explore' | 'play' | 'ar';

export interface RuntimeOptions {
  lowPower: boolean;
  reducedMotion: boolean;
  bootImageUrl: string;
}

/**
 * Liga as peças: palco 3D, tela (canvas → textura), console de jogos, entradas e áudio.
 * Não depende de React; a interface só chama métodos e escuta mudanças.
 */
export class ArcadeRuntime {
  readonly stage: ArcadeStage;
  readonly screen = new ScreenSurface();
  readonly input = new InputManager();
  readonly audio = new AudioEngine();
  readonly highscores = createHighscores();
  readonly console: ArcadeConsole;
  mode: AppMode = 'explore';
  /** Desliga a captura de teclado (ex.: diálogo aberto). */
  keyboardBlocked = false;
  private cleanups: Array<() => void> = [];
  private modeListeners = new Set<(m: AppMode) => void>();
  private cartListeners = new Set<() => void>();
  private pendingLaunch: number | null = null;

  constructor(container: HTMLElement, private opts: RuntimeOptions) {
    this.stage = new ArcadeStage(container, { lowPower: opts.lowPower, reducedMotion: opts.reducedMotion });
    this.console = new ArcadeConsole(this.screen, {
      rng: mulberry32((Date.now() ^ 0x5eed) >>> 0),
      sfx: (n) => this.audio.play(n),
      highscores: this.highscores,
    });
  }

  async init(progress: (step: string, f: number) => void) {
    const tick = (step: string, f: number) => {
      progress(step, f);
      return new Promise<void>((r) => requestAnimationFrame(() => r()));
    };
    await tick('Carregando a arte original da tela', 0.05);
    const img = await loadImage(this.opts.bootImageUrl).catch(() => null);
    if (img) this.console.setBootImage(img);
    this.console.render();
    await this.stage.load(this.screen.texture, tick);

    this.stage.onControl = this.handleModelControl;
    this.cleanups.push(this.stage.addFrameListener(this.frame));
    this.cleanups.push(
      this.input.subscribe((pad) => this.syncModel(pad)),
      this.input.attachKeyboard(window, () => !this.keyboardBlocked),
    );
    const unlock = () => this.audio.unlock();
    window.addEventListener('pointerdown', unlock, { capture: true });
    window.addEventListener('keydown', unlock, { capture: true });
    const vis = () => {
      if (document.hidden) {
        this.console.pause();
        this.input.releaseAll();
      }
    };
    document.addEventListener('visibilitychange', vis);
    this.cleanups.push(() => {
      window.removeEventListener('pointerdown', unlock, { capture: true });
      window.removeEventListener('keydown', unlock, { capture: true });
      document.removeEventListener('visibilitychange', vis);
    });
  }

  // ----------------------------------------------------------------- modos

  onMode(fn: (m: AppMode) => void) {
    this.modeListeners.add(fn);
    return () => this.modeListeners.delete(fn);
  }

  onCartridges(fn: () => void) {
    this.cartListeners.add(fn);
    return () => this.cartListeners.delete(fn);
  }

  setMode(mode: AppMode) {
    this.mode = mode;
    if (mode === 'play') {
      this.stage.setView('play');
      this.stage.setOrbitEnabled(false);
      this.console.showStartHint = true;
    } else if (mode === 'explore') {
      this.stage.setOrbitEnabled(true);
      this.console.showStartHint = false;
      if (this.stage.currentView === 'play') this.stage.setView('hero');
    }
    this.modeListeners.forEach((fn) => fn(mode));
  }

  setView(v: ViewId) {
    if (this.mode === 'play' && v !== 'play') this.setMode('explore');
    this.stage.setView(v);
  }

  resetView() {
    this.stage.setView(this.mode === 'play' ? 'play' : 'hero');
  }

  // ----------------------------------------------------------------- controles

  /** Botões HTML (ArcadeControls) e atalhos da interface. */
  pressButton(key: ButtonKey, down: boolean, holdId = 'ui', source: InputSource = 'touch') {
    this.input.setButton(source, key, down, holdId);
  }

  setStickFromUI(x: number, y: number) {
    this.input.setAxis('touch', x, y);
  }

  private handleModelControl = (e: ControlEvent) => {
    const c = e.control;
    if (c === 'joystick') {
      const a = e.phase === 'up' ? { x: 0, y: 0 } : (e.axis ?? { x: 0, y: 0 });
      this.input.setAxis('model', a.x, a.y);
      return;
    }
    if (c.startsWith('cart:')) {
      if (e.phase === 'down') this.toggleCartridge(c.slice(5) as CartridgeSlot);
      return;
    }
    this.input.setButton('model', c as ButtonKey, e.phase !== 'up', `p${e.pointerId}`);
  };

  private syncModel(pad: PadState) {
    const m = this.stage.model;
    if (!m) return;
    const quiet = this.console.mode === 'game' && this.console.game?.status === 'playing';
    for (const k of ['blue', 'yellow', 'red', 'start'] as const) {
      if (pad[k] && !m.isPressed(k) && !quiet) this.audio.play('button');
      m.setPressed(k, pad[k]);
    }
    m.setStick(pad.x, pad.y);
  }

  private frame = (dt: number) => {
    const pad = this.input.poll();
    this.console.update(dt, pad);
  };

  // ----------------------------------------------------------------- cartuchos

  isCartridgeInserted(slot: CartridgeSlot) {
    return this.stage.model?.isCartridgeInserted(slot) ?? true;
  }

  /** Remove ou reinsere um cartucho. Reinserir carrega o jogo dele. */
  toggleCartridge(slot: CartridgeSlot) {
    const model = this.stage.model;
    const entry = gameForCartridge(slot);
    if (model.isCartridgeInserted(slot)) {
      model.setCartridgeOut(slot, true);
      this.audio.play('eject');
      if (entry && this.console.game?.id === entry.id) this.console.openLibrary('CARTUCHO REMOVIDO');
    } else {
      model.setCartridgeOut(slot, false);
      window.setTimeout(() => this.audio.play('insert'), 280);
      if (entry) this.scheduleLaunch(entry.id, 650);
    }
    this.cartListeners.forEach((fn) => fn());
    const anyOut = (['top', 'side', 'bottom'] as const).some((s) => !model.isCartridgeInserted(s));
    this.stage.setFramePadding(anyOut ? 8 : 0);
  }

  /** Seleção pelo menu de cartuchos: anima a peça física (se houver) e abre o jogo. */
  selectGame(id: GameId) {
    const entry = catalogEntry(id);
    const slot = entry.cartridge;
    const model = this.stage.model;
    if (!slot) {
      this.scheduleLaunch(id, 0);
    } else if (!model.isCartridgeInserted(slot)) {
      this.toggleCartridge(slot);
    } else {
      // tira e recoloca rapidamente para mostrar qual peça carrega o jogo
      model.setCartridgeOut(slot, true);
      this.audio.play('eject');
      window.setTimeout(() => {
        model.setCartridgeOut(slot, false);
        this.audio.play('insert');
        this.cartListeners.forEach((fn) => fn());
      }, 550);
      this.scheduleLaunch(id, 900);
    }
    if (this.mode === 'explore') this.setMode('play');
  }

  private scheduleLaunch(id: GameId, delay: number) {
    if (this.pendingLaunch) window.clearTimeout(this.pendingLaunch);
    this.pendingLaunch = window.setTimeout(() => {
      this.pendingLaunch = null;
      this.console.launch(id);
    }, delay);
  }

  // ----------------------------------------------------------------- exportação (GLB/USDZ)

  /** Grupo pronto para exportar: em metros, deitado sobre o "chão" como na RA. */
  private async withExportPose<T>(fn: (root: THREE.Object3D) => Promise<T>): Promise<T> {
    const model = this.stage.model;
    const root = model.root;
    const parent = root.parent;
    const wrapper = new THREE.Group();
    wrapper.name = 'PocketArcade';
    wrapper.scale.setScalar(0.01);
    wrapper.rotation.x = -Math.PI / 2;
    wrapper.position.y = 0.0124;
    wrapper.add(root);
    model.setCableResting(true);
    // mapas procedurais (DataTexture) ficam fora: nem todo visualizador de RA os aceita
    const shell = model.materials.shell;
    const maps = { r: shell.roughnessMap, n: shell.normalMap };
    shell.roughnessMap = null;
    shell.normalMap = null;
    shell.needsUpdate = true;
    try {
      const scene = new THREE.Scene();
      scene.add(wrapper);
      scene.updateMatrixWorld(true);
      return await fn(scene);
    } finally {
      shell.roughnessMap = maps.r;
      shell.normalMap = maps.n;
      shell.needsUpdate = true;
      model.setCableResting(false);
      (parent ?? this.stage.pose).add(root);
    }
  }

  async exportGLB(): Promise<ArrayBuffer> {
    const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
    return this.withExportPose(async (scene) => (await new GLTFExporter().parseAsync(scene, { binary: true, onlyVisible: true, maxTextureSize: 1024 })) as ArrayBuffer);
  }

  async exportUSDZ(): Promise<Uint8Array> {
    const { USDZExporter } = await import('three/examples/jsm/exporters/USDZExporter.js');
    return this.withExportPose(async (scene) => {
      // o USDZ não tem visibilidade: o cabo pendurado (oculto) sai temporariamente
      const hidden: THREE.Object3D[] = [];
      scene.traverse((o) => {
        if (!o.visible) hidden.push(o);
      });
      const parents = hidden.map((o) => o.parent);
      hidden.forEach((o) => o.removeFromParent());
      try {
        return await new USDZExporter().parseAsync(scene, { quickLookCompatible: true, maxTextureSize: 1024 });
      } finally {
        hidden.forEach((o, i) => parents[i]?.add(o));
      }
    });
  }

  games() {
    return CATALOG;
  }

  dispose() {
    this.cleanups.forEach((fn) => fn());
    this.stage.dispose();
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
