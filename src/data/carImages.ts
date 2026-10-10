/**
 * IMAGENS DE ESTÚDIO DOS CARROS (renders em fundo claro, vista 3/4)
 * ----------------------------------------------------------------------------
 * Coloque a imagem em `public/cars/<id-da-equipe>.webp` (ou .jpg/.png) e
 * registre-a aqui com o crédito. Equipes sem imagem de estúdio usam a foto
 * real do Wikimedia Commons (src/services/carPhotos.ts).
 *
 * Use apenas imagens com direito de uso (próprias, licenciadas ou kits de
 * imprensa que permitam o uso) e informe a origem em `credit`.
 * Fundo ideal: cinza-claro/branco liso, como em um estúdio fotográfico.
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
    caption: 'Audi #27 — render de estúdio',
  },
};

export const studioImageFor = (teamId: string) => studioImages[teamId];
