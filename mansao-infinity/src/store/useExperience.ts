import { create } from 'zustand';
import type { TimeOfDay } from '../config/lighting';
import { detectQuality, type QualityLevel } from '../config/quality';
import { ROOMS, roomById, LEVEL_Y, OPERABLE_IDS, type Level } from '../data/plan';

/**
 * Modos de visualização:
 *  intro      — tela inicial com a fachada girando lentamente
 *  exterior   — câmera orbital livre ao redor da propriedade
 *  interior   — corte "casa de bonecas": tira a cobertura/pavimento para ver o cômodo
 *  top        — vista superior em corte, como uma planta 3D
 *  walk       — caminhada em primeira pessoa
 *  tour       — visita guiada cinematográfica
 *  explode    — prancha de apresentação: isométrica com pavimentos separados e legendas
 */
export type ViewMode = 'intro' | 'exterior' | 'interior' | 'top' | 'walk' | 'tour' | 'explode';

export interface CameraShot {
  position: [number, number, number];
  target: [number, number, number];
  /** Transição suave (true) ou corte seco (false). */
  smooth?: boolean;
  /** Tempo de suavização do deslocamento (s). */
  travel?: number;
}

export interface CameraPose {
  x: number;
  z: number;
  y: number;
  /** Ângulo de visão no plano (rad): 0 = olhando para −z (norte). */
  heading: number;
  level: Level;
}

export interface WalkSpawn {
  x: number;
  z: number;
  level: Level;
  lookX: number;
  lookZ: number;
}

interface ExperienceState {
  started: boolean;
  mode: ViewMode;
  /** Pavimento cortado no modo interior/topo (mostra até este pavimento, sem forro). */
  cutLevel: Level | null;
  time: TimeOfDay;
  quality: QualityLevel;
  qualityAuto: boolean;
  lights: Record<string, boolean>;
  exteriorLights: boolean;
  doors: Record<string, boolean>;
  selectedRoom: string | null;
  hoveredRoom: string | null;
  planOpen: boolean;
  planLevel: Level;
  settingsOpen: boolean;
  helpOpen: boolean;
  shot: (CameraShot & { nonce: number }) | null;
  pose: CameraPose;
  walkSpawn: (WalkSpawn & { nonce: number }) | null;
  tourStep: number;
  tourPlaying: boolean;
  toast: { text: string; nonce: number } | null;
  /** Separação vertical (m) entre térreo e superior na prancha de apresentação. */
  explodeAmount: number;
  /** Fundo da prancha: claro quadriculado ou estúdio escuro. */
  boardTheme: 'light' | 'dark';
  /** Legendas dos cômodos na prancha. */
  boardLabels: boolean;
  /** Pedido de fade para cortes de câmera. */
  fade: number;

  start: (mode?: ViewMode) => void;
  setMode: (mode: ViewMode) => void;
  setCutLevel: (lv: Level | null) => void;
  setTime: (t: TimeOfDay) => void;
  setQuality: (q: QualityLevel, auto?: boolean) => void;
  toggleRoomLight: (id: string) => void;
  setAllLights: (on: boolean) => void;
  toggleExteriorLights: () => void;
  toggleDoor: (id: string) => void;
  setAllDoors: (open: boolean) => void;
  selectRoom: (id: string | null) => void;
  focusRoom: (id: string) => void;
  hoverRoom: (id: string | null) => void;
  setPlanOpen: (open: boolean) => void;
  setPlanLevel: (lv: Level) => void;
  setSettingsOpen: (open: boolean) => void;
  setHelpOpen: (open: boolean) => void;
  requestShot: (shot: CameraShot) => void;
  setPose: (pose: CameraPose) => void;
  walkInto: (roomId?: string) => void;
  setTourStep: (i: number) => void;
  setTourPlaying: (p: boolean) => void;
  notify: (text: string) => void;
  requestFade: () => void;
  setExplodeAmount: (m: number) => void;
  setBoardTheme: (t: 'light' | 'dark') => void;
  setBoardLabels: (on: boolean) => void;
}

const allRoomLights = (on: boolean) => Object.fromEntries(ROOMS.map((rm) => [rm.id, on]));

let nonce = 0;

/** Parâmetros de URL opcionais: ?hora=dia|por-do-sol|noite e ?qualidade=baixa|media|alta|ultra. */
function urlParam(name: string): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(name);
}
const TIME_PARAM: Record<string, TimeOfDay> = { dia: 'day', 'por-do-sol': 'sunset', noite: 'night', day: 'day', sunset: 'sunset', night: 'night' };
const QUALITY_PARAM: Record<string, QualityLevel> = { baixa: 'low', media: 'medium', alta: 'high', ultra: 'ultra', low: 'low', medium: 'medium', high: 'high' };
const initialTime: TimeOfDay = TIME_PARAM[urlParam('hora') ?? ''] ?? 'sunset';
const initialQuality: QualityLevel | undefined = QUALITY_PARAM[urlParam('qualidade') ?? ''];

/** Enquadramento "casa de bonecas" de um cômodo: câmera alta a sudeste do centro. */
export function roomShot(id: string): CameraShot | null {
  const rm = roomById(id);
  if (!rm) return null;
  const cx = (rm.rect.x0 + rm.rect.x1) / 2;
  const cz = (rm.rect.z0 + rm.rect.z1) / 2;
  const size = Math.max(rm.rect.x1 - rm.rect.x0, rm.rect.z1 - rm.rect.z0);
  const dist = Math.max(9, size * 1.35);
  const y = LEVEL_Y[rm.level];
  return {
    position: [cx + dist * 0.3, y + dist * 1.15, cz + dist * 0.6],
    target: [cx, y + 0.6, cz],
    smooth: true,
  };
}

export const EXTERIOR_SHOT: CameraShot = { position: [42, 17, 48], target: [-2, 3, -2], smooth: true };
export const TOP_SHOT: CameraShot = { position: [-2, 78, 4], target: [-2, 0, 0.5], smooth: true };
/** Isométrica da prancha (teleobjetiva de longe, quase ortogonal): vista de sudeste, como nas pranchas de arquitetura. */
export const EXPLODE_SHOT: CameraShot = { position: [72, 76, 100], target: [-2, 7.5, 1], smooth: true, travel: 1.4 };

export const useExperience = create<ExperienceState>((set, get) => ({
  started: false,
  mode: 'intro',
  cutLevel: null,
  time: initialTime,
  quality: initialQuality ?? detectQuality(),
  qualityAuto: !initialQuality,
  lights: allRoomLights(true),
  exteriorLights: true,
  doors: {},
  selectedRoom: null,
  hoveredRoom: null,
  planOpen: false,
  planLevel: 0,
  settingsOpen: false,
  helpOpen: false,
  shot: null,
  pose: { x: 40, z: 45, y: 16, heading: 0, level: 0 },
  walkSpawn: null,
  tourStep: 0,
  tourPlaying: false,
  toast: null,
  fade: 0,
  explodeAmount: 14,
  boardTheme: 'light',
  boardLabels: true,

  start: (mode = 'exterior') => {
    set({ started: true });
    if (mode === 'tour') {
      set({ mode: 'tour', tourStep: 0, tourPlaying: true, cutLevel: null, selectedRoom: null });
    } else {
      get().setMode(mode);
    }
  },

  setMode: (mode) => {
    const prev = get().mode;
    const patch: Partial<ExperienceState> = { mode };
    if (mode !== 'tour') patch.tourPlaying = false;
    if (mode === 'exterior') {
      patch.cutLevel = null;
      if (prev !== 'exterior') patch.shot = { ...EXTERIOR_SHOT, nonce: ++nonce };
    } else if (mode === 'top') {
      patch.cutLevel = get().cutLevel ?? 1;
      patch.shot = { ...TOP_SHOT, nonce: ++nonce };
    } else if (mode === 'interior') {
      const sel = get().selectedRoom ?? 'living';
      const rm = roomById(sel);
      patch.cutLevel = rm?.level ?? 0;
      patch.selectedRoom = sel;
      const s = roomShot(sel);
      if (s) patch.shot = { ...s, nonce: ++nonce };
    } else if (mode === 'walk') {
      patch.cutLevel = null;
      if (!get().walkSpawn) {
        patch.walkSpawn = { x: -1, z: 14, level: 0, lookX: -1, lookZ: 0, nonce: ++nonce };
      }
    } else if (mode === 'explode') {
      patch.cutLevel = null;
      patch.selectedRoom = null;
      patch.shot = { ...EXPLODE_SHOT, nonce: ++nonce };
    } else if (mode === 'tour') {
      patch.tourStep = 0;
      patch.tourPlaying = true;
      patch.selectedRoom = null;
    }
    set(patch);
  },

  setCutLevel: (lv) => set({ cutLevel: lv }),
  setTime: (t) => set({ time: t }),
  setQuality: (q, auto = false) => set({ quality: q, qualityAuto: auto }),
  toggleRoomLight: (id) => set((s) => ({ lights: { ...s.lights, [id]: !s.lights[id] } })),
  setAllLights: (on) => set({ lights: allRoomLights(on), exteriorLights: on }),
  toggleExteriorLights: () => set((s) => ({ exteriorLights: !s.exteriorLights })),
  toggleDoor: (id) => set((s) => ({ doors: { ...s.doors, [id]: !s.doors[id] } })),
  setAllDoors: (open) => set({ doors: Object.fromEntries(OPERABLE_IDS.map((id) => [id, open])) }),

  selectRoom: (id) => set({ selectedRoom: id }),

  focusRoom: (id) => {
    const rm = roomById(id);
    if (!rm) return;
    const { mode } = get();
    if (mode === 'walk') {
      get().walkInto(id);
      set({ selectedRoom: id });
      return;
    }
    if (mode === 'explode') {
      set({ selectedRoom: id, planLevel: rm.level });
      return;
    }
    const s = roomShot(id);
    set({
      selectedRoom: id,
      mode: mode === 'top' ? 'top' : 'interior',
      cutLevel: rm.outdoor && rm.level === 0 ? null : rm.level,
      planLevel: rm.level,
      tourPlaying: false,
      shot: s ? { ...s, nonce: ++nonce } : get().shot,
    });
  },

  hoverRoom: (id) => {
    if (get().hoveredRoom !== id) set({ hoveredRoom: id });
  },
  setPlanOpen: (open) => set({ planOpen: open }),
  setPlanLevel: (lv) => set({ planLevel: lv }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setHelpOpen: (open) => set({ helpOpen: open }),
  requestShot: (shot) => set({ shot: { ...shot, nonce: ++nonce } }),
  setPose: (pose) => set({ pose }),

  walkInto: (roomId) => {
    const rm = roomId ? roomById(roomId) : undefined;
    const sp = rm?.spawn;
    const spawn: WalkSpawn = sp
      ? { x: sp.x, z: sp.z, level: rm!.level, lookX: sp.lx, lookZ: sp.lz }
      : { x: -1, z: 14, level: 0, lookX: -1, lookZ: 0 };
    set({ mode: 'walk', cutLevel: null, tourPlaying: false, walkSpawn: { ...spawn, nonce: ++nonce }, planLevel: spawn.level });
  },

  setTourStep: (i) => set({ tourStep: i }),
  setTourPlaying: (p) => set({ tourPlaying: p }),
  notify: (text) => set({ toast: { text, nonce: ++nonce } }),
  requestFade: () => set({ fade: ++nonce }),
  setExplodeAmount: (m) => set({ explodeAmount: Math.max(0, Math.min(16, m)) }),
  setBoardTheme: (t) => set({ boardTheme: t }),
  setBoardLabels: (on) => set({ boardLabels: on }),
}));
