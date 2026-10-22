/**
 * Presets de iluminação. A posição do sol segue a implantação: a fachada dos
 * fundos (piscina) está voltada para o norte (−z), de onde vem o sol no Brasil.
 * O poente acontece a oeste (−x).
 */
export type TimeOfDay = 'day' | 'sunset' | 'night';

export interface LightingPreset {
  label: string;
  /** Direção de onde vem a luz principal (normalizada no uso). */
  sunDir: [number, number, number];
  sunColor: string;
  sunIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  envIntensity: number;
  /** Parâmetros do céu físico (drei Sky). */
  sky: { turbidity: number; rayleigh: number; mieCoefficient: number; mieDirectionalG: number };
  fogColor: string;
  fogDensity: number;
  exposure: number;
  /** 0..1: quanto as luzes artificiais (internas e externas) aparecem. */
  artificial: number;
  stars: boolean;
  poolGlow: number;
}

export const LIGHTING: Record<TimeOfDay, LightingPreset> = {
  day: {
    label: 'Dia',
    sunDir: [0.45, 0.78, -0.43],
    sunColor: '#fff4e6',
    sunIntensity: 4.2,
    hemiSky: '#cfe3ff',
    hemiGround: '#6b6253',
    hemiIntensity: 0.4,
    envIntensity: 0.7,
    sky: { turbidity: 2.0, rayleigh: 1.4, mieCoefficient: 0.004, mieDirectionalG: 0.8 },
    fogColor: '#c6d4e2',
    fogDensity: 0.0009,
    exposure: 1.0,
    artificial: 0,
    stars: false,
    poolGlow: 0,
  },
  sunset: {
    label: 'Pôr do sol',
    sunDir: [-0.88, 0.07, -0.47],
    sunColor: '#ffb27a',
    sunIntensity: 2.4,
    hemiSky: '#ffd2b0',
    hemiGround: '#4a3c35',
    hemiIntensity: 0.38,
    envIntensity: 0.75,
    sky: { turbidity: 8, rayleigh: 3.2, mieCoefficient: 0.008, mieDirectionalG: 0.92 },
    fogColor: '#d7a98c',
    fogDensity: 0.0013,
    exposure: 1.0,
    artificial: 0.55,
    stars: false,
    poolGlow: 0.5,
  },
  night: {
    label: 'Noite',
    sunDir: [0.3, 0.55, 0.25],
    sunColor: '#9fb4ff',
    sunIntensity: 0.12,
    hemiSky: '#2a3757',
    hemiGround: '#0d0f14',
    hemiIntensity: 0.07,
    envIntensity: 0.12,
    sky: { turbidity: 0.6, rayleigh: 0.12, mieCoefficient: 0.002, mieDirectionalG: 0.7 },
    fogColor: '#0b1020',
    fogDensity: 0.0016,
    exposure: 1.05,
    artificial: 1,
    stars: true,
    poolGlow: 1,
  },
};

export const TIME_ORDER: TimeOfDay[] = ['day', 'sunset', 'night'];

/** Temperatura de cor das luminárias internas (2700 K). */
export const WARM_LIGHT = '#ffc98f';
export const NEUTRAL_LIGHT = '#ffe4c4';
