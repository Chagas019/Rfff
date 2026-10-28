import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CORES, LOGO } from "../config";
import { clamp, saida, useU } from "./Base";

/**
 * Bola de basquete metálica entrando em movimento de câmera: vem do canto,
 * girando, com contraluz azul de um lado e laranja do outro.
 */
export const BolaCinematica: React.FC<{ em: number; tamanho: number; cx: number; cy: number }> = ({ em, tamanho, cx, cy }) => {
  const f = useCurrentFrame();
  const { u } = useU();
  const t = f - em;
  if (t < 0) return null;
  const p = interpolate(t, [0, 45], [0, 1], { ...clamp, easing: saida });
  const x = cx + (1 - p) * 520 * u;
  const y = cy + (1 - p) * 760 * u + Math.sin(t / 22) * 10 * u;
  const escala = 0.45 + p * 0.55 + t * 0.0015;
  return (
    <div style={{ position: "absolute", left: x - tamanho / 2, top: y - tamanho / 2, width: tamanho, height: tamanho, transform: `scale(${escala})` }}>
      {/* contraluzes */}
      <div
        style={{
          position: "absolute",
          inset: -tamanho * 0.08,
          borderRadius: "50%",
          background: `radial-gradient(circle at 15% 30%, ${CORES.azulLuz}cc 0%, transparent 45%), radial-gradient(circle at 85% 75%, ${CORES.laranja}cc 0%, transparent 45%)`,
          filter: `blur(${tamanho * 0.06}px)`,
        }}
      />
      <Img
        src={staticFile("imagens/bola-basquete.png")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          transform: `rotate(${t * 2.2 - 60}deg)`,
          filter: `drop-shadow(${-tamanho * 0.02}px 0 ${tamanho * 0.03}px ${CORES.azulLuz}) drop-shadow(${tamanho * 0.02}px 0 ${tamanho * 0.03}px ${CORES.laranja})`,
        }}
      />
    </div>
  );
};

/**
 * Revelação do logo oficial: surge do escuro com anel de luz girando, brilho
 * atravessando e mola de entrada. O arquivo do logo não é alterado.
 */
export const LogoRevelacao: React.FC<{ em: number; tamanho: number }> = ({ em, tamanho }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f - em;
  if (t < -2) return null;
  const p = spring({ frame: t, fps, config: { damping: 14, stiffness: 120 } });
  const brilho = interpolate(t, [8, 34], [-40, 140], clamp);
  return (
    <div
      style={{
        position: "relative",
        width: tamanho,
        height: tamanho,
        transform: `scale(${0.4 + 0.6 * p}) rotateY(${(1 - p) * 60}deg)`,
        opacity: interpolate(t, [0, 5], [0, 1], clamp),
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -tamanho * 0.07,
          borderRadius: "50%",
          background: `conic-gradient(from ${t * 3}deg, ${CORES.azulLuz}, ${CORES.ouro}, ${CORES.laranja}, ${CORES.azul}, ${CORES.azulLuz})`,
          filter: `blur(${tamanho * 0.02}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: -tamanho * 0.35,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${CORES.ouro}66 20%, transparent 65%)`,
        }}
      />
      <Img src={staticFile(LOGO)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", borderRadius: "50%" }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `linear-gradient(115deg, transparent ${brilho - 12}%, rgba(255,255,255,0.75) ${brilho}%, transparent ${brilho + 12}%)`,
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
};
