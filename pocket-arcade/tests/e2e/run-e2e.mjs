// Teste ponta a ponta no Chromium real (Playwright).
// Uso: npm run build && npm run test:e2e   (sobe o `vite preview` sozinho)
//      ou: node tests/e2e/run-e2e.mjs http://localhost:5173/   (contra um servidor já aberto)
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT = resolve(process.env.E2E_OUT ?? 'test-results/e2e');
mkdirSync(OUT, { recursive: true });
const executablePath = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
const IGNORED = [/KHR_parallel_shader_compile/, /GPU stall due to ReadPixels/, /Automatic fallback to software WebGL/, /swiftshader/i];

let url = process.argv[2];
let server;
if (!url) {
  server = spawn('npx', ['vite', 'preview', '--port', '4317', '--strictPort'], { stdio: 'pipe' });
  url = 'http://localhost:4317/';
  await new Promise((r) => setTimeout(r, 2500));
}

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✔' : '✘'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch({ executablePath, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

async function openPage(viewport, opts = {}) {
  const ctx = await browser.newContext({ viewport, hasTouch: !!opts.touch, isMobile: !!opts.touch, deviceScaleFactor: 1 });
  if (opts.initScript) await ctx.addInitScript(opts.initScript);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && !IGNORED.some((re) => re.test(m.text()))) errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  await page.waitForTimeout(800);
  return { page, errors, ctx };
}

/** Projeta um objeto do modelo para coordenadas de tela. */
const screenPos = (page, name) =>
  page.evaluate((n) => {
    const rt = window.__pocketArcade;
    const obj = rt.stage.model.root.getObjectByName(n);
    const v = obj.getWorldPosition(new obj.position.constructor());
    v.project(rt.stage.camera);
    const r = rt.stage.renderer.domElement.getBoundingClientRect();
    return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
  }, name);

/** Espera N quadros renderizados (em GPU de software cada quadro pode levar ~1 s). */
const frames = async (page, n = 2) => {
  const target = (await page.evaluate(() => window.__pocketArcade.stage.frameCount)) + n;
  await page.waitForFunction((t) => window.__pocketArcade.stage.frameCount >= t, target, { timeout: 120000, polling: 50 });
};
const until = (page, fn, arg) => page.waitForFunction(fn, arg, { timeout: 120000, polling: 100 }).then(() => true, () => false);

const consoleState = (page) => page.evaluate(() => window.__pocketArcade.console.snapshot());
const camDist = (page) => page.evaluate(() => window.__pocketArcade.stage.camera.position.length());
const tapKey = async (page, key) => {
  await page.keyboard.press(key);
  await frames(page, 2);
};

try {
  // ------------------------------------------------------------ desktop
  {
    const { page, errors, ctx } = await openPage({ width: 1280, height: 800 });
    check('carrega o modelo 3D (canvas WebGL)', await page.locator('canvas.stage-canvas').count() === 1);
    const meshCount = await page.evaluate(() => {
      let n = 0;
      window.__pocketArcade.stage.model.root.traverse((o) => o.isMesh && n++);
      return n;
    });
    check('modelo tem geometria real', meshCount > 80, `${meshCount} malhas`);
    await page.screenshot({ path: `${OUT}/desktop-hero.png` });

    // rotação por arraste
    const before = await page.evaluate(() => window.__pocketArcade.stage.camera.position.toArray());
    await page.mouse.move(200, 400);
    await page.mouse.down();
    await page.mouse.move(500, 380, { steps: 12 });
    await page.mouse.up();
    await frames(page, 3);
    const after = await page.evaluate(() => window.__pocketArcade.stage.camera.position.toArray());
    check('arrastar gira a câmera em volta do aparelho', Math.hypot(after[0] - before[0], after[2] - before[2]) > 5);

    // zoom
    const d0 = await camDist(page);
    await page.mouse.move(640, 380);
    await page.mouse.wheel(0, -600);
    await frames(page, 6);
    const d1 = await camDist(page);
    check('rolar aproxima (zoom)', d1 < d0 - 1, `${d0.toFixed(1)} → ${d1.toFixed(1)}`);

    // vistas
    await page.getByRole('button', { name: 'Traseira' }).click();
    await until(page, () => {
      const p = window.__pocketArcade.stage.camera.position;
      return Math.abs(Math.abs(Math.atan2(p.x, p.z)) - Math.PI) < 0.05;
    });
    await frames(page, 2);
    const az = await page.evaluate(() => {
      const p = window.__pocketArcade.stage.camera.position;
      return (Math.atan2(p.x, p.z) * 180) / Math.PI;
    });
    check('vista traseira', Math.abs(Math.abs(az) - 180) < 5, `azimute ${az.toFixed(1)}°`);
    await page.screenshot({ path: `${OUT}/desktop-back.png` });
    for (const v of ['Lateral esquerda', 'Topo']) {
      await page.getByRole('button', { name: v }).click();
      await frames(page, 12);
      await page.screenshot({ path: `${OUT}/desktop-${v.replace(/\s+/g, '-').toLowerCase()}.png` });
    }
    await page.getByRole('button', { name: 'Reiniciar visualização' }).click();
    await frames(page, 12);

    // botão 3D pressionado com o mouse
    const blue = await screenPos(page, 'button-blue');
    await page.mouse.move(blue.x, blue.y);
    await page.mouse.down();
    await frames(page, 2);
    const pressed = await page.evaluate(() => window.__pocketArcade.stage.model.isPressed('blue'));
    await page.mouse.up();
    await frames(page, 2);
    const released = await page.evaluate(() => !window.__pocketArcade.stage.model.isPressed('blue'));
    check('clicar no botão azul do modelo pressiona e solta', pressed && released);

    // cartucho removível
    const cart = await screenPos(page, 'cartridge-top-groffi');
    await page.mouse.click(cart.x, cart.y);
    await frames(page, 25);
    const out = await page.evaluate(() => !window.__pocketArcade.isCartridgeInserted('top'));
    await page.screenshot({ path: `${OUT}/desktop-cartridge-out.png` });
    await page.evaluate(() => window.__pocketArcade.toggleCartridge('top'));
    await until(page, () => window.__pocketArcade.console.snapshot().gameId === 'pixel-adventure');
    const back = await page.evaluate(() => window.__pocketArcade.isCartridgeInserted('top'));
    const launched = await consoleState(page);
    check('cartucho amarelo sai ao clicar e volta carregando o Pixel Adventure', out && back && launched.gameId === 'pixel-adventure', JSON.stringify(launched));

    // modo Jogar + quatro jogos pelo teclado
    await page.getByRole('button', { name: /^Jogar$/ }).click();
    await frames(page, 12);
    await page.locator('canvas.stage-canvas').focus();
    await page.screenshot({ path: `${OUT}/desktop-play.png` });
    for (const id of ['pixel-adventure', 'space-defender', 'snake-classic', 'brick-breaker']) {
      await page.evaluate((g) => window.__pocketArcade.console.launch(g), id);
      await frames(page, 1);
      await tapKey(page, 'x');
      let s = await consoleState(page);
      const started = s.gameId === id && s.status === 'playing';
      // joga um pouco
      for (let i = 0; i < 12; i++) {
        await page.keyboard.down(i % 2 ? 'ArrowLeft' : 'ArrowRight');
        await page.keyboard.down('z');
        await frames(page, 1);
        await page.keyboard.up('z');
        await page.keyboard.up(i % 2 ? 'ArrowLeft' : 'ArrowRight');
      }
      await page.screenshot({ path: `${OUT}/game-${id}.png` });
      s = await consoleState(page);
      let pausedOk = true;
      if (s.status === 'playing') {
        await tapKey(page, 'Enter');
        pausedOk = (await consoleState(page)).status === 'paused';
        await page.screenshot({ path: `${OUT}/game-${id}-paused.png` });
        await tapKey(page, 'z'); // azul = reiniciar
        const restarted = await page.evaluate(() => window.__pocketArcade.console.game.score === 0);
        pausedOk = pausedOk && restarted && (await consoleState(page)).status === 'playing';
      }
      await tapKey(page, 'c');
      await tapKey(page, 'c');
      s = await consoleState(page);
      check(`${id}: inicia, pausa, reinicia e volta à biblioteca`, started && pausedOk && s.mode === 'library', JSON.stringify(s));
    }

    // botão Pausar da interface
    await page.evaluate(() => window.__pocketArcade.console.launch('snake-classic'));
    await tapKey(page, 'x');
    await page.getByRole('button', { name: 'Pausar' }).click();
    await frames(page, 1);
    check('botão Pausar da interface pausa de verdade', (await consoleState(page)).status === 'paused');

    // seletor de cartucho
    await page.getByRole('button', { name: 'Selecionar cartucho' }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/desktop-cartridges.png` });
    await page.getByRole('button', { name: /Brick Breaker/ }).click();
    check('seletor de cartucho carrega o jogo', await until(page, () => window.__pocketArcade.console.snapshot().gameId === 'brick-breaker'));

    // RA sem WebXR
    await page.getByRole('button', { name: /Ver no meu espaço/ }).click();
    await page.waitForTimeout(400);
    const dlg = await page.getByRole('alertdialog').textContent();
    check('sem RA no navegador: explica a limitação e não abre câmera', /indisponível/i.test(dlg ?? '') && /Nenhuma câmera foi aberta/.test(dlg ?? ''));
    await page.screenshot({ path: `${OUT}/desktop-ar-unavailable.png` });
    await page.getByRole('button', { name: 'Continuar no 3D' }).click();

    const fps = await page.evaluate(
      () =>
        new Promise((r) => {
          let n = 0;
          const t0 = performance.now();
          const f = () => (performance.now() - t0 < 2000 ? (n++, requestAnimationFrame(f)) : r(n / 2));
          requestAnimationFrame(f);
        }),
    );
    console.log(`  (quadros por segundo no Chromium com renderização por software: ${fps})`);
    check('sem erros no console (desktop)', errors.length === 0, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }

  // ------------------------------------------------------------ RA com permissão negada (WebXR simulado)
  {
    const initScript = () => {
      Object.defineProperty(navigator, 'xr', {
        value: {
          isSessionSupported: async (mode) => mode === 'immersive-ar',
          requestSession: async () => {
            throw new DOMException('Permissão negada', 'NotAllowedError');
          },
        },
      });
    };
    const { page, errors, ctx } = await openPage({ width: 800, height: 900 }, { initScript });
    await page.getByRole('button', { name: /Ver no meu espaço/ }).click();
    await page.waitForTimeout(500);
    const txt = (await page.getByRole('alertdialog').textContent()) ?? '';
    check('WebXR disponível mas permissão negada: mensagem clara e volta ao 3D', /Câmera não liberada/.test(txt));
    const mode = await page.evaluate(() => window.__pocketArcade.mode);
    check('modo volta para o 3D após a recusa', mode !== 'ar', mode);
    await page.screenshot({ path: `${OUT}/ar-permission-denied.png` });
    check('sem erros no console (RA negada)', errors.length === 0, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }

  // ------------------------------------------------------------ celular
  {
    const { page, errors, ctx } = await openPage({ width: 390, height: 844 }, { touch: true });
    await page.screenshot({ path: `${OUT}/mobile-hero.png` });
    const noScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    check('sem rolagem horizontal no celular', noScroll);
    await page.getByRole('button', { name: /^Jogar$/ }).tap();
    await frames(page, 12);
    const yellow = page.getByRole('button', { name: /Botão amarelo/ });
    check('controles na tela aparecem no modo Jogar', await yellow.isVisible());
    await yellow.tap();
    await frames(page, 2);
    check('toque no amarelo sai da abertura para a biblioteca', (await consoleState(page)).mode === 'library');
    await yellow.tap();
    await frames(page, 2);
    await yellow.tap();
    await frames(page, 3);
    await page.screenshot({ path: `${OUT}/mobile-play.png` });
    const s = await consoleState(page);
    check('jogo inicia pelos controles de toque', s.mode === 'game' && s.status === 'playing', JSON.stringify(s));
    // toque direto no botão vermelho do modelo 3D
    const red = await screenPos(page, 'button-red');
    await page.touchscreen.tap(red.x, red.y);
    await frames(page, 2);
    check('toque no botão vermelho do modelo pausa o jogo', (await consoleState(page)).status === 'paused');
    check('sem erros no console (celular)', errors.length === 0, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }

  // ------------------------------------------------------------ tablet em paisagem
  {
    const { page, errors, ctx } = await openPage({ width: 1024, height: 700 }, { touch: true });
    await page.screenshot({ path: `${OUT}/tablet-hero.png` });
    check('sem erros no console (tablet)', errors.length === 0, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
} catch (err) {
  check('execução sem exceções', false, String(err?.stack ?? err));
} finally {
  await browser.close();
  server?.kill();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} verificações aprovadas. Capturas em ${OUT}`);
process.exit(failed.length ? 1 : 0);
