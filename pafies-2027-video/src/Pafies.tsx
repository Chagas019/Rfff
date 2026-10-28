import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile } from "remotion";
import { CENAS, cena, diasAte, FPS, hojeEmBrasilia, INICIO_DAS_PROVAS, PropsVideo, s } from "./config";
import { carregarFontes } from "./fontes";
import { Vinheta } from "./componentes/Visual";
import { Cena1Chamado } from "./cenas/Cena1Chamado";
import { Cena2Gincana } from "./cenas/Cena2Gincana";
import { Cena3Contagem } from "./cenas/Cena3Contagem";
import { Cena4Aviso } from "./cenas/Cena4Aviso";
import { Cena5Gratidao } from "./cenas/Cena5Gratidao";
import { Cena6Encerramento } from "./cenas/Cena6Encerramento";

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

const m = (id: Parameters<typeof cena>[0], chave: string) => {
  const v = cena(id).marcas[chave];
  if (v === undefined) throw new Error(`Marca "${chave}" ausente na cena ${id} (roteiro.json)`);
  return s(v);
};

export const Pafies: React.FC<PropsVideo> = ({ dataReferencia }) => {
  const dias = diasAte(INICIO_DAS_PROVAS, dataReferencia || hojeEmBrasilia());
  const dur = (id: Parameters<typeof cena>[0]) => s(cena(id).fim) - s(cena(id).inicio);
  const seq = (id: Parameters<typeof cena>[0], el: React.ReactNode) => (
    <Sequence key={id} from={s(cena(id).inicio)} durationInFrames={dur(id)} name={id}>
      {el}
    </Sequence>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {seq(
        "chamado",
        <Cena1Chamado duracao={dur("chamado")} momentoRotulo={m("chamado", "rotulo")} momentoTitulo={m("chamado", "titulo")} />,
      )}
      {seq("gincana", <Cena2Gincana duracao={dur("gincana")} corte={m("gincana", "titulo")} momentoRally={m("gincana", "rally")} />)}
      {seq(
        "contagem",
        <Cena3Contagem
          duracao={dur("contagem")}
          dias={dias}
          momentoData={m("contagem", "data")}
          momentoProvas={m("contagem", "provas")}
          momentoBola={m("contagem", "basquete")}
        />,
      )}
      {seq(
        "aviso",
        <Cena4Aviso
          duracao={dur("aviso")}
          momentoCorrecao={m("aviso", "correcao")}
          momentoNumero={m("aviso", "numero")}
          momentoToneladas={m("aviso", "toneladas")}
        />,
      )}
      {seq(
        "gratidao",
        <Cena5Gratidao
          duracao={dur("gratidao")}
          momentosCartoes={[m("gratidao", "esperanca"), m("gratidao", "cuidado"), m("gratidao", "amor")]}
          momentoObrigado={m("gratidao", "obrigado")}
          momentoJuntos={m("gratidao", "juntos")}
        />,
      )}
      {seq("encerramento", <Cena6Encerramento duracao={dur("encerramento")} momentoFrase={m("encerramento", "frase")}
          momentoBola={m("encerramento", "basquete")}
        />)}
      <Vinheta />

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
