/**
 * Mobiliário posicionado em escala real. A mesma lista alimenta o modelo 3D
 * (cada tipo tem um componente procedural) e a planta baixa (pegada em escala).
 *
 * Convenções: (x, z) é o centro da peça; w = largura (eixo x local),
 * d = profundidade (eixo z local); rot em graus no sentido anti-horário visto
 * de cima. Com rot = 0 a "frente" da peça (onde a pessoa senta/usa) aponta para +z.
 */

export type FurnitureType =
  | 'sofa' | 'armchair' | 'loungeChair' | 'coffeeTable' | 'sideTable' | 'rug' | 'floorLamp' | 'piano' | 'plant' | 'console'
  | 'diningTable' | 'diningChair' | 'sideboard'
  | 'island' | 'counter' | 'tallUnits' | 'stool'
  | 'cinemaSeat' | 'cinemaRiser'
  | 'desk' | 'officeChair' | 'bookshelf'
  | 'bed' | 'nightstand' | 'wardrobe' | 'closetIsland' | 'dresser'
  | 'bathtub' | 'shower' | 'vanity' | 'toilet'
  | 'washer' | 'shelving' | 'boiler' | 'toolCabinet' | 'bikeRack' | 'car'
  | 'bbq' | 'outdoorTable' | 'outdoorChair' | 'outdoorSofa' | 'sunbed' | 'umbrella' | 'outdoorShower' | 'spa' | 'planter' | 'bench';

export interface FurnitureItem {
  id: string;
  room: string;
  type: FurnitureType;
  x: number;
  z: number;
  w: number;
  d: number;
  h?: number;
  rot?: number;
  /** Variação de acabamento / cor (interpretação depende do tipo). */
  variant?: string;
  /** Elevação extra (ex.: poltronas sobre o degrau do cinema). */
  y?: number;
}

let n = 0;
const f = (room: string, type: FurnitureType, x: number, z: number, w: number, d: number, rot = 0, extra: Partial<FurnitureItem> = {}): FurnitureItem => ({
  id: `${room}-${type}-${n++}`, room, type, x, z, w, d, rot, ...extra,
});

const diningChairs = (): FurnitureItem[] => {
  const out: FurnitureItem[] = [];
  const xs = [-2.7, -1.85, -1.0, -0.15, 0.7];
  for (const x of xs) {
    out.push(f('dining', 'diningChair', x, -7.45, 0.52, 0.56, 0));
    out.push(f('dining', 'diningChair', x, -5.55, 0.52, 0.56, 180));
  }
  out.push(f('dining', 'diningChair', -3.55, -6.5, 0.52, 0.56, 90));
  out.push(f('dining', 'diningChair', 1.55, -6.5, 0.52, 0.56, -90));
  return out;
};

const cinemaSeats = (): FurnitureItem[] => {
  const out: FurnitureItem[] = [];
  for (const x of [14.2, 15.5, 16.8, 18.1]) {
    out.push(f('cinema', 'cinemaSeat', x, 6.3, 0.95, 1.0, 0, { variant: 'front' }));
    out.push(f('cinema', 'cinemaSeat', x, 3.9, 0.95, 1.0, 0, { y: 0.4, variant: 'back' }));
  }
  return out;
};

export const FURNITURE: FurnitureItem[] = [
  // ------------------------------------------------ Sala de estar
  f('living', 'rug', 9.5, -3.7, 6.2, 4.6),
  f('living', 'sofa', 9.5, -5.35, 4.0, 1.05, 0, { variant: 'linen' }),
  f('living', 'sofa', 12.75, -3.4, 2.6, 1.0, -90, { variant: 'boucle' }),
  f('living', 'coffeeTable', 9.3, -3.3, 1.7, 1.0),
  f('living', 'armchair', 6.6, -2.6, 0.85, 0.85, 90, { variant: 'boucle' }),
  f('living', 'armchair', 6.6, -4.2, 0.85, 0.85, 90, { variant: 'boucle' }),
  f('living', 'sideTable', 7.15, -5.55, 0.5, 0.5),
  f('living', 'floorLamp', 11.95, -5.65, 0.45, 0.45),
  f('living', 'loungeChair', 16.6, -8.2, 0.8, 0.9, 200, { variant: 'leather' }),
  f('living', 'loungeChair', 18.4, -8.2, 0.8, 0.9, 160, { variant: 'leather' }),
  f('living', 'sideTable', 17.5, -8.6, 0.5, 0.5),
  f('living', 'piano', 17.0, -3.0, 1.55, 2.1, -35),
  f('living', 'plant', 4.8, -9.3, 0.8, 0.8, 0, { h: 2.4 }),
  f('living', 'plant', 19.3, -0.8, 0.8, 0.8, 0, { h: 2.2 }),
  f('living', 'console', 15.2, -0.45, 2.2, 0.45),

  // ------------------------------------------------ Jantar
  f('dining', 'rug', -1, -6.5, 6.0, 3.6),
  f('dining', 'diningTable', -1, -6.5, 4.2, 1.2),
  ...diningChairs(),
  f('dining', 'plant', -5.4, -9.4, 0.7, 0.7, 0, { h: 1.9 }),
  f('dining', 'sideboard', -1, -3.35, 3.0, 0.5, 180),

  // ------------------------------------------------ Cozinha
  f('kitchen', 'counter', -12.6, -9.5, 10.0, 0.68, 0, { variant: 'sink' }),
  f('kitchen', 'tallUnits', -17.6, -6.4, 6.0, 0.65, 90),
  f('kitchen', 'island', -11.6, -6.4, 4.4, 1.4, 0),
  f('kitchen', 'stool', -13.0, -5.25, 0.45, 0.45, 180),
  f('kitchen', 'stool', -12.1, -5.25, 0.45, 0.45, 180),
  f('kitchen', 'stool', -11.2, -5.25, 0.45, 0.45, 180),
  f('kitchen', 'stool', -10.3, -5.25, 0.45, 0.45, 180),

  // ------------------------------------------------ Despensa, serviço, lavanderia, depósito
  f('pantry', 'shelving', -17.65, -0.5, 4.6, 0.5, 90, { variant: 'pantry' }),
  f('pantry', 'shelving', -14.35, -0.6, 3.6, 0.5, -90, { variant: 'pantry' }),
  f('pantry', 'shelving', -16, 1.7, 2.6, 0.45, 180, { variant: 'pantry' }),
  f('serviceHall', 'bench', -13.55, 0.8, 1.4, 0.4, -90),
  f('laundry', 'washer', -23.5, -1.6, 0.65, 0.7, 90, { variant: 'washer' }),
  f('laundry', 'washer', -23.5, -0.9, 0.65, 0.7, 90, { variant: 'dryer' }),
  f('laundry', 'counter', -23.5, 0.6, 2.4, 0.65, 90, { variant: 'laundry' }),
  f('laundry', 'shelving', -18.4, -0.5, 3.0, 0.45, -90, { variant: 'laundry' }),
  f('storage', 'boiler', -23.4, -9.3, 0.7, 0.7),
  f('storage', 'boiler', -22.5, -9.3, 0.7, 0.7),
  f('storage', 'shelving', -18.45, -6.6, 5.6, 0.55, -90, { variant: 'metal' }),
  f('storage', 'toolCabinet', -23.6, -5.4, 2.0, 0.5, 90, { variant: 'panel' }),

  // ------------------------------------------------ Lavabo
  f('powder', 'vanity', -9.7, 0.0, 1.3, 0.5, 90, { variant: 'stone' }),
  f('powder', 'toilet', -8.5, -2.62, 0.4, 0.58, 0),
  f('powder', 'plant', -7.5, -2.5, 0.4, 0.4, 0, { h: 0.9 }),

  // ------------------------------------------------ Hall / galeria
  f('foyer', 'console', 3.7, 8.0, 2.2, 0.45, -90),
  f('foyer', 'plant', 3.2, 9.4, 0.9, 0.9, 0, { h: 2.6 }),
  f('foyer', 'bench', -4.5, 9.55, 1.8, 0.45, 180),
  f('gallery', 'bench', -6.7, -1.6, 1.6, 0.45, 90),
  f('gallery', 'plant', -6.5, 1.5, 0.6, 0.6, 0, { h: 1.6 }),

  // ------------------------------------------------ Escritório
  f('office', 'rug', 8, 5.6, 4.0, 3.0),
  f('office', 'desk', 8, 6.1, 2.2, 0.95, 0),
  f('office', 'officeChair', 8, 6.95, 0.7, 0.7, 180),
  f('office', 'armchair', 7.3, 4.8, 0.75, 0.75, 0, { variant: 'leather' }),
  f('office', 'armchair', 8.7, 4.8, 0.75, 0.75, 0, { variant: 'leather' }),
  f('office', 'bookshelf', 11.75, 5.0, 7.6, 0.42, -90),
  f('office', 'loungeChair', 5.2, 8.8, 0.85, 0.9, 135, { variant: 'leather' }),
  f('office', 'floorLamp', 4.6, 9.5, 0.4, 0.4),
  f('office', 'sideTable', 6.1, 9.5, 0.45, 0.45),
  f('office', 'plant', 4.7, 0.7, 0.6, 0.6, 0, { h: 1.7 }),

  // ------------------------------------------------ Cinema
  f('cinema', 'cinemaRiser', 16.15, 3.9, 7.6, 2.4),
  ...cinemaSeats(),

  // ------------------------------------------------ Garagem
  f('garage', 'car', -22.0, 5.6, 1.95, 4.75, 180, { variant: 'black' }),
  f('garage', 'car', -18.6, 5.6, 1.95, 4.75, 180, { variant: 'white' }),
  f('garage', 'car', -15.4, 5.6, 1.95, 4.75, 180, { variant: 'silver' }),
  f('garage', 'car', -12.1, 5.6, 1.95, 4.75, 180, { variant: 'green' }),
  f('garage', 'toolCabinet', -16.5, 2.35, 6.0, 0.55, 0),
  f('garage', 'bikeRack', -23.6, 8.3, 0.5, 2.6, 90),

  // ------------------------------------------------ Suíte master
  f('master', 'rug', -1.6, -6.6, 3.6, 4.2),
  f('master', 'bed', -2.6, -6.6, 2.0, 2.2, 90, { variant: 'king' }),
  f('master', 'nightstand', -3.55, -8.15, 0.6, 0.45, 90),
  f('master', 'nightstand', -3.55, -5.05, 0.6, 0.45, 90),
  f('master', 'loungeChair', 2.7, -8.6, 0.8, 0.85, 220, { variant: 'boucle' }),
  f('master', 'loungeChair', 2.9, -6.8, 0.8, 0.85, 300, { variant: 'boucle' }),
  f('master', 'sideTable', 3.4, -7.7, 0.45, 0.45),
  f('master', 'dresser', 3.62, -3.0, 2.0, 0.5, -90),
  f('master', 'plant', 3.4, -0.6, 0.6, 0.6, 0, { h: 1.6 }),
  f('masterCloset', 'wardrobe', -7.0, -0.32, 5.6, 0.6, 180, { variant: 'walnut', h: 2.8 }),
  f('masterCloset', 'wardrobe', -9.68, -2.4, 2.6, 0.6, 90, { variant: 'walnut', h: 2.8 }),
  f('masterCloset', 'closetIsland', -6.6, -2.3, 1.6, 0.8),
  f('masterBath', 'bathtub', -6.6, -9.1, 1.8, 0.85),
  f('masterBath', 'shower', -9.0, -5.1, 2.0, 2.0, 0),
  f('masterBath', 'vanity', -4.35, -7.0, 2.4, 0.55, -90, { variant: 'double' }),
  f('masterBath', 'toilet', -9.6, -8.4, 0.4, 0.6, 90),

  // ------------------------------------------------ Suíte 2
  f('bed2', 'rug', -19.6, -6.5, 3.0, 3.6),
  f('bed2', 'bed', -18.4, -6.5, 1.6, 2.05, -90, { variant: 'sage' }),
  f('bed2', 'nightstand', -17.45, -7.75, 0.5, 0.4, -90),
  f('bed2', 'nightstand', -17.45, -5.25, 0.5, 0.4, -90),
  f('bed2', 'desk', -23.5, -4.6, 1.4, 0.65, 90, { variant: 'small' }),
  f('bed2', 'officeChair', -22.85, -4.6, 0.55, 0.55, -90, { variant: 'simple' }),
  f('bed2', 'armchair', -23.1, -9.0, 0.8, 0.8, 45, { variant: 'linen' }),
  f('closet2', 'wardrobe', -17.38, -1.5, 2.4, 0.6, -90, { h: 2.6 }),
  f('bath2', 'shower', -23.2, -1.5, 2.9, 1.5, 90),
  f('bath2', 'vanity', -21.2, -2.68, 1.4, 0.5, 0),
  f('bath2', 'toilet', -21.0, -0.35, 0.4, 0.58, 180),

  // ------------------------------------------------ Suíte 3
  f('bed3', 'rug', -14.4, -6.5, 3.0, 3.6),
  f('bed3', 'bed', -15.6, -6.5, 1.6, 2.05, 90, { variant: 'terracotta' }),
  f('bed3', 'nightstand', -16.55, -7.75, 0.5, 0.4, 90),
  f('bed3', 'nightstand', -16.55, -5.25, 0.5, 0.4, 90),
  f('bed3', 'desk', -10.5, -4.8, 1.4, 0.65, -90, { variant: 'small' }),
  f('bed3', 'officeChair', -11.15, -4.8, 0.55, 0.55, 90, { variant: 'simple' }),
  f('bed3', 'armchair', -10.9, -9.0, 0.8, 0.8, -45, { variant: 'linen' }),
  f('closet3', 'wardrobe', -16.62, -1.5, 2.4, 0.6, 90, { h: 2.6 }),
  f('bath3', 'shower', -10.8, -2.1, 1.4, 1.6, 0),
  f('bath3', 'vanity', -12.0, -0.3, 1.2, 0.5, 180),
  f('bath3', 'toilet', -12.65, -2.65, 0.4, 0.58, 0),

  // ------------------------------------------------ Quarto 4
  f('bed4', 'rug', -20.2, 6.8, 2.8, 3.4),
  f('bed4', 'bed', -18.75, 6.8, 1.6, 2.05, -90, { variant: 'petrol' }),
  f('bed4', 'nightstand', -17.85, 5.55, 0.5, 0.4, -90),
  f('bed4', 'nightstand', -17.85, 8.05, 0.5, 0.4, -90),
  f('bed4', 'desk', -23.55, 5.2, 1.3, 0.6, 90, { variant: 'small' }),
  f('bed4', 'officeChair', -22.95, 5.2, 0.55, 0.55, -90, { variant: 'simple' }),
  f('bed4', 'wardrobe', -22.35, 3.98, 2.6, 0.6, 0, { h: 2.6 }),
  f('sacada4', 'outdoorChair', -21.6, 10.8, 0.6, 0.6, 180),

  // ------------------------------------------------ Banho compartilhado
  f('bathShared', 'shower', -16.25, 9.1, 2.3, 1.6, 180),
  f('bathShared', 'vanity', -17.18, 5.6, 1.6, 0.5, 90),
  f('bathShared', 'toilet', -15.4, 7.2, 0.4, 0.58, -90),

  // ------------------------------------------------ Quarto 5
  f('bed5', 'rug', -12.6, 7.0, 2.6, 3.2),
  f('bed5', 'bed', -11.3, 7.0, 1.6, 2.05, -90, { variant: 'sand' }),
  f('bed5', 'nightstand', -10.5, 5.75, 0.5, 0.4, -90),
  f('bed5', 'nightstand', -10.5, 8.25, 0.5, 0.4, -90),
  f('bed5', 'desk', -14.55, 5.6, 1.2, 0.6, 90, { variant: 'small' }),
  f('bed5', 'officeChair', -13.95, 5.6, 0.55, 0.55, -90, { variant: 'simple' }),
  f('bed5', 'wardrobe', -14.62, 8.4, 2.2, 0.6, 90, { h: 2.6 }),

  // ------------------------------------------------ Circulação íntima
  f('corridor', 'console', -21, 0.35, 2.0, 0.4, 0),
  f('corridor', 'plant', -23.4, 3.0, 0.6, 0.6, 0, { h: 1.6 }),
  f('corridor', 'bench', -5, 0.35, 1.8, 0.4, 0),

  // ------------------------------------------------ Terraço superior e varanda
  f('terrace', 'spa', 16.5, 6.0, 2.6, 2.6),
  f('terrace', 'sunbed', 8.5, 7.6, 0.8, 2.0, 180),
  f('terrace', 'sunbed', 10.0, 7.6, 0.8, 2.0, 180),
  f('terrace', 'outdoorSofa', 12.0, 2.0, 2.6, 0.95, 180),
  f('terrace', 'coffeeTable', 12.0, 3.3, 1.2, 0.7, 0, { variant: 'outdoor' }),
  f('terrace', 'planter', 12, 9.55, 15.0, 0.7),
  f('terrace', 'planter', 19.55, 2.5, 0.7, 4.0),
  f('balcony', 'outdoorChair', 1.6, -11.8, 0.7, 0.7, 200),
  f('balcony', 'outdoorChair', 3.0, -11.8, 0.7, 0.7, 160),
  f('balcony', 'sideTable', 2.3, -12.2, 0.45, 0.45, 0, { variant: 'outdoor' }),
  f('balcony', 'planter', -6, -12.6, 7.0, 0.55),

  // ------------------------------------------------ Gourmet
  f('gourmet', 'bbq', -23.35, -20.0, 5.6, 0.9, 90),
  f('gourmet', 'outdoorTable', -17.0, -20.0, 3.0, 1.1),
  ...[-18.1, -17.0, -15.9].flatMap((x) => [
    f('gourmet', 'outdoorChair', x, -20.85, 0.55, 0.55, 0),
    f('gourmet', 'outdoorChair', x, -19.15, 0.55, 0.55, 180),
  ]),
  f('gourmet', 'outdoorChair', -18.95, -20.0, 0.55, 0.55, 90),
  f('gourmet', 'outdoorChair', -15.05, -20.0, 0.55, 0.55, -90),
  f('gourmet', 'rug', -11.0, -20.0, 4.6, 3.6, 0, { variant: 'outdoor' }),
  f('gourmet', 'outdoorSofa', -11.0, -21.4, 3.0, 0.95, 0),
  f('gourmet', 'outdoorSofa', -13.0, -19.6, 2.0, 0.95, -90),
  f('gourmet', 'outdoorChair', -9.0, -18.9, 0.75, 0.75, 135, { variant: 'lounge' }),
  f('gourmet', 'coffeeTable', -11.0, -20.0, 1.3, 1.3, 0, { variant: 'outdoor' }),

  // ------------------------------------------------ Piscina e deck
  f('pool', 'sunbed', 1.4, -21.0, 0.75, 2.0, 0, { variant: 'water', y: -0.3 }),
  f('pool', 'sunbed', 3.4, -21.0, 0.75, 2.0, 0, { variant: 'water', y: -0.3 }),
  f('pool', 'umbrella', 2.4, -23.2, 2.6, 2.6),
  ...[7.5, 9.8, 12.1, 14.4].map((x) => f('pool', 'sunbed', x, -16.9, 0.75, 1.9, 180)),
  f('pool', 'outdoorShower', 21.2, -17.0, 0.4, 0.4),
  f('terraceGround', 'planter', -2.2, -10.6, 2.6, 0.6),
  f('terraceGround', 'planter', 19.6, -10.6, 0.6, 0.6),
];

export const furnitureForRoom = (roomId: string) => FURNITURE.filter((it) => it.room === roomId);
