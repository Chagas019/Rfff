import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CORES } from "../config";
import { FONTE, OBLIQUO } from "../fontes";
import { Camera, clamp, gradienteTexto, useLayout } from "../componentes/Visual";
import { Cartela, Flare, Poeira, Rotulo, Surge } from "../componentes/Cinema";
import { BolaHeroi } from "../componentes/Esportes";
import { Clarao, Faiscas, OndaDeChoque, RaiosDeLuz, Tremor } from "../componentes/Impacto";

/**
 * Momentos em que o número cai (90 → 89 → 88 → 87), como frações do intervalo
 * entre "faltam" e o impacto: o relógio acelera. tools/gerar-trilha.py usa as
 * mesmas frações para os tiques.
 */
export const FRACOES_TIQUES = [0, 0.4, 0.7, 0.88];

/** Número em Cinzel com separação RGB (aberração cromática) logo após o impacto. */
const Numero: React.FC<{ valor: number; tamanho: number; separacao: number }> = ({ valor, tamanho, separacao }) => {
  const base: React.CSSProperties = {
    fontFamily: FONTE,
    fontWeight: 900,
    fontSize: tamanho,
    lineHeight: 0.9,
    letterSpacing: tamanho * 0.01,
  };
  const canal = (cor: string, dx: number): React.CSSProperties => ({
    ...base,
    position: "absolute",
    inset: 0,
    color: cor,
    transform: `translateX(${dx}px)`,
    mixBlendMode: "screen",
    opacity: 0.8,
  });
  return (
    <div style={{ position: "relative", transform: OBLIQUO }}>
      {separacao > 0.5 && (
        <>
          <div style={canal("#FF3B3B", -separacao)}>{valor}</div>
          <div style={canal("#3BE0FF", separacao)}>{valor}</div>
        </>
      )}
      <div
        style={{
          ...base,
          position: "relative",
          filter: `drop-shadow(0 ${tamanho * 0.02}px ${tamanho * 0.05}px rgba(5,12,45,0.6)) drop-shadow(0 0 ${
            tamanho * 0.08
          }px ${CORES.dourado}88)`,
        }}
      >
        <span style={gradienteTexto("#FFFFFF", "#FFE2A8", 180)}>{valor}</span>
      </div>
    </div>
  );
};

/**
 * Cena 1 — faltam 86 dias. A bola gira em câmera lenta e sai de foco, o relógio
 * acelera (90, 89, 88, 87), a tela "puxa o ar" e o 86 desaba com clarão, onda de
 * choque, faíscas, raios de luz, aberração cromática e tremor de câmera.
 */
export const Cena1Contagem: React.FC<{
  duracao: number;
  dias: number;
  momentoFaltam: number;
  momentoImpacto: number;
}> = ({ duracao, dias, momentoFaltam, momentoImpacto }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, vertical, width, height } = useLayout();

  const tiques = FRACOES_TIQUES.map((p) => Math.round(momentoFaltam + p * (momentoImpacto - momentoFaltam)));
  const passos = tiques.filter((t) => f >= t).length;
  const valor = f >= momentoImpacto ? dias : dias + FRACOES_TIQUES.length + 1 - passos;

  // antes do impacto: o número encolhe e a tela escurece ("puxa o ar")
  const depois = f >= momentoImpacto;
  const succao = depois ? 0 : interpolate(f, [momentoImpacto - 9, momentoImpacto - 1], [0, 1], clamp);
  // o impacto: o 86 desaba de grande para o tamanho final, com um repique
  const t = f - momentoImpacto;
  const queda = spring({ frame: t, fps, config: { damping: 15, stiffness: 260, mass: 0.6 } });
  const escala = depois ? 2.8 - 1.8 * queda : 1 - succao * 0.3;
  const separacao = depois && t < 14 ? (1 - t / 14) * 26 * u : 0;
  // batida de coração no número depois de travar
  const pulso = depois ? 1 + Math.max(0, Math.sin(((t - 6) / 15) * Math.PI)) ** 8 * 0.04 : 1;
  const yNumero = vertical ? "48%" : "50%";

  return (
    <AbsoluteFill>
      <Tremor em={momentoImpacto}>
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

        {/* escurecimento antes do golpe */}
        <AbsoluteFill style={{ background: "#000", opacity: succao * 0.55 }} />
        <RaiosDeLuz em={momentoImpacto} y={yNumero} />
        <OndaDeChoque em={momentoImpacto} y={yNumero} />

        <Cartela em={momentoFaltam} ate={duracao} entrada={12}>
          <Rotulo tamanho={vertical ? 42 : 36} style={{ opacity: 1 - succao * 0.6 }}>
            Faltam
          </Rotulo>
          <div
            style={{
              transform: `scale(${escala * pulso})`,
              filter: depois ? undefined : `blur(${succao * 8 * u}px)`,
              opacity: depois ? interpolate(t, [0, 2], [0, 1], clamp) : 1 - succao * 0.5,
              margin: `${-10 * u}px 0`,
            }}
          >
            <Numero valor={valor} tamanho={(vertical ? 760 : 560) * u} separacao={separacao} />
          </div>
          <Surge em={momentoImpacto + 10}>
            <Rotulo tamanho={vertical ? 36 : 32}>{dias === 1 ? "dia" : "dias"} para a gincana</Rotulo>
          </Surge>
        </Cartela>

        <Faiscas em={momentoImpacto} y={height * (vertical ? 0.48 : 0.5)} />
      </Tremor>

      <Clarao em={momentoImpacto} />
      <Flare em={momentoImpacto - 2} forca={1.3} duracao={40} y={yNumero} />
    </AbsoluteFill>
  );
};
