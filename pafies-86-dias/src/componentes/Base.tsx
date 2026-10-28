import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const saida = Easing.bezier(0.16, 1, 0.3, 1); // desacelera forte (entradas)
export const entradaRapida = Easing.bezier(0.7, 0, 0.84, 0); // acelera (saídas)

/** 1 unidade = 1 px num quadro de 1080 de largura. */
export const useU = () => {
  const { width, height } = useVideoConfig();
  return { u: width / 1080, width, height };
};

/** Movimento de câmera: zoom, deslocamento e giro interpolados entre dois estados. */
export const Camera: React.FC<{
  children: React.ReactNode;
  de: number;
  ate: number;
  zoom?: [number, number];
  x?: [number, number];
  y?: [number, number];
  giro?: [number, number];
  easing?: (t: number) => number;
  style?: React.CSSProperties;
}> = ({ children, de, ate, zoom = [1, 1], x = [0, 0], y = [0, 0], giro = [0, 0], easing, style }) => {
  const f = useCurrentFrame();
  const { u } = useU();
  const p = interpolate(f, [de, ate], [0, 1], { ...clamp, easing });
  const v = (a: [number, number]) => a[0] + (a[1] - a[0]) * p;
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${v(x) * u}px, ${v(y) * u}px) scale(${v(zoom)}) rotate(${v(giro)}deg)`,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Tremor de câmera que começa forte e morre em poucos frames. */
export const Tremor: React.FC<{ em: number; forca?: number; duracao?: number; children: React.ReactNode }> = ({
  em,
  forca = 26,
  duracao = 20,
  children,
}) => {
  const f = useCurrentFrame();
  const { u } = useU();
  const t = f - em;
  const a = t >= 0 && t < duracao ? (1 - t / duracao) ** 2 * forca * u : 0;
  const x = a * (random(`tx-${f}`) * 2 - 1);
  const y = a * (random(`ty-${f}`) * 2 - 1);
  const r = (a / u) * 0.03 * (random(`tr-${f}`) * 2 - 1);
  return <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px) rotate(${r}deg)` }}>{children}</AbsoluteFill>;
};

/** Clarão que estoura e some. */
export const Clarao: React.FC<{ em: number; duracao?: number; forca?: number; cor?: string }> = ({
  em,
  duracao = 12,
  forca = 0.9,
  cor = "#FFF3D6",
}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [em - 1, em, em + duracao], [0, forca, 0], clamp);
  if (o <= 0) return null;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle, #FFFFFF 0%, ${cor} 40%, transparent 95%)`,
        opacity: o,
        pointerEvents: "none",
      }}
    />
  );
};

/** Granulação de filme. */
export const Grao: React.FC<{ intensidade?: number }> = ({ intensidade = 0.09 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: intensidade, pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id={`grao-${f}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 97} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grao-${f})`} />
      </svg>
    </AbsoluteFill>
  );
};

export const Vinheta: React.FC<{ forca?: number }> = ({ forca = 0.7 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 75% 60% at 50% 45%, transparent 45%, rgba(0,0,0,${forca}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

/** Fade de/para preto. */
export const Fade: React.FC<{ de: number; ate: number; entrando?: boolean }> = ({ de, ate, entrando = false }) => {
  const f = useCurrentFrame();
  const o = entrando ? interpolate(f, [de, ate], [1, 0], clamp) : interpolate(f, [de, ate], [0, 1], clamp);
  if (o <= 0) return null;
  return <AbsoluteFill style={{ background: "#000", opacity: o, pointerEvents: "none" }} />;
};
