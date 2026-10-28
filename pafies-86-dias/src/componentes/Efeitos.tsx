import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { CORES } from "../config";
import { clamp, saida, useU } from "./Base";

/** Fundo: azul royal no centro, marinho nas bordas, com brilho que respira. */
export const Fundo: React.FC<{ intensidade?: number; quente?: number }> = ({ intensidade = 1, quente = 0.3 }) => {
  const f = useCurrentFrame();
  const r = 0.9 + Math.sin(f / 40) * 0.1;
  return (
    <AbsoluteFill style={{ background: "#02071A" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 55% at 50% 45%, ${CORES.royal} 0%, ${CORES.marinho} 55%, #02071A 100%)`,
          opacity: intensidade * r,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 35% at 50% 105%, ${CORES.laranja}aa 0%, transparent 70%)`,
          opacity: quente,
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
};

/** Poeira dourada flutuando; "velocidade" alta vira chuva de luz. */
export const PoeiraDourada: React.FC<{ quantidade?: number; velocidade?: number; semente?: string; aparece?: number }> = ({
  quantidade = 80,
  velocidade = 1,
  semente = "p",
  aparece = 0,
}) => {
  const f = useCurrentFrame();
  const { width, height, u } = useU();
  const o = interpolate(f, [aparece, aparece + 30], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", opacity: o, pointerEvents: "none" }}>
      {new Array(quantidade).fill(0).map((_, i) => {
        const r = (k: string) => random(`${semente}-${i}-${k}`);
        const perto = r("d") > 0.85;
        const tam = (perto ? 18 + r("t") * 30 : 2 + r("t") * 5) * u;
        const vel = (0.6 + r("v") * 1.6) * velocidade * u;
        const y = (((r("y") * height - f * vel * 1.5) % height) + height) % height;
        const x = r("x") * width + Math.sin(f / (25 + r("w") * 30) + i) * 20 * u;
        const cor = r("c") > 0.3 ? CORES.ouro : CORES.azulLuz;
        const brilho = 0.4 + 0.6 * Math.abs(Math.sin(f / (10 + r("b") * 20) + i));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: tam,
              height: tam * (velocidade > 3 ? 1 + velocidade * 0.8 : 1),
              borderRadius: 999,
              background: cor,
              opacity: (perto ? 0.25 : 1) * brilho,
              filter: perto ? `blur(${tam * 0.3}px)` : undefined,
              boxShadow: perto ? undefined : `0 0 ${tam * 3}px ${tam}px ${cor}88`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Feixes de luz azul atravessando o cenário na diagonal. */
export const Feixes: React.FC<{ quantidade?: number; cor?: string; forca?: number }> = ({
  quantidade = 3,
  cor = CORES.azulLuz,
  forca = 1,
}) => {
  const f = useCurrentFrame();
  const { u } = useU();
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", overflow: "hidden", pointerEvents: "none" }}>
      {new Array(quantidade).fill(0).map((_, i) => {
        const ang = -30 + i * 25 + Math.sin(f / 50 + i * 1.7) * 8;
        const x = 20 + i * 30 + Math.sin(f / 70 + i) * 10;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: "-30%",
              width: (90 + i * 40) * u,
              height: "160%",
              transformOrigin: "50% 0%",
              transform: `rotate(${ang}deg)`,
              background: `linear-gradient(180deg, ${cor}cc 0%, ${cor}33 55%, transparent 90%)`,
              filter: `blur(${30 * u}px)`,
              opacity: (0.45 + 0.2 * Math.sin(f / 20 + i)) * forca,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Linhas de energia azul e laranja cruzando a tela em alta velocidade. */
export const LinhasDeEnergia: React.FC<{ em: number; quantidade?: number; duracao?: number; semente?: string }> = ({
  em,
  quantidade = 7,
  duracao = 18,
  semente = "e",
}) => {
  const f = useCurrentFrame();
  const { width, height, u } = useU();
  const t = f - em;
  if (t < 0 || t > duracao + 20) return null;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", overflow: "hidden", pointerEvents: "none" }}>
      {new Array(quantidade).fill(0).map((_, i) => {
        const r = (k: string) => random(`${semente}-${i}-${k}`);
        const atraso = r("a") * 10;
        const p = interpolate(t - atraso, [0, duracao], [-0.3, 1.3], clamp);
        const laranja = i % 2 === 1;
        const y = r("y") * height;
        const comp = (500 + r("c") * 700) * u;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p * (width + comp) - comp,
              top: y,
              width: comp,
              height: (laranja ? 6 : 10) * u,
              borderRadius: 999,
              transform: `rotate(${-24 + r("r") * 10}deg)`,
              background: `linear-gradient(90deg, transparent, ${laranja ? CORES.laranja : CORES.azulLuz}, #FFFFFF)`,
              boxShadow: `0 0 ${18 * u}px ${laranja ? CORES.laranja : CORES.azulLuz}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Linhas de velocidade saindo do centro (efeito "warp"). */
export const Warp: React.FC<{ de: number; ate: number; quantidade?: number; forca?: number }> = ({
  de,
  ate,
  quantidade = 90,
  forca = 1,
}) => {
  const f = useCurrentFrame();
  const { width, height, u } = useU();
  if (f < de || f > ate) return null;
  const o = interpolate(f, [de, de + 10, ate - 10, ate], [0, 1, 1, 0], clamp) * forca;
  const cx = width / 2;
  const cy = height * 0.45;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", opacity: o, pointerEvents: "none" }}>
      {new Array(quantidade).fill(0).map((_, i) => {
        const r = (k: string) => random(`warp-${i}-${k}`);
        const ang = r("a") * Math.PI * 2;
        const ciclo = ((f * (0.025 + r("v") * 0.03) + r("o")) % 1) ** 2;
        const dist = ciclo * Math.hypot(width, height) * 0.7;
        const comp = (40 + ciclo * 420) * u;
        const cor = r("c") > 0.4 ? CORES.ouro : CORES.azulLuz;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx + Math.cos(ang) * dist,
              top: cy + Math.sin(ang) * dist,
              width: comp,
              height: (2 + ciclo * 4) * u,
              borderRadius: 999,
              background: `linear-gradient(90deg, transparent, ${cor})`,
              transform: `translate(-100%, -50%) rotate(${ang}rad)`,
              transformOrigin: "100% 50%",
              opacity: ciclo,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Explosão de faíscas douradas e brancas, com arrasto e gravidade. */
export const Explosao: React.FC<{ em: number; x?: number; y?: number; quantidade?: number }> = ({
  em,
  x,
  y,
  quantidade = 120,
}) => {
  const f = useCurrentFrame();
  const { width, height, u } = useU();
  const t = f - em;
  if (t < 0 || t > 60) return null;
  const cx = x ?? width / 2;
  const cy = y ?? height / 2;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      {new Array(quantidade).fill(0).map((_, i) => {
        const r = (k: string) => random(`exp-${em}-${i}-${k}`);
        const ang = r("a") * Math.PI * 2;
        const vel = (16 + r("v") * 40) * u;
        const arrasto = 1 - Math.exp(-t / 13);
        const dist = vel * 14 * arrasto;
        const px = cx + Math.cos(ang) * dist;
        const py = cy + Math.sin(ang) * dist + 0.2 * u * t * t;
        const vida = interpolate(t, [0, 12 + r("l") * 45], [1, 0], clamp);
        const comp = (10 + r("c") * 32) * u * (1 - arrasto * 0.7);
        const cor = r("k") > 0.6 ? "#FFFFFF" : r("k") > 0.25 ? CORES.ouro : CORES.laranja;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px,
              top: py,
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

/** Onda de choque em anéis. */
export const OndaDeChoque: React.FC<{ em: number; y?: string }> = ({ em, y = "45%" }) => {
  const f = useCurrentFrame();
  const { width, height, u } = useU();
  const t = f - em;
  if (t < 0 || t > 40) return null;
  const diag = Math.hypot(width, height);
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      {[0, 6].map((atraso, i) => {
        const p = interpolate(t - atraso, [0, 30], [0, 1], { ...clamp, easing: saida });
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
              border: `${(1 - p) * 40 * u + 2 * u}px solid ${i === 0 ? "#FFFFFF" : CORES.ouro}`,
              boxShadow: `0 0 ${60 * u}px ${i === 0 ? CORES.azulLuz : CORES.laranja}`,
              opacity: t - atraso >= 0 ? 1 - p : 0,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Raios de luz girando atrás de um elemento. */
export const Raios: React.FC<{ em: number; y?: string; cor?: string; maximo?: number }> = ({
  em,
  y = "45%",
  cor = "#FFFFFF",
  maximo = 0.8,
}) => {
  const f = useCurrentFrame();
  const { u } = useU();
  const t = f - em;
  if (t < 0) return null;
  const o = interpolate(t, [0, 4, 40], [0, maximo, maximo * 0.45], clamp);
  const tam = interpolate(t, [0, 12], [300, 2200], { ...clamp, easing: saida }) * u;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: y,
          width: tam,
          height: tam,
          transform: `translate(-50%, -50%) rotate(${t * 0.45}deg)`,
          borderRadius: "50%",
          background: `repeating-conic-gradient(from 0deg, ${cor}55 0deg 4deg, transparent 4deg 15deg)`,
          WebkitMaskImage: "radial-gradient(circle, #000 0%, #000 15%, transparent 70%)",
          maskImage: "radial-gradient(circle, #000 0%, #000 15%, transparent 70%)",
          opacity: o,
        }}
      />
    </AbsoluteFill>
  );
};

/** Reflexo anamórfico horizontal. */
export const Flare: React.FC<{ em: number; y?: string; cor?: string; duracao?: number; forca?: number }> = ({
  em,
  y = "45%",
  cor = CORES.azulLuz,
  duracao = 40,
  forca = 1,
}) => {
  const f = useCurrentFrame() - em;
  const { width, u } = useU();
  if (f < 0 || f > duracao) return null;
  const p = f / duracao;
  const o = Math.sin(Math.PI * p) * forca;
  const x = interpolate(p, [0, 1], [-0.12, 0.12]) * width;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: y,
          left: "50%",
          width: width * 1.8,
          height: 12 * u,
          transform: `translate(calc(-50% + ${x}px), -50%)`,
          background: `radial-gradient(ellipse 50% 50% at 50% 50%, #FFFFFF 0%, ${cor} 20%, ${cor}55 45%, transparent 70%)`,
          opacity: o,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: y,
          left: "50%",
          width: 300 * u,
          height: 300 * u,
          transform: `translate(calc(-50% + ${x}px), -50%)`,
          borderRadius: "50%",
          background: `radial-gradient(circle, #FFFFFFcc 0%, ${cor}66 25%, transparent 65%)`,
          opacity: o * 0.8,
        }}
      />
    </AbsoluteFill>
  );
};
