/**
 * IMAGENS DE ESTÚDIO DOS CARROS (renders em fundo claro, vista 3/4)
 * ----------------------------------------------------------------------------
 * Coloque a imagem em `public/cars/<id-da-equipe>.webp` (ou .jpg/.png) e
 * registre-a aqui com o crédito. Equipes sem imagem de estúdio usam a foto
 * real do Wikimedia Commons (src/services/carPhotos.ts).
 *
 * Use apenas imagens com direito de uso (próprias, licenciadas ou kits de
 * imprensa que permitam o uso) e informe a origem em `credit`.
 * Prefira PNG com fundo transparente (recortado).
 */
export interface StudioImage {
  src: string;
  /** Texto exibido como crédito na imagem. */
  credit: string;
  /** Link da origem, se houver. */
  sourceUrl?: string;
  /** "render" (imagem digital) ou "photo" (fotografia). */
  kind: 'render' | 'photo';
  /** Descrição curta do que a imagem mostra. */
  caption: string;
}

export const studioImages: Partial<Record<string, StudioImage>> = {
  audi: {
    src: '/cars/audi.webp',
    credit: 'Render enviado pelo responsável do site',
    kind: 'render',
    caption: 'Audi #27 — render de estúdio (fundo removido)',
  },
  ferrari: {
    src: '/cars/ferrari-top.webp',
    credit: 'Render enviado pelo responsável do site',
    kind: 'render',
    caption: 'Ferrari #16 — vista aérea (fundo removido)',
  },
};

export const studioImageFor = (teamId: string) => studioImages[teamId];

/** Arte de capacete com fundo transparente (substitui o capacete ilustrado). */
export interface HelmetImage { src: string; credit: string; caption: string }

export const helmetImages: Partial<Record<string, HelmetImage>> = {
  leclerc: {
    src: '/helmets/leclerc.webp',
    credit: 'Arte: DaiMOnDesign',
    caption: 'Capacete de Charles Leclerc — arte digital (fundo removido)',
  },
};
