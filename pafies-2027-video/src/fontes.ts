import { continueRender, delayRender, staticFile } from "remotion";

export const FONTE_TEXTO = "Montserrat, Arial, sans-serif";
export const FONTE_CINEMA = "Cinzel, 'Times New Roman', serif";

let carregado = false;

/** Carrega as fontes locais (public/fontes) antes do primeiro frame. */
export const carregarFontes = () => {
  if (carregado || typeof document === "undefined") return;
  carregado = true;
  const handle = delayRender("Carregando fontes");
  const fontes = [
    new FontFace("Cinzel", `url(${staticFile("fontes/Cinzel.woff2")})`, { weight: "400 900" }),
    new FontFace("Montserrat", `url(${staticFile("fontes/Montserrat.woff2")})`, {
      weight: "100 900",
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
