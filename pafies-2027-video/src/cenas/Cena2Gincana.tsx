import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CORES } from "../config";
import { FONTE_TEXTO } from "../fontes";
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
  TextoSurge,
  Titulo,
  useLayout,
  useOpacidadeCena,
} from "../componentes/Visual";

/** Logotipo oficial com anel de luz azul e laranja girando por trás. */
export const LogoPafies: React.FC<{ tamanho: number; em?: number }> = ({ tamanho, em = 0 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - em, fps, config: { damping: 12, stiffness: 90 } });
  const giro = (f - em) * 1.6;
  return (
    <div
      style={{
        position: "relative",
        width: tamanho,
        height: tamanho,
        transform: `scale(${p}) rotateY(${(1 - p) * 70}deg)`,
        opacity: interpolate(f - em, [0, 6], [0, 1], clamp),
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -tamanho * 0.06,
          borderRadius: "50%",
          background: `conic-gradient(from ${giro}deg, ${CORES.azulLuz}, ${CORES.laranja}, ${CORES.dourado}, ${CORES.azul}, ${CORES.azulLuz})`,
          filter: `blur(${tamanho * 0.03}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: -tamanho * 0.25,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${CORES.azulLuz}66 30%, transparent 70%)`,
        }}
      />
      <Img
        src={staticFile("imagens/logo-pafies.png")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", borderRadius: "50%" }}
      />
    </div>
  );
};

/** Elemento 3D laranja flutuando para dar profundidade. */
export const No3D: React.FC<{ tamanho: number; x: string; y: string; fase?: number; desfoque?: number }> = ({
  tamanho,
  x,
  y,
  fase = 0,
  desfoque = 0,
}) => {
  const f = useCurrentFrame();
  return (
    <Img
      src={staticFile("imagens/no-laranja.png")}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: tamanho,
        transform: `translate(-50%, -50%) rotate(${f * 0.4 + fase}deg) translateY(${Math.sin(f / 25 + fase) * 14}px)`,
        filter: `blur(${desfoque}px) drop-shadow(0 0 30px ${CORES.laranja}88)`,
      }}
    />
  );
};

/** Cena 2 — o nome PAFIES surge com faixas de luz azul e laranja. */
export const Cena2Gincana: React.FC<{ duracao: number; corte: number }> = ({ duracao, corte }) => {
  const f = useCurrentFrame();
  const { u, vertical } = useLayout();
  const opacidade = useOpacidadeCena(duracao, 4, 8);

  const parte1 = interpolate(f, [corte - 8, corte], [1, 0], clamp);
  const parte2 = interpolate(f, [corte - 4, corte + 4], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ opacity: opacidade }}>
      <Fundo intensidade={1} laranja={0.45} />
      <Fachos quantidade={3} />
      <Camera de={1.05} ate={1.15} duracao={duracao}>
        <No3D tamanho={vertical ? 300 * u : 340 * u} x={vertical ? "84%" : "88%"} y={vertical ? "16%" : "22%"} />
        <No3D
          tamanho={vertical ? 220 * u : 240 * u}
          x={vertical ? "14%" : "10%"}
          y={vertical ? "86%" : "80%"}
          fase={120}
          desfoque={3 * u}
        />
        <Particulas quantidade={80} velocidade={1.4} semente="c2" />
      </Camera>
      <FaixasDeLuz inicio={0} duracao={26} />
      <FaixasDeLuz inicio={corte - 6} duracao={22} quantidade={3} />

      {/* Parte 1: logotipo oficial */}
      <Centro style={{ opacity: parte1 }}>
        <LogoPafies tamanho={(vertical ? 620 : 560) * u} em={2} />
        <TextoSurge em={24} style={{ marginTop: 50 * u }}>
          <div
            style={{
              fontFamily: FONTE_TEXTO,
              fontWeight: 800,
              fontSize: 40 * u,
              letterSpacing: 10 * u,
              color: CORES.branco,
              textShadow: `0 0 ${20 * u}px ${CORES.azulLuz}`,
            }}
          >
            VEM AÍ…
          </div>
        </TextoSurge>
      </Centro>

      {/* Parte 2: título completo */}
      <Centro style={{ opacity: parte2, padding: `0 ${60 * u}px` }}>
        <TextoSurge em={corte} de="zoom">
          <div
            style={{
              fontFamily: FONTE_TEXTO,
              fontWeight: 900,
              fontSize: (vertical ? 64 : 60) * u,
              letterSpacing: 4 * u,
              textAlign: "center",
              ...gradienteTexto(CORES.dourado, CORES.laranja),
              filter: `drop-shadow(0 0 ${14 * u}px ${CORES.laranja}aa)`,
            }}
          >
            10ª GINCANA SOLIDÁRIA
          </div>
        </TextoSurge>
        <TextoSurge em={corte + 6}>
          <Titulo tamanho={vertical ? 250 : 230} style={{ marginTop: 6 * u }}>
            PAFIES 2027
          </Titulo>
        </TextoSurge>
        <TextoSurge em={corte + 22}>
          <div
            style={{
              marginTop: 30 * u,
              padding: `${14 * u}px ${34 * u}px`,
              borderRadius: 999,
              border: `${2 * u}px solid ${CORES.azulLuz}`,
              background: `linear-gradient(90deg, ${CORES.azul}aa, ${CORES.marinho}cc)`,
              boxShadow: `0 0 ${30 * u}px ${CORES.azulLuz}66, inset 0 0 ${20 * u}px ${CORES.laranja}33`,
              fontFamily: FONTE_TEXTO,
              fontWeight: 800,
              fontSize: (vertical ? 36 : 34) * u,
              letterSpacing: 6 * u,
              color: CORES.branco,
              whiteSpace: "nowrap",
            }}
          >
            FÉ <span style={{ color: CORES.laranja }}>•</span> UNIÃO{" "}
            <span style={{ color: CORES.laranja }}>•</span> SOLIDARIEDADE
          </div>
        </TextoSurge>
      </Centro>
      <Clarao em={2} />
      <Clarao em={corte} cor={CORES.laranja} duracao={10} />
    </AbsoluteFill>
  );
};
