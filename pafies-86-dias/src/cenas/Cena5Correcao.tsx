import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CORES } from "../config";
import { FONTE, OBLIQUO } from "../fontes";
import { clamp, saida, Tremor, useU } from "../componentes/Base";
import { Feixes, Flare, Fundo, PoeiraDourada } from "../componentes/Efeitos";
import { FormasFlutuantes } from "../componentes/Geometria";
import { Rotulo, Surge } from "../componentes/Texto";

/**
 * Cena extra — correção da arrecadação: são mais de 50 mil QUILOS de
 * alimentos, e não 50 mil toneladas. Nenhum outro número é mostrado.
 */
export const Cena5Correcao: React.FC<{ duracao: number; atencao: number; quilos: number; toneladas: number }> = ({
  duracao,
  atencao,
  quilos,
  toneladas,
}) => {
  const f = useCurrentFrame();
  const { u } = useU();
  const risco = interpolate(f, [toneladas + 12, toneladas + 26], [0, 1], { ...clamp, easing: saida });
  const bate = interpolate(f, [quilos, quilos + 10], [1.6, 1], { ...clamp, easing: saida });
  const sai = interpolate(f, [duracao - 10, duracao], [0, 1], clamp);
  const titulo: React.CSSProperties = {
    fontFamily: FONTE,
    fontWeight: 900,
    textTransform: "uppercase",
    textAlign: "center",
    transform: OBLIQUO,
    lineHeight: 0.9,
  };
  return (
    <AbsoluteFill style={{ opacity: 1 - sai }}>
      <Fundo intensidade={1} quente={0.7} />
      <Feixes quantidade={2} cor={CORES.laranja} forca={0.7} />
      <FormasFlutuantes semente="c5" quantidade={7} forca={0.45} />
      <PoeiraDourada quantidade={50} semente="c5p" />

      <Tremor em={quilos} forca={14} duracao={12}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 140 * u, gap: 26 * u }}>
          <Surge em={atencao}>
            <div
              style={{
                padding: `${12 * u}px ${36 * u}px`,
                borderRadius: 999,
                border: `${3 * u}px solid ${CORES.ouro}`,
                background: `${CORES.laranja}33`,
              }}
            >
              <Rotulo tamanho={46} cor={CORES.ouro}>
                Atenção • Correção
              </Rotulo>
            </div>
          </Surge>
          <Surge em={atencao + 8}>
            <Rotulo tamanho={50}>Já arrecadamos</Rotulo>
          </Surge>
          <div
            style={{
              ...titulo,
              fontSize: 250 * u,
              color: CORES.branco,
              opacity: interpolate(f, [quilos, quilos + 4], [0, 1], clamp),
              transform: `${OBLIQUO} scale(${bate})`,
              filter: `drop-shadow(0 ${8 * u}px 0 ${CORES.azul}) drop-shadow(0 0 ${30 * u}px ${CORES.azulLuz}88)`,
            }}
          >
            Mais de
            <br />
            <span style={{ color: "#FFD98A" }}>50 mil quilos</span>
          </div>
          <Surge em={quilos + 12}>
            <Rotulo tamanho={54}>de alimentos</Rotulo>
          </Surge>

          <Surge em={toneladas} style={{ marginTop: 40 * u }}>
            <div style={{ position: "relative" }}>
              <div style={{ ...titulo, fontSize: 104 * u, color: "#C9D3EE" }}>Não são 50 mil toneladas</div>
              <div
                style={{
                  position: "absolute",
                  left: "-2%",
                  top: "50%",
                  width: `${risco * 104}%`,
                  height: 9 * u,
                  background: CORES.laranja,
                  boxShadow: `0 0 ${16 * u}px ${CORES.laranja}`,
                  transform: "rotate(-3deg)",
                }}
              />
            </div>
          </Surge>
        </AbsoluteFill>
      </Tremor>
      <Flare em={quilos - 2} cor={CORES.ouro} />
    </AbsoluteFill>
  );
};
