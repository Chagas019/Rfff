// Exporta o modelo 3D procedural para arquivos de verdade:
//   public/models/pocket-arcade.glb  (Scene Viewer / Android, e qualquer visualizador glTF)
//   public/models/pocket-arcade.usdz (AR Quick Look / iPhone e iPad)
// A exportação roda dentro do navegador (GLTFExporter e USDZExporter do Three.js),
// a partir da mesma geometria e materiais do app.
// Uso: npm run build && npm run export:models && npm run build
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const executablePath = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
let url = process.argv[2];
let server;
if (!url) {
  server = spawn('npx', ['vite', 'preview', '--port', '4318', '--strictPort'], { stdio: 'pipe' });
  url = 'http://localhost:4318/';
  await new Promise((r) => setTimeout(r, 2500));
}

const browser = await chromium.launch({ executablePath, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
  const page = await browser.newPage({ viewport: { width: 800, height: 800 } });
  page.on('pageerror', (e) => console.error('[página]', e.message));
  await page.goto(`${url}?capture=1`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 180000 });
  const toB64 = (buf) => {
    const bytes = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(s);
  };
  const files = await page.evaluate(
    async (toB64Src) => {
      const toB64 = new Function(`return ${toB64Src}`)();
      const rt = window.__pocketArcade;
      const glb = await rt.exportGLB();
      const usdz = await rt.exportUSDZ();
      return { glb: toB64(glb), usdz: toB64(usdz) };
    },
    toB64.toString(),
  );
  const dir = resolve('public/models');
  mkdirSync(dir, { recursive: true });
  for (const [ext, b64] of Object.entries(files)) {
    const buf = Buffer.from(b64, 'base64');
    writeFileSync(resolve(dir, `pocket-arcade.${ext}`), buf);
    console.log(`public/models/pocket-arcade.${ext}: ${(buf.length / 1024).toFixed(0)} KB`);
  }
} finally {
  await browser.close();
  server?.kill();
}
