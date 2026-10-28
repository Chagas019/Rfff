import React from "react";
import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { CORES } from "../config";
import { FONTE_TITULO } from "../fontes";

/** Medidas comuns aos dois formatos: u = 1px num quadro de 1080 de lado menor. */
export const useLayout = () => {
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  return { vertical, u: Math.min(width, height) / 1080, width, height };
};

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const suave = Easing.bezier(0.22, 1, 0.36, 1);

/** Entrada e saída de uma cena, em frames relativos à própria cena. */
export const useOpacidadeCena = (duracao: number, entrada = 8, saida = 8) => {
  const f = useCurrentFrame();
  return interpolate(f, [0, entrada, duracao - saida, duracao], [0, 1, 1, 0], clamp);
};

export const gradienteTexto = (de: string, ate: string, angulo = 180): React.CSSProperties => ({
  backgroundImage: `linear-gradient(${angulo}deg, ${de}, ${ate})`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
});

/** Fundo azul-marinho com um núcleo de luz azul e reflexos laranja nas bordas. */
export const Fundo: React.FC<{ intensidade?: number; laranja?: number }> = ({
  intensidade = 1,
  laranja = 0.35,
}) => {
  const f = useCurrentFrame();
  const deriva = Math.sin(f / 70) * 6;
  return (
    <AbsoluteFill style={{ backgroundColor: "#030B22" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 75% 60% at 50% ${48 + deriva}%, ${CORES.azul}${hex(
            0.75 * intensidade,
          )} 0%, ${CORES.marinho} 45%, #030B22 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${15 + deriva}% 105%, ${CORES.laranja}${hex(
            laranja,
          )} 0%, transparent 40%), radial-gradient(circle at ${88 - deriva}% -5%, ${CORES.dourado}${hex(
            laranja * 0.6,
          )} 0%, transparent 35%)`,
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
};

const hex = (a: number) =>
  Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, "0");

/** Fachos de luz volumétrica que descem do alto, como num palco. */
export const Fachos: React.FC<{ abertura?: number; cor?: string; quantidade?: number }> = ({
  abertura = 1,
  cor = CORES.azulLuz,
  quantidade = 3,
}) => {
  const f = useCurrentFrame();
  const { u } = useLayout();
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", overflow: "hidden" }}>
      {new Array(quantidade).fill(0).map((_, i) => {
        const centro = quantidade === 1 ? 50 : 18 + (64 / (quantidade - 1)) * i;
        const balanco = Math.sin(f / 45 + i * 2.1) * 4;
        const topo = 4 * abertura;
        const base = 22 * abertura;
        const x = centro + balanco;
        return (
          <AbsoluteFill
            key={i}
            style={{
              clipPath: `polygon(${x - topo}% -5%, ${x + topo}% -5%, ${x + base}% 105%, ${x - base}% 105%)`,
              background: `linear-gradient(180deg, ${cor}cc 0%, ${cor}44 45%, transparent 95%)`,
              filter: `blur(${28 * u}px)`,
              opacity: (0.35 + 0.15 * Math.sin(f / 23 + i)) * abertura,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Partículas luminosas azuis e laranja subindo devagar. */
export const Particulas: React.FC<{ quantidade?: number; velocidade?: number; semente?: string }> = ({
  quantidade = 70,
  velocidade = 1,
  semente = "p",
}) => {
  const f = useCurrentFrame();
  const { width, height, u } = useLayout();
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen" }}>
      {new Array(quantidade).fill(0).map((_, i) => {
        const r = (k: string) => random(`${semente}-${i}-${k}`);
        const tam = (2 + r("t") * 7) * u;
        const vel = (0.6 + r("v") * 2.2) * velocidade;
        const y = (((r("y") * height - f * vel * u * 1.4) % height) + height) % height;
        const x = r("x") * width + Math.sin(f / (30 + r("w") * 40) + i) * 18 * u;
        const laranja = r("c") > 0.72;
        const cor = laranja ? CORES.dourado : CORES.azulLuz;
        const brilho = 0.35 + 0.65 * Math.abs(Math.sin(f / (12 + r("b") * 20) + i));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: tam,
              height: tam,
              borderRadius: "50%",
              background: cor,
              opacity: brilho,
              boxShadow: `0 0 ${tam * 3}px ${tam}px ${laranja ? CORES.laranja : CORES.azul}aa`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Faixas de luz que cruzam a tela na diagonal. */
export const FaixasDeLuz: React.FC<{ inicio?: number; duracao?: number; quantidade?: number }> = ({
  inicio = 0,
  duracao = 30,
  quantidade = 4,
}) => {
  const f = useCurrentFrame() - inicio;
  const { u } = useLayout();
  if (f < 0 || f > duracao + 20) return null;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", overflow: "hidden" }}>
      {new Array(quantidade).fill(0).map((_, i) => {
        const atraso = i * 4;
        const p = interpolate(f - atraso, [0, duracao], [-0.6, 1.6], { ...clamp, easing: suave });
        const laranja = i % 2 === 1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "-50%",
              top: `${10 + i * 22}%`,
              width: "200%",
              height: (laranja ? 10 : 18) * u,
              transform: `translateX(${(p - 0.5) * 100}%) rotate(-18deg)`,
              background: `linear-gradient(90deg, transparent, ${laranja ? CORES.laranja : CORES.azulLuz}, ${
                laranja ? CORES.dourado : CORES.branco
              }, transparent)`,
              filter: `blur(${6 * u}px)`,
              opacity: 0.85,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Clarão rápido para os cortes sincronizados com os impactos. */
export const Clarao: React.FC<{ em: number; cor?: string; duracao?: number }> = ({
  em,
  cor = CORES.azulLuz,
  duracao = 14,
}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [em - 2, em, em + duracao], [0, 0.9, 0], clamp);
  if (o <= 0) return null;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 50%, ${CORES.branco} 0%, ${cor} 35%, transparent 80%)`,
        opacity: o,
        mixBlendMode: "screen",
      }}
    />
  );
};

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

/** Texto que surge com mola, desfoque e espaçamento se fechando. */
export const TextoSurge: React.FC<{
  children: React.ReactNode;
  em: number;
  style?: React.CSSProperties;
  de?: "baixo" | "cima" | "zoom";
}> = ({ children, em, style, de = "baixo" }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useLayout();
  const p = spring({ frame: f - em, fps, config: { damping: 16, stiffness: 120, mass: 0.8 } });
  const desloc = de === "zoom" ? 0 : (de === "baixo" ? 60 : -60) * u * (1 - p);
  const escala = de === "zoom" ? interpolate(p, [0, 1], [1.8, 1]) : 1;
  return (
    <div
      style={{
        opacity: interpolate(f - em, [0, 6], [0, 1], clamp),
        transform: `translateY(${desloc}px) scale(${escala})`,
        filter: `blur(${(1 - p) * 14 * u}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Título em Anton com degradê branco→azul-claro e contorno luminoso laranja. */
export const Titulo: React.FC<{
  children: React.ReactNode;
  tamanho: number;
  degradê?: [string, string];
  brilho?: string;
  style?: React.CSSProperties;
}> = ({ children, tamanho, degradê = [CORES.branco, "#BFE3FF"], brilho = CORES.azulLuz, style }) => {
  const { u } = useLayout();
  return (
    <div
      style={{
        fontFamily: FONTE_TITULO,
        fontSize: tamanho * u,
        lineHeight: 1.02,
        textAlign: "center",
        textTransform: "uppercase",
        letterSpacing: 1 * u,
        filter: `drop-shadow(0 0 ${18 * u}px ${brilho}aa) drop-shadow(0 ${6 * u}px ${10 * u}px #000a)`,
        ...style,
      }}
    >
      <span style={gradienteTexto(degradê[0], degradê[1])}>{children}</span>
    </div>
  );
};

export const Centro: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <AbsoluteFill
    style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", ...style }}
  >
    {children}
  </AbsoluteFill>
);

/** Vinheta escura nas bordas para dar profundidade cinematográfica. */
export const Vinheta: React.FC = () => (
  <AbsoluteFill
    style={{
      background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.65) 100%)",
      pointerEvents: "none",
    }}
  />
);
