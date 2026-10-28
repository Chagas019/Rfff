import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CORES } from "../config";
import { FONTE_TEXTO } from "../fontes";
import {
  Camera,
  Centro,
  Clarao,
  clamp,
  Fachos,
  FaixasDeLuz,
  Fundo,
  gradienteTexto,
  Particulas,
  suave,
  TextoSurge,
  Titulo,
  useLayout,
} from "../componentes/Visual";
import { LogoPafies, No3D } from "./Cena2Gincana";

/** Cena 6 — explosão de luz azul e laranja e a assinatura final. */
export const Cena6Encerramento: React.FC<{ duracao: number; momentoFrase: number }> = ({ duracao, momentoFrase }) => {
  const f = useCurrentFrame();
  const { u, vertical } = useLayout();
  const explosao = interpolate(f, [0, 30], [0, 1], { ...clamp, easing: suave });
  const saida = interpolate(f, [duracao - 24, duracao], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ opacity: saida }}>
      <Fundo intensidade={1.3} laranja={0.7} />
      <Fachos quantidade={vertical ? 4 : 6} abertura={1.1} />
      {/* onda de luz em anel */}
      <Centro>
        <div
          style={{
            width: explosao * 2600 * u,
            height: explosao * 2600 * u,
            borderRadius: "50%",
            border: `${(1 - explosao) * 120 * u + 4 * u}px solid ${CORES.laranja}`,
            boxShadow: `0 0 ${120 * u}px ${CORES.azulLuz}, inset 0 0 ${120 * u}px ${CORES.dourado}`,
            opacity: 1 - explosao,
            mixBlendMode: "screen",
          }}
        />
      </Centro>
      <Camera de={1.2} ate={1} duracao={45} balanco={0.6}>
        <Particulas quantidade={140} velocidade={1.8} semente="c6" />
        <No3D tamanho={260 * u} x={vertical ? "85%" : "86%"} y={vertical ? "12%" : "20%"} fase={40} />
        <No3D tamanho={200 * u} x={vertical ? "15%" : "12%"} y={vertical ? "90%" : "82%"} fase={200} desfoque={2 * u} />
      </Camera>
      <FaixasDeLuz inicio={0} duracao={24} quantidade={5} />

      <Centro style={{ padding: `0 ${50 * u}px`, flexDirection: vertical ? "column" : "row", gap: vertical ? 0 : 70 * u }}>
        <LogoPafies tamanho={(vertical ? 360 : 440) * u} em={4} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: vertical ? 36 * u : 0 }}>
          <TextoSurge em={10}>
            <div
              style={{
                fontFamily: FONTE_TEXTO,
                fontWeight: 900,
                fontSize: (vertical ? 56 : 50) * u,
                letterSpacing: 3 * u,
                ...gradienteTexto(CORES.dourado, CORES.laranja),
                filter: `drop-shadow(0 0 ${12 * u}px ${CORES.laranja}aa)`,
              }}
            >
              10ª GINCANA SOLIDÁRIA
            </div>
          </TextoSurge>
          <TextoSurge em={14} de="zoom">
            <Titulo tamanho={vertical ? 220 : 190}>PAFIES 2027</Titulo>
          </TextoSurge>
          <TextoSurge em={22}>
            <div
              style={{
                marginTop: 14 * u,
                padding: `${12 * u}px ${30 * u}px`,
                borderRadius: 999,
                border: `${3 * u}px solid ${CORES.laranja}`,
                fontFamily: FONTE_TEXTO,
                fontWeight: 900,
                fontSize: (vertical ? 48 : 44) * u,
                letterSpacing: 4 * u,
                color: CORES.branco,
                background: `${CORES.marinho}aa`,
                boxShadow: `0 0 ${30 * u}px ${CORES.laranja}88`,
              }}
            >
              22 DE JANEIRO DE 2027
            </div>
          </TextoSurge>
          <TextoSurge em={momentoFrase}>
            <div
              style={{
                marginTop: 34 * u,
                fontFamily: FONTE_TEXTO,
                fontWeight: 800,
                fontSize: (vertical ? 44 : 38) * u,
                lineHeight: 1.3,
                textAlign: "center",
                color: CORES.branco,
                textShadow: `0 0 ${18 * u}px ${CORES.azulLuz}`,
                maxWidth: (vertical ? 960 : 900) * u,
              }}
            >
              JUNTOS, TRANSFORMAMOS
              <br />
              <span style={gradienteTexto(CORES.azulLuz, CORES.branco, 90)}>SOLIDARIEDADE EM AÇÃO!</span>
            </div>
          </TextoSurge>
        </div>
      </Centro>
      <Clarao em={0} cor={CORES.laranja} duracao={22} />
    </AbsoluteFill>
  );
};
