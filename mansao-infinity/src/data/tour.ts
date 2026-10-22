import type { TimeOfDay } from '../config/lighting';
import type { Level } from './plan';

export interface TourStep {
  title: string;
  text: string;
  position: [number, number, number];
  target: [number, number, number];
  /** Segundos parado no plano antes de seguir. */
  hold: number;
  /** Tempo de deslocamento da câmera (suavização). */
  travel: number;
  cut?: Level | null;
  time?: TimeOfDay;
  room?: string;
  open?: string[];
  /** Corte com fade (para não atravessar paredes entre ambientes internos). */
  fade?: boolean;
}

/** Roteiro da visita guiada: um percurso cinematográfico do acesso à cobertura. */
export const TOUR: TourStep[] = [
  { title: 'Mansão Infinity', text: 'Implantação em platô sobre o mar: 1.350 m² construídos, piscina de borda infinita e paisagismo tropical.', position: [70, 38, 78], target: [-2, 2, -4], hold: 3.5, travel: 2.6, cut: null },
  { title: 'Fachada principal', text: 'Volumes assimétricos em concreto, travertino e teca, com a marquise de 6,5 m em balanço sobre a entrada.', position: [10, 5.5, 44], target: [-4, 4, 8], hold: 4, travel: 2.4, cut: null, open: ['streetGate'] },
  { title: 'Acesso social', text: 'Pisantes de travertino entre palmeiras levam à porta pivotante de nogueira com 4,5 m de altura.', position: [1.5, 1.7, 22], target: [-1, 2.6, 10], hold: 4, travel: 2.6, cut: null, open: ['pedestrianGate', 'frontDoor'] },
  { title: 'Hall com pé-direito duplo', text: 'Sete metros de altura, piso em mármore Calacatta, escada flutuante em nogueira e elevador panorâmico.', position: [1.8, 1.7, 9.0], target: [-6.5, 3.2, 4.5], hold: 4.5, travel: 2.8, cut: null, room: 'foyer', fade: true },
  { title: 'Sala de estar', text: 'Panos de vidro de piso a teto para a piscina, lareira linear em painel de Nero Marquina e lustre de globos.', position: [17.5, 2.0, -1.2], target: [8.5, 1.6, -6.5], hold: 5, travel: 3.0, cut: null, room: 'living', fade: true },
  { title: 'Jantar e cozinha', text: 'Mesa para 12 sob lustre escultural, integrada à cozinha com ilha de 4,4 m em mármore.', position: [3.2, 1.8, -3.6], target: [-10, 1.1, -7.5], hold: 5, travel: 2.8, cut: null, room: 'dining', fade: true },
  { title: 'Terraço e piscina', text: 'Deck em travertino, prainha com espreguiçadeiras e borda infinita de 20 m voltada para o mar.', position: [-4, 2.4, -14.5], target: [14, -0.5, -24], hold: 5, travel: 3.0, cut: null, room: 'pool', open: ['diningTerrace'], fade: true },
  { title: 'Espaço gourmet', text: 'Churrasqueira, bancada em granito, mesa para oito e lounge sob pérgola de concreto e teca.', position: [-4.5, 2.6, -25], target: [-17, 1, -19], hold: 4.5, travel: 2.8, cut: null, room: 'gourmet' },
  { title: 'Suíte master', text: 'Cabeceira estofada de parede inteira, estar íntimo, closet com vitrines iluminadas e banho com banheira de imersão.', position: [8, 15, 4], target: [-3, 4.6, -6], hold: 5, travel: 3.0, cut: 1, room: 'master' },
  { title: 'Pavimento superior', text: 'Cinco suítes e quartos, galeria íntima aberta para o hall e terraço com spa sobre o cinema.', position: [-8, 34, 24], target: [-8, 4, 0], hold: 4.5, travel: 3.0, cut: 1 },
  { title: 'Térreo', text: 'Área social integrada, cinema, escritório, serviço completo e garagem para quatro carros.', position: [-2, 40, 26], target: [-2, 0, 0], hold: 4.5, travel: 3.0, cut: 0 },
  { title: 'Garagem', text: 'Quatro vagas de 3,2 × 6 m, portão seccionado de 12 m, armários e iluminação linear.', position: [-6, 10, 16], target: [-17, 0.5, 5.5], hold: 4, travel: 2.8, cut: 0, room: 'garage', open: ['garageDoor'] },
  { title: 'Cinema', text: 'Tela de 5,5 m, oito poltronas reclináveis em dois níveis, painéis acústicos e teto estrelado.', position: [21, 11, 0], target: [16, 0.5, 5.5], hold: 4, travel: 2.8, cut: 0, room: 'cinema' },
  { title: 'Ao anoitecer', text: 'A iluminação arquitetônica revela os volumes, a piscina se acende e o interior brilha através do vidro.', position: [46, 9, -48], target: [0, 2, -6], hold: 6, travel: 3.4, cut: null, time: 'night' },
];
