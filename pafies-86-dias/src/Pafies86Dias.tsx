import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { CENAS, FRAMES, IdCena, MARCAS } from "./config";
import { carregarFontes } from "./fontes";
import { Fade, Grao, Vinheta } from "./componentes/Base";
import { Cena1Despertar } from "./cenas/Cena1Despertar";
import { Cena2Explosao86 } from "./cenas/Cena2Explosao86";
import { Cena3Energia } from "./cenas/Cena3Energia";
import { Cena4Expectativa } from "./cenas/Cena4Expectativa";
import { Cena5Correcao } from "./cenas/Cena5Correcao";
import { Cena6Revelacao } from "./cenas/Cena6Revelacao";

carregarFontes();

const ini = (id: IdCena) => CENAS[id][0];
const dur = (id: IdCena) => CENAS[id][1] - CENAS[id][0];
/** Marca convertida para o tempo local da cena. */
const local = (id: IdCena, marca: number) => marca - ini(id);

const Cena: React.FC<{ id: IdCena; children: React.ReactNode }> = ({ id, children }) => (
  <Sequence from={ini(id)} durationInFrames={dur(id)} name={id}>
    {children}
  </Sequence>
);

export const Pafies86Dias: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <Cena id="despertar">
      <Cena1Despertar duracao={dur("despertar")} momentoTexto={local("despertar", MARCAS.textoComecou)} />
    </Cena>
    <Cena id="explosao">
      <Cena2Explosao86 duracao={dur("explosao")} impacto={local("explosao", MARCAS.impacto86)} />
    </Cena>
    <Cena id="energia">
      <Cena3Energia
        duracao={dur("energia")}
        palavras={[MARCAS.palavra1, MARCAS.palavra2, MARCAS.palavra3].map((m) => local("energia", m))}
      />
    </Cena>
    <Cena id="expectativa">
      <Cena4Expectativa
        duracao={dur("expectativa")}
        reaparece={local("expectativa", MARCAS.reaparece86)}
        texto={local("expectativa", MARCAS.historia)}
      />
    </Cena>
    <Cena id="correcao">
      <Cena5Correcao
        duracao={dur("correcao")}
        atencao={local("correcao", MARCAS.atencao)}
        quilos={local("correcao", MARCAS.quilos)}
        toneladas={local("correcao", MARCAS.toneladas)}
      />
    </Cena>
    <Cena id="revelacao">
      <Cena6Revelacao
        duracao={dur("revelacao")}
        revelacao={local("revelacao", MARCAS.revelacao)}
        assinatura={local("revelacao", MARCAS.assinatura)}
      />
    </Cena>

    <Vinheta forca={0.6} />
    <Grao />
    <Fade de={0} ate={6} entrando />
    <Fade de={FRAMES - 10} ate={FRAMES} />

    <Audio src={staticFile("audio/trilha.wav")} />
  </AbsoluteFill>
);
