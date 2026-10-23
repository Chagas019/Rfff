import { mulberry32 } from '../games/engine/random';
import { EMPTY_PAD, makeInput, type GameEnv, type GameId, type GameInput, type PadState, type SfxName } from '../games/engine/types';

export function testEnv(seed = 1) {
  const sounds: SfxName[] = [];
  const scores = new Map<GameId, number>();
  const env: GameEnv = {
    rng: mulberry32(seed),
    sfx: (n) => sounds.push(n),
    highscores: { get: (id) => scores.get(id) ?? 0, set: (id, s) => scores.set(id, s) },
  };
  return { env, sounds, scores };
}

/** Gera entradas quadro a quadro, com detecção de borda como no app. */
export class PadDriver {
  private prev: PadState = { ...EMPTY_PAD };
  frame(p: Partial<PadState> = {}): GameInput {
    const curr = { ...EMPTY_PAD, ...p };
    const input = makeInput(curr, this.prev);
    this.prev = curr;
    return input;
  }
}

export const DT = 1 / 60;
