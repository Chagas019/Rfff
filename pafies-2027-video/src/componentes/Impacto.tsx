import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { CORES } from "../config";
import { clamp, useLayout } from "./Visual";

/** Tremor de câmera que começa forte no impacto e morre em poucos frames. */
export const Tremor: React.FC<{ em: number; forca?: number; duracao?: number; children: React.ReactNode }> = ({
  em,
  forca = 28,
  duracao = 22,
  children,
}) => {
  const f = useCurrentFrame();
  const { u } = useLayout();
  const t = f - em;
  const a = t >= 0 && t < duracao ? (1 - t / duracao) ** 2 * forca * u : 0;
  const x = a * (random(`tx-${f}`) * 2 - 1);
  const y = a * (random(`ty-${f}`) * 2 - 1);
  const rot = (a / u) * 0.03 * (random(`tr-${f}`) * 2 - 1);
  return <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px) rotate(${rot}deg)` }}>{children}</AbsoluteFill>;
};

/** Clarão branco que estoura e some. */
export const Clarao: React.FC<{ em: number; duracao?: number; forca?: number }> = ({ em, duracao = 12, forca = 0.95 }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [em - 1, em, em + duracao], [0, forca, 0], clamp);
  if (o <= 0) return null;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle, #FFFFFF 0%, #FFF3D6 35%, ${CORES.dourado}88 70%, transparent 100%)`,
        opacity: o,
        pointerEvents: "none",
      }}
    />
  );
};

/** Onda de choque: anéis que se expandem a partir do centro. */
export const OndaDeChoque: React.FC<{ em: number; y?: string }> = ({ em, y = "50%" }) => {
  const f = useCurrentFrame();
  const { width, height, u } = useLayout();
  const diag = Math.hypot(width, height);
  const t = f - em;
  if (t < 0 || t > 40) return null;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      {[0, 6].map((atraso, i) => {
        const p = interpolate(t - atraso, [0, 30], [0, 1], { ...clamp, easing: (x) => 1 - (1 - x) ** 3 });
        const r = p * diag * (i === 0 ? 0.75 : 0.55);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: y,
              width: r * 2,
              height: r * 2,
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              border: `${(1 - p) * 40 * u + 2 * u}px solid ${i === 0 ? "#FFFFFF" : CORES.dourado}`,
              boxShadow: `0 0 ${60 * u}px ${i === 0 ? CORES.azulLuz : CORES.laranja}`,
              opacity: (1 - p) * (t - atraso >= 0 ? 1 : 0),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Explosão de faíscas douradas e brancas saindo do centro, com gravidade. */
export const Faiscas: React.FC<{ em: number; quantidade?: number; y?: number }> = ({ em, quantidade = 110, y }) => {
  const f = useCurrentFrame();
  const { width, height, u } = useLayout();
  const t = f - em;
  if (t < 0 || t > 60) return null;
  const cx = width / 2;
  const cy = y ?? height / 2;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      {new Array(quantidade).fill(0).map((_, i) => {
        const r = (k: string) => random(`faisca-${i}-${k}`);
        const ang = r("a") * Math.PI * 2;
        const vel = (14 + r("v") * 34) * u;
        const arrasto = 1 - Math.exp(-t / 14); // desacelera
        const dist = vel * 14 * arrasto;
        const x = cx + Math.cos(ang) * dist;
        const yy = cy + Math.sin(ang) * dist + 0.35 * u * t * t * 0.5; // gravidade
        const vida = interpolate(t, [0, 10 + r("l") * 40], [1, 0], clamp);
        const comp = (8 + r("c") * 26) * u * (1 - arrasto * 0.7);
        const cor = r("k") > 0.6 ? "#FFFFFF" : r("k") > 0.25 ? CORES.dourado : CORES.laranja;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: yy,
              width: comp,
              height: 5 * u,
              borderRadius: 4 * u,
              background: cor,
              boxShadow: `0 0 ${10 * u}px ${cor}`,
              transform: `translate(-50%, -50%) rotate(${ang}rad)`,
              opacity: vida,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Raios de luz girando atrás do número. */
export const RaiosDeLuz: React.FC<{ em: number; y?: string }> = ({ em, y = "50%" }) => {
  const f = useCurrentFrame();
  const { u } = useLayout();
  const t = f - em;
  if (t < 0) return null;
  const o = interpolate(t, [0, 4, 30], [0, 0.85, 0.4], clamp);
  const tam = interpolate(t, [0, 10], [400, 1900], { ...clamp, easing: (x) => 1 - (1 - x) ** 3 }) * u;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: y,
          width: tam,
          height: tam,
          transform: `translate(-50%, -50%) rotate(${t * 0.5}deg)`,
          borderRadius: "50%",
          background: `repeating-conic-gradient(from 0deg, #FFFFFF55 0deg 4deg, transparent 4deg 15deg)`,
          WebkitMaskImage: "radial-gradient(circle, #000 0%, #000 15%, transparent 70%)",
          maskImage: "radial-gradient(circle, #000 0%, #000 15%, transparent 70%)",
          opacity: o,
        }}
      />
    </AbsoluteFill>
  );
};
