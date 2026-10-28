import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { AREA_SEGURA } from "../config";
import { Camera, clamp, entradaRapida, useU } from "../componentes/Base";
import { Feixes, Fundo, PoeiraDourada } from "../componentes/Efeitos";
import { BolaCinematica } from "../componentes/Elementos";
import { TextoLetras } from "../componentes/Texto";

/** Cena 1 (0–3 s) — o despertar: escuro, poeira dourada, feixes azuis e a bola chegando. */
export const Cena1Despertar: React.FC<{ duracao: number; momentoTexto: number }> = ({ duracao, momentoTexto }) => {
  const f = useCurrentFrame();
  const { u, width, height } = useU();
  const acende = interpolate(f, [0, 40], [0, 1], clamp);
  // no fim, a câmera "mergulha" na bola em direção à cena do 86
  const mergulho = interpolate(f, [duracao - 14, duracao], [0, 1], { ...clamp, easing: entradaRapida });
  return (
    <AbsoluteFill style={{ filter: `blur(${mergulho * 16 * u}px)` }}>
      <Camera de={0} ate={duracao} zoom={[1.08, 1]}>
        <AbsoluteFill style={{ opacity: acende }}>
          <Fundo intensidade={0.7} quente={0.25} />
        </AbsoluteFill>
        <AbsoluteFill style={{ opacity: interpolate(f, [8, 30], [0, 1], clamp) }}>
          <Feixes quantidade={3} />
        </AbsoluteFill>
        <PoeiraDourada aparece={4} quantidade={70} semente="c1" />
      </Camera>
      <AbsoluteFill style={{ transform: `scale(${1 + mergulho * 2.2})`, transformOrigin: "50% 55%" }}>
        <BolaCinematica em={10} tamanho={560 * u} cx={width / 2} cy={height * 0.56} />
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: AREA_SEGURA.topo * u + 90 * u, opacity: 1 - mergulho }}>
        <TextoLetras texto="A CONTAGEM" em={momentoTexto} tamanho={130} espacamento={0.06} />
        <TextoLetras texto="COMEÇOU…" em={momentoTexto + 10} tamanho={130} espacamento={0.06} cor="#FFD98A" />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
