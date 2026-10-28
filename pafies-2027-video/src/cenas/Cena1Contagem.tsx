import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CORES } from "../config";
import { Camera, useLayout } from "../componentes/Visual";
import {
  Cartela,
  FadePreto,
  Flare,
  FundoCinema,
  Linha,
  LuzVolumetrica,
  Poeira,
  Rotulo,
  Surge,
  TituloCinema,
} from "../componentes/Cinema";
import { BolaHeroi } from "../componentes/Esportes";

/** Passo do "relógio": o número cai um dia a cada meio segundo até travar. */
const PASSO = 15;
const DIAS_A_MAIS = 4;

/**
 * Cena 1 — faltam 86 dias. A bola gira em câmera lenta, sai de foco,
 * e o número "86" trava com um reflexo de lente; depois, a data das provas.
 */
export const Cena1Contagem: React.FC<{
  duracao: number;
  dias: number;
  momentoFaltam: number;
  momentoData: number;
  momentoProvas: number;
}> = ({ duracao, dias, momentoFaltam, momentoData, momentoProvas }) => {
  const f = useCurrentFrame();
  const { u, vertical, width, height } = useLayout();
  const passos = Math.min(DIAS_A_MAIS, Math.max(0, Math.floor((f - momentoFaltam) / PASSO)));
  const valor = dias + DIAS_A_MAIS - passos;
  const trava = momentoFaltam + DIAS_A_MAIS * PASSO;

  return (
    <AbsoluteFill>
      <FundoCinema />
      <LuzVolumetrica />
      <Camera de={1} ate={1.08} duracao={duracao} balanco={0.3}>
        <BolaHeroi
          tamanho={(vertical ? 780 : 600) * u}
          x={width / 2}
          y={height * (vertical ? 0.55 : 0.52)}
          focoDe={momentoFaltam - 6}
          focoAte={momentoFaltam + 20}
        />
        <Poeira semente="c1" />
      </Camera>

      <Cartela em={momentoFaltam} ate={momentoData - 2}>
        <Rotulo tamanho={vertical ? 40 : 34}>Faltam</Rotulo>
        <TituloCinema tamanho={vertical ? 560 : 400} style={{ margin: `${-20 * u}px 0` }}>
          {valor}
        </TituloCinema>
        <Surge em={trava + 4}>
          <Rotulo tamanho={vertical ? 34 : 30}>{dias === 1 ? "dia" : "dias"} para a gincana</Rotulo>
        </Surge>
      </Cartela>

      <Cartela em={momentoData} ate={duracao}>
        <Rotulo tamanho={vertical ? 30 : 26} cor={CORES.dourado}>
          Faltam {dias} {dias === 1 ? "dia" : "dias"}
        </Rotulo>
        <TituloCinema tamanho={vertical ? 150 : 140} style={{ marginTop: 24 * u }}>
          22 de janeiro
        </TituloCinema>
        <Rotulo tamanho={vertical ? 46 : 40} style={{ marginTop: 10 * u }}>
          de 2027
        </Rotulo>
        <Linha em={momentoProvas - 6} largura={vertical ? 640 : 760} style={{ margin: `${36 * u}px 0` }} />
        <Surge em={momentoProvas}>
          <Rotulo tamanho={vertical ? 40 : 36} cor={CORES.dourado}>
            Começam as provas
          </Rotulo>
        </Surge>
      </Cartela>

      <Flare em={trava - 10} />
      <Flare em={momentoData - 8} cor={CORES.dourado} forca={0.8} />
      <FadePreto de={0} ate={20} entrada />
      <FadePreto de={duracao - 10} ate={duracao} />
    </AbsoluteFill>
  );
};
