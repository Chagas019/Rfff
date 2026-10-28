import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CORES } from "../config";
import { FONTE_TEXTO } from "../fontes";
import {
  Camera,
  Centro,
  clamp,
  Fachos,
  Fundo,
  Particulas,
  suave,
  TextoSurge,
  Titulo,
  useLayout,
  useOpacidadeCena,
} from "../componentes/Visual";

/** Cena 1 — tela preta, uma luz azul nasce no centro e a câmera avança até ela. */
export const Cena1Chamado: React.FC<{ duracao: number; momentoRotulo: number; momentoTitulo: number }> = ({
  duracao,
  momentoRotulo,
  momentoTitulo,
}) => {
  const f = useCurrentFrame();
  const { u, vertical } = useLayout();
  const opacidade = useOpacidadeCena(duracao, 1, 10);
  const nasce = interpolate(f, [8, 75], [0, 1], { ...clamp, easing: suave });
  const raioLuz = interpolate(f, [8, duracao], [20, 520], { ...clamp, easing: suave }) * u;
  const reflexo = interpolate(f, [30, 150], [-40, 140], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", opacity: opacidade }}>
      <AbsoluteFill style={{ opacity: nasce }}>
        <Fundo intensidade={nasce * 0.8} laranja={0.2 * nasce} />
      </AbsoluteFill>
      <Camera de={1} ate={1.25} duracao={duracao}>
        <AbsoluteFill style={{ opacity: nasce }}>
          <Fachos abertura={0.6 + nasce * 0.4} quantidade={1} />
        </AbsoluteFill>
        {/* núcleo de luz azul */}
        <Centro>
          <div
            style={{
              width: raioLuz,
              height: raioLuz,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${CORES.branco} 0%, ${CORES.azulLuz} 18%, ${CORES.azul}88 45%, transparent 70%)`,
              opacity: nasce,
              filter: `blur(${4 * u}px)`,
            }}
          />
        </Centro>
        {/* reflexo laranja atravessando a composição */}
        <AbsoluteFill style={{ mixBlendMode: "screen", overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              top: "-20%",
              left: `${reflexo}%`,
              width: 160 * u,
              height: "140%",
              transform: "rotate(20deg)",
              background: `linear-gradient(90deg, transparent, ${CORES.laranja}88, ${CORES.dourado}aa, transparent)`,
              filter: `blur(${30 * u}px)`,
            }}
          />
        </AbsoluteFill>
        <AbsoluteFill style={{ opacity: interpolate(f, [15, 60], [0, 1], clamp) }}>
          <Particulas quantidade={60} velocidade={0.6} semente="c1" />
        </AbsoluteFill>
      </Camera>

      <Centro style={{ padding: `0 ${70 * u}px` }}>
        <TextoSurge em={momentoRotulo} de="zoom">
          <div
            style={{
              fontFamily: FONTE_TEXTO,
              fontWeight: 600,
              fontSize: 30 * u,
              letterSpacing: interpolate(f, [momentoRotulo, momentoRotulo + 90], [24, 10], clamp) * u,
              color: CORES.dourado,
              textAlign: "center",
              marginBottom: 24 * u,
            }}
          >
            PREPARE O CORAÇÃO
          </div>
        </TextoSurge>
        <TextoSurge em={momentoTitulo}>
          <Titulo tamanho={vertical ? 118 : 120}>
            Uma grande missão
            <br />
            está chegando…
          </Titulo>
        </TextoSurge>
      </Centro>
    </AbsoluteFill>
  );
};
