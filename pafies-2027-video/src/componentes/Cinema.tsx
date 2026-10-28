import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { CORES } from "../config";
import { FONTE_CINEMA, FONTE_TEXTO } from "../fontes";
import { clamp, gradienteTexto, useLayout } from "./Visual";

const lento = Easing.bezier(0.33, 0, 0.15, 1);

/** Faixas pretas de cinema (2,39:1 no 16:9; faixas equivalentes no 9:16), entrando no início. */
export const Letterbox: React.FC = () => {
  const f = useCurrentFrame();
  const { vertical, width, height } = useLayout();
  const alvo = vertical ? height * 0.1 : (height - width / 2.39) / 2;
  const h = interpolate(f, [0, 24], [height / 2, alvo], { ...clamp, easing: lento });
  const barra: React.CSSProperties = { position: "absolute", left: 0, right: 0, height: h, background: "#000" };
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ ...barra, top: 0 }} />
      <div style={{ ...barra, bottom: 0 }} />
    </AbsoluteFill>
  );
};

/** Granulação de filme, diferente a cada frame. */
export const Grao: React.FC<{ intensidade?: number }> = ({ intensidade = 0.11 }) => {
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

/** Correção de cor "teal & orange": sombras azuis, altas luzes quentes, bordas escuras. */
export const Gradacao: React.FC = () => (
  <>
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${CORES.marinho}55 0%, transparent 40%, ${CORES.laranja}14 100%)`,
        mixBlendMode: "soft-light",
        pointerEvents: "none",
      }}
    />
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 40%, rgba(0,0,0,0.45) 100%)",
        pointerEvents: "none",
      }}
    />
  </>
);

/** Reflexo anamórfico: um traço horizontal longo e fino que atravessa a lente. */
export const Flare: React.FC<{ em: number; y?: string; cor?: string; duracao?: number; forca?: number }> = ({
  em,
  y = "50%",
  cor = CORES.azulLuz,
  duracao = 50,
  forca = 1,
}) => {
  const f = useCurrentFrame() - em;
  const { width, u } = useLayout();
  if (f < 0 || f > duracao) return null;
  const p = f / duracao;
  const o = Math.sin(Math.PI * p) * forca;
  const x = interpolate(p, [0, 1], [-0.15, 0.15]) * width;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: y,
          left: "50%",
          width: width * 1.6,
          height: 10 * u,
          transform: `translate(calc(-50% + ${x}px), -50%)`,
          background: `radial-gradient(ellipse 50% 50% at 50% 50%, #FFFFFF 0%, ${cor} 18%, ${cor}55 45%, transparent 70%)`,
          filter: `blur(${2 * u}px)`,
          opacity: o,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: y,
          left: "50%",
          width: 260 * u,
          height: 260 * u,
          transform: `translate(calc(-50% + ${x}px), -50%)`,
          borderRadius: "50%",
          background: `radial-gradient(circle, #FFFFFFcc 0%, ${cor}66 25%, transparent 65%)`,
          opacity: o * 0.8,
        }}
      />
    </AbsoluteFill>
  );
};

/** Poeira no ar com profundidade de campo: grãos nítidos e bokeh desfocado à frente. */
export const Poeira: React.FC<{ quantidade?: number; semente?: string }> = ({ quantidade = 45, semente = "p" }) => {
  const f = useCurrentFrame();
  const { width, height, u } = useLayout();
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      {new Array(quantidade).fill(0).map((_, i) => {
        const r = (k: string) => random(`${semente}-${i}-${k}`);
        const perto = r("d") > 0.82; // poucos bem perto da lente, grandes e borrados
        const tam = (perto ? 40 + r("t") * 70 : 2 + r("t") * 4) * u;
        const vel = (perto ? 0.5 : 0.15 + r("v") * 0.3) * u;
        const x = (r("x") * width + f * vel * (r("s") > 0.5 ? 1 : -1) + width) % width;
        const y = (r("y") * height - f * vel * 0.6 + height * 2) % height;
        const quente = r("c") > 0.65;
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
              background: quente ? CORES.dourado : "#CFE6FF",
              opacity: (perto ? 0.12 : 0.55) * (0.5 + 0.5 * Math.sin(f / 30 + i)),
              filter: perto ? `blur(${tam * 0.35}px)` : undefined,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * Cartela de trailer: entra devagar (desfoque → nítido, leve aproximação),
 * segura e sai em fade.
 */
export const Cartela: React.FC<{
  em: number;
  ate: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  entrada?: number;
  saida?: number;
}> = ({ em, ate, children, style, entrada = 18, saida = 12 }) => {
  const f = useCurrentFrame();
  const { u } = useLayout();
  if (f < em || f > ate) return null;
  const pIn = interpolate(f, [em, em + entrada], [0, 1], { ...clamp, easing: lento });
  const pOut = interpolate(f, [ate - saida, ate], [0, 1], clamp);
  const deriva = interpolate(f, [em, ate], [1.04, 1], clamp);
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        opacity: pIn * (1 - pOut),
        filter: `blur(${(1 - pIn) * 10 * u + pOut * 6 * u}px)`,
        transform: `scale(${deriva})`,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Elemento que aparece em fade dentro de uma cartela. */
export const Surge: React.FC<{ em: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  em,
  children,
  style,
}) => {
  const f = useCurrentFrame();
  const { u } = useLayout();
  const p = interpolate(f, [em, em + 16], [0, 1], { ...clamp, easing: lento });
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * 14 * u}px)`, filter: `blur(${(1 - p) * 6 * u}px)`, ...style }}>
      {children}
    </div>
  );
};

/** Texto pequeno, caixa alta, com espaçamento largo (créditos de cinema). */
export const Rotulo: React.FC<{ children: React.ReactNode; tamanho?: number; cor?: string; style?: React.CSSProperties }> = ({
  children,
  tamanho = 30,
  cor = "#FFFFFF",
  style,
}) => {
  const { u } = useLayout();
  return (
    <div
      style={{
        fontFamily: FONTE_TEXTO,
        fontWeight: 500,
        fontSize: tamanho * u,
        letterSpacing: tamanho * 0.42 * u,
        marginRight: -tamanho * 0.42 * u, // compensa o espaço depois da última letra
        color: cor,
        textAlign: "center",
        textTransform: "uppercase",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Título serifado metálico (Cinzel) com brilho suave. */
export const TituloCinema: React.FC<{
  children: React.ReactNode;
  tamanho: number;
  quente?: boolean;
  style?: React.CSSProperties;
}> = ({ children, tamanho, quente = false, style }) => {
  const { u } = useLayout();
  const metal = quente
    ? gradienteTexto("#FFF4E0", CORES.dourado, 180)
    : gradienteTexto("#FFFFFF", "#9CC8FF", 180);
  return (
    <div
      style={{
        fontFamily: FONTE_CINEMA,
        fontWeight: 600,
        fontSize: tamanho * u,
        lineHeight: 1.05,
        letterSpacing: tamanho * 0.04 * u,
        textAlign: "center",
        filter: `drop-shadow(0 ${tamanho * 0.03 * u}px ${tamanho * 0.08 * u}px rgba(5,12,45,0.55))`,
        ...style,
      }}
    >
      <span style={metal}>{children}</span>
    </div>
  );
};

/** Linha fina que cresce do centro. */
export const Linha: React.FC<{ em: number; largura: number; cor?: string; style?: React.CSSProperties }> = ({
  em,
  largura,
  cor = CORES.laranja,
  style,
}) => {
  const f = useCurrentFrame();
  const { u } = useLayout();
  const p = interpolate(f, [em, em + 24], [0, 1], { ...clamp, easing: lento });
  return (
    <div
      style={{
        width: largura * u * p,
        height: 2 * u,
        background: `linear-gradient(90deg, transparent, ${cor}, transparent)`,
        boxShadow: `0 0 ${8 * u}px ${cor}`,
        ...style,
      }}
    />
  );
};

/** Escurece tudo no fim (fade to black). */
export const FadePreto: React.FC<{ de: number; ate: number; entrada?: boolean }> = ({ de, ate, entrada = false }) => {
  const f = useCurrentFrame();
  const o = entrada ? interpolate(f, [de, ate], [1, 0], clamp) : interpolate(f, [de, ate], [0, 1], clamp);
  if (o <= 0) return null;
  return <AbsoluteFill style={{ background: "#000", opacity: o, pointerEvents: "none" }} />;
};
