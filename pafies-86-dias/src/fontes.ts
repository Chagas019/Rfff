import { continueRender, delayRender, staticFile } from "remotion";

/** Condensada extra-negrito, inclinada no estilo "Super Condensed Extra Bold Oblique". */
export const FONTE = "'Saira Extra Condensed', 'Arial Narrow', sans-serif";
export const OBLIQUO = "skewX(-10deg)";

let carregado = false;

/** Carrega as fontes locais (public/fontes) antes do primeiro frame. */
export const carregarFontes = () => {
  if (carregado || typeof document === "undefined") return;
  carregado = true;
  const handle = delayRender("Carregando fontes");
  const fontes = [600, 900].map(
    (peso) =>
      new FontFace("Saira Extra Condensed", `url(${staticFile(`fontes/SairaExtraCondensed-${peso}.woff2`)})`, {
        weight: String(peso),
      }),
  );
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
