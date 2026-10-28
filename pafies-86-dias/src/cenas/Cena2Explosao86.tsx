import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CORES, DIAS } from "../config";
import { Clarao, clamp, entradaRapida, Tremor, useU } from "../componentes/Base";
import { Explosao, Feixes, Flare, Fundo, LinhasDeEnergia, OndaDeChoque, PoeiraDourada, Raios } from "../componentes/Efeitos";
import { Numero3D } from "../componentes/Numero3D";
import { Rotulo, Surge, TextoLetras } from "../componentes/Texto";

const Y_NUMERO = 0.44;

/**
 * Cena 2 (3–7 s) — a explosão dos 86 dias: o número vem da lente num zoom
 * agressivo, bate no tempo da trilha e domina a tela em 3D metálico.
 */
export const Cena2Explosao86: React.FC<{ duracao: number; impacto: number }> = ({ duracao, impacto }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, height } = useU();
  const t = f - impacto;
  const antes = f < impacto;
  const chegada = interpolate(f, [0, impacto], [7, 1.15], { ...clamp, easing: entradaRapida });
  const mola = spring({ frame: t, fps, config: { damping: 14, stiffness: 250, mass: 0.6 } });
  const empurra = interpolate(t, [0, duracao - impacto], [0, 0.12], clamp);
  const escala = antes ? chegada : 1.15 - 0.15 * mola + empurra;
  const separacao = !antes && t < 14 ? (1 - t / 14) * 30 * u : 0;
  // órbita lenta para revelar a profundidade do número
  const rotY = interpolate(f, [impacto, duracao], [-22, 16], clamp);
  const rotX = interpolate(f, [impacto, duracao], [10, -4], clamp);
  // saída em chicote para a próxima cena
  const chicote = interpolate(f, [duracao - 10, duracao], [0, 1], { ...clamp, easing: entradaRapida });
  const y = `${Y_NUMERO * 100}%`;

  return (
    <AbsoluteFill style={{ transform: `translateX(${-chicote * 1300 * u}px)`, filter: `blur(${chicote * 20 * u}px)` }}>
      <Fundo intensidade={1.25} quente={0.45} />
      <Feixes quantidade={4} forca={1.2} />
      <Raios em={impacto} y={y} cor="#FFE7B0" />
      <PoeiraDourada quantidade={90} velocidade={1.6} semente="c2" />
      <LinhasDeEnergia em={impacto - 4} semente="e1" />
      <LinhasDeEnergia em={impacto + 40} quantidade={5} semente="e2" />
      <OndaDeChoque em={impacto} y={y} />

      <Tremor em={impacto} forca={30}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: (1 - Y_NUMERO * 2) * height }}>
          <Surge em={impacto + 6}>
            <Rotulo tamanho={64} cor={CORES.ouro}>
              Faltam
            </Rotulo>
          </Surge>
          <div
            style={{
              transform: `scale(${escala})`,
              filter: antes ? `blur(${(chegada - 1) * 3 * u}px)` : undefined,
              opacity: interpolate(f, [0, 4], [0, 1], clamp),
              margin: `${-30 * u}px 0 ${-10 * u}px`,
            }}
          >
            <Numero3D texto={String(DIAS)} tamanho={900} rotX={rotX} rotY={rotY} separacao={separacao} />
          </div>
          <TextoLetras texto="DIAS" em={impacto + 12} tamanho={190} espacamento={0.18} passo={3} />
        </AbsoluteFill>
      </Tremor>

      <Explosao em={impacto} y={height * Y_NUMERO} />
      <Clarao em={impacto} />
      <Flare em={impacto - 2} y={y} forca={1.3} />
    </AbsoluteFill>
  );
};
