import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

/** Medidas comuns aos dois formatos: u = 1px num quadro de 1080 de lado menor. */
export const useLayout = () => {
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  return { vertical, u: Math.min(width, height) / 1080, width, height };
};

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const suave = Easing.bezier(0.22, 1, 0.36, 1);

export const gradienteTexto = (de: string, ate: string, angulo = 180): React.CSSProperties => ({
  backgroundImage: `linear-gradient(${angulo}deg, ${de}, ${ate})`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
});

/** Movimento de câmera simulado: aproximação lenta com leve balanço. */
export const Camera: React.FC<{
  children: React.ReactNode;
  de?: number;
  ate?: number;
  duracao: number;
  balanco?: number;
}> = ({ children, de = 1, ate = 1.12, duracao, balanco = 1 }) => {
  const f = useCurrentFrame();
  const { u } = useLayout();
  const escala = interpolate(f, [0, duracao], [de, ate], clamp);
  const x = Math.sin(f / 50) * 8 * u * balanco;
  const y = Math.cos(f / 60) * 6 * u * balanco;
  const rot = Math.sin(f / 80) * 0.6 * balanco;
  return (
    <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px) scale(${escala}) rotate(${rot}deg)` }}>
      {children}
    </AbsoluteFill>
  );
};
