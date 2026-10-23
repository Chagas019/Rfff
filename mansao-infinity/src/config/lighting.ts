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
  /** Cores do céu visível (gradiente zênite → horizonte e halo do sol). */
  dome: { zenith: string; horizon: string; glow: string };
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
    sky: { turbidity: 6, rayleigh: 2.8, mieCoefficient: 0.003, mieDirectionalG: 0.75 },
    dome: { zenith: '#1d4f9c', horizon: '#bcd2e8', glow: '#fff3dc' },
    fogColor: '#bccfe2',
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
    dome: { zenith: '#2c3a63', horizon: '#eea57a', glow: '#ffcf96' },
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
    dome: { zenith: '#040814', horizon: '#24304f', glow: '#9fb4ff' },
    fogColor: '#0b1020',
    fogDensity: 0.0016,
    exposure: 1.05,
    artificial: 1,
    stars: true,
    poolGlow: 1,
  },
};

export const TIME_ORDER: TimeOfDay[] = ['day', 'sunset', 'night'];

/**
 * Luz de estúdio da prancha de apresentação: luz-chave suave de sudeste, muito
 * céu (preenchimento) e as luminárias internas acesas e quentes — o aspecto
 * das maquetes eletrônicas de entrega de projeto.
 */
export const STUDIO: LightingPreset = {
  label: 'Estúdio',
  sunDir: [0.42, 0.9, 0.62],
  sunColor: '#fff3e4',
  sunIntensity: 2.4,
  hemiSky: '#ffffff',
  hemiGround: '#d9cfc0',
  hemiIntensity: 0.85,
  envIntensity: 0.85,
  sky: { turbidity: 2, rayleigh: 1, mieCoefficient: 0.003, mieDirectionalG: 0.8 },
  dome: { zenith: '#ffffff', horizon: '#ffffff', glow: '#ffffff' },
  fogColor: '#ffffff',
  fogDensity: 0,
  exposure: 1.0,
  artificial: 0.9,
  stars: false,
  poolGlow: 0,
};

/** Temperatura de cor das luminárias internas (2700 K). */
export const WARM_LIGHT = '#ffc98f';
export const NEUTRAL_LIGHT = '#ffe4c4';
