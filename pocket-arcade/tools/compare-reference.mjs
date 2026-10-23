// Renderiza a vista "Como na foto" e monta uma imagem lado a lado com a fotografia de referência.
// Uso: npm run dev (em outro terminal) e depois `node tools/compare-reference.mjs [url] [saida.png] [vista]`
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const url = process.argv[2] ?? 'http://localhost:5173/';
const out = resolve(process.argv[3] ?? 'comparison.png');
const view = process.argv[4] ?? 'hero';
const executablePath = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';

const browser = await chromium.launch({ executablePath, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 770, height: 999 } });
page.on('console', (m) => m.type() === 'error' && console.error('[console]', m.text()));
await page.goto(`${url}${url.includes('?') ? '&' : '?'}view=${view}&capture=1`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
await page.waitForTimeout(1500);
const render = await page.screenshot({ type: 'png' });
const ref = readFileSync(resolve('public/reference/pocket-arcade-reference.jpg'));
const cmp = await browser.newPage({ viewport: { width: 1540, height: 999 } });
await cmp.setContent(`<body style="margin:0;display:flex;background:#fff">
  <img src="data:image/jpeg;base64,${ref.toString('base64')}" width="770" height="999">
  <img src="data:image/png;base64,${render.toString('base64')}" width="770" height="999"></body>`);
writeFileSync(out, await cmp.screenshot({ type: 'png' }));
writeFileSync(out.replace(/\.png$/, '-render.png'), render);
await browser.close();
console.log('comparação salva em', out);
