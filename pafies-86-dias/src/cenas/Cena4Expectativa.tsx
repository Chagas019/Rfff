import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { DIAS } from "../config";
import { Clarao, clamp, saida, useU } from "../componentes/Base";
import { Flare, Fundo, PoeiraDourada, Raios, Warp } from "../componentes/Efeitos";
import { TunelGeometrico } from "../componentes/Geometria";
import { Numero3D } from "../componentes/Numero3D";
import { TextoLetras } from "../componentes/Texto";

/**
 * Cena 4 (12–16 s) — a expectativa aumenta: a câmera atravessa um túnel de
 * formas, a poeira vira chuva de luz e o 86 reaparece girando em 3D.
 */
export const Cena4Expectativa: React.FC<{ duracao: number; reaparece: number; texto: number }> = ({
  duracao,
  reaparece,
  texto,
}) => {
  const f = useCurrentFrame();
  const { u } = useU();
  const chega = interpolate(f, [reaparece, reaparece + 20], [0.15, 1], { ...clamp, easing: saida });
  const rotY = interpolate(f, [reaparece, duracao], [-40, 28], clamp);
  const rotX = 14 + Math.sin(f / 20) * 4;
  const flutua = Math.sin(f / 18) * 12 * u;
  return (
    <AbsoluteFill>
      <Fundo intensidade={1.2} quente={0.6} />
      <TunelGeometrico de={0} ate={duracao} />
      <Warp de={0} ate={duracao} />
      <PoeiraDourada quantidade={70} velocidade={5} semente="c4" />
      <Raios em={reaparece} y="34%" cor="#9FD3FF" maximo={0.55} />

      <AbsoluteFill style={{ alignItems: "center", paddingTop: 300 * u }}>
        <div
          style={{
            transform: `translateY(${flutua}px) scale(${chega})`,
            opacity: interpolate(f, [reaparece, reaparece + 6], [0, 1], clamp),
            filter: `blur(${(1 - chega) * 12 * u}px)`,
          }}
        >
          <Numero3D texto={String(DIAS)} tamanho={460} rotX={rotX} rotY={rotY} profundidade={90} />
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 560 * u }}>
        <TextoLetras texto="A SOLIDARIEDADE" em={texto} tamanho={120} espacamento={0.04} passo={1.2} />
        <TextoLetras texto="VAI FAZER" em={texto + 10} tamanho={120} espacamento={0.04} passo={1.2} />
        <TextoLetras texto="HISTÓRIA!" em={texto + 18} tamanho={170} espacamento={0.04} passo={2} cor="#FFD98A" />
      </AbsoluteFill>

      <Flare em={reaparece + 4} y="34%" />
      <Clarao em={duracao - 4} duracao={8} forca={0.7} />
    </AbsoluteFill>
  );
};
