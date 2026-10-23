/**
 * Detecção honesta de realidade aumentada. Nada de câmera falsa: só oferecemos o que
 * o navegador realmente suporta.
 *
 *  - WebXR "immersive-ar" (Chrome no Android com ARCore, alguns headsets): experiência
 *    completa, com detecção de superfície, âncora, jogos funcionando e gestos.
 *  - AR Quick Look (Safari no iPhone/iPad): abre o modelo USDZ no visualizador da Apple.
 *  - Scene Viewer (Android sem WebXR): abre o modelo GLB no visualizador do Google.
 *  - Demais navegadores: explicamos a limitação e mantemos o 3D interativo.
 */

export type Platform = 'ios' | 'android' | 'other';

export interface ARSupport {
  webxr: boolean;
  quickLook: boolean;
  sceneViewer: boolean;
  secureContext: boolean;
  platform: Platform;
}

export const AR_ASSETS = {
  glb: 'models/pocket-arcade.glb',
  usdz: 'models/pocket-arcade.usdz',
};

export function detectPlatform(ua = navigator.userAgent, maxTouchPoints = navigator.maxTouchPoints ?? 0): Platform {
  if (/android/i.test(ua)) return 'android';
  // iPadOS 13+ se identifica como Mac, mas tem tela de toque
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && maxTouchPoints > 1)) return 'ios';
  return 'other';
}

export async function detectARSupport(): Promise<ARSupport> {
  const platform = detectPlatform();
  const secureContext = typeof window !== 'undefined' && window.isSecureContext === true;
  let webxr = false;
  try {
    const xr = (navigator as Navigator & { xr?: XRSystem }).xr;
    if (xr && secureContext) webxr = await xr.isSessionSupported('immersive-ar');
  } catch {
    webxr = false;
  }
  let quickLook = false;
  try {
    quickLook = document.createElement('a').relList.supports('ar');
  } catch {
    quickLook = false;
  }
  return { webxr, quickLook, sceneViewer: platform === 'android' && !webxr, secureContext, platform };
}

export type ARRoute = 'webxr' | 'quick-look' | 'scene-viewer' | 'unavailable';

/** Qual caminho de RA usar, em ordem de preferência. */
export function chooseARRoute(s: ARSupport): ARRoute {
  if (s.webxr) return 'webxr';
  if (s.quickLook) return 'quick-look';
  if (s.sceneViewer) return 'scene-viewer';
  return 'unavailable';
}

/** Explicação em português para quando não há RA neste navegador. */
export function unavailableReason(s: ARSupport): string {
  if (!s.secureContext) return 'A realidade aumentada só funciona em páginas seguras (HTTPS). Abra o endereço publicado com https://.';
  if (s.platform === 'ios') return 'Este navegador do iPhone/iPad não abre o AR Quick Look. Abra a página no Safari.';
  if (s.platform === 'android') return 'Este navegador não oferece realidade aumentada. Use o Chrome atualizado com o Google Play Services for AR (ARCore).';
  return 'Este navegador não oferece realidade aumentada. Abra esta página no celular: Chrome no Android (ARCore) ou Safari no iPhone/iPad.';
}

export function absoluteAssetUrl(path: string, base = document.baseURI) {
  return new URL(path, base).toString();
}

/** Abre o USDZ no AR Quick Look (precisa ser chamado dentro do gesto de toque). */
export function openQuickLook(usdzUrl: string) {
  const a = document.createElement('a');
  a.rel = 'ar';
  a.href = usdzUrl;
  a.appendChild(document.createElement('img')); // o Safari exige uma imagem dentro do link
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** URL de intent do Scene Viewer (Android). */
export function sceneViewerIntent(glbUrl: string, title: string, fallbackUrl: string) {
  const params = new URLSearchParams({ file: glbUrl, mode: 'ar_preferred', title, resizable: 'true' });
  return (
    `intent://arvr.google.com/scene-viewer/1.0?${params.toString()}` +
    `#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;` +
    `S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end;`
  );
}

/** Confere se o arquivo exportado existe antes de mandar a pessoa para o visualizador. */
export async function assetExists(url: string) {
  try {
    const r = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    const type = r.headers.get('content-type') ?? '';
    return r.ok && !type.includes('text/html');
  } catch {
    return false;
  }
}

export type ARErrorCode = 'denied' | 'unsupported' | 'failed';

export class ARError extends Error {
  constructor(public code: ARErrorCode, message: string) {
    super(message);
  }
}

/** Traduz a falha do requestSession para algo que a pessoa entenda. */
export function mapSessionError(err: unknown): ARError {
  const name = (err as { name?: string })?.name ?? '';
  if (name === 'NotAllowedError' || name === 'SecurityError')
    return new ARError('denied', 'A câmera não foi liberada. Para ver o aparelho no seu espaço, permita o acesso à câmera nas configurações do navegador e tente de novo.');
  if (name === 'NotSupportedError')
    return new ARError('unsupported', 'Este aparelho não suporta os recursos de RA necessários (detecção de superfícies).');
  return new ARError('failed', 'Não foi possível iniciar a realidade aumentada. Tente de novo.');
}
