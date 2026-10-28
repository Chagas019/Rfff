import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { CORES } from "../config";
import { clamp } from "./Visual";

/**
 * Bola de basquete metálica em câmera lenta: gira devagar, flutua e sai de
 * foco (rack focus) quando o texto entra na frente.
 */
export const BolaHeroi: React.FC<{
  tamanho: number;
  x: number;
  y: number;
  /** frames em que o foco passa da bola para o texto */
  focoDe: number;
  focoAte: number;
}> = ({ tamanho, x, y, focoDe, focoAte }) => {
  const f = useCurrentFrame();
  const desfoque = interpolate(f, [focoDe, focoAte], [0, tamanho * 0.018], clamp);
  const brilho = interpolate(f, [focoDe, focoAte], [1, 0.45], clamp);
  const flutua = Math.sin(f / 40) * tamanho * 0.02;
  const escala = interpolate(f, [0, 300], [0.92, 1.05], clamp);
  return (
    <Img
      src={staticFile("imagens/bola-basquete.png")}
      style={{
        position: "absolute",
        left: x - tamanho / 2,
        top: y - tamanho / 2 + flutua,
        width: tamanho,
        height: tamanho,
        transform: `scale(${escala}) rotate(${f * 0.35}deg)`,
        opacity: brilho,
        filter: `blur(${desfoque}px) drop-shadow(0 0 ${tamanho * 0.06}px ${CORES.laranja}aa) drop-shadow(0 0 ${
          tamanho * 0.18
        }px ${CORES.azul}88)`,
      }}
    />
  );
};

/**
 * Pingue-pongue em câmera lenta, como um "bullet time": as duas raquetes
 * suspensas e a bolinha parada no meio do lance, com rastro de movimento.
 */
export const RaquetesCameraLenta: React.FC<{ x: number; y: number; largura: number; em: number }> = ({
  x,
  y,
  largura,
  em,
}) => {
  const f = useCurrentFrame();
  const t = f - em;
  if (t < 0) return null;
  const entrada = interpolate(t, [0, 30], [0, 1], clamp);
  const raquete = largura * 0.3;
  const respira = Math.sin(t / 35);
  const bolinha = largura * 0.05;
  const bx = x + interpolate(t, [0, 150], [-largura * 0.06, largura * 0.06]);
  const by = y - largura * 0.08 + respira * largura * 0.01;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: entrada }}>
      <Img
        src={staticFile("imagens/raquete-esquerda.png")}
        style={{
          position: "absolute",
          width: raquete,
          left: x - largura / 2 - raquete * 0.2 - (1 - entrada) * largura * 0.1,
          top: y - raquete * 0.9,
          transformOrigin: "10% 95%",
          transform: `rotate(${-14 + respira * 3}deg)`,
          filter: `drop-shadow(0 0 ${raquete * 0.1}px ${CORES.azulLuz}aa) saturate(0.85)`,
        }}
      />
      <Img
        src={staticFile("imagens/raquete-direita.png")}
        style={{
          position: "absolute",
          width: raquete * 1.1,
          left: x + largura / 2 - raquete * 0.9 + (1 - entrada) * largura * 0.1,
          top: y - raquete * 0.9,
          transformOrigin: "90% 95%",
          transform: `rotate(${14 - respira * 3}deg)`,
          filter: `drop-shadow(0 0 ${raquete * 0.1}px ${CORES.laranja}aa) saturate(0.85)`,
        }}
      />
      {/* rastro da bolinha */}
      <div
        style={{
          position: "absolute",
          left: bx - largura * 0.22,
          top: by - bolinha * 0.35,
          width: largura * 0.22,
          height: bolinha * 0.7,
          borderRadius: 999,
          background: `linear-gradient(90deg, transparent, ${CORES.azulLuz}55, #FFFFFFaa)`,
          filter: `blur(${bolinha * 0.25}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: bx - bolinha / 2,
          top: by - bolinha / 2,
          width: bolinha,
          height: bolinha,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 30%, #FFFFFF 0%, #E6ECF5 22%, #9AA6B8 55%, #3B4352 85%, #1C2230 100%)",
          boxShadow: `0 0 ${bolinha * 0.6}px ${CORES.azulLuz}aa`,
        }}
      />
    </div>
  );
};
