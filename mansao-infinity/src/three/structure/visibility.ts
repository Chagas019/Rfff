import { useExperience } from '../../store/useExperience';

export interface LevelVisibility {
  L0: boolean;
  L1: boolean;
  roof: boolean;
  ceil0: boolean;
  ceil1: boolean;
}

/**
 * Regras do corte "casa de bonecas": com corte no térreo some o pavimento
 * superior e os forros do térreo; com corte no superior somem a cobertura e os
 * forros do superior. Sem corte, tudo aparece.
 */
export function levelVisibility(cut: 0 | 1 | null): LevelVisibility {
  if (cut === null) return { L0: true, L1: true, roof: true, ceil0: true, ceil1: true };
  if (cut === 0) return { L0: true, L1: false, roof: false, ceil0: false, ceil1: false };
  return { L0: true, L1: true, roof: false, ceil0: true, ceil1: false };
}

export function useLevelVisibility(): LevelVisibility {
  const cut = useExperience((s) => (s.mode === 'walk' ? null : s.cutLevel));
  return levelVisibility(cut);
}
