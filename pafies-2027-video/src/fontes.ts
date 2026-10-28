import { continueRender, delayRender, staticFile } from "remotion";

/*
 * Referência enviada: Base Neue Super Condensed Extra Bold Oblique (fonte paga).
 * Usamos a alternativa livre mais próxima, Saira Extra Condensed, inclinada com skew.
 * Para trocar pela Base Neue, basta apontar os FontFace abaixo para o arquivo dela.
 */
export const FONTE = "'Saira Extra Condensed', 'Arial Narrow', sans-serif";
/** Inclinação "oblique" aplicada aos textos. */
export const OBLIQUO = "skewX(-10deg)";

let carregado = false;

/** Carrega as fontes locais (public/fontes) antes do primeiro frame. */
export const carregarFontes = () => {
  if (carregado || typeof document === "undefined") return;
  carregado = true;
  const handle = delayRender("Carregando fontes");
  const fontes = [
    new FontFace("Saira Extra Condensed", `url(${staticFile("fontes/SairaExtraCondensed-600.woff2")})`, {
      weight: "600",
    }),
    new FontFace("Saira Extra Condensed", `url(${staticFile("fontes/SairaExtraCondensed-900.woff2")})`, {
      weight: "900",
    }),
  ];
  Promise.all(fontes.map((f) => f.load()))
    .then((carregadas) => {
      carregadas.forEach((f) => (document.fonts as unknown as Set<FontFace>).add(f));
      continueRender(handle);
    })
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
};
