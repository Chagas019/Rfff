/**
 * IDENTIDADE VISUAL POR PAÍS-SEDE
 * Paletas inspiradas nas bandeiras (cores oficiais aproximadas) e na cultura visual de
 * cada país. `accent` é a cor de destaque usada em textos, botões e indicadores: foi
 * ajustada para ter contraste com o fundo escuro do site e com texto preto por cima
 * (luminância entre 0,2 e 0,8 — conferido em src/data/__tests__/eventThemes.test.ts).
 * `c1`, `c2` e `c3` compõem gradientes, faixas e detalhes; nunca uma bandeira inteira.
 */
export interface EventTheme {
  accent: string;
  c1: string;
  c2: string;
  c3: string;
  /** Descrição curta da inspiração (exibida no banner do evento). */
  motif: string;
}

export const EVENT_THEMES: Record<string, EventTheme> = {
  AU: { accent: '#FFCD00', c1: '#00843D', c2: '#FFCD00', c3: '#0B1A2E', motif: 'Verde e dourado australianos' },
  CN: { accent: '#FFDE3B', c1: '#EE1C25', c2: '#FFDE00', c3: '#8A0D12', motif: 'Vermelho e amarelo da China' },
  JP: { accent: '#FF5A72', c1: '#BC002D', c2: '#F5F5F5', c3: '#5C0016', motif: 'Branco e vermelho do Japão' },
  BH: { accent: '#FF5468', c1: '#CE1126', c2: '#F5F5F5', c3: '#5E0711', motif: 'Vermelho e branco do Bahrein' },
  SA: { accent: '#3DCB7A', c1: '#006C35', c2: '#F5F5F5', c3: '#003A1C', motif: 'Verde saudita' },
  US: { accent: '#FF5C6C', c1: '#B22234', c2: '#F5F5F5', c3: '#3C3B6E', motif: 'Vermelho, branco e azul americanos' },
  CA: { accent: '#FF5757', c1: '#E30000', c2: '#F5F5F5', c3: '#6B0000', motif: 'Vermelho e branco do Canadá' },
  MC: { accent: '#FF5468', c1: '#CE1126', c2: '#F5F5F5', c3: '#5E0711', motif: 'Vermelho e branco de Mônaco' },
  ES: { accent: '#F1BF00', c1: '#AA151B', c2: '#F1BF00', c3: '#4D090C', motif: 'Vermelho e amarelo espanhóis' },
  AT: { accent: '#FF5468', c1: '#C8102E', c2: '#F5F5F5', c3: '#5A0714', motif: 'Vermelho e branco da Áustria' },
  GB: { accent: '#7FA6FF', c1: '#012169', c2: '#C8102E', c3: '#F5F5F5', motif: 'Azul, vermelho e branco britânicos' },
  BE: { accent: '#FDDA24', c1: '#1A1A1A', c2: '#FDDA24', c3: '#EF3340', motif: 'Preto, amarelo e vermelho belgas' },
  HU: { accent: '#62C27A', c1: '#CE2939', c2: '#F5F5F5', c3: '#477050', motif: 'Vermelho, branco e verde húngaros' },
  NL: { accent: '#FF8A1E', c1: '#AE1C28', c2: '#F5F5F5', c3: '#21468B', motif: 'Laranja holandês com vermelho, branco e azul' },
  IT: { accent: '#3CC46F', c1: '#009246', c2: '#F1F2F1', c3: '#CE2B37', motif: 'Verde, branco e vermelho italianos' },
  AZ: { accent: '#20C4F0', c1: '#00B5E2', c2: '#EF3340', c3: '#509E2F', motif: 'Azul, vermelho e verde do Azerbaijão' },
  MY: { accent: '#FFCC00', c1: '#010066', c2: '#CC0001', c3: '#FFCC00', motif: 'Azul, vermelho e amarelo da Malásia' },
  SG: { accent: '#FF5C66', c1: '#EF3340', c2: '#F5F5F5', c3: '#6E0E15', motif: 'Vermelho e branco de Singapura' },
  MX: { accent: '#2FBF7A', c1: '#006847', c2: '#F5F5F5', c3: '#CE1126', motif: 'Verde, branco e vermelho mexicanos' },
  BR: { accent: '#FFDF00', c1: '#009C3B', c2: '#FFDF00', c3: '#002776', motif: 'Verde, amarelo e azul do Brasil' },
  QA: { accent: '#FF6F97', c1: '#8A1538', c2: '#F5F5F5', c3: '#3F0A1A', motif: 'Grená e branco do Catar' },
  AE: { accent: '#E2BF5A', c1: '#1F4FA8', c2: '#D4AF37', c3: '#E6D3A3', motif: 'Azul do golfo, dourado e tons de areia' },
};

/** Paleta neutra do site, usada quando não há etapa (fim de temporada) ou país sem paleta. */
export const DEFAULT_THEME: EventTheme = { accent: '#EDB40B', c1: '#20273B', c2: '#EDB40B', c3: '#0E1324', motif: 'Identidade padrão do GRID F1' };

export const themeFor = (countryCode?: string): EventTheme => (countryCode && EVENT_THEMES[countryCode]) || DEFAULT_THEME;
