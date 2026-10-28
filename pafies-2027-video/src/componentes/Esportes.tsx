import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CORES } from "../config";
import { clamp } from "./Visual";

/** Um tempo da trilha (120 BPM): quiques e raquetadas caem no ritmo da música
 *  (tools/gerar-trilha.py usa o mesmo tempo para os sons de quique e raquetada). */
export const TEMPO_BATIDA = 60 / 120;

const bolinhaEstilo = (tam: number): React.CSSProperties => ({
  position: "absolute",
  width: tam,
  height: tam,
  borderRadius: "50%",
  background: `radial-gradient(circle at 35% 30%, #FFFFFF 0%, #E6ECF5 22%, #9AA6B8 55%, #3B4352 85%, #1C2230 100%)`,
  boxShadow: `0 0 ${tam * 0.5}px ${CORES.azulLuz}aa, inset ${-tam * 0.08}px ${-tam * 0.1}px ${tam * 0.2}px #0006`,
});

/**
 * Rally de pingue-pongue: as raquetes giram no punho a cada batida e a bolinha
 * vai e volta em arco, com rastro.
 */
export const RallyPinguePongue: React.FC<{
  em: number;
  /** largura total da jogada, em px */
  largura: number;
  /** centro da jogada, em px */
  x: number;
  y: number;
}> = ({ em, largura, x, y }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f - em;
  if (t < -2) return null;

  const entrada = spring({ frame: t, fps, config: { damping: 14, stiffness: 90 } });
  const periodo = TEMPO_BATIDA * fps;
  const raquete = largura * 0.3;
  const xEsq = x - largura / 2 + raquete * 0.75;
  const xDir = x + largura / 2 - raquete * 0.75;
  const altura = largura * 0.12;
  const bolinha = largura * 0.055;

  // posição da bolinha num instante (em frames desde o início)
  const posicao = (tt: number) => {
    const ida = Math.max(0, tt) / periodo;
    const lance = Math.floor(ida);
    const p = ida - lance;
    const deEsq = lance % 2 === 0;
    const bx = deEsq ? xEsq + (xDir - xEsq) * p : xDir - (xDir - xEsq) * p;
    const by = y - altura * Math.sin(Math.PI * p) - largura * 0.02;
    return { bx, by };
  };

  // golpe: pico de rotação no instante de cada batida
  const golpe = (lado: 0 | 1) => {
    const fase = (t / periodo - lado + 2) % 2; // 0 = batida deste lado
    const d = Math.min(fase, 2 - fase) * periodo; // frames até a batida mais próxima
    return Math.exp(-((d / 4) ** 2));
  };

  const rastro = [0, 1.5, 3, 4.5, 6];
  return (
    <div style={{ position: "absolute", inset: 0, opacity: entrada }}>
      <Img
        src={staticFile("imagens/raquete-esquerda.png")}
        style={{
          position: "absolute",
          width: raquete,
          left: xEsq - raquete * 0.95 - (1 - entrada) * largura * 0.4,
          top: y - raquete * 0.85,
          transformOrigin: "10% 95%",
          transform: `rotate(${-8 - golpe(0) * 28 + Math.sin(f / 9) * 2}deg)`,
          filter: `drop-shadow(0 0 ${raquete * 0.08}px ${CORES.azulLuz}99)`,
        }}
      />
      <Img
        src={staticFile("imagens/raquete-direita.png")}
        style={{
          position: "absolute",
          width: raquete * 1.1,
          left: xDir - raquete * 0.15 + (1 - entrada) * largura * 0.4,
          top: y - raquete * 0.85,
          transformOrigin: "90% 95%",
          transform: `rotate(${8 + golpe(1) * 28 + Math.cos(f / 9) * 2}deg)`,
          filter: `drop-shadow(0 0 ${raquete * 0.08}px ${CORES.laranja}99)`,
        }}
      />
      {t >= 0 &&
        rastro.map((atraso, i) => {
          const { bx, by } = posicao(t - atraso);
          const tam = bolinha * (1 - i * 0.12);
          return (
            <div
              key={i}
              style={{
                ...bolinhaEstilo(tam),
                left: bx - tam / 2,
                top: by - tam / 2,
                opacity: i === 0 ? 1 : 0.35 - i * 0.06,
                filter: i === 0 ? undefined : `blur(${i * 1.5}px)`,
              }}
            />
          );
        })}
    </div>
  );
};

/**
 * Bola de basquete metálica quicando no ritmo, girando e achatando ao tocar o chão.
 */
export const BolaQuicando: React.FC<{
  em: number;
  tamanho: number;
  x: number;
  /** linha do "chão" (base da bola), em px */
  chao: number;
  altura: number;
  opacidade?: number;
}> = ({ em, tamanho, x, chao, altura, opacidade = 1 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f - em;
  if (t < 0) return null;
  const periodo = TEMPO_BATIDA * fps;
  const p = (t / periodo) % 1;
  const salto = Math.sin(Math.PI * p); // 0 no chão, 1 no alto
  const contato = Math.exp(-((Math.min(p, 1 - p) * periodo / 2.2) ** 2));
  const achata = 1 - contato * 0.14;
  const estica = 1 + contato * 0.1 + salto * 0.03;
  const entrada = interpolate(t, [0, 8], [0, 1], clamp);
  const yBase = chao - altura * salto - tamanho;
  return (
    <>
      {/* sombra luminosa no chão */}
      <div
        style={{
          position: "absolute",
          left: x - tamanho * 0.45,
          top: chao - tamanho * 0.06,
          width: tamanho * 0.9,
          height: tamanho * 0.12,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, ${CORES.laranja}99 0%, transparent 70%)`,
          opacity: (0.35 + 0.65 * (1 - salto)) * entrada * opacidade,
          transform: `scaleX(${1.1 - salto * 0.5})`,
        }}
      />
      <Img
        src={staticFile("imagens/bola-basquete.png")}
        style={{
          position: "absolute",
          left: x - tamanho / 2,
          top: yBase,
          width: tamanho,
          height: tamanho,
          opacity: entrada * opacidade,
          transformOrigin: "50% 100%",
          transform: `scale(${estica}, ${achata}) rotate(${t * 4}deg)`,
          filter: `drop-shadow(0 0 ${tamanho * 0.08}px ${CORES.laranja}aa) drop-shadow(0 0 ${tamanho * 0.15}px ${CORES.azulLuz}55)`,
        }}
      />
    </>
  );
};
