/**
 * Planta da Casa Octógono (metros, y para cima, +z = frente/sul).
 *
 * Um octógono regular com uma face voltada para a frente. O anel entre o
 * octógono central (sala rebaixada sob a claraboia) e as paredes externas é
 * dividido por oito paredes radiais em oito ambientes, um por face.
 */

export const DEG = Math.PI / 180;
export const HALF = 22.5 * DEG;

/** Apótema da face externa da parede de pedra. */
export const A_OUT = 10;
export const T_STONE = 0.34;
export const T_PLASTER = 0.12;
/** Face interna (reboco) da parede externa. */
export const A_IN = A_OUT - T_STONE - T_PLASTER;
/** Eixo da parede do octógono central e sua espessura. */
export const A_CORE = 5.0;
export const T_CORE = 0.16;
export const T_RADIAL = 0.14;
/** Pé-direito e espessura da laje de cobertura. */
export const H = 3.3;
export const ROOF_T = 0.62;
/** Beiral da laje além da parede. */
export const EAVE = 0.18;

export type V2 = [number, number];

/** Ângulo (a partir de +z, girando para +x) da normal da face k. */
export const faceAngle = (k: number) => (((k % 8) + 8) % 8) * 45 * DEG;

/** Ponto do octógono de apótema `ap` no ângulo polar `theta` (mesma convenção). */
export const polar = (r: number, theta: number): V2 => [r * Math.sin(theta), r * Math.cos(theta)];

/** Raio do vértice para um apótema. */
export const circum = (ap: number) => ap / Math.cos(HALF);

/** Vértice entre a face k e a face k+1. */
export const vertex = (ap: number, k: number): V2 => polar(circum(ap), faceAngle(k) + HALF);

/** Extremos da face k (do vértice k-1 ao vértice k). */
export const faceEnds = (ap: number, k: number): [V2, V2] => [vertex(ap, k - 1), vertex(ap, k)];

/** Comprimento de uma face para um apótema. */
export const faceLength = (ap: number) => 2 * ap * Math.tan(HALF);

export const octagon = (ap: number): V2[] => Array.from({ length: 8 }, (_, k) => vertex(ap, k));

export type RoomKind = 'living' | 'dining' | 'kitchen' | 'bedroom' | 'master' | 'bath' | 'reading';

export interface Room {
  k: number;
  id: string;
  name: string;
  kind: RoomKind;
  note: string;
}

/** Um ambiente por face, no sentido horário a partir da frente. */
export const ROOMS: Room[] = [
  { k: 0, id: 'estar', name: 'Estar com lareira', kind: 'living', note: 'Lareira de pedra e vista para o jardim de entrada' },
  { k: 1, id: 'jantar', name: 'Jantar', kind: 'dining', note: 'Mesa para oito, integrada à cozinha' },
  { k: 2, id: 'cozinha', name: 'Cozinha', kind: 'kitchen', note: 'Ilha em mármore e bancada em nogueira' },
  { k: 3, id: 'suite3', name: 'Suíte leitura', kind: 'reading', note: 'Quarto com canto de leitura voltado à mata' },
  { k: 4, id: 'master', name: 'Suíte master', kind: 'master', note: 'Cama king e poltronas junto ao vidro' },
  { k: 5, id: 'suite2', name: 'Suíte 2', kind: 'bedroom', note: 'Quarto com escrivaninha' },
  { k: 6, id: 'banho', name: 'Banho', kind: 'bath', note: 'Banheira solta, ducha e bancada dupla' },
  { k: 7, id: 'quarto', name: 'Quarto de hóspedes', kind: 'bedroom', note: 'Cama queen e janela para o caminho' },
];

/** Vão numa parede: t0..t1 ao longo dela (0..1), da altura y0 à y1. */
export interface Gap {
  t0: number;
  t1: number;
  y0: number;
  y1: number;
}

const glass = (t0 = 0.14, t1 = 0.86): Gap => ({ t0, t1, y0: 0, y1: 2.75 });

/** Vãos das faces externas (envidraçadas, exceto o banho com janela alta). */
export const OUTER_GAPS: Gap[][] = ROOMS.map((r) => (r.kind === 'bath' ? [{ t0: 0.3, t1: 0.7, y0: 1.6, y1: 2.6 }] : [glass()]));

/** Vãos das faces do octógono central. */
export const CORE_GAPS: Gap[][] = ROOMS.map((r) => {
  if (r.kind === 'living') {
    return [
      { t0: 0.06, t1: 0.3, y0: 0, y1: 2.6 },
      { t0: 0.7, t1: 0.94, y0: 0, y1: 2.6 },
    ];
  }
  if (r.kind === 'dining' || r.kind === 'kitchen') return [{ t0: 0.12, t1: 0.88, y0: 0, y1: 2.75 }];
  if (r.kind === 'bath') return [{ t0: 0.08, t1: 0.3, y0: 0, y1: 2.2 }];
  return [{ t0: 0.72, t1: 0.94, y0: 0, y1: 2.25 }];
});

/**
 * Paredes radiais no vértice k (entre a face k e a k+1). `null` = sem parede
 * (jantar e cozinha integrados); vãos medidos de dentro (0) para fora (1).
 */
export const RADIAL_GAPS: (Gap[] | null)[] = [
  [{ t0: 0.3, t1: 0.62, y0: 0, y1: 2.6 }], // estar | jantar
  null, // jantar | cozinha
  [], // cozinha | suíte leitura
  [], // suíte leitura | master
  [], // master | suíte 2
  [], // suíte 2 | banho
  [], // banho | quarto
  [], // quarto | estar
];

/** Centro do ambiente k (na metade do anel) e seu ângulo. */
export const ROOM_MID = (A_CORE + A_IN) / 2;
export const roomCenter = (k: number): V2 => polar(ROOM_MID, faceAngle(k));

/** Largura útil de um ambiente na profundidade local z (z = 0 no centro, + para fora). */
export const roomWidthAt = (z: number) => faceLength(ROOM_MID + z) - T_RADIAL;

/** Área de um anel octogonal entre dois apótemas. */
export const octArea = (ap: number) => 8 * ap * ap * Math.tan(HALF);

export const AREAS = {
  footprint: octArea(A_OUT),
  core: octArea(A_CORE - T_CORE / 2),
  ring: octArea(A_IN) - octArea(A_CORE + T_CORE / 2),
};

/** Em que ambiente (índice da face) está um ponto do anel, ou -1 no centro/fora. */
export function roomAt(x: number, z: number): number {
  const theta = Math.atan2(x, z);
  const k = Math.round(theta / (45 * DEG));
  const kk = ((k % 8) + 8) % 8;
  const local = x * Math.sin(faceAngle(kk)) + z * Math.cos(faceAngle(kk));
  if (local < A_CORE || local > A_IN) return -1;
  return kk;
}
