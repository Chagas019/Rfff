import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, suave, useLayout } from "./Visual";

/*
 * Fundo enviado pela equipe, refeito em vetor para servir aos dois formatos:
 * azul de papel envelhecido com meias-luas e círculos laranja/amarelos,
 * uma estrela de quatro pontas e uma estrela-explosão. As formas se mexem devagar.
 */

const AZUL = "#273CA2";
const LARANJA = "#DE643D";
const AMARELO = "#EBAE44";
const AMARELO_CLARO = "#F0BF60";

type Forma =
  | { tipo: "meiaLuaCima" | "meiaLuaBaixo" | "circulo"; cx: number; cy: number; r: number; cor: string }
  | { tipo: "estrela4" | "explosao"; cx: number; cy: number; r: number; cor: string };

// coordenadas no quadro de desenho de cada formato (9:16 = 562×1000; 16:9 = 1000×562)
const VERTICAL: Forma[] = [
  { tipo: "meiaLuaCima", cx: 548, cy: 333, r: 205, cor: LARANJA },
  { tipo: "estrela4", cx: 395, cy: 140, r: 88, cor: AMARELO_CLARO },
  { tipo: "meiaLuaBaixo", cx: -60, cy: 343, r: 200, cor: AMARELO },
  { tipo: "circulo", cx: 60, cy: 945, r: 220, cor: LARANJA },
  { tipo: "explosao", cx: 200, cy: 820, r: 110, cor: AMARELO_CLARO },
  { tipo: "circulo", cx: 600, cy: 820, r: 148, cor: AMARELO },
];
const HORIZONTAL: Forma[] = [
  { tipo: "meiaLuaCima", cx: 905, cy: 250, r: 200, cor: LARANJA },
  { tipo: "estrela4", cx: 745, cy: 92, r: 76, cor: AMARELO_CLARO },
  { tipo: "meiaLuaBaixo", cx: -50, cy: 215, r: 190, cor: AMARELO },
  { tipo: "circulo", cx: 110, cy: 610, r: 210, cor: LARANJA },
  { tipo: "explosao", cx: 265, cy: 470, r: 96, cor: AMARELO_CLARO },
  { tipo: "circulo", cx: 1020, cy: 505, r: 150, cor: AMARELO },
];

const estrela4 = (r: number) => {
  const c = r * 0.13;
  return `M0,${-r} Q${c},${-c} ${r * 0.88},0 Q${c},${c} 0,${r} Q${-c},${c} ${-r * 0.88},0 Q${-c},${-c} 0,${-r} Z`;
};

const explosao = (r: number, pontas = 12) =>
  new Array(pontas * 2)
    .fill(0)
    .map((_, i) => {
      const a = (Math.PI * i) / pontas - Math.PI / 2;
      const raio = i % 2 === 0 ? r : r * 0.55;
      return `${(Math.cos(a) * raio).toFixed(1)},${(Math.sin(a) * raio).toFixed(1)}`;
    })
    .join(" ");

const Desenho: React.FC<{ forma: Forma; i: number }> = ({ forma, i }) => {
  const f = useCurrentFrame();
  // cada forma entra deslizando no começo do vídeo e depois "respira" devagar
  const entrada = interpolate(f, [6 + i * 3, 36 + i * 3], [0, 1], { ...clamp, easing: suave });
  const dx = Math.sin(f / (70 + i * 9) + i) * 6;
  const dy = Math.cos(f / (80 + i * 7) + i * 2) * 6 + (1 - entrada) * (i % 2 ? 160 : -160);
  const { cx, cy, r, cor } = forma;
  const mover = `translate(${cx + dx} ${cy + dy})`;
  switch (forma.tipo) {
    case "meiaLuaCima":
      return <path transform={mover} d={`M${-r},0 A${r},${r} 0 0 1 ${r},0 Z`} fill={cor} opacity={entrada} />;
    case "meiaLuaBaixo":
      return <path transform={mover} d={`M${-r},0 A${r},${r} 0 0 0 ${r},0 Z`} fill={cor} opacity={entrada} />;
    case "circulo":
      return <circle transform={mover} r={r * (1 + Math.sin(f / 50 + i) * 0.015)} fill={cor} opacity={entrada} />;
    case "estrela4": {
      const brilha = 1 + Math.max(0, Math.sin(f / 18)) ** 6 * 0.18;
      return (
        <path
          transform={`${mover} rotate(${Math.sin(f / 60) * 8}) scale(${brilha * entrada})`}
          d={estrela4(r)}
          fill={cor}
        />
      );
    }
    case "explosao":
      return (
        <polygon
          transform={`${mover} rotate(${f * 0.25}) scale(${entrada})`}
          points={explosao(r)}
          fill={cor}
        />
      );
  }
};

export const FundoGeometrico: React.FC = () => {
  const { vertical } = useLayout();
  const formas = vertical ? VERTICAL : HORIZONTAL;
  const [w, h] = vertical ? [562, 1000] : [1000, 562];
  return (
    <AbsoluteFill style={{ backgroundColor: AZUL }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          {/* manchas escuras de papel envelhecido */}
          <filter id="manchas" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02 0.03" numOctaves="4" seed="3" result="n" />
            <feColorMatrix in="n" type="luminanceToAlpha" result="a" />
            <feComponentTransfer in="a" result="b">
              <feFuncA type="table" tableValues="0 0 0 0.12 0.35" />
            </feComponentTransfer>
            <feFlood floodColor="#0B1650" />
            <feComposite in2="b" operator="in" />
          </filter>
          {/* arranhões e respingos claros (o desgaste da impressão) */}
          <filter id="desgaste" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11" result="n" />
            <feColorMatrix in="n" type="luminanceToAlpha" result="a" />
            <feComponentTransfer in="a" result="b">
              <feFuncA type="discrete" tableValues="0 0 0 0 0 0 0 0.45" />
            </feComponentTransfer>
            <feFlood floodColor="#0B1650" />
            <feComposite in2="b" operator="in" />
          </filter>
          {/* dobra do papel */}
          <linearGradient id="dobra" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0.38" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="0.42" stopColor="#FFFFFF" stopOpacity="0.07" />
            <stop offset="0.45" stopColor="#000000" stopOpacity="0.08" />
            <stop offset="0.5" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
        </defs>
        {formas.map((forma, i) => (
          <Desenho key={i} forma={forma} i={i} />
        ))}
        <rect width={w} height={h} filter="url(#manchas)" />
        <rect width={w} height={h} filter="url(#desgaste)" />
        <rect width={w} height={h} fill="url(#dobra)" />
      </svg>
    </AbsoluteFill>
  );
};
