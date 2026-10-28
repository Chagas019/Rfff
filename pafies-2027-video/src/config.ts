import roteiro from "../roteiro.json";

export const CORES = {
  marinho: "#071B49",
  azul: "#1261D8",
  azulLuz: "#36A5FF",
  laranja: "#FF6A00",
  dourado: "#FFB347",
  branco: "#FFFFFF",
} as const;

export const FPS = roteiro.fps;
export const DURACAO_FRAMES = Math.round(roteiro.duracao * FPS);

export type IdCena = "contagem" | "aviso" | "encerramento";

export type Cena = {
  id: IdCena;
  inicio: number;
  fim: number;
  /** null quando a cena não tem locução */
  narracao: string | null;
  falaInicio: number | null;
  falaDuracao: number;
  marcas: Record<string, number>;
};

export const CENAS = roteiro.cenas as unknown as Cena[];

export const s = (segundos: number) => Math.round(segundos * FPS);

export const cena = (id: IdCena) => {
  const c = CENAS.find((x) => x.id === id);
  if (!c) throw new Error(`Cena desconhecida: ${id}`);
  return c;
};

// Data confirmada do início das provas.
export const INICIO_DAS_PROVAS = "2027-01-22";
export const DATA_REFERENCIA_PADRAO = "2026-10-28";

/** Data de hoje no fuso de Brasília, no formato AAAA-MM-DD. */
export const hojeEmBrasilia = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

/** Dias inteiros entre duas datas AAAA-MM-DD (nunca negativo). */
export const diasAte = (alvo: string, referencia: string) => {
  const dia = (iso: string) => {
    const [a, m, d] = iso.split("-").map(Number);
    return Date.UTC(a, m - 1, d) / 86_400_000;
  };
  return Math.max(0, Math.round(dia(alvo) - dia(referencia)));
};

export type PropsVideo = {
  /** Data a partir da qual a contagem é calculada (AAAA-MM-DD). Vazio = hoje. */
  dataReferencia: string;
};
