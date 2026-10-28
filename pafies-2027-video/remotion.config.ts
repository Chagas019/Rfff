import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setConcurrency(4);

// Opcional: usar um Chrome/Chromium já instalado em vez de baixar o do Remotion.
// Ex.: REMOTION_BROWSER=/caminho/chrome-headless-shell npm run render
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
