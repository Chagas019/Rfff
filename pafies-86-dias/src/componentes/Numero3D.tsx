import React from "react";
import { useCurrentFrame } from "remotion";
import { CORES } from "../config";
import { FONTE } from "../fontes";
import { useU } from "./Base";

/**
 * Número com extrusão 3D real (camadas em translateZ dentro de um espaço com
 * perspectiva), face metálica dourada com reflexo correndo e borda iluminada em azul.
 */
export const Numero3D: React.FC<{
  texto: string;
  tamanho: number;
  /** giro do objeto em graus */
  rotX?: number;
  rotY?: number;
  profundidade?: number;
  /** aberração cromática (px) logo após um impacto */
  separacao?: number;
}> = ({ texto, tamanho, rotX = 0, rotY = 0, profundidade = 120, separacao = 0 }) => {
  const f = useCurrentFrame();
  const { u } = useU();
  const camadas = 30;
  const base: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    fontFamily: FONTE,
    fontWeight: 900,
    fontSize: tamanho * u,
    lineHeight: 1,
    textAlign: "center",
    whiteSpace: "nowrap",
  };
  // reflexo especular atravessando a face
  const brilho = ((f * 1.6) % 260) - 80;
  return (
    <div style={{ perspective: 1800 * u, width: tamanho * 1.15 * u, height: tamanho * u }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) skewX(-8deg)`,
        }}
      >
        {/* laterais: do fundo (marinho) até perto da face (dourado escuro) */}
        {new Array(camadas).fill(0).map((_, i) => {
          const k = i / (camadas - 1);
          const z = -profundidade * u * (1 - k);
          // lateral dourada escurecendo para o fundo, com um fio azul de contraluz
          const cor =
            i === 0 ? "#0A1E5C" : `rgb(${Math.round(70 + k * 150)}, ${Math.round(38 + k * 100)}, ${Math.round(8 + k * 30)})`;
          return (
            <div key={i} style={{ ...base, color: cor, transform: `translateZ(${z}px)` }}>
              {texto}
            </div>
          );
        })}
        {separacao > 0.5 && (
          <>
            <div style={{ ...base, color: "#FF3B3B", mixBlendMode: "screen", opacity: 0.85, transform: `translateZ(1px) translateX(${-separacao}px)` }}>
              {texto}
            </div>
            <div style={{ ...base, color: "#3BE0FF", mixBlendMode: "screen", opacity: 0.85, transform: `translateZ(1px) translateX(${separacao}px)` }}>
              {texto}
            </div>
          </>
        )}
        {/* face metálica */}
        <div
          style={{
            ...base,
            transform: "translateZ(2px)",
            backgroundImage: `linear-gradient(105deg, transparent ${brilho}%, rgba(255,255,255,0.95) ${brilho + 6}%, transparent ${
              brilho + 14
            }%), linear-gradient(180deg, #FFFFFF 0%, #FFE7B0 30%, ${CORES.ouro} 52%, #A8671C 62%, #FFD98A 78%, #FFF4D6 100%)`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            filter: `drop-shadow(0 0 ${10 * u}px ${CORES.azulLuz}aa) drop-shadow(0 0 ${36 * u}px ${CORES.azul}88)`,
          }}
        >
          {texto}
        </div>
      </div>
    </div>
  );
};
