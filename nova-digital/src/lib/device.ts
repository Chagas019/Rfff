export type Quality = 'high' | 'low';

/** Detecta suporte a WebGL sem deixar contexto aberto. */
export function hasWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  if (new URLSearchParams(window.location.search).has('nowebgl')) return false; // para testar o fallback
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Qualidade gráfica estimada: celulares e máquinas modestas recebem menos partículas e geometria. */
export function detectQuality(): Quality {
  if (typeof window === 'undefined') return 'low';
  const nav = navigator as Navigator & { deviceMemory?: number };
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  const fewCores = (nav.hardwareConcurrency ?? 8) <= 4;
  const lowMemory = (nav.deviceMemory ?? 8) <= 4;
  return (coarse && small) || fewCores || lowMemory ? 'low' : 'high';
}

/** Limite de pixel ratio para o renderizador. */
export function maxDpr(quality: Quality): number {
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  return Math.min(dpr, quality === 'low' ? 1.75 : 2);
}
