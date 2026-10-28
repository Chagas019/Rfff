import tempos from "./tempos.json";

export const CORES = {
  marinho: "#071B49",
  royal: "#1E3FCB",
  azul: "#1261D8",
  azulLuz: "#36A5FF",
  laranja: "#FF6A00",
  dourado: "#FFB347",
  ouro: "#F5C46A",
  branco: "#FFFFFF",
} as const;

export const FPS = tempos.fps;
export const FRAMES = tempos.frames;
/** Único número de contagem exibido no vídeo. */
export const DIAS = 86;

export type IdCena = keyof typeof tempos.cenas;
export const CENAS = tempos.cenas as Record<IdCena, [number, number]>;
/** Frames-chave, compartilhados com tools/gerar-trilha.py para sincronizar os impactos. */
export const MARCAS = tempos.marcas;

/**
 * Fotos e vídeos reais da gincana para a cena 3 (equipes, alimentos, união).
 * Coloque os arquivos em public/midia/ e liste-os aqui, por exemplo:
 *   { arquivo: "midia/equipes.jpg" } ou { arquivo: "midia/arrecadacao.mp4", video: true }
 * Enquanto a lista estiver vazia, os painéis mostram composições gráficas animadas.
 */
export type Midia = { arquivo: string; video?: boolean };
export const MIDIAS: Midia[] = [];

/** Logo oficial (substitua o arquivo em public/imagens/ para trocar). */
export const LOGO = "imagens/logo-pafies.png";

/** Área segura do Instagram Reels (px no quadro 1080×1920). */
export const AREA_SEGURA = { topo: 260, base: 1450, lados: 70 };
