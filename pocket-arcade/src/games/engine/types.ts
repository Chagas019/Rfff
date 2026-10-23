import type { Rng } from './random';

/** Estado bruto dos controles (todas as fontes somadas: toque, teclado, gamepad, 3D). */
export interface PadState {
  /** Joystick: −1 (esquerda) … 1 (direita). */
  x: number;
  /** Joystick: −1 (baixo) … 1 (cima). */
  y: number;
  /** Botão azul: ação principal. */
  blue: boolean;
  /** Botão amarelo: ação secundária / confirmar / pular. */
  yellow: boolean;
  /** Botão vermelho: voltar / cancelar. */
  red: boolean;
  /** Botão branco abaixo da tela: Start / Pausa. */
  start: boolean;
}

export type EdgeKey = 'blue' | 'yellow' | 'red' | 'start' | 'left' | 'right' | 'up' | 'down';

/** Entrada de um quadro, com direções digitais e "acabou de apertar". */
export interface GameInput extends PadState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  pressed: Record<EdgeKey, boolean>;
}

export const EMPTY_PAD: PadState = { x: 0, y: 0, blue: false, yellow: false, red: false, start: false };

const DIR_THRESHOLD = 0.45;

export function digital(p: PadState) {
  return {
    left: p.x < -DIR_THRESHOLD,
    right: p.x > DIR_THRESHOLD,
    up: p.y > DIR_THRESHOLD,
    down: p.y < -DIR_THRESHOLD,
  };
}

export function makeInput(curr: PadState, prev: PadState): GameInput {
  const d = digital(curr);
  const pd = digital(prev);
  return {
    ...curr,
    ...d,
    pressed: {
      blue: curr.blue && !prev.blue,
      yellow: curr.yellow && !prev.yellow,
      red: curr.red && !prev.red,
      start: curr.start && !prev.start,
      left: d.left && !pd.left,
      right: d.right && !pd.right,
      up: d.up && !pd.up,
      down: d.down && !pd.down,
    },
  };
}

export type GameId = 'pixel-adventure' | 'space-defender' | 'snake-classic' | 'brick-breaker';

export type GameStatus = 'title' | 'playing' | 'paused' | 'levelclear' | 'gameover' | 'victory';

export type SfxName =
  | 'button'
  | 'confirm'
  | 'back'
  | 'start'
  | 'coin'
  | 'jump'
  | 'shoot'
  | 'hit'
  | 'explode'
  | 'bounce'
  | 'brick'
  | 'powerup'
  | 'lose'
  | 'win'
  | 'insert'
  | 'eject'
  | 'pause'
  | 'step';

export interface HighscoreStore {
  get(id: GameId): number;
  set(id: GameId, score: number): void;
}

export interface GameEnv {
  rng: Rng;
  sfx: (name: SfxName) => void;
  highscores: HighscoreStore;
}

export interface Game {
  readonly id: GameId;
  readonly title: string;
  status: GameStatus;
  score: number;
  best: number;
  /** O jogo pediu para voltar à biblioteca (botão vermelho no menu de pausa/fim). */
  exitRequested: boolean;
  start(): void;
  togglePause(): void;
  update(dt: number, input: GameInput): void;
  render(ctx: CanvasRenderingContext2D): void;
}
