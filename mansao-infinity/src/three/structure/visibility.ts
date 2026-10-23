import { useExperience } from '../../store/useExperience';

export interface LevelVisibility {
  L0: boolean;
  /** Parte alta (acima de 4 m) das paredes de pé-direito duplo do térreo. */
  L0up: boolean;
  L1: boolean;
  roof: boolean;
  ceil0: boolean;
  ceil1: boolean;
  /** Prancha de apresentação (pavimentos separados, topo das paredes em preto). */
  explode: boolean;
}

/**
 * Regras do corte "casa de bonecas": com corte no térreo some o pavimento
 * superior e os forros do térreo; com corte no superior somem a cobertura e os
 * forros do superior. Sem corte, tudo aparece. Na prancha de apresentação os
 * forros e a cobertura somem e o pé-direito duplo é cortado a 4 m; o corte
 * escolhe mostrar os dois pavimentos, só o térreo ou só o superior.
 */
export function levelVisibility(cut: 0 | 1 | null, explode = false): LevelVisibility {
  if (explode) {
    return { L0: cut !== 1, L0up: false, L1: cut !== 0, roof: false, ceil0: false, ceil1: false, explode: true };
  }
  if (cut === null) return { L0: true, L0up: true, L1: true, roof: true, ceil0: true, ceil1: true, explode: false };
  if (cut === 0) return { L0: true, L0up: false, L1: false, roof: false, ceil0: false, ceil1: false, explode: false };
  return { L0: true, L0up: true, L1: true, roof: false, ceil0: true, ceil1: false, explode: false };
}

export function useLevelVisibility(): LevelVisibility {
  const cut = useExperience((s) => (s.mode === 'walk' ? null : s.cutLevel));
  const explode = useExperience((s) => s.mode === 'explode');
  return levelVisibility(cut, explode);
}
