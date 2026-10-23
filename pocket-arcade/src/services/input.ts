import { EMPTY_PAD, type PadState } from '../games/engine/types';

export type ButtonKey = 'blue' | 'yellow' | 'red' | 'start';
export type InputSource = 'keyboard' | 'gamepad' | 'touch' | 'model';

/** Teclado → controles do aparelho. */
export const KEYMAP: Record<string, ButtonKey | 'left' | 'right' | 'up' | 'down'> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  KeyZ: 'blue',
  KeyJ: 'blue',
  KeyX: 'yellow',
  KeyK: 'yellow',
  Space: 'yellow',
  KeyC: 'red',
  KeyL: 'red',
  Backspace: 'red',
  Escape: 'red',
  Enter: 'start',
  KeyP: 'start',
};

/** Gamepad padrão (layout "standard" da Gamepad API). */
export const GAMEPAD_MAP: Record<number, ButtonKey | 'left' | 'right' | 'up' | 'down'> = {
  0: 'yellow', // A / ✕
  1: 'red', // B / ◯
  2: 'blue', // X / ▢
  3: 'blue', // Y / △
  8: 'red', // Select
  9: 'start', // Start
  12: 'up',
  13: 'down',
  14: 'left',
  15: 'right',
};

const DEADZONE = 0.2;

interface SourceState {
  buttons: Record<ButtonKey, boolean>;
  dirs: { left: boolean; right: boolean; up: boolean; down: boolean };
  axis: { x: number; y: number } | null;
}

const blank = (): SourceState => ({
  buttons: { blue: false, yellow: false, red: false, start: false },
  dirs: { left: false, right: false, up: false, down: false },
  axis: null,
});

/**
 * Junta todas as formas de controlar: teclado, gamepad, botões na tela (HTML) e
 * toque direto nos botões do modelo 3D. Vários toques simultâneos são suportados
 * (cada ponteiro é rastreado separadamente).
 */
export class InputManager {
  private sources: Record<InputSource, SourceState> = {
    keyboard: blank(),
    gamepad: blank(),
    touch: blank(),
    model: blank(),
  };
  /** Ponteiros ativos por fonte (para soltar só quando o último dedo sair). */
  private holds = new Map<string, Set<string>>();
  enabled = true;
  lastSource: InputSource = 'keyboard';
  private listeners = new Set<(pad: PadState) => void>();
  private last: PadState = { ...EMPTY_PAD };
  /**
   * Toques mais curtos que um quadro (apertou e soltou antes do próximo poll) não podem
   * se perder: o aperto fica "travado" até ser lido uma vez.
   */
  private latchedButtons = new Set<ButtonKey>();
  private latchedDirs = new Set<'left' | 'right' | 'up' | 'down'>();

  /** Notifica mudanças (usado para animar os botões 3D e os botões HTML). */
  subscribe(fn: (pad: PadState) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  setButton(source: InputSource, key: ButtonKey, down: boolean, holdId = 'default') {
    const id = `${source}:${key}`;
    const set = this.holds.get(id) ?? new Set<string>();
    if (down) set.add(holdId);
    else set.delete(holdId);
    this.holds.set(id, set);
    this.sources[source].buttons[key] = set.size > 0;
    if (down) {
      this.lastSource = source;
      this.latchedButtons.add(key);
    }
  }

  setDirection(source: InputSource, dir: 'left' | 'right' | 'up' | 'down', down: boolean) {
    this.sources[source].dirs[dir] = down;
    if (down) {
      this.lastSource = source;
      this.latchedDirs.add(dir);
    }
  }

  setAxis(source: InputSource, x: number, y: number) {
    this.sources[source].axis = x === 0 && y === 0 ? null : { x: clamp(x), y: clamp(y) };
    this.lastSource = source;
  }

  releaseAll(source?: InputSource) {
    const list = source ? [source] : (Object.keys(this.sources) as InputSource[]);
    for (const s of list) this.sources[s] = blank();
    for (const k of [...this.holds.keys()]) if (!source || k.startsWith(source + ':')) this.holds.delete(k);
  }

  /** Lê o gamepad e devolve o estado combinado deste quadro. */
  poll(): PadState {
    this.pollGamepad();
    const pad: PadState = { ...EMPTY_PAD };
    for (const s of Object.values(this.sources)) {
      pad.blue ||= s.buttons.blue;
      pad.yellow ||= s.buttons.yellow;
      pad.red ||= s.buttons.red;
      pad.start ||= s.buttons.start;
      const dx = (s.dirs.right ? 1 : 0) - (s.dirs.left ? 1 : 0);
      const dy = (s.dirs.up ? 1 : 0) - (s.dirs.down ? 1 : 0);
      const ax = s.axis?.x ?? 0;
      const ay = s.axis?.y ?? 0;
      const x = Math.abs(dx) > Math.abs(ax) ? dx : ax;
      const y = Math.abs(dy) > Math.abs(ay) ? dy : ay;
      if (Math.abs(x) > Math.abs(pad.x)) pad.x = x;
      if (Math.abs(y) > Math.abs(pad.y)) pad.y = y;
    }
    for (const k of this.latchedButtons) pad[k] = true;
    if (this.latchedDirs.has('left') && pad.x > -1) pad.x = -1;
    if (this.latchedDirs.has('right') && pad.x < 1) pad.x = 1;
    if (this.latchedDirs.has('up') && pad.y < 1) pad.y = 1;
    if (this.latchedDirs.has('down') && pad.y > -1) pad.y = -1;
    this.latchedButtons.clear();
    this.latchedDirs.clear();
    if (!this.enabled) return { ...EMPTY_PAD };
    if (!samePad(pad, this.last)) {
      this.last = pad;
      this.listeners.forEach((fn) => fn(pad));
    }
    return pad;
  }

  private pollGamepad() {
    const gps = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = Array.from(gps ?? []).find((g) => g && g.connected);
    const s = blank();
    if (gp) {
      gp.buttons.forEach((b, i) => {
        const m = GAMEPAD_MAP[i];
        if (!m || !b.pressed) return;
        if (m === 'left' || m === 'right' || m === 'up' || m === 'down') s.dirs[m] = true;
        else s.buttons[m] = true;
      });
      const ax = gp.axes[0] ?? 0;
      const ay = -(gp.axes[1] ?? 0);
      if (Math.hypot(ax, ay) > DEADZONE) s.axis = { x: clamp(ax), y: clamp(ay) };
      if (Object.values(s.buttons).some(Boolean) || s.axis) this.lastSource = 'gamepad';
    }
    this.sources.gamepad = s;
  }

  /** Liga o teclado. `isActive` decide se as teclas devem ser capturadas agora. */
  attachKeyboard(target: Window, isActive: () => boolean) {
    const handler = (down: boolean) => (e: KeyboardEvent) => {
      const m = KEYMAP[e.code];
      if (!m) return;
      const el = e.target instanceof HTMLElement ? e.target : null;
      // não interferir com botões/campos focados (Enter/Espaço ativam o botão focado)
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (el && (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') && (e.code === 'Enter' || e.code === 'Space')) return;
      if (!isActive()) {
        if (!down) this.releaseKey(m);
        return;
      }
      if (e.repeat) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      if (m === 'left' || m === 'right' || m === 'up' || m === 'down') this.setDirection('keyboard', m, down);
      else this.setButton('keyboard', m, down, e.code);
    };
    const kd = handler(true);
    const ku = handler(false);
    const blur = () => this.releaseAll('keyboard');
    target.addEventListener('keydown', kd);
    target.addEventListener('keyup', ku);
    target.addEventListener('blur', blur);
    return () => {
      target.removeEventListener('keydown', kd);
      target.removeEventListener('keyup', ku);
      target.removeEventListener('blur', blur);
    };
  }

  private releaseKey(m: ButtonKey | 'left' | 'right' | 'up' | 'down') {
    if (m === 'left' || m === 'right' || m === 'up' || m === 'down') this.setDirection('keyboard', m, false);
    else this.releaseAll('keyboard');
  }
}

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

function samePad(a: PadState, b: PadState) {
  return a.blue === b.blue && a.yellow === b.yellow && a.red === b.red && a.start === b.start && Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) < 0.01;
}
