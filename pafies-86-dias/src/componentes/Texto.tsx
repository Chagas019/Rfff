import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CORES } from "../config";
import { FONTE, OBLIQUO } from "../fontes";
import { clamp, entradaRapida, saida, useU } from "./Base";

const estiloBase = (tamanho: number, u: number, peso = 900): React.CSSProperties => ({
  fontFamily: FONTE,
  fontWeight: peso,
  fontSize: tamanho * u,
  lineHeight: 0.92,
  textTransform: "uppercase",
  textAlign: "center",
  whiteSpace: "pre-line",
});

/** Letras entrando uma a uma, subindo do desfoque. */
export const TextoLetras: React.FC<{
  texto: string;
  em: number;
  tamanho: number;
  cor?: string;
  espacamento?: number;
  peso?: number;
  passo?: number;
}> = ({ texto, em, tamanho, cor = CORES.branco, espacamento = 0.12, peso = 900, passo = 1.6 }) => {
  const f = useCurrentFrame();
  const { u } = useU();
  return (
    <div style={{ ...estiloBase(tamanho, u, peso), color: cor, letterSpacing: tamanho * espacamento * u, transform: OBLIQUO }}>
      {texto.split("").map((c, i) => {
        const p = interpolate(f, [em + i * passo, em + i * passo + 12], [0, 1], { ...clamp, easing: saida });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: p,
              transform: `translateY(${(1 - p) * 40 * u}px)`,
              filter: `blur(${(1 - p) * 10 * u}px)`,
              whiteSpace: "pre",
            }}
          >
            {c}
          </span>
        );
      })}
    </div>
  );
};

/**
 * Palavra que "bate" na tela: entra grande, desfocada e com rastro, trava com
 * mola, e sai disparando para cima.
 */
export const PalavraImpacto: React.FC<{
  texto: string;
  em: number;
  ate: number;
  tamanho: number;
  cor?: string;
  sombra?: string;
}> = ({ texto, em, ate, tamanho, cor = CORES.branco, sombra = CORES.azul }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useU();
  if (f < em - 1 || f > ate) return null;
  const p = spring({ frame: f - em, fps, config: { damping: 13, stiffness: 240, mass: 0.6 } });
  const fora = interpolate(f, [ate - 7, ate], [0, 1], { ...clamp, easing: entradaRapida });
  const escala = 1.9 - 0.9 * p;
  const borrao = (1 - Math.min(1, p)) * 18 * u + fora * 14 * u;
  return (
    <div
      style={{
        ...estiloBase(tamanho, u),
        color: cor,
        transform: `${OBLIQUO} translateY(${-fora * 260 * u}px) scale(${escala * (1 + fora * 0.3)})`,
        opacity: interpolate(f - em, [0, 3], [0, 1], clamp) * (1 - fora),
        filter: `blur(${borrao}px) drop-shadow(0 ${8 * u}px 0 ${sombra}) drop-shadow(0 0 ${30 * u}px ${CORES.azulLuz}88)`,
      }}
    >
      {texto}
    </div>
  );
};

/** Rótulo pequeno, espaçado, em caixa alta. */
export const Rotulo: React.FC<{ children: React.ReactNode; tamanho?: number; cor?: string; style?: React.CSSProperties }> = ({
  children,
  tamanho = 42,
  cor = CORES.branco,
  style,
}) => {
  const { u } = useU();
  return (
    <div
      style={{
        ...estiloBase(tamanho, u, 600),
        color: cor,
        letterSpacing: tamanho * 0.22 * u,
        marginRight: -tamanho * 0.22 * u,
        transform: OBLIQUO,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Entra subindo do desfoque. */
export const Surge: React.FC<{ em: number; children: React.ReactNode; style?: React.CSSProperties; ate?: number }> = ({
  em,
  ate,
  children,
  style,
}) => {
  const f = useCurrentFrame();
  const { u } = useU();
  const p = interpolate(f, [em, em + 14], [0, 1], { ...clamp, easing: saida });
  const s = ate === undefined ? 0 : interpolate(f, [ate - 8, ate], [0, 1], clamp);
  return (
    <div
      style={{
        opacity: p * (1 - s),
        transform: `translateY(${(1 - p) * 30 * u}px)`,
        filter: `blur(${(1 - p) * 8 * u + s * 8 * u}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
