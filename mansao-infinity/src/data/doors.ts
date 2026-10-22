import { WALLS, LEVEL_Y, OPERABLE_KINDS, type Level, type OpeningKind } from './plan';
import { exteriorSide, wallThickness } from '../utils/geometry';

/** Esquadria operável já posicionada no mundo (portas, portas de correr, pivotante e portão). */
export interface DoorSpec {
  id: string;
  kind: OpeningKind;
  level: Level;
  axis: 'x' | 'z';
  /** coordenada fixa da parede */
  at: number;
  a: number;
  b: number;
  h: number;
  y: number;
  thickness: number;
  /** +1: abre para o lado positivo da normal; −1: lado negativo. */
  swing: 1 | -1;
  /** Dobradiça na ponta 'a' (padrão) ou 'b'. */
  hinge: 'a' | 'b';
  wallKind: 'ext' | 'int' | 'glass';
  /** Centro (para proximidade no modo caminhada). */
  cx: number;
  cz: number;
}

/** Ajustes de sentido de abertura para não bater em móveis. */
const SWING_OVERRIDE: Record<string, { swing?: 1 | -1; hinge?: 'a' | 'b' }> = {
  garageLaundry: { swing: 1 },
  garageService: { swing: -1, hinge: 'b' },
  pantryService: { swing: 1 },
  laundryStorage: { swing: -1 },
  pantryKitchen: { swing: -1, hinge: 'a' },
  powderDoor: { swing: -1, hinge: 'b' },
  officeDoor: { swing: 1, hinge: 'a' },
  cinemaDoor: { swing: 1 },
  bed4Door: { swing: 1, hinge: 'b' },
  bathSharedDoor: { swing: 1 },
  bed5Door: { swing: 1, hinge: 'b' },
  suite2Door: { swing: -1, hinge: 'b' },
  suite3Door: { swing: -1, hinge: 'a' },
  masterDoor: { swing: -1, hinge: 'a' },
  bath2Door: { swing: -1, hinge: 'a' },
  bath3Door: { swing: 1, hinge: 'a' },
  masterBathDoor: { swing: -1, hinge: 'b' },
  storageOut: { swing: 1 },
  kitchenOut: { swing: 1, hinge: 'b' },
};

export const DOORS: DoorSpec[] = WALLS.flatMap((w) =>
  (w.openings ?? [])
    .filter((o) => o.id && OPERABLE_KINDS.includes(o.kind))
    .map((o): DoorSpec => {
      const ext = w.kind === 'int' ? 0 : exteriorSide(w);
      const swing: 1 | -1 = ext !== 0 ? (ext > 0 ? -1 : 1) : 1;
      const ov = SWING_OVERRIDE[o.id!] ?? {};
      const a = o.c - o.w / 2;
      const b = o.c + o.w / 2;
      return {
        id: o.id!,
        kind: o.kind,
        level: w.level,
        axis: w.axis,
        at: w.at,
        a,
        b,
        h: o.h,
        y: LEVEL_Y[w.level] + (w.base ?? 0) + (o.sill ?? 0),
        thickness: wallThickness(w),
        swing: ov.swing ?? swing,
        hinge: ov.hinge ?? 'a',
        wallKind: w.kind,
        cx: w.axis === 'x' ? o.c : w.at,
        cz: w.axis === 'x' ? w.at : o.c,
      };
    }),
);

export const DOOR_NAMES: Record<string, string> = {
  frontDoor: 'Porta pivotante',
  garageDoor: 'Portão da garagem',
  streetGate: 'Portão da rua',
  pedestrianGate: 'Portão social',
};
