import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CORES } from "../config";
import { FONTE_CINEMA } from "../fontes";
import { Camera, clamp, suave, useLayout } from "../componentes/Visual";
import {
  Cartela,
  Flare,
  Linha,
  Poeira,
  Rotulo,
  Surge,
  TituloCinema,
} from "../componentes/Cinema";

const milhar = (n: number) => n.toLocaleString("pt-BR");

/**
 * Cena 2 — aviso oficial em cartelas de trailer: são mais de 50 mil QUILOS
 * de alimentos, e não 50 mil toneladas.
 */
export const Cena2Aviso: React.FC<{
  duracao: number;
  momentoCorrecao: number;
  momentoNumeroCorreto: number;
  momentoNumero: number;
  momentoIssoMesmo: number;
  momentoToneladas: number;
}> = ({ duracao, momentoCorrecao, momentoNumeroCorreto, momentoNumero, momentoIssoMesmo, momentoToneladas }) => {
  const f = useCurrentFrame();
  const { u, vertical } = useLayout();
  const contagem = interpolate(f, [momentoNumero + 4, momentoNumero + 50], [0, 50000], { ...clamp, easing: suave });
  const risco = interpolate(f, [momentoToneladas + 16, momentoToneladas + 34], [0, 1], { ...clamp, easing: suave });
  const larguraTexto = vertical ? 860 * u : 1300 * u;

  return (
    <AbsoluteFill>
      <Camera de={1.02} ate={1.1} duracao={duracao} balanco={0.25}>
        <Poeira semente="c2" quantidade={55} />
      </Camera>

      <Cartela em={0} ate={momentoNumeroCorreto - 2}>
        <Linha em={4} largura={vertical ? 420 : 520} />
        <Rotulo tamanho={vertical ? 30 : 28} cor={CORES.dourado} style={{ margin: `${22 * u}px 0` }}>
          Aviso importante
        </Rotulo>
        <TituloCinema tamanho={vertical ? 190 : 170} quente>
          Atenção
        </TituloCinema>
        <Surge em={momentoCorrecao} style={{ maxWidth: larguraTexto, marginTop: 30 * u }}>
          <Rotulo tamanho={vertical ? 28 : 26} style={{ lineHeight: 1.7 }}>
            Correção sobre a arrecadação de alimentos
          </Rotulo>
        </Surge>
      </Cartela>

      <Cartela em={momentoNumeroCorreto} ate={momentoNumero - 2}>
        <Rotulo tamanho={vertical ? 40 : 36}>O número correto é</Rotulo>
      </Cartela>

      <Cartela em={momentoNumero} ate={momentoToneladas - 2}>
        <TituloCinema tamanho={vertical ? 230 : 210}>
          <span style={{ fontSize: "0.55em", verticalAlign: "0.45em" }}>+</span>
          {milhar(Math.round(contagem / 10) * 10)}
        </TituloCinema>
        <Surge em={momentoNumero + 10} style={{ marginTop: 10 * u }}>
          <Rotulo tamanho={vertical ? 40 : 38}>quilos de alimentos</Rotulo>
        </Surge>
        <Linha em={momentoIssoMesmo - 6} largura={vertical ? 640 : 760} style={{ margin: `${40 * u}px 0` }} />
        <Surge em={momentoIssoMesmo} style={{ maxWidth: larguraTexto }}>
          <Rotulo tamanho={vertical ? 32 : 30} cor={CORES.dourado} style={{ lineHeight: 1.7 }}>
            Mais de 50 mil quilos arrecadados
          </Rotulo>
        </Surge>
      </Cartela>

      <Cartela em={momentoToneladas} ate={duracao}>
        <Rotulo tamanho={vertical ? 34 : 30}>e não</Rotulo>
        <div style={{ position: "relative", marginTop: 16 * u }}>
          <div
            style={{
              fontFamily: FONTE_CINEMA,
              fontWeight: 600,
              fontSize: (vertical ? 104 : 120) * u,
              letterSpacing: 4 * u,
              color: "#C3CCE4",
              textAlign: "center",
              lineHeight: 1.1,
            }}
          >
            50 mil toneladas
          </div>
          <div
            style={{
              position: "absolute",
              left: "-3%",
              top: "50%",
              width: `${risco * 106}%`,
              height: 6 * u,
              background: CORES.laranja,
              boxShadow: `0 0 ${14 * u}px ${CORES.laranja}`,
              transform: "rotate(-4deg)",
            }}
          />
        </div>
        <Linha em={momentoToneladas + 30} largura={vertical ? 640 : 760} cor={CORES.azulLuz} style={{ margin: `${44 * u}px 0` }} />
        <Surge em={momentoToneladas + 36}>
          <TituloCinema tamanho={vertical ? 92 : 84}>+50.000 kg</TituloCinema>
          <Rotulo tamanho={vertical ? 28 : 26} style={{ marginTop: 12 * u }}>
            de alimentos
          </Rotulo>
        </Surge>
      </Cartela>

      <Flare em={momentoNumero + 34} />
      <Flare em={momentoToneladas + 26} cor={CORES.laranja} forca={0.7} />
    </AbsoluteFill>
  );
};
