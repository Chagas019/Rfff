/**
 * Física de interface no estilo Apple (WWDC 2018, "Designing Fluid Interfaces"), adaptada para a web.
 */

/** Springs no vocabulário da Apple: damping 1 = sem ressalto; response = rapidez em segundos. */
export const SPRING = {
  /** Padrão para interface: criticamente amortecido, sem overshoot. */
  ui: { type: 'spring', bounce: 0, duration: 0.4 },
  /** Gaveta/sheet (damping ~0.8, response 0.3): um leve ressalto, usado após gesto com impulso. */
  sheet: { type: 'spring', bounce: 0.2, duration: 0.3 },
} as const;

/**
 * Projeta onde um movimento vai parar, como a desaceleração da rolagem.
 * `velocity` em px/s; `decelerationRate` 0.998 = normal, 0.99 = mais curto.
 */
export function project(velocity: number, decelerationRate = 0.998): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * Resistência progressiva além de um limite (rubber-banding): quanto mais longe, menos o elemento segue.
 * `overshoot` é quanto passou do limite; `dimension` é o tamanho de referência.
 */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  if (dimension <= 0) return 0;
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/** Aplica rubber-banding a um valor que deveria ficar entre `min` e `max`. */
export function rubberbandClamp(value: number, min: number, max: number, dimension: number): number {
  if (value < min) return min + rubberband(value - min, dimension);
  if (value > max) return max + rubberband(value - max, dimension);
  return value;
}

/** Vibração curta e causal (só em aparelhos com toque que suportam a API). */
export function tick(ms = 8) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator && window.matchMedia('(pointer: coarse)').matches) {
      navigator.vibrate(ms);
    }
  } catch {
    /* sem suporte: ignora */
  }
}
