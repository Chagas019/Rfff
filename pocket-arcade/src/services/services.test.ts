import { afterEach, describe, expect, it, vi } from 'vitest';
import { InputManager } from './input';
import {
  chooseARRoute,
  detectARSupport,
  detectPlatform,
  mapSessionError,
  sceneViewerIntent,
  unavailableReason,
  type ARSupport,
} from './arSupport';
import { createHighscores } from './storage';
import { AudioEngine } from './audio';

describe('InputManager', () => {
  it('soma teclado, toque e modelo 3D', () => {
    const im = new InputManager();
    im.setButton('touch', 'blue', true);
    im.setDirection('keyboard', 'left', true);
    im.setAxis('model', 0.2, 0.9);
    const p = im.poll();
    expect(p.blue).toBe(true);
    expect(p.x).toBe(-1);
    expect(p.y).toBeCloseTo(0.9);
  });

  it('com vários dedos no mesmo botão, só solta quando o último sair', () => {
    const im = new InputManager();
    im.setButton('model', 'red', true, 'p1');
    im.setButton('model', 'red', true, 'p2');
    im.setButton('model', 'red', false, 'p1');
    expect(im.poll().red).toBe(true);
    im.setButton('model', 'red', false, 'p2');
    expect(im.poll().red).toBe(false);
  });

  it('um toque mais curto que um quadro não se perde', () => {
    const im = new InputManager();
    im.setButton('keyboard', 'yellow', true, 'KeyX');
    im.setButton('keyboard', 'yellow', false, 'KeyX');
    expect(im.poll().yellow).toBe(true);
    expect(im.poll().yellow).toBe(false);
  });

  it('mapeia o teclado e respeita o bloqueio (diálogo aberto)', () => {
    const im = new InputManager();
    let active = true;
    const detach = im.attachKeyboard(window, () => active);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyZ' }));
    expect(im.poll().blue).toBe(true);
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyZ' }));
    active = false;
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    expect(im.poll().start).toBe(false);
    detach();
  });

  it('avisa quem escuta quando o estado muda (animação dos botões 3D)', () => {
    const im = new InputManager();
    const fn = vi.fn();
    im.subscribe(fn);
    im.setButton('touch', 'start', true);
    im.poll();
    im.poll();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn.mock.calls[0][0].start).toBe(true);
  });
});

describe('Detecção de realidade aumentada', () => {
  const base: ARSupport = { webxr: false, quickLook: false, sceneViewer: false, secureContext: true, platform: 'other' };

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (navigator as unknown as { xr?: unknown }).xr;
  });

  it('identifica a plataforma', () => {
    expect(detectPlatform('Mozilla/5.0 (Linux; Android 14; Pixel 8)', 5)).toBe('android');
    expect(detectPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 5)).toBe('ios');
    expect(detectPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)).toBe('ios'); // iPad
    expect(detectPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0)).toBe('other');
  });

  it('prefere WebXR, depois Quick Look, depois Scene Viewer', () => {
    expect(chooseARRoute({ ...base, webxr: true, quickLook: true })).toBe('webxr');
    expect(chooseARRoute({ ...base, quickLook: true })).toBe('quick-look');
    expect(chooseARRoute({ ...base, sceneViewer: true })).toBe('scene-viewer');
    expect(chooseARRoute(base)).toBe('unavailable');
  });

  it('sem WebXR no navegador, não oferece RA imersiva', async () => {
    const s = await detectARSupport();
    expect(s.webxr).toBe(false);
  });

  it('usa navigator.xr.isSessionSupported quando a página é segura', async () => {
    vi.stubGlobal('isSecureContext', true);
    (navigator as unknown as { xr: unknown }).xr = { isSessionSupported: vi.fn(async (m: string) => m === 'immersive-ar') };
    const s = await detectARSupport();
    expect(s.webxr).toBe(true);
    expect(chooseARRoute(s)).toBe('webxr');
  });

  it('se isSessionSupported falhar, trata como sem suporte', async () => {
    vi.stubGlobal('isSecureContext', true);
    (navigator as unknown as { xr: unknown }).xr = { isSessionSupported: vi.fn(async () => Promise.reject(new Error('x'))) };
    expect((await detectARSupport()).webxr).toBe(false);
  });

  it('explica a limitação conforme o caso', () => {
    expect(unavailableReason({ ...base, secureContext: false })).toMatch(/HTTPS/);
    expect(unavailableReason({ ...base, platform: 'ios' })).toMatch(/Safari/);
    expect(unavailableReason(base)).toMatch(/celular/);
  });

  it('traduz permissão negada e falta de suporte', () => {
    expect(mapSessionError({ name: 'NotAllowedError' }).code).toBe('denied');
    expect(mapSessionError({ name: 'SecurityError' }).code).toBe('denied');
    expect(mapSessionError({ name: 'NotSupportedError' }).code).toBe('unsupported');
    expect(mapSessionError(new Error('?')).code).toBe('failed');
  });

  it('monta a intent do Scene Viewer com o arquivo e o retorno', () => {
    const url = sceneViewerIntent('https://x.dev/models/a.glb', 'Pocket Arcade', 'https://x.dev/');
    expect(url.startsWith('intent://arvr.google.com/scene-viewer/1.0?')).toBe(true);
    expect(url).toContain('file=https%3A%2F%2Fx.dev%2Fmodels%2Fa.glb');
    expect(url).toContain('mode=ar_preferred');
    expect(url).toContain('S.browser_fallback_url=https%3A%2F%2Fx.dev%2F');
  });
});

describe('Recordes e áudio', () => {
  it('guarda o recorde no armazenamento local', () => {
    const h = createHighscores();
    h.set('snake-classic', 420);
    expect(createHighscores().get('snake-classic')).toBe(420);
  });

  it('sem AudioContext (ou antes de um gesto), tocar som não quebra', () => {
    const a = new AudioEngine();
    expect(() => a.play('coin')).not.toThrow();
    a.setMuted(true);
    expect(new AudioEngine().muted).toBe(true);
    a.setMuted(false);
  });
});
