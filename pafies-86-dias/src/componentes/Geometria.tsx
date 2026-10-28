import React from "react";
import { AbsoluteFill, Img, interpolate, OffthreadVideo, random, staticFile, useCurrentFrame } from "remotion";
import { CORES, Midia } from "../config";
import { clamp, saida, useU } from "./Base";

/*
 * Formas da identidade geométrica do PAFIES: meias-luas e círculos laranja e
 * amarelos, estrela de quatro pontas e estrela-explosão.
 */
export type TipoForma = "meiaLua" | "circulo" | "estrela4" | "explosao" | "anel";

const AMARELO = "#EBAE44";
const LARANJA = "#DE643D";

export const Forma: React.FC<{ tipo: TipoForma; tam: number; cor: string; giro?: number }> = ({ tipo, tam, cor, giro = 0 }) => {
  const r = tam / 2;
  let conteudo: React.ReactNode;
  if (tipo === "meiaLua") conteudo = <path d={`M${-r},0 A${r},${r} 0 0 1 ${r},0 Z`} fill={cor} />;
  else if (tipo === "circulo") conteudo = <circle r={r} fill={cor} />;
  else if (tipo === "anel") conteudo = <circle r={r * 0.9} fill="none" stroke={cor} strokeWidth={r * 0.12} />;
  else if (tipo === "estrela4") {
    const c = r * 0.13;
    conteudo = (
      <path
        d={`M0,${-r} Q${c},${-c} ${r * 0.88},0 Q${c},${c} 0,${r} Q${-c},${c} ${-r * 0.88},0 Q${-c},${-c} 0,${-r} Z`}
        fill={cor}
      />
    );
  } else {
    const pts = new Array(24)
      .fill(0)
      .map((_, i) => {
        const a = (Math.PI * i) / 12 - Math.PI / 2;
        const rr = i % 2 === 0 ? r : r * 0.55;
        return `${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`;
      })
      .join(" ");
    conteudo = <polygon points={pts} fill={cor} />;
  }
  return (
    <svg width={tam} height={tam} viewBox={`${-r} ${-r} ${tam} ${tam}`} style={{ overflow: "visible" }}>
      <g transform={`rotate(${giro})`}>{conteudo}</g>
    </svg>
  );
};

const TIPOS: TipoForma[] = ["meiaLua", "circulo", "estrela4", "explosao", "anel", "meiaLua", "circulo"];
const CORES_FORMA = [LARANJA, AMARELO, CORES.azulLuz, AMARELO, LARANJA, CORES.royal, AMARELO];

/** Formas flutuando em camadas de profundidade (as de trás desfocadas e escuras). */
export const FormasFlutuantes: React.FC<{ quantidade?: number; semente?: string; forca?: number }> = ({
  quantidade = 9,
  semente = "f",
  forca = 1,
}) => {
  const f = useCurrentFrame();
  const { width, height, u } = useU();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {new Array(quantidade).fill(0).map((_, i) => {
        const r = (k: string) => random(`${semente}-${i}-${k}`);
        const prof = 0.3 + r("z") * 0.7; // 1 = perto
        const tam = (120 + prof * 320) * u;
        const x = (r("x") * 1.2 - 0.1) * width + Math.sin(f / (60 + i * 7)) * 30 * u * prof;
        const y = (r("y") * 1.1 - 0.05) * height + Math.cos(f / (70 + i * 5)) * 40 * u * prof - f * 0.6 * u * prof;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
              opacity: (0.25 + prof * 0.55) * forca,
              filter: `blur(${(1 - prof) * 14 * u}px)`,
            }}
          >
            <Forma tipo={TIPOS[i % TIPOS.length]} tam={tam} cor={CORES_FORMA[i % CORES_FORMA.length]} giro={f * (r("g") - 0.5) * 0.8 + r("g0") * 360} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * Túnel: a câmera atravessa formas geométricas que vêm do fundo em direção à lente.
 */
export const TunelGeometrico: React.FC<{ de: number; ate: number; quantidade?: number }> = ({ de, ate, quantidade = 16 }) => {
  const f = useCurrentFrame();
  const { width, height, u } = useU();
  if (f < de || f > ate) return null;
  const t = f - de;
  const fade = interpolate(f, [de, de + 12, ate - 10, ate], [0, 1, 1, 0], clamp);
  const itens = new Array(quantidade).fill(0).map((_, i) => {
    const r = (k: string) => random(`tunel-${i}-${k}`);
    const ciclo = 70;
    const z = 1 - (((t + (i * ciclo) / quantidade) % ciclo) / ciclo); // 1 longe → 0 na lente
    return { i, r, z };
  });
  return (
    <AbsoluteFill style={{ opacity: fade, pointerEvents: "none" }}>
      {itens
        .sort((a, b) => b.z - a.z)
        .map(({ i, r, z }) => {
          const escala = 0.08 / Math.max(0.04, z);
          const ang = r("a") * Math.PI * 2;
          const raio = (260 + r("d") * 260) * u;
          const x = width / 2 + Math.cos(ang) * raio * escala;
          const y = height * 0.45 + Math.sin(ang) * raio * escala;
          const o = interpolate(z, [0, 0.08, 0.85, 1], [0, 1, 1, 0], clamp);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                transform: `translate(-50%, -50%) scale(${escala})`,
                opacity: o * 0.85,
                filter: `blur(${Math.max(0, escala - 2) * 3 * u}px)`,
              }}
            >
              <Forma tipo={TIPOS[i % TIPOS.length]} tam={220 * u} cor={CORES_FORMA[(i + 2) % CORES_FORMA.length]} giro={f * 2 + i * 40} />
            </div>
          );
        })}
    </AbsoluteFill>
  );
};

/**
 * Painel inclinado para fotos e vídeos reais. Sem arquivo, mostra uma
 * composição gráfica animada (sem textos de "coloque aqui").
 */
export const PainelMidia: React.FC<{
  midia?: Midia;
  em: number;
  ate: number;
  x: number;
  y: number;
  largura: number;
  altura: number;
  lado: 1 | -1;
  indice: number;
}> = ({ midia, em, ate, x, y, largura, altura, lado, indice }) => {
  const f = useCurrentFrame();
  const { u } = useU();
  if (f < em || f > ate) return null;
  const p = interpolate(f, [em, em + 14], [0, 1], { ...clamp, easing: saida });
  const sai = interpolate(f, [ate - 8, ate], [0, 1], clamp);
  const dx = (1 - p) * lado * 900 * u - sai * lado * 900 * u;
  const kenBurns = interpolate(f, [em, ate], [1.15, 1.0]);
  return (
    <div
      style={{
        position: "absolute",
        left: x - largura / 2 + dx,
        top: y - altura / 2,
        width: largura,
        height: altura,
        clipPath: "polygon(8% 0, 100% 0, 92% 100%, 0 100%)",
        overflow: "hidden",
        boxShadow: `0 0 ${40 * u}px ${CORES.azulLuz}66`,
      }}
    >
      {midia ? (
        midia.video ? (
          <OffthreadVideo src={staticFile(midia.arquivo)} muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${kenBurns})` }} />
        ) : (
          <Img src={staticFile(midia.arquivo)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${kenBurns})` }} />
        )
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: `linear-gradient(${120 + indice * 40}deg, ${[CORES.royal, LARANJA, CORES.azul][indice % 3]} 0%, ${CORES.marinho} 100%)`,
            position: "relative",
          }}
        >
          {[0, 1, 2].map((k) => (
            <div
              key={k}
              style={{
                position: "absolute",
                left: `${20 + k * 30}%`,
                top: `${50 + Math.sin(f / 12 + k) * 18}%`,
                transform: "translate(-50%, -50%)",
                opacity: 0.55,
              }}
            >
              <Forma tipo={TIPOS[(indice + k) % TIPOS.length]} tam={(140 + k * 40) * u} cor={k === 1 ? AMARELO : "#FFFFFF33"} giro={f * (k + 1)} />
            </div>
          ))}
        </div>
      )}
      {/* brilho correndo pelo painel */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(110deg, transparent ${(f - em) * 4 - 40}%, rgba(255,255,255,0.35) ${(f - em) * 4 - 30}%, transparent ${(f - em) * 4 - 20}%)`,
        }}
      />
    </div>
  );
};
