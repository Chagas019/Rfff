import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CORES } from "../config";
import { clamp } from "./Visual";

/** Logotipo oficial com anel de luz azul e laranja girando por trás. */
export const LogoPafies: React.FC<{ tamanho: number; em?: number }> = ({ tamanho, em = 0 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - em, fps, config: { damping: 12, stiffness: 90 } });
  const giro = (f - em) * 1.6;
  return (
    <div
      style={{
        position: "relative",
        width: tamanho,
        height: tamanho,
        transform: `scale(${p}) rotateY(${(1 - p) * 70}deg)`,
        opacity: interpolate(f - em, [0, 6], [0, 1], clamp),
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -tamanho * 0.06,
          borderRadius: "50%",
          background: `conic-gradient(from ${giro}deg, ${CORES.azulLuz}, ${CORES.laranja}, ${CORES.dourado}, ${CORES.azul}, ${CORES.azulLuz})`,
          filter: `blur(${tamanho * 0.03}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: -tamanho * 0.25,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${CORES.azulLuz}66 30%, transparent 70%)`,
        }}
      />
      <Img
        src={staticFile("imagens/logo-pafies.png")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", borderRadius: "50%" }}
      />
    </div>
  );
};
