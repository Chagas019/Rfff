import { create } from 'zustand';

export type View = 'aerea' | 'corte' | 'interior';
export type Light = 'tarde' | 'noite';

interface State {
  view: View;
  light: Light;
  labels: boolean;
  /** Incrementa a cada troca de vista para reenquadrar a câmera. */
  shot: number;
  setView: (v: View) => void;
  setLight: (l: Light) => void;
  setLabels: (v: boolean) => void;
}

const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
const initialView = (['aerea', 'corte', 'interior'] as View[]).find((v) => v === params.get('vista')) ?? 'aerea';
const initialLight: Light = params.get('luz') === 'noite' ? 'noite' : 'tarde';

export const useStore = create<State>((set) => ({
  view: initialView,
  light: initialLight,
  labels: true,
  shot: 0,
  setView: (view) => set((s) => ({ view, shot: s.shot + 1 })),
  setLight: (light) => set({ light }),
  setLabels: (labels) => set({ labels }),
}));
