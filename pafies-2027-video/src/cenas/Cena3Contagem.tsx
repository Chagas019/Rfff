import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CORES } from "../config";
import { FONTE_TEXTO, FONTE_TITULO } from "../fontes";
import { BolaQuicando } from "../componentes/Esportes";
import {
  Camera,
  Centro,
  Clarao,
  clamp,
  Fachos,
  FaixasDeLuz,
  Fundo,
  gradienteTexto,
  Particulas,
  suave,
  TextoSurge,
  Titulo,
  useLayout,
  useOpacidadeCena,
} from "../componentes/Visual";

/** Número gigante com profundidade: camadas deslocadas formam a extrusão 3D. */
const Numero3D: React.FC<{ valor: string; tamanho: number }> = ({ valor, tamanho }) => {
  const camadas = 14;
  return (
    <div style={{ position: "relative", fontFamily: FONTE_TITULO, fontSize: tamanho, lineHeight: 1 }}>
      {new Array(camadas).fill(0).map((_, i) => {
        const k = camadas - i;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              transform: `translate(${k * tamanho * 0.004}px, ${k * tamanho * 0.006}px)`,
              color: i < camadas / 2 ? "#0A2A6E" : CORES.azul,
              opacity: 0.9,
            }}
          >
            {valor}
          </div>
        );
      })}
      <div
        style={{
          position: "relative",
          ...gradienteTexto(CORES.branco, CORES.azulLuz, 175),
          filter: `drop-shadow(0 0 ${tamanho * 0.05}px ${CORES.azulLuz})`,
        }}
      >
        {valor}
      </div>
      {/* reflexo laranja correndo pelo número */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          ...gradienteTexto(`${CORES.laranja}00`, `${CORES.dourado}`, 200),
          mixBlendMode: "screen",
          opacity: 0.55,
        }}
      >
        {valor}
      </div>
    </div>
  );
};

/** Cena 3 — contagem regressiva até o início das provas. */
export const Cena3Contagem: React.FC<{
  duracao: number;
  dias: number;
  momentoData: number;
  momentoProvas: number;
  momentoBola: number;
}> = ({ duracao, dias, momentoData, momentoProvas, momentoBola }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, vertical, width, height } = useLayout();
  const opacidade = useOpacidadeCena(duracao, 3, 10);

  // os dias "rolam" de um valor maior até o número real
  const rolagem = interpolate(f, [8, 40], [0, 1], { ...clamp, easing: suave });
  const inicioRolagem = dias + 60;
  const valor = Math.round(inicioRolagem - (inicioRolagem - dias) * rolagem);
  const pulso = spring({ frame: f - 40, fps, config: { damping: 8, stiffness: 160 } });
  const escalaNumero = 1 + (1 - pulso) * 0.12;

  const fase1 = interpolate(f, [momentoData - 8, momentoData], [1, 0], clamp);
  const fase2 = interpolate(f, [momentoData - 4, momentoData + 4], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ opacity: opacidade }}>
      <Fundo intensidade={1.1} laranja={0.5} />
      <Fachos quantidade={vertical ? 3 : 5} abertura={1} />
      <Camera de={1} ate={1.1} duracao={duracao} balanco={1.5}>
        <Particulas quantidade={110} velocidade={2.2} semente="c3" />
        <Img
          src={staticFile("imagens/raio-laranja.png")}
          style={{
            position: "absolute",
            right: vertical ? "-6%" : "6%",
            top: vertical ? "4%" : "12%",
            height: (vertical ? 520 : 600) * u,
            transform: `rotate(${12 + Math.sin(f / 20) * 3}deg)`,
            opacity: 0.85 * fase1,
            filter: `drop-shadow(0 0 ${30 * u}px ${CORES.laranja})`,
          }}
        />
        <BolaQuicando
          em={momentoBola}
          tamanho={(vertical ? 250 : 230) * u}
          x={vertical ? width * 0.2 : width * 0.13}
          chao={vertical ? height * 0.93 : height * 0.9}
          altura={(vertical ? 260 : 330) * u}
        />
      </Camera>
      <FaixasDeLuz inicio={0} duracao={20} />
      <FaixasDeLuz inicio={momentoData - 6} duracao={20} quantidade={3} />

      {/* Fase 1: dias restantes */}
      <Centro style={{ opacity: fase1 }}>
        <TextoSurge em={2} de="cima">
          <Titulo tamanho={vertical ? 92 : 84} degradê={[CORES.dourado, CORES.laranja]} brilho={CORES.laranja}>
            A contagem regressiva
            <br />
            começou!
          </Titulo>
        </TextoSurge>
        <TextoSurge em={8}>
          <div
            style={{
              marginTop: 24 * u,
              fontFamily: FONTE_TEXTO,
              fontWeight: 900,
              fontSize: 56 * u,
              letterSpacing: 16 * u,
              color: CORES.dourado,
              textShadow: `0 0 ${18 * u}px ${CORES.laranja}`,
            }}
          >
            FALTAM
          </div>
        </TextoSurge>
        <div style={{ transform: `scale(${escalaNumero})`, marginTop: 4 * u }}>
          <TextoSurge em={12} de="zoom">
            <Numero3D valor={String(valor)} tamanho={(vertical ? 420 : 380) * u} />
          </TextoSurge>
        </div>
        <TextoSurge em={30}>
          <div
            style={{
              fontFamily: FONTE_TEXTO,
              fontWeight: 900,
              fontSize: (vertical ? 50 : 46) * u,
              letterSpacing: 8 * u,
              color: CORES.branco,
              textShadow: `0 0 ${20 * u}px ${CORES.azulLuz}`,
              marginTop: 10 * u,
            }}
          >
            {dias === 1 ? "DIA" : "DIAS"} PARA A GINCANA
          </div>
        </TextoSurge>
      </Centro>

      {/* Fase 2: data confirmada */}
      <Centro style={{ opacity: fase2, padding: `0 ${50 * u}px` }}>
        <TextoSurge em={momentoData} de="zoom">
          <div style={{ textAlign: "center", fontFamily: FONTE_TITULO, lineHeight: 0.95 }}>
            <div
              style={{
                fontSize: (vertical ? 400 : 340) * u,
                color: "transparent",
                WebkitTextStroke: `${5 * u}px ${CORES.branco}`,
                filter: `drop-shadow(0 0 ${16 * u}px ${CORES.azulLuz}) drop-shadow(0 0 ${40 * u}px ${CORES.azul})`,
              }}
            >
              22
            </div>
            <div
              style={{
                fontSize: (vertical ? 120 : 110) * u,
                ...gradienteTexto(CORES.dourado, CORES.laranja),
                filter: `drop-shadow(0 0 ${14 * u}px ${CORES.laranja}aa)`,
              }}
            >
              DE JANEIRO
            </div>
            <div
              style={{
                fontSize: (vertical ? 110 : 100) * u,
                color: "transparent",
                WebkitTextStroke: `${3 * u}px ${CORES.azulLuz}`,
                letterSpacing: 8 * u,
              }}
            >
              DE 2027
            </div>
          </div>
        </TextoSurge>
        <TextoSurge em={momentoProvas}>
          <div
            style={{
              marginTop: 36 * u,
              padding: `${18 * u}px ${44 * u}px`,
              borderRadius: 18 * u,
              background: `linear-gradient(90deg, ${CORES.laranja}, ${CORES.dourado})`,
              boxShadow: `0 0 ${50 * u}px ${CORES.laranja}aa`,
              fontFamily: FONTE_TITULO,
              fontSize: (vertical ? 92 : 80) * u,
              color: CORES.marinho,
              letterSpacing: 2 * u,
              whiteSpace: "nowrap",
            }}
          >
            COMEÇAM AS PROVAS!
          </div>
        </TextoSurge>
        <TextoSurge em={momentoProvas + 24}>
          <div
            style={{
              marginTop: 26 * u,
              fontFamily: FONTE_TEXTO,
              fontWeight: 800,
              fontSize: 40 * u,
              letterSpacing: 6 * u,
              color: CORES.branco,
              textShadow: `0 0 ${16 * u}px ${CORES.azulLuz}`,
            }}
          >
            FALTAM <span style={{ color: CORES.dourado }}>{dias}</span> {dias === 1 ? "DIA" : "DIAS"} PARA A GINCANA
          </div>
        </TextoSurge>
      </Centro>
      <Clarao em={momentoData} />
      <Clarao em={momentoProvas} cor={CORES.laranja} duracao={10} />
    </AbsoluteFill>
  );
};
