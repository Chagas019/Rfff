/**
 * Medidas do aparelho, tiradas da fotografia de referência
 * (public/reference/pocket-arcade-reference.jpg, 770×999 px).
 *
 * Como medir: os cantos da face frontal na foto foram marcados à mão
 * (TL 132,197 · TR 548,213 · BR 685,790 · BL 258,800) e cada componente foi
 * convertido para coordenadas normalizadas (u da esquerda para a direita,
 * v de cima para baixo) dentro desse quadrilátero. Peças altas (botões,
 * joystick) aparecem deslocadas para a direita na foto por causa da câmera,
 * então a base delas foi corrigida para a esquerda.
 *
 * Unidade do modelo: centímetro. A frente olha para +Z, o topo para +Y.
 * As dimensões físicas reais não são conhecidas; a proporção largura/altura
 * (≈0,76) e a espessura (≈23 % da largura) foram estimadas pela perspectiva.
 */

export const BODY = {
  width: 10,
  height: 13.2,
  depth: 2.3,
  cornerRadius: 0.78,
  /** Fronte (placa frontal) e fundo (concha traseira), separados por um friso. */
  frontZ: 1.1,
  backZ: -1.2,
  seamZ: 0.5,
  seamGap: 0.06,
  frontBevel: 0.13,
  backBevel: 0.24,
} as const;

/** u,v da foto → x,y do modelo (face frontal). */
export const fx = (u: number) => (u - 0.5) * BODY.width;
export const fy = (v: number) => (0.5 - v) * BODY.height;

/** Profundidade em que ficam ranhuras, entradas e cartuchos (meio da concha traseira). */
export const SIDE_Z = -0.38;

export const LAYOUT = {
  /** Moldura preta da tela (u 0,075–0,925 · v 0,058–0,497). */
  bezel: { x0: fx(0.075), x1: fx(0.925), y0: fy(0.497), y1: fy(0.058), radius: 0.48, border: 0.16, bottomBorder: 0.16 },
  /** Indicador/botão horizontal branco abaixo da tela. */
  pill: { x: fx(0.5), y: fy(0.548), w: 2.15, h: 0.42 },
  /** Adesivo "Play" (levemente inclinado na foto). */
  play: { x: fx(0.175), y: fy(0.59), w: 3.4, h: 1.25, rotation: 0.2 },
  /** Elemento decorativo azul em cruz arredondada. */
  clover: { x: fx(0.88), y: fy(0.566), radius: 0.55 },
  /** Botões na ordem da foto, da esquerda para a direita: azul, amarelo, vermelho. */
  buttons: [
    { id: 'blue', x: fx(0.158), y: fy(0.748) },
    { id: 'yellow', x: fx(0.328), y: fy(0.746) },
    { id: 'red', x: fx(0.498), y: fy(0.741) },
  ],
  buttonRadius: 0.68,
  buttonWell: 0.78,
  /** Joystick grande no canto inferior direito. */
  joystick: { x: fx(0.846), y: fy(0.776), housingRadius: 1.5, capRadius: 1.18 },
  /** Etiqueta em relevo "Fast Campus". */
  label: { x: fx(0.5), y: fy(0.924), w: 2.45, h: 0.58 },
  /** Parafusos nos quatro cantos visíveis. */
  screwInset: 0.5,
  screwRadius: 0.19,
} as const;

/** Lateral esquerda (x = −W/2): posições ao longo da altura, medidas na foto. */
export const LEFT_SIDE = {
  slider: { y: fy(0.135), length: 1.5, width: 0.42 },
  vents: { yTop: fy(0.33), yBottom: fy(0.5), count: 13, length: 0.95, thickness: 0.075 },
  knob: { y: fy(0.645), radius: 0.56, length: 0.62 },
  magentaPill: { y: fy(0.795), length: 1.25, width: 0.42 },
  magentaDot: { y: fy(0.888), radius: 0.17 },
} as const;

/** Cartuchos e conectores que saem do corpo. */
export const ACCESSORIES = {
  /** Cartucho amarelo "groffi" saindo do topo. */
  topCartridge: { x: fx(0.51), width: 3.0, exposed: 2.15, insideLength: 2.1, thickness: 0.5 },
  /** Cartão azul "Memory Card" saindo da lateral direita. */
  sideCard: { y: fy(0.215), length: 2.65, exposed: 1.55, insideLength: 2.2, thickness: 0.36, z: 0.0 },
  /** Peça vermelha saindo da base. */
  bottomTab: { x: fx(0.24), width: 3.3, exposed: 1.55, insideLength: 1.7, thickness: 0.62 },
  /** Argola metálica triangular no topo. */
  topLoop: { x: fx(0.78) },
  /** Conector USB na base. */
  usb: { x: fx(0.47) },
  /** Marcações na base (CE/FC) e furo pequeno. */
  marks: { x: fx(0.66) },
  pinhole: { x: fx(0.8) },
} as const;

/** Tela: resolução lógica dos jogos (mesma proporção da área visível da tela). */
export const SCREEN_RES = { width: 300, height: 200 } as const;
