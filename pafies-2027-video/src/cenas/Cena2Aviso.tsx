import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CORES } from "../config";
import { FONTE_TEXTO, FONTE_TITULO } from "../fontes";
import {
  Centro,
  Clarao,
  clamp,
  Fachos,
  Fundo,
  gradienteTexto,
  Particulas,
  suave,
  TextoSurge,
  Titulo,
  useLayout,
  useOpacidadeCena,
} from "../componentes/Visual";

const formatarMilhar = (n: number) => n.toLocaleString("pt-BR");

/** Placa de alerta com triângulo pulsando. */
const Alerta: React.FC<{ tamanho: number }> = ({ tamanho }) => {
  const f = useCurrentFrame();
  const pulso = 1 + Math.sin(f / 4) * 0.05;
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" style={{ transform: `scale(${pulso})` }}>
      <defs>
        <linearGradient id="alerta" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={CORES.dourado} />
          <stop offset="1" stopColor={CORES.laranja} />
        </linearGradient>
      </defs>
      <path d="M50 6 L96 90 H4 Z" fill="url(#alerta)" stroke={CORES.branco} strokeWidth="3" strokeLinejoin="round" />
      <rect x="45" y="34" width="10" height="32" rx="4" fill={CORES.marinho} />
      <circle cx="50" cy="77" r="6" fill={CORES.marinho} />
    </svg>
  );
};

/** Cena 2 — aviso oficial: são mais de 50 mil QUILOS (não toneladas). */
export const Cena2Aviso: React.FC<{
  duracao: number;
  momentoCorrecao: number;
  momentoNumero: number;
  momentoToneladas: number;
}> = ({ duracao, momentoCorrecao, momentoNumero, momentoToneladas }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, vertical } = useLayout();
  const opacidade = useOpacidadeCena(duracao, 3, 10);

  const contagem = interpolate(f, [momentoNumero, momentoNumero + 50], [0, 50000], {
    ...clamp,
    easing: suave,
  });
  const fixo = spring({ frame: f - (momentoNumero + 50), fps, config: { damping: 9, stiffness: 180 } });
  const risco = interpolate(f, [momentoToneladas + 10, momentoToneladas + 22], [0, 1], clamp);

  // o cabeçalho sobe e encolhe quando o número entra, mas continua visível
  const sobe = interpolate(f, [momentoNumero - 10, momentoNumero + 10], [0, 1], { ...clamp, easing: suave });

  return (
    <AbsoluteFill style={{ opacity: opacidade, backgroundColor: CORES.marinho }}>
      <Fundo intensidade={0.7} laranja={0.55} />
      <Fachos quantidade={2} abertura={0.8} cor={CORES.azulLuz} />
      <Particulas quantidade={50} velocidade={0.7} semente="c4" />

      <Centro style={{ padding: `0 ${60 * u}px`, justifyContent: "flex-start", paddingTop: vertical ? 230 * u : 70 * u }}>
        <div
          style={{
            transform: `translateY(${-sobe * (vertical ? 40 : 10) * u}px) scale(${1 - sobe * (vertical ? 0.08 : 0.28)})`,
            transformOrigin: "top center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <TextoSurge em={4} de="zoom">
            <Alerta tamanho={(vertical ? 200 : 150) * u} />
          </TextoSurge>
          <TextoSurge em={8}>
            <Titulo tamanho={vertical ? 132 : 120} degradê={[CORES.dourado, CORES.laranja]} brilho={CORES.laranja}>
              Atenção!
            </Titulo>
          </TextoSurge>
          <TextoSurge em={16}>
            <div
              style={{
                fontFamily: FONTE_TEXTO,
                fontWeight: 900,
                fontSize: 50 * u,
                letterSpacing: 8 * u,
                color: CORES.branco,
                textAlign: "center",
              }}
            >
              AVISO IMPORTANTE
            </div>
          </TextoSurge>
          <TextoSurge em={momentoCorrecao}>
            <div
              style={{
                marginTop: 34 * u,
                padding: `${16 * u}px ${30 * u}px`,
                borderLeft: `${8 * u}px solid ${CORES.laranja}`,
                background: `linear-gradient(90deg, ${CORES.azul}cc, ${CORES.marinho}00)`,
                fontFamily: FONTE_TEXTO,
                fontWeight: 800,
                fontSize: (vertical ? 44 : 40) * u,
                lineHeight: 1.25,
                color: CORES.branco,
                textAlign: "left",
                maxWidth: vertical ? 900 * u : 1300 * u,
              }}
            >
              CORREÇÃO SOBRE A ARRECADAÇÃO DE ALIMENTOS
            </div>
          </TextoSurge>
        </div>
      </Centro>

      {f >= momentoNumero - 2 && (
        <Centro style={{ justifyContent: "flex-end", paddingBottom: vertical ? 300 * u : 90 * u }}>
          <TextoSurge em={momentoNumero} de="zoom">
            <div
              style={{
                fontFamily: FONTE_TITULO,
                fontSize: (vertical ? 250 : 230) * u,
                lineHeight: 1,
                transform: `scale(${1 + (1 - fixo) * 0.1})`,
                ...gradienteTexto(CORES.branco, CORES.azulLuz),
                filter: `drop-shadow(0 0 ${22 * u}px ${CORES.azulLuz}) drop-shadow(0 0 ${8 * u}px ${CORES.laranja}88)`,
                whiteSpace: "nowrap",
                textAlign: "center",
              }}
            >
              +{formatarMilhar(Math.round(contagem / 10) * 10)}
              <span style={{ fontSize: "0.5em", marginLeft: 16 * u, ...gradienteTexto(CORES.dourado, CORES.laranja) }}>
                KG
              </span>
            </div>
          </TextoSurge>
          <TextoSurge em={momentoNumero + 8}>
            <div
              style={{
                fontFamily: FONTE_TEXTO,
                fontWeight: 900,
                fontSize: 50 * u,
                letterSpacing: 8 * u,
                color: CORES.dourado,
                textAlign: "center",
              }}
            >
              DE ALIMENTOS
            </div>
          </TextoSurge>
          <TextoSurge em={momentoNumero + 50}>
            <div
              style={{
                marginTop: 28 * u,
                padding: `${16 * u}px ${36 * u}px`,
                borderRadius: 16 * u,
                background: `linear-gradient(90deg, ${CORES.azul}, ${CORES.azulLuz})`,
                boxShadow: `0 0 ${40 * u}px ${CORES.azulLuz}88`,
                fontFamily: FONTE_TITULO,
                fontSize: (vertical ? 60 : 58) * u,
                color: CORES.branco,
                textAlign: "center",
              }}
            >
              MAIS DE 50 MIL QUILOS ARRECADADOS!
            </div>
          </TextoSurge>
          <TextoSurge em={momentoToneladas}>
            <div
              style={{
                position: "relative",
                marginTop: 26 * u,
                fontFamily: FONTE_TEXTO,
                fontWeight: 800,
                fontSize: 46 * u,
                letterSpacing: 3 * u,
                color: "#D6E4FF",
                textAlign: "center",
              }}
            >
              <span style={{ color: CORES.laranja, marginRight: 14 * u }}>✕</span>
              <span style={{ position: "relative" }}>
                NÃO SÃO 50 MIL TONELADAS
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "52%",
                    height: 5 * u,
                    width: `${risco * 100}%`,
                    background: CORES.laranja,
                    boxShadow: `0 0 ${10 * u}px ${CORES.laranja}`,
                  }}
                />
              </span>
            </div>
          </TextoSurge>
        </Centro>
      )}
      <Clarao em={1} cor={CORES.laranja} duracao={12} />
      <Clarao em={momentoNumero} duracao={10} />
    </AbsoluteFill>
  );
};
