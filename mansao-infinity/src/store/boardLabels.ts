import { create } from 'zustand';

/** Âncora de legenda já projetada na tela (px), calculada dentro do canvas a cada quadro. */
export interface ProjectedAnchor {
  id: string;
  x: number;
  y: number;
  visible: boolean;
}

/** Contorno do desenho na tela (px), para as colunas de legenda não invadirem a casa. */
export interface ScreenBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export const useBoardLabels = create<{ anchors: ProjectedAnchor[]; bounds: ScreenBounds | null; set: (a: ProjectedAnchor[], b: ScreenBounds | null) => void }>((set) => ({
  anchors: [],
  bounds: null,
  set: (anchors, bounds) => set({ anchors, bounds }),
}));
