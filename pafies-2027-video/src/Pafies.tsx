import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile } from "remotion";
import { CENAS, cena, diasAte, FPS, hojeEmBrasilia, IdCena, INICIO_DAS_PROVAS, PropsVideo, s } from "./config";
import { carregarFontes } from "./fontes";
import { Gradacao, Grao, Letterbox } from "./componentes/Cinema";
import { Cena1Contagem } from "./cenas/Cena1Contagem";
import { Cena2Aviso } from "./cenas/Cena2Aviso";
import { Cena3Encerramento } from "./cenas/Cena3Encerramento";

carregarFontes();

const VOLUME_TRILHA = 0.55;
const VOLUME_TRILHA_SOB_VOZ = 0.14; // ducking: a música abre espaço para a locutora
const VOLUME_EFEITOS = 0.6;
const ATAQUE = 0.25; // s para a música baixar antes da fala
const SOLTURA = 0.6; // s para a música voltar depois da fala

/** Quanto a trilha deve estar "abaixada" (0 a 1) num frame do vídeo. */
const ducking = (frame: number) => {
  const t = frame / FPS;
  let d = 0;
  for (const c of CENAS) {
    if (c.falaInicio === null) continue;
    const ini = c.falaInicio;
    const fim = c.falaInicio + c.falaDuracao;
    d = Math.max(
      d,
      interpolate(t, [ini - ATAQUE, ini, fim, fim + SOLTURA], [0, 1, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    );
  }
  return d;
};

const volumeTrilha = (frame: number) =>
  interpolate(ducking(frame), [0, 1], [VOLUME_TRILHA, VOLUME_TRILHA_SOB_VOZ]);

const m = (id: IdCena, chave: string) => {
  const v = cena(id).marcas[chave];
  if (v === undefined) throw new Error(`Marca "${chave}" ausente na cena ${id} (roteiro.json)`);
  return s(v);
};

const dur = (id: IdCena) => s(cena(id).fim) - s(cena(id).inicio);

const seq = (id: IdCena, el: React.ReactNode) => (
  <Sequence key={id} from={s(cena(id).inicio)} durationInFrames={dur(id)} name={id}>
    {el}
  </Sequence>
);

export const Pafies: React.FC<PropsVideo> = ({ dataReferencia }) => {
  const dias = diasAte(INICIO_DAS_PROVAS, dataReferencia || hojeEmBrasilia());

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {seq(
        "contagem",
        <Cena1Contagem
          duracao={dur("contagem")}
          dias={dias}
          momentoFaltam={m("contagem", "faltam")}
          momentoData={m("contagem", "data")}
          momentoProvas={m("contagem", "provas")}
        />,
      )}
      {seq(
        "aviso",
        <Cena2Aviso
          duracao={dur("aviso")}
          momentoCorrecao={m("aviso", "correcao")}
          momentoNumeroCorreto={m("aviso", "numeroCorreto")}
          momentoNumero={m("aviso", "numero")}
          momentoIssoMesmo={m("aviso", "issoMesmo")}
          momentoToneladas={m("aviso", "toneladas")}
        />,
      )}
      {seq(
        "encerramento",
        <Cena3Encerramento
          duracao={dur("encerramento")}
          dias={dias}
          momentoRaquetes={m("encerramento", "raquetes")}
          momentoFrase={m("encerramento", "frase")}
        />,
      )}
      <Gradacao />
      <Grao />
      <Letterbox />

      <Audio src={staticFile("audio/trilha.wav")} volume={volumeTrilha} />
      <Audio src={staticFile("audio/efeitos.wav")} volume={VOLUME_EFEITOS} />
      {CENAS.map((c) =>
        c.narracao && c.falaInicio !== null ? (
          <Sequence key={c.id} from={s(c.falaInicio)} name={`voz ${c.id}`}>
            <Audio src={staticFile(`narracao/${c.narracao}`)} volume={1} />
          </Sequence>
        ) : null,
      )}
    </AbsoluteFill>
  );
};
