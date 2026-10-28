import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CORES } from "../config";
import { FONTE_TEXTO } from "../fontes";
import {
  Camera,
  Centro,
  clamp,
  Fachos,
  Fundo,
  Particulas,
  TextoSurge,
  Titulo,
  useLayout,
  useOpacidadeCena,
} from "../componentes/Visual";

/*
 * Ilustrações vetoriais (não são fotos): caixa de mantimentos, mãos com coração
 * e voluntários de mãos dadas. Não há fotos reais do PAFIES nos arquivos, então
 * nada aqui finge documentar o evento.
 */

const Caixa: React.FC = () => (
  <svg viewBox="0 0 200 200" width="100%" height="100%">
    <defs>
      <linearGradient id="cx-f" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#E9A55B" />
        <stop offset="1" stopColor="#B86B2A" />
      </linearGradient>
      <linearGradient id="cx-l" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#9C5520" />
        <stop offset="1" stopColor="#C77A35" />
      </linearGradient>
    </defs>
    {/* mantimentos saindo da caixa */}
    <rect x="52" y="40" width="34" height="62" rx="6" fill={CORES.branco} />
    <rect x="52" y="56" width="34" height="18" fill={CORES.azul} />
    <text x="69" y="69" fontSize="11" textAnchor="middle" fill="#fff" fontFamily="Arial" fontWeight="bold">ARROZ</text>
    <rect x="92" y="52" width="30" height="50" rx="5" fill={CORES.dourado} />
    <rect x="92" y="64" width="30" height="14" fill={CORES.laranja} />
    <rect x="126" y="34" width="22" height="68" rx="9" fill="#F7E2B5" />
    <rect x="126" y="50" width="22" height="16" fill={CORES.azulLuz} />
    <circle cx="110" cy="44" r="10" fill="#E33B2E" />
    <path d="M110 34 q4 -8 10 -6" stroke="#2E8B3A" strokeWidth="3" fill="none" />
    {/* caixa */}
    <path d="M30 90 L170 90 L160 176 L40 176 Z" fill="url(#cx-f)" />
    <path d="M30 90 L10 70 L58 70 L76 90 Z" fill="url(#cx-l)" />
    <path d="M170 90 L190 70 L142 70 L124 90 Z" fill="url(#cx-l)" />
    <path d="M78 118 q22 -18 44 0 q-22 30 -22 30 q0 0 -22 -30z" fill={CORES.branco} opacity="0.9" />
    <path d="M90 117 q10 -8 20 0" stroke={CORES.laranja} strokeWidth="0" />
  </svg>
);

const MaosCoracao: React.FC = () => {
  const f = useCurrentFrame();
  const bate = 1 + Math.max(0, Math.sin(f / 5)) * 0.08;
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%">
      <defs>
        <linearGradient id="cor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={CORES.dourado} />
          <stop offset="1" stopColor={CORES.laranja} />
        </linearGradient>
        <linearGradient id="mao" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={CORES.azulLuz} />
          <stop offset="1" stopColor={CORES.azul} />
        </linearGradient>
      </defs>
      <g transform={`translate(100 78) scale(${bate}) translate(-100 -78)`}>
        <path d="M100 120 C40 80 50 30 80 32 C92 33 98 42 100 50 C102 42 108 33 120 32 C150 30 160 80 100 120 Z" fill="url(#cor)" />
        <path d="M78 46 q-12 4 -12 20" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.6" />
      </g>
      <path d="M20 150 Q50 120 80 128 L100 140 L120 128 Q150 120 180 150 L180 190 L20 190 Z" fill="url(#mao)" />
      <path d="M60 138 q20 -6 40 6 q20 -12 40 -6" stroke="#fff" strokeWidth="3" fill="none" opacity="0.5" />
    </svg>
  );
};

const Voluntarios: React.FC = () => {
  const pessoa = (x: number, cor: string, alt: number) => (
    <g key={x}>
      <circle cx={x} cy={100 - alt} r="16" fill={cor} />
      <path d={`M${x - 22} 190 L${x - 18} ${130 - alt} Q${x} ${112 - alt} ${x + 18} ${130 - alt} L${x + 22} 190 Z`} fill={cor} />
    </g>
  );
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%">
      <path d="M30 140 L70 132 L100 140 L130 132 L170 140" stroke={CORES.dourado} strokeWidth="7" strokeLinecap="round" fill="none" />
      {pessoa(30, CORES.azulLuz, 0)}
      {pessoa(70, CORES.laranja, 8)}
      {pessoa(100, CORES.branco, 14)}
      {pessoa(130, CORES.dourado, 8)}
      {pessoa(170, CORES.azul, 0)}
    </svg>
  );
};

const Cartao: React.FC<{ em: number; titulo: string; children: React.ReactNode; largura: number }> = ({
  em,
  titulo,
  children,
  largura,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useLayout();
  const p = spring({ frame: f - em, fps, config: { damping: 14, stiffness: 100 } });
  const flutua = Math.sin((f + em) / 18) * 8 * u;
  return (
    <div
      style={{
        width: largura,
        padding: 20 * u,
        borderRadius: 32 * u,
        background: `linear-gradient(160deg, ${CORES.azul}cc, ${CORES.marinho}ee)`,
        border: `${2 * u}px solid ${CORES.azulLuz}88`,
        boxShadow: `0 ${20 * u}px ${50 * u}px #0008, 0 0 ${40 * u}px ${CORES.azulLuz}44, inset 0 0 ${30 * u}px ${CORES.laranja}22`,
        transform: `translateY(${(1 - p) * 120 * u + flutua}px) rotateX(${(1 - p) * 40}deg) scale(${0.8 + p * 0.2})`,
        opacity: interpolate(f - em, [0, 8], [0, 1], clamp),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ width: largura * 0.8, height: largura * 0.8 }}>{children}</div>
      <div
        style={{
          fontFamily: FONTE_TEXTO,
          fontWeight: 900,
          fontSize: 30 * u,
          letterSpacing: 3 * u,
          color: CORES.branco,
          marginTop: 6 * u,
        }}
      >
        {titulo}
      </div>
    </div>
  );
};

/** Cena 5 — emoção e gratidão. */
export const Cena5Gratidao: React.FC<{
  duracao: number;
  momentosCartoes: [number, number, number];
  momentoObrigado: number;
  momentoJuntos: number;
}> = ({
  duracao,
  momentosCartoes,
  momentoObrigado,
  momentoJuntos,
}) => {
  const { u, vertical } = useLayout();
  const opacidade = useOpacidadeCena(duracao, 8, 6);
  const largura = (vertical ? 300 : 330) * u;

  return (
    <AbsoluteFill style={{ opacity: opacidade }}>
      <Fundo intensidade={1} laranja={0.7} />
      <Fachos quantidade={3} cor={CORES.dourado} abertura={0.8} />
      <Camera de={1.08} ate={1} duracao={duracao}>
        <Particulas quantidade={90} velocidade={0.9} semente="c5" />
      </Camera>
      <Centro style={{ padding: `0 ${40 * u}px`, gap: 34 * u }}>
        <div
          style={{
            display: "flex",
            gap: 24 * u,
            justifyContent: "center",
            flexWrap: vertical ? "wrap" : "nowrap",
            width: vertical ? 1000 * u : "auto",
          }}
        >
          <Cartao em={momentosCartoes[0]} titulo="ESPERANÇA" largura={largura}>
            <Caixa />
          </Cartao>
          <Cartao em={momentosCartoes[1]} titulo="CUIDADO" largura={largura}>
            <MaosCoracao />
          </Cartao>
          <Cartao em={momentosCartoes[2]} titulo="AMOR AO PRÓXIMO" largura={vertical ? largura * 1.2 : largura}>
            <Voluntarios />
          </Cartao>
        </div>
        <TextoSurge em={momentoObrigado} de="zoom">
          <Titulo tamanho={vertical ? 150 : 120} degradê={[CORES.dourado, CORES.laranja]} brilho={CORES.laranja}>
            Obrigado!
          </Titulo>
        </TextoSurge>
        <TextoSurge em={momentoJuntos}>
          <div
            style={{
              fontFamily: FONTE_TEXTO,
              fontWeight: 800,
              fontSize: (vertical ? 46 : 42) * u,
              textAlign: "center",
              color: CORES.branco,
              lineHeight: 1.3,
              textShadow: `0 0 ${20 * u}px ${CORES.azulLuz}`,
            }}
          >
            JUNTOS, PODEMOS TRANSFORMAR
            <br />
            MUITAS VIDAS!
          </div>
        </TextoSurge>
      </Centro>
    </AbsoluteFill>
  );
};
