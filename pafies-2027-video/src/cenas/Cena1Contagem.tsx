import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Camera, clamp, useLayout } from "../componentes/Visual";
import {
  Cartela,
  Flare,
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
 * e o número "86" trava com um reflexo de lente.
 */
export const Cena1Contagem: React.FC<{
  duracao: number;
  dias: number;
  momentoFaltam: number;
}> = ({ duracao, dias, momentoFaltam }) => {
  const f = useCurrentFrame();
  const { u, vertical, width, height } = useLayout();
  const passos = Math.min(DIAS_A_MAIS, Math.max(0, Math.floor((f - momentoFaltam) / PASSO)));
  const valor = dias + DIAS_A_MAIS - passos;
  const trava = momentoFaltam + DIAS_A_MAIS * PASSO;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: interpolate(f, [duracao - 12, duracao], [1, 0], clamp) }}>
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
      </AbsoluteFill>

      <Cartela em={momentoFaltam} ate={duracao}>
        <Rotulo tamanho={vertical ? 40 : 34}>Faltam</Rotulo>
        <TituloCinema tamanho={vertical ? 560 : 400} style={{ margin: `${-20 * u}px 0` }}>
          {valor}
        </TituloCinema>
        <Surge em={trava + 4}>
          <Rotulo tamanho={vertical ? 34 : 30}>{dias === 1 ? "dia" : "dias"} para a gincana</Rotulo>
        </Surge>
      </Cartela>

      <Flare em={trava - 10} />
    </AbsoluteFill>
  );
};
