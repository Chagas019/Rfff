import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CORES, MIDIAS } from "../config";
import { Clarao, useU } from "../componentes/Base";
import { Fundo, LinhasDeEnergia, PoeiraDourada } from "../componentes/Efeitos";
import { FormasFlutuantes, PainelMidia } from "../componentes/Geometria";
import { PalavraImpacto } from "../componentes/Texto";

const FRASES = ["UMA\nMISSÃO.", "MUITAS\nEQUIPES.", "UM SÓ\nPROPÓSITO."];

/**
 * Cena 3 (7–12 s) — energia e solidariedade: tipografia cinética, uma frase por
 * batida, com painéis para fotos/vídeos reais da gincana passando por trás.
 */
export const Cena3Energia: React.FC<{ duracao: number; palavras: number[] }> = ({ duracao, palavras }) => {
  useCurrentFrame();
  const { u, width, height } = useU();
  return (
    <AbsoluteFill>
      <Fundo intensidade={1.1} quente={0.35} />
      <FormasFlutuantes semente="c3" quantidade={10} />
      <PoeiraDourada quantidade={60} velocidade={2.5} semente="c3p" />
      {palavras.map((em, i) => {
        const ate = palavras[i + 1] ?? duracao;
        return (
          <React.Fragment key={i}>
            <PainelMidia
              midia={MIDIAS[i]}
              indice={i}
              em={em - 2}
              ate={ate}
              x={width / 2 + (i % 2 ? 60 : -60) * u}
              y={height * 0.36}
              largura={820 * u}
              altura={760 * u}
              lado={i % 2 ? 1 : -1}
            />
            <LinhasDeEnergia em={em - 3} quantidade={6} duracao={14} semente={`c3-${i}`} />
            <Clarao em={em} duracao={6} forca={0.35} />
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingTop: height * 0.32 }}>
              <PalavraImpacto texto={FRASES[i]} em={em} ate={ate} tamanho={230} cor={i === 2 ? "#FFD98A" : CORES.branco} />
            </AbsoluteFill>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
