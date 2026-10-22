/**
 * Planta da Mansão Infinity — fonte única de verdade para o modelo 3D, a planta
 * baixa 2D, a colisão do modo caminhada e as informações dos cômodos.
 *
 * Sistema de coordenadas (metros):
 *   x → leste, z → sul (rua), y → cima.
 *   A fachada principal fica em z = 10 (voltada para a rua, ao sul);
 *   a piscina e o jardim ficam ao norte (z negativo), onde bate o sol no Brasil.
 */

export type Level = 0 | 1;

export const LEVEL_Y: Record<Level, number> = { 0: 0, 1: 4.0 };
/** Pé-direito livre de cada pavimento (piso acabado → forro). */
export const CEILING: Record<Level, number> = { 0: 3.6, 1: 3.0 };
/** Altura do topo das lajes de cobertura. */
export const ROOF_Y = 7.4;
export const EXT_T = 0.3;
export const INT_T = 0.15;

export type OpeningKind =
  | 'door' // porta de giro (folha interativa)
  | 'double' // porta dupla de giro
  | 'slide' // porta de correr de vidro
  | 'pivot' // porta pivotante gigante da entrada
  | 'garage' // portão seccionado da garagem
  | 'window' // janela fixa / maxim-ar
  | 'opening'; // vão livre (sem esquadria)

export interface Opening {
  /** Coordenada do centro do vão ao longo do eixo da parede. */
  c: number;
  w: number;
  h: number;
  sill?: number;
  kind: OpeningKind;
  id?: string;
}

export type WallKind = 'ext' | 'int' | 'glass';

export interface Wall {
  id: string;
  level: Level;
  /** 'x' = parede corre ao longo de x (em z fixo); 'z' = corre ao longo de z (em x fixo). */
  axis: 'x' | 'z';
  at: number;
  from: number;
  to: number;
  kind: WallKind;
  /** Altura a partir do piso do pavimento. */
  h?: number;
  /** Elevação da base em relação ao piso do pavimento. */
  base?: number;
  openings?: Opening[];
}

export type RoomCategory = 'social' | 'intima' | 'servico' | 'lazer' | 'externa' | 'circulacao';

export interface Rect {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}

export interface Room {
  id: string;
  name: string;
  short?: string;
  level: Level;
  rect: Rect;
  category: RoomCategory;
  floor: FloorFinish;
  /** Pé-direito (m); padrão do pavimento quando ausente. */
  height?: number;
  outdoor?: boolean;
  description: string;
  materials: string[];
  features: string[];
  /** Ponto de vista para o modo caminhada (olho a 1,65 m): posição e ponto para onde olha. */
  spawn?: { x: number; z: number; lx: number; lz: number };
}

export type FloorFinish =
  | 'oak'
  | 'marble'
  | 'porcelain'
  | 'polished'
  | 'stone'
  | 'carpet'
  | 'travertine'
  | 'deck';

const r = (x0: number, x1: number, z0: number, z1: number): Rect => ({ x0, x1, z0, z1 });

// ------------------------------------------------------------------ cômodos
export const ROOMS: Room[] = [
  // ===== Térreo
  {
    id: 'foyer', name: 'Hall de entrada', short: 'Hall', level: 0, rect: r(-10, 4, 2, 10), category: 'circulacao', floor: 'marble', height: 7.0,
    description: 'Recepção com pé-direito duplo de 7 m, porta pivotante de 4,5 m e escada escultural flutuante em nogueira.',
    materials: ['Mármore Calacatta polido', 'Nogueira americana', 'Vidro extraclaro', 'Aço com pintura grafite'],
    features: ['Porta pivotante 2,4 × 4,5 m', 'Escada com degraus em balanço', 'Elevador residencial', 'Lustre escultural'],
    spawn: { x: -1, z: 8.8, lx: -3, lz: 2 },
  },
  {
    id: 'gallery', name: 'Galeria', level: 0, rect: r(-7, 4, -3, 2), category: 'circulacao', floor: 'marble',
    description: 'Eixo de circulação que conecta hall, jantar e estar, com obras de arte iluminadas.',
    materials: ['Mármore Calacatta', 'Gesso acabado', 'Spots embutidos 2700 K'],
    features: ['Obras de arte com iluminação dedicada', 'Acesso ao lavabo'],
    spawn: { x: 3, z: -0.5, lx: -6, lz: -0.5 },
  },
  {
    id: 'living', name: 'Sala de estar', short: 'Estar', level: 0, rect: r(4, 20, -10, 0), category: 'social', floor: 'oak', height: 7.0,
    description: 'Estar com pé-direito duplo, panos de vidro de piso a teto para a piscina, lareira linear e painel em mármore Nero Marquina.',
    materials: ['Piso em carvalho europeu', 'Mármore Nero Marquina', 'Linho e bouclé', 'Vidro low-e'],
    features: ['Pé-direito duplo (7 m)', 'Lareira linear a gás', 'Painel de TV em pedra natural', 'Piano de cauda', 'Cortinas de 6,8 m'],
    spawn: { x: 5.2, z: -1.2, lx: 16, lz: -8 },
  },
  {
    id: 'dining', name: 'Sala de jantar', short: 'Jantar', level: 0, rect: r(-6, 4, -10, -3), category: 'social', floor: 'oak',
    description: 'Mesa para 12 pessoas sob lustre escultural, integrada à cozinha, ao estar e ao jardim.',
    materials: ['Carvalho europeu', 'Tampo em nogueira maciça', 'Cadeiras em linho', 'Latão escovado'],
    features: ['Mesa de 4,2 m para 12 lugares', 'Lustre linear escultural', 'Porta de correr para o terraço'],
    spawn: { x: 3, z: -3.6, lx: -4, lz: -8 },
  },
  {
    id: 'kitchen', name: 'Cozinha gourmet', short: 'Cozinha', level: 0, rect: r(-18, -6, -10, -3), category: 'social', floor: 'porcelain',
    description: 'Cozinha com ilha de 4,4 m em mármore com cascata, eletros embutidos e bancada sob a janela voltada para o jardim.',
    materials: ['Mármore Calacatta (tampo e cascata)', 'Laca grafite fosca', 'Nogueira', 'Metais em aço escovado'],
    features: ['Ilha central 4,4 × 1,4 m', 'Cooktop por indução e coifa', 'Geladeira e fornos embutidos', 'LED sob bancada', 'Despensa independente'],
    spawn: { x: -7, z: -3.8, lx: -14, lz: -8 },
  },
  {
    id: 'pantry', name: 'Despensa', level: 0, rect: r(-18, -14, -3, 2), category: 'servico', floor: 'porcelain',
    description: 'Despensa com prateleiras em todo o perímetro e acesso direto à cozinha.',
    materials: ['Porcelanato', 'Prateleiras em carvalho'], features: ['Prateleiras em U', 'Acesso pela cozinha e pelo hall de serviço'],
    spawn: { x: -15.5, z: -2.4, lx: -16, lz: 1.5 },
  },
  {
    id: 'serviceHall', name: 'Hall de serviço', short: 'Serviço', level: 0, rect: r(-14, -10, -3, 2), category: 'circulacao', floor: 'porcelain',
    description: 'Circulação de serviço entre garagem, cozinha e despensa, fora da vista social.',
    materials: ['Porcelanato técnico'], features: ['Acesso independente da garagem'],
    spawn: { x: -12, z: 1.3, lx: -12, lz: -3 },
  },
  {
    id: 'powder', name: 'Lavabo', level: 0, rect: r(-10, -7, -3, 2), category: 'servico', floor: 'stone',
    description: 'Lavabo social revestido em pedra escura com cuba esculpida e espelho retroiluminado.',
    materials: ['Mármore Nero Marquina', 'Metais em latão escovado'], features: ['Espelho retroiluminado', 'Bacia suspensa'],
    spawn: { x: -7.9, z: 1.3, lx: -9.5, lz: -1.5 },
  },
  {
    id: 'laundry', name: 'Lavanderia', level: 0, rect: r(-24, -18, -3, 2), category: 'servico', floor: 'porcelain',
    description: 'Lavanderia completa com lavadora, secadora, tanque e armários.',
    materials: ['Porcelanato', 'Quartzo branco', 'Laca branca'], features: ['Lavadora e secadora', 'Tanque em aço inox', 'Varal de teto'],
    spawn: { x: -19, z: 1.3, lx: -23, lz: -2 },
  },
  {
    id: 'storage', name: 'Depósito e área técnica', short: 'Depósito', level: 0, rect: r(-24, -18, -10, -3), category: 'servico', floor: 'polished',
    description: 'Depósito, casa de máquinas da piscina, aquecedores e quadro elétrico, escondidos da vista principal.',
    materials: ['Concreto polido'], features: ['Boilers de água quente', 'Quadro elétrico', 'Estantes metálicas', 'Porta de serviço para o jardim'],
    spawn: { x: -21, z: -3.8, lx: -21, lz: -9 },
  },
  {
    id: 'garage', name: 'Garagem', level: 0, rect: r(-24, -10, 2, 10), category: 'servico', floor: 'polished',
    description: 'Garagem coberta para quatro veículos com portão seccionado automático e iluminação linear.',
    materials: ['Concreto polido', 'Armários em laca grafite', 'Perfis de LED'],
    features: ['4 vagas de 3,2 × 6 m', 'Portão automático de 12 m', 'Armários de ferramentas', 'Suporte para bicicletas'],
    spawn: { x: -11, z: 9.2, lx: -20, lz: 4 },
  },
  {
    id: 'office', name: 'Escritório', level: 0, rect: r(4, 12, 0, 10), category: 'social', floor: 'oak',
    description: 'Escritório com mesa executiva, estante de 7,5 m com livros e poltrona de leitura junto à janela.',
    materials: ['Carvalho', 'Nogueira', 'Couro', 'Latão'], features: ['Mesa executiva', 'Estante do piso ao teto', 'Poltrona de leitura'],
    spawn: { x: 4.9, z: 1.2, lx: 10, lz: 8 },
  },
  {
    id: 'cinema', name: 'Sala de cinema', short: 'Cinema', level: 0, rect: r(12, 20, 0, 10), category: 'lazer', floor: 'carpet',
    description: 'Home theater com tela de 5,5 m, poltronas reclináveis em dois níveis, painéis acústicos e teto estrelado.',
    materials: ['Veludo grafite', 'Painéis acústicos em tecido', 'Carpete de lã'],
    features: ['Tela de 5,5 m', '8 poltronas reclináveis', 'Painéis acústicos', 'Iluminação indireta regulável', 'Teto estrelado'],
    spawn: { x: 18.6, z: 0.9, lx: 15, lz: 8 },
  },
  // ===== Pavimento superior
  {
    id: 'corridor', name: 'Galeria íntima', short: 'Circulação', level: 1, rect: r(-24, 4, 0, 3.6), category: 'circulacao', floor: 'oak',
    description: 'Circulação íntima com guarda-corpo de vidro aberto para o pé-direito duplo do hall.',
    materials: ['Carvalho', 'Vidro laminado'], features: ['Vista para o hall', 'Acesso ao terraço'],
    spawn: { x: 3, z: 1.8, lx: -20, lz: 1.8 },
  },
  {
    id: 'master', name: 'Suíte master', short: 'Master', level: 1, rect: r(-4, 4, -10, 0), category: 'intima', floor: 'oak',
    description: 'Suíte com cama king-size, cabeceira estofada de parede inteira, estar íntimo e varanda privativa para a piscina.',
    materials: ['Carvalho', 'Linho natural', 'Bouclé', 'Nogueira'], features: ['Cama king-size', 'Cabeceira estofada', 'Varanda privativa', 'Closet e banho master'],
    spawn: { x: 3, z: -0.8, lx: -2, lz: -7 },
  },
  {
    id: 'masterCloset', name: 'Closet master', short: 'Closet', level: 1, rect: r(-10, -4, -4, 0), category: 'intima', floor: 'oak',
    description: 'Closet com armários iluminados, ilha de joias com tampo de vidro e prateleiras para calçados.',
    materials: ['Nogueira', 'Vidro fumê', 'Couro'], features: ['Ilha central', 'Iluminação interna dos armários'],
    spawn: { x: -4.6, z: -2, lx: -9, lz: -2 },
  },
  {
    id: 'masterBath', name: 'Banho master', short: 'Banho master', level: 1, rect: r(-10, -4, -10, -4), category: 'intima', floor: 'marble',
    description: 'Banho com banheira de imersão independente, chuveiro amplo em vidro, bancada dupla e espelhos iluminados.',
    materials: ['Mármore Calacatta', 'Metais escovados', 'Vidro extraclaro'], features: ['Banheira independente', 'Chuveiro de teto', 'Bancada dupla', 'Espelhos com LED', 'Nicho embutido'],
    spawn: { x: -7, z: -4.6, lx: -7, lz: -9.5 },
  },
  {
    id: 'bed2', name: 'Suíte 2', level: 1, rect: r(-24, -17, -10, -3), category: 'intima', floor: 'oak',
    description: 'Suíte voltada para o jardim, com escrivaninha, poltrona e porta de correr para a sacada.',
    materials: ['Carvalho', 'Linho verde-sálvia'], features: ['Cama queen', 'Escrivaninha', 'Banho privativo'],
    spawn: { x: -18.5, z: -3.6, lx: -21, lz: -8 },
  },
  { id: 'closet2', name: 'Closet suíte 2', short: 'Closet', level: 1, rect: r(-20, -17, -3, 0), category: 'intima', floor: 'oak', description: 'Closet de passagem da suíte 2.', materials: ['Laca off-white'], features: ['Armários'], spawn: { x: -18.5, z: -0.5, lx: -18.5, lz: -3 } },
  { id: 'bath2', name: 'Banho suíte 2', short: 'Banho', level: 1, rect: r(-24, -20, -3, 0), category: 'intima', floor: 'porcelain', description: 'Banho em porcelanato com box de vidro e nicho.', materials: ['Porcelanato', 'Metais cromados'], features: ['Box de vidro', 'Nicho embutido'], spawn: { x: -20.5, z: -1.5, lx: -23, lz: -1.5 } },
  {
    id: 'bed3', name: 'Suíte 3', level: 1, rect: r(-17, -10, -10, -3), category: 'intima', floor: 'oak',
    description: 'Suíte em tons terrosos com escrivaninha e sacada para a piscina.',
    materials: ['Carvalho', 'Linho terracota'], features: ['Cama queen', 'Escrivaninha', 'Banho privativo'],
    spawn: { x: -15, z: -3.6, lx: -12, lz: -8 },
  },
  { id: 'closet3', name: 'Closet suíte 3', short: 'Closet', level: 1, rect: r(-17, -13, -3, 0), category: 'intima', floor: 'oak', description: 'Closet de passagem da suíte 3.', materials: ['Laca off-white'], features: ['Armários'], spawn: { x: -15, z: -0.5, lx: -15, lz: -3 } },
  { id: 'bath3', name: 'Banho suíte 3', short: 'Banho', level: 1, rect: r(-13, -10, -3, 0), category: 'intima', floor: 'porcelain', description: 'Banho com box de vidro e bancada suspensa.', materials: ['Porcelanato', 'Metais escovados'], features: ['Box de vidro', 'Nicho embutido'], spawn: { x: -12.5, z: -1.5, lx: -10, lz: -1.5 } },
  {
    id: 'bed4', name: 'Quarto 4', level: 1, rect: r(-24, -17.5, 3.6, 10), category: 'intima', floor: 'oak',
    description: 'Quarto voltado para a rua com sacada, escrivaninha e armário.',
    materials: ['Carvalho', 'Linho azul-petróleo'], features: ['Cama queen', 'Sacada com guarda-corpo de vidro', 'Banho compartilhado'],
    spawn: { x: -18.3, z: 4.3, lx: -22, lz: 8 },
  },
  { id: 'bathShared', name: 'Banho compartilhado', short: 'Banho', level: 1, rect: r(-17.5, -15, 3.6, 10), category: 'intima', floor: 'porcelain', description: 'Banho que atende os quartos 4 e 5.', materials: ['Porcelanato', 'Metais cromados'], features: ['Box de vidro', 'Bancada'], spawn: { x: -16.25, z: 4.2, lx: -16.25, lz: 9 } },
  {
    id: 'bed5', name: 'Quarto 5', level: 1, rect: r(-15, -10, 3.6, 10), category: 'intima', floor: 'oak',
    description: 'Quarto de hóspedes com escrivaninha e armário.',
    materials: ['Carvalho', 'Linho areia'], features: ['Cama queen', 'Escrivaninha', 'Armário'],
    spawn: { x: -12, z: 4.3, lx: -12, lz: 9 },
  },
  {
    id: 'terrace', name: 'Terraço', level: 1, rect: r(4, 20, 0, 10), category: 'lazer', floor: 'deck', outdoor: true,
    description: 'Terraço sobre o escritório e o cinema, com spa aquecido, espreguiçadeiras e jardineiras.',
    materials: ['Deck em cumaru', 'Vidro laminado', 'Jardineiras em concreto'], features: ['Spa aquecido', 'Guarda-corpo de vidro'],
    spawn: { x: 5, z: 1.8, lx: 16, lz: 7 },
  },
  {
    id: 'sacada4', name: 'Sacada do quarto 4', short: 'Sacada', level: 1, rect: r(-23.4, -18, 10, 11.4), category: 'lazer', floor: 'deck', outdoor: true,
    description: 'Sacada voltada para o jardim frontal, com guarda-corpo de vidro.',
    materials: ['Deck em cumaru', 'Vidro laminado'], features: ['Vista para a alameda de palmeiras'],
    spawn: { x: -20.7, z: 10.5, lx: -20.7, lz: 20 },
  },
  {
    id: 'balcony', name: 'Varanda master', short: 'Varanda', level: 1, rect: r(-10, 4, -13, -10), category: 'lazer', floor: 'deck', outdoor: true,
    description: 'Varanda privativa da suíte master com vista para a piscina e o mar.',
    materials: ['Deck em cumaru', 'Vidro laminado'], features: ['Vista para a piscina de borda infinita'],
    spawn: { x: -4, z: -10.6, lx: 8, lz: -30 },
  },
  // ===== Áreas externas (térreo)
  {
    id: 'pool', name: 'Piscina de borda infinita', short: 'Piscina', level: 0, rect: r(-2, 22.5, -25, -16), category: 'externa', floor: 'stone', outdoor: true,
    description: 'Piscina de 20 × 7 m com borda infinita voltada para o mar, prainha com espreguiçadeiras e iluminação subaquática.',
    materials: ['Pastilhas de vidro', 'Borda em travertino', 'Deck em travertino'], features: ['Borda infinita de 20 m', 'Prainha', 'Iluminação subaquática', 'Chuveiro externo'],
    spawn: { x: -1, z: -16.5, lx: 12, lz: -25 },
  },
  {
    id: 'gourmet', name: 'Espaço gourmet', short: 'Gourmet', level: 0, rect: r(-24, -6, -24, -16), category: 'lazer', floor: 'travertine', outdoor: true,
    description: 'Área gourmet coberta com churrasqueira, bancada em pedra, mesa para oito e lounge.',
    materials: ['Granito preto', 'Travertino', 'Concreto aparente', 'Teca'], features: ['Churrasqueira', 'Bancada com cuba', 'Mesa para 8', 'Lounge com sofás'],
    spawn: { x: -6.5, z: -16.8, lx: -20, lz: -21 },
  },
  {
    id: 'terraceGround', name: 'Terraço da piscina', short: 'Terraço', level: 0, rect: r(-24, 20, -16, -10), category: 'externa', floor: 'travertine', outdoor: true,
    description: 'Deck em travertino que conecta estar, jantar e cozinha à piscina.',
    materials: ['Travertino'], features: ['Integração com a área social'],
    spawn: { x: 10, z: -11, lx: 10, lz: -30 },
  },
];

export const roomById = (id: string): Room | undefined => ROOMS.find((rm) => rm.id === id);

// ------------------------------------------------------------------ paredes
const W = (id: string, level: Level, axis: 'x' | 'z', at: number, from: number, to: number, kind: WallKind, openings: Opening[] = [], h?: number, base?: number): Wall => ({
  id, level, axis, at, from, to, kind, openings, h, base,
});

const door = (c: number, id: string, w = 0.9, h = 2.4): Opening => ({ c, w, h, kind: 'door', id });
const win = (c: number, w: number, sill: number, h: number): Opening => ({ c, w, h, sill, kind: 'window' });
const slide = (c: number, w: number, id: string, h = 2.8): Opening => ({ c, w, h, kind: 'slide', id });

export const WALLS: Wall[] = [
  // ---------------- Térreo — fachada e perímetro
  W('g-front-garage', 0, 'x', 10, -24, -10, 'ext', [{ c: -17, w: 12, h: 3.0, kind: 'garage', id: 'garageDoor' }]),
  W('g-front-foyer', 0, 'x', 10, -10, 4, 'glass', [{ c: -1, w: 2.4, h: 4.5, kind: 'pivot', id: 'frontDoor' }], 7.4),
  W('g-front-office', 0, 'x', 10, 4, 12, 'ext', [win(8, 5, 0.45, 2.75)]),
  W('g-front-cinema', 0, 'x', 10, 12, 20, 'ext'),
  W('g-east-cinema', 0, 'z', 20, 0, 10, 'ext'),
  W('g-east-living', 0, 'z', 20, -10, 0, 'glass', [slide(-5, 4, 'livingEast', 3.2)], 7.4),
  W('g-back-living', 0, 'x', -10, 4, 20, 'glass', [slide(12, 6, 'livingPool', 3.2)], 7.4),
  W('g-back-dining', 0, 'x', -10, -6, 4, 'glass', [slide(-1, 4, 'diningTerrace', 3.0)]),
  W('g-back-kitchen', 0, 'x', -10, -18, -6, 'ext', [win(-12.5, 9, 1.0, 2.2), door(-7, 'kitchenOut', 1.0, 2.6)]),
  W('g-back-storage', 0, 'x', -10, -24, -18, 'ext', [door(-21, 'storageOut', 1.0), win(-19.2, 1.2, 2.2, 0.8)]),
  W('g-west-storage', 0, 'z', -24, -10, -3, 'ext', [win(-6.5, 2.5, 2.2, 0.8)]),
  W('g-west-laundry', 0, 'z', -24, -3, 2, 'ext', [win(-0.5, 2, 1.1, 1.3)]),
  W('g-west-garage', 0, 'z', -24, 2, 10, 'ext', [win(6, 3, 2.2, 0.8)]),
  // ---------------- Térreo — paredes internas
  W('g-garage-back', 0, 'x', 2, -24, -10, 'int', [door(-21, 'garageLaundry'), door(-12, 'garageService')]),
  W('g-garage-foyer', 0, 'z', -10, 2, 10, 'int'),
  W('g-laundry-pantry', 0, 'z', -18, -3, 2, 'int'),
  W('g-pantry-service', 0, 'z', -14, -3, 2, 'int', [door(0, 'pantryService')]),
  W('g-laundry-storage', 0, 'x', -3, -24, -18, 'int', [door(-21, 'laundryStorage')]),
  W('g-storage-kitchen', 0, 'z', -18, -10, -3, 'int'),
  W('g-pantry-kitchen', 0, 'x', -3, -18, -14, 'int', [door(-16, 'pantryKitchen')]),
  W('g-service-kitchen', 0, 'x', -3, -14, -10, 'int', [{ c: -12, w: 1.4, h: 2.6, kind: 'opening' }]),
  W('g-service-powder', 0, 'z', -10, -3, 2, 'int'),
  W('g-powder-foyer', 0, 'x', 2, -10, -7, 'int'),
  W('g-powder-gallery', 0, 'z', -7, -3, 2, 'int', [door(0.6, 'powderDoor')]),
  W('g-powder-kitchen', 0, 'x', -3, -10, -6, 'int'),
  W('g-kitchen-dining', 0, 'z', -6, -10, -3, 'int', [{ c: -6.5, w: 5, h: 3.0, kind: 'opening' }]),
  W('g-dining-living', 0, 'z', 4, -10, -3, 'int', [{ c: -6.5, w: 5, h: 3.2, kind: 'opening' }]),
  W('g-gallery-living', 0, 'z', 4, -3, 0, 'int', [{ c: -1.5, w: 2.6, h: 3.2, kind: 'opening' }]),
  W('g-office-west', 0, 'z', 4, 0, 10, 'int', [door(5, 'officeDoor', 1.0, 2.6)]),
  W('g-living-office', 0, 'x', 0, 4, 12, 'int'),
  W('g-living-cinema', 0, 'x', 0, 12, 20, 'int', [{ c: 18.5, w: 1.6, h: 2.6, kind: 'double', id: 'cinemaDoor' }]),
  W('g-office-cinema', 0, 'z', 12, 0, 10, 'int'),

  // ---------------- Superior — perímetro
  W('u-front', 1, 'x', 10, -24, -10, 'ext', [slide(-20.75, 3.5, 'bed4Balcony', 2.6), win(-16.25, 1.2, 1.6, 0.8), win(-12.5, 3, 0.6, 2.0)]),
  W('u-west', 1, 'z', -24, -10, 10, 'ext', [win(-6.5, 3, 0.6, 2.0), win(-1.5, 1.2, 1.6, 0.8), win(7, 2.5, 0.6, 2.0)]),
  W('u-back', 1, 'x', -10, -24, 4, 'ext', [slide(-20.5, 4, 'bed2Balcony', 2.6), slide(-13.5, 4, 'bed3Balcony', 2.6), win(-7, 3, 1.0, 1.6), slide(0, 7, 'masterBalcony', 2.6)]),
  W('u-east-master', 1, 'z', 4, -10, 0, 'ext'),
  W('u-east-corridor', 1, 'z', 4, 0, 3.6, 'ext', [slide(1.8, 2.4, 'terraceDoor', 2.6)]),
  W('u-east-foyer', 1, 'z', 4, 3.6, 10, 'ext', [win(6.8, 5, 0.4, 2.4)]),
  W('u-living-terrace', 1, 'x', 0, 4, 20, 'ext', [win(17, 5, 0.2, 2.8)]),
  W('u-foyer-bed5', 1, 'z', -10, 3.6, 10, 'ext'),
  // ---------------- Superior — internas
  W('u-front-rooms', 1, 'x', 3.6, -24, -10, 'int', [door(-18.3, 'bed4Door'), door(-16.25, 'bathSharedDoor', 0.8), door(-12, 'bed5Door')]),
  W('u-bed4-bath', 1, 'z', -17.5, 3.6, 10, 'int'),
  W('u-bath-bed5', 1, 'z', -15, 3.6, 10, 'int'),
  W('u-corridor-back', 1, 'x', 0, -24, 4, 'int', [door(-18.5, 'suite2Door'), door(-15, 'suite3Door'), door(-2, 'masterDoor', 1.1)]),
  W('u-bath2-closet2', 1, 'z', -20, -3, 0, 'int', [door(-1.5, 'bath2Door', 0.8)]),
  W('u-bath2-bed2', 1, 'x', -3, -24, -20, 'int'),
  W('u-closet2-bed2', 1, 'x', -3, -20, -17, 'int', [{ c: -18.5, w: 1.0, h: 2.4, kind: 'opening' }]),
  W('u-suite2-suite3', 1, 'z', -17, -10, 0, 'int'),
  W('u-closet3-bath3', 1, 'z', -13, -3, 0, 'int', [door(-1.5, 'bath3Door', 0.8)]),
  W('u-closet3-bed3', 1, 'x', -3, -17, -13, 'int', [{ c: -15, w: 1.0, h: 2.4, kind: 'opening' }]),
  W('u-bath3-bed3', 1, 'x', -3, -13, -10, 'int'),
  W('u-suite3-master', 1, 'z', -10, -10, 0, 'int'),
  W('u-closet-bath', 1, 'x', -4, -10, -4, 'int', [door(-7, 'masterBathDoor')]),
  W('u-closet-master', 1, 'z', -4, -4, 0, 'int', [{ c: -2, w: 1.2, h: 2.4, kind: 'opening' }]),
  W('u-bath-master', 1, 'z', -4, -10, -4, 'int'),
];

// ------------------------------------------------------------------ escada e elevador
/** Escada reta flutuante no hall: sobe de sul (z = 9,6) para norte (z = 3,6). */
export const STAIR = {
  x0: -7.8,
  x1: -6.2,
  zBottom: 9.6,
  zTop: 3.6,
  risers: 21,
};
export const ELEVATOR = { x0: -10, x1: -8.4, z0: 2, z1: 3.6, doorX: -8.4 };

/** Vazios (pé-direito duplo) no pavimento superior. */
export const VOIDS: (Rect & { id: string; label: string })[] = [
  { id: 'foyerVoid', label: 'Pé-direito duplo do hall', x0: -10, x1: 4, z0: 3.6, z1: 10 },
  { id: 'livingVoid', label: 'Pé-direito duplo do estar', x0: 4, x1: 20, z0: -10, z1: 0 },
];

/** Guarda-corpos de vidro (segmentos) no pavimento superior. */
export const GUARDRAILS: { level: Level; axis: 'x' | 'z'; at: number; from: number; to: number }[] = [
  { level: 1, axis: 'x', at: 3.6, from: -10, to: STAIR.x0 },
  { level: 1, axis: 'x', at: 3.6, from: STAIR.x1, to: 4 },
  // terraço
  { level: 1, axis: 'x', at: 10, from: 4, to: 20 },
  { level: 1, axis: 'z', at: 20, from: 0, to: 10 },
  // varanda master
  { level: 1, axis: 'x', at: -13, from: -10, to: 4 },
  { level: 1, axis: 'z', at: -10, from: -13, to: -10 },
  { level: 1, axis: 'z', at: 4, from: -13, to: -10 },
  // guarda-corpos (balcão francês) nas portas de correr das suítes 2 e 3
  { level: 1, axis: 'x', at: -10.3, from: -22.6, to: -18.4 },
  { level: 1, axis: 'x', at: -10.3, from: -15.6, to: -11.4 },
  // sacada quarto 4
  { level: 1, axis: 'x', at: 11.4, from: -23.4, to: -18 },
  { level: 1, axis: 'z', at: -23.4, from: 10, to: 11.4 },
  { level: 1, axis: 'z', at: -18, from: 10, to: 11.4 },
];

/** Contornos construídos por pavimento (para lajes, forros e cálculo de área). */
export const FOOTPRINT: Record<Level, Rect[]> = {
  0: [r(-24, 20, -10, 10)],
  1: [r(-24, 4, -10, 10)],
};

/** Terreno e implantação. */
export const LOT = { x0: -34, x1: 32, z0: -40, z1: 30 };
export const POOL = { x0: 0, x1: 20, z0: -25, z1: -18, beachX1: 5, depth: 1.5, beachDepth: 0.3 };

// ------------------------------------------------------------------ utilidades de área
export const rectArea = (rc: Rect) => (rc.x1 - rc.x0) * (rc.z1 - rc.z0);
export const rectCenter = (rc: Rect) => ({ x: (rc.x0 + rc.x1) / 2, z: (rc.z0 + rc.z1) / 2 });
export const rectSize = (rc: Rect) => ({ w: rc.x1 - rc.x0, d: rc.z1 - rc.z0 });

/** Área construída bruta: soma dos contornos menos os vazios do pavimento superior. */
export function builtArea(): number {
  const ground = FOOTPRINT[0].reduce((s, rc) => s + rectArea(rc), 0);
  const upper = FOOTPRINT[1].reduce((s, rc) => s + rectArea(rc), 0);
  const voids = VOIDS.filter((v) => v.x1 <= 4.0001).reduce((s, v) => s + rectArea(v), 0);
  return ground + upper - voids;
}

/** Área útil (soma das áreas internas dos cômodos fechados). */
export function usefulArea(): number {
  return Math.round(ROOMS.filter((rm) => !rm.outdoor).reduce((s, rm) => s + (rm.rect.x1 - rm.rect.x0 - 0.2) * (rm.rect.z1 - rm.rect.z0 - 0.2), 0));
}

export const roomHeight = (rm: Room) => rm.height ?? CEILING[rm.level];

export const LEVEL_NAMES: Record<Level, string> = { 0: 'Térreo', 1: 'Pavimento superior' };
export const CATEGORY_NAMES: Record<RoomCategory, string> = {
  social: 'Social',
  intima: 'Íntima',
  servico: 'Serviço',
  lazer: 'Lazer',
  externa: 'Externa',
  circulacao: 'Circulação',
};

/** Esquadrias que abrem e fecham (portas, portas de correr, portão da garagem e portões da rua). */
export const OPERABLE_KINDS: OpeningKind[] = ['door', 'double', 'slide', 'pivot', 'garage'];
export const GATE_IDS = ['streetGate', 'pedestrianGate'] as const;
export const OPERABLE_IDS: string[] = [
  ...WALLS.flatMap((w) => (w.openings ?? []).filter((o) => o.id && OPERABLE_KINDS.includes(o.kind)).map((o) => o.id as string)),
  ...GATE_IDS,
];
