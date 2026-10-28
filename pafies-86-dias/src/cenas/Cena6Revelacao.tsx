import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CORES } from "../config";
import { Camera, Clarao, clamp, useU } from "../componentes/Base";
import { Explosao, Feixes, Flare, Fundo, PoeiraDourada, Raios } from "../componentes/Efeitos";
import { LogoRevelacao } from "../componentes/Elementos";
import { Rotulo, Surge, TextoLetras } from "../componentes/Texto";

/** Cena 5 (16–20 s, aqui 21–25 s) — revelação do logo oficial e assinatura. */
export const Cena6Revelacao: React.FC<{ duracao: number; revelacao: number; assinatura: number }> = ({
  duracao,
  revelacao,
  assinatura,
}) => {
  const f = useCurrentFrame();
  const { u, height } = useU();
  const luz = interpolate(f, [0, revelacao, revelacao + 10], [0.15, 0.25, 1], clamp);
  const yLogo = height * 0.34;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: luz }}>
        <Fundo intensidade={1.2} quente={0.5} />
        <Feixes quantidade={3} forca={0.9} />
      </AbsoluteFill>
      <Raios em={revelacao} y="34%" cor="#FFE7B0" maximo={0.7} />
      <PoeiraDourada quantidade={110} velocidade={1.2} semente="c6" aparece={revelacao - 6} />

      <Camera de={revelacao} ate={duracao} zoom={[1.08, 1]}>
        <AbsoluteFill style={{ alignItems: "center", paddingTop: yLogo - 230 * u }}>
          <LogoRevelacao em={revelacao} tamanho={460 * u} />
          <Surge em={revelacao + 12} style={{ marginTop: 64 * u }}>
            <Rotulo tamanho={52} cor={CORES.ouro}>
              10ª Gincana Solidária
            </Rotulo>
          </Surge>
          <TextoLetras texto="PAFIES 2027" em={revelacao + 18} tamanho={250} espacamento={0.02} passo={1.4} />
          <Surge em={assinatura} style={{ marginTop: 40 * u }}>
            <Rotulo tamanho={58}>Você faz parte</Rotulo>
            <Rotulo tamanho={58} cor="#FFD98A" style={{ marginTop: 10 * u }}>
              dessa história!
            </Rotulo>
          </Surge>
        </AbsoluteFill>
      </Camera>

      <Explosao em={revelacao} y={yLogo} quantidade={90} />
      <Clarao em={revelacao} duracao={14} />
      <Flare em={revelacao - 2} y="34%" cor={CORES.ouro} forca={1.2} />
    </AbsoluteFill>
  );
};
