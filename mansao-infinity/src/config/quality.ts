/** Perfis de qualidade gráfica. "auto" escolhe pelo aparelho e se ajusta pelo FPS. */
export type QualityLevel = 'low' | 'medium' | 'high' | 'ultra';

export interface QualityProfile {
  label: string;
  dpr: [number, number];
  shadows: boolean;
  shadowMapSize: number;
  postprocessing: boolean;
  ao: boolean;
  bloom: boolean;
  antialias: boolean;
  /** Número de luzes pontuais reais distribuídas entre os cômodos acesos mais próximos. */
  lightPool: number;
  /** Distância (m) até onde o mobiliário de cômodos sem vidro grande é desenhado. */
  furnitureDistance: number;
  /** Multiplicador da densidade de vegetação. */
  vegetation: number;
  envResolution: number;
}

export const QUALITY: Record<QualityLevel, QualityProfile> = {
  low: { label: 'Baixa', dpr: [0.75, 1], shadows: true, shadowMapSize: 1024, postprocessing: false, ao: false, bloom: false, antialias: true, lightPool: 3, furnitureDistance: 26, vegetation: 0.45, envResolution: 64 },
  medium: { label: 'Média', dpr: [1, 1.25], shadows: true, shadowMapSize: 2048, postprocessing: true, ao: true, bloom: true, antialias: false, lightPool: 5, furnitureDistance: 38, vegetation: 0.7, envResolution: 128 },
  high: { label: 'Alta', dpr: [1, 1.75], shadows: true, shadowMapSize: 2048, postprocessing: true, ao: true, bloom: true, antialias: false, lightPool: 8, furnitureDistance: 60, vegetation: 1, envResolution: 256 },
  ultra: { label: 'Ultra', dpr: [1, 2], shadows: true, shadowMapSize: 4096, postprocessing: true, ao: true, bloom: true, antialias: false, lightPool: 12, furnitureDistance: 120, vegetation: 1.25, envResolution: 512 },
};

export const QUALITY_ORDER: QualityLevel[] = ['low', 'medium', 'high', 'ultra'];

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0;
}

/** Heurística inicial: celular → baixa; tablet/notebook modesto → média; desktop → alta. */
export function detectQuality(): QualityLevel {
  if (typeof window === 'undefined') return 'medium';
  const nav = navigator as Navigator & { deviceMemory?: number };
  const mem = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 4;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  const touch = isTouchDevice();
  if (small && touch) return 'low';
  if (touch || mem <= 4 || cores <= 4) return 'medium';
  return 'high';
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
