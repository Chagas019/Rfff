import type { GameId, HighscoreStore } from '../games/engine/types';

/** localStorage com proteção: navegação privada ou bloqueio de cookies não quebram o app. */
export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* sem armazenamento: o valor vale só nesta sessão */
  }
}

const PREFIX = 'pocket-arcade:best:';

export function createHighscores(): HighscoreStore {
  const memory = new Map<GameId, number>();
  return {
    get(id) {
      if (memory.has(id)) return memory.get(id)!;
      const n = Number(readStorage(PREFIX + id));
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
    },
    set(id, score) {
      memory.set(id, score);
      writeStorage(PREFIX + id, String(Math.floor(score)));
    },
  };
}
