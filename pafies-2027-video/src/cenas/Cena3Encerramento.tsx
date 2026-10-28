import React from "react";
import { AbsoluteFill } from "remotion";
import { CORES } from "../config";
import { Camera, useLayout } from "../componentes/Visual";
import {
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
import { LogoPafies } from "../componentes/Elementos";
import { RaquetesCameraLenta } from "../componentes/Esportes";

/** Cena 3 — assinatura final: logo, nome do evento e os dois recados. */
export const Cena3Encerramento: React.FC<{
  duracao: number;
  dias: number;
  momentoRaquetes: number;
  momentoFrase: number;
}> = ({ duracao, dias, momentoRaquetes, momentoFrase }) => {
  const { u, vertical, width, height } = useLayout();

  return (
    <AbsoluteFill>
      <FundoCinema quente={0.4} />
      <LuzVolumetrica intensidade={0.9} />
      <Camera de={1.06} ate={1} duracao={duracao} balanco={0.2}>
        <Poeira semente="c3" />
        <RaquetesCameraLenta
          em={momentoRaquetes}
          x={width / 2}
          y={height * (vertical ? 0.83 : 0.87)}
          largura={(vertical ? 760 : 620) * u}
        />
      </Camera>

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          paddingBottom: (vertical ? 260 : 170) * u,
        }}
      >
        <Surge em={4}>
          <LogoPafies tamanho={(vertical ? 250 : 170) * u} em={4} />
        </Surge>
        <Surge em={12} style={{ marginTop: 34 * u }}>
          <Rotulo tamanho={vertical ? 28 : 24} cor={CORES.dourado}>
            10ª Gincana Solidária
          </Rotulo>
        </Surge>
        <Surge em={18}>
          <TituloCinema tamanho={vertical ? 150 : 118} style={{ marginTop: 10 * u }}>
            PAFIES 2027
          </TituloCinema>
        </Surge>
        <Linha em={26} largura={vertical ? 560 : 640} style={{ margin: `${26 * u}px 0` }} />
        <Surge em={momentoFrase}>
          <Rotulo tamanho={vertical ? 32 : 28}>
            Faltam {dias} {dias === 1 ? "dia" : "dias"}
          </Rotulo>
        </Surge>
        <Surge em={momentoFrase + 10} style={{ marginTop: 14 * u, maxWidth: vertical ? 860 * u : 1400 * u }}>
          <Rotulo tamanho={vertical ? 24 : 22} cor={CORES.dourado} style={{ lineHeight: 1.7 }}>
            +50 mil quilos de alimentos arrecadados
          </Rotulo>
        </Surge>
      </AbsoluteFill>

      <Flare em={0} cor={CORES.dourado} />
      <FadePreto de={0} ate={8} entrada />
      <FadePreto de={duracao - 22} ate={duracao} />
    </AbsoluteFill>
  );
};
