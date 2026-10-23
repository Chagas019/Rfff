import * as THREE from 'three';
import { mulberry32 } from '../../games/engine/random';

/** Ruído de valor suavizado, repetível (tileable), em [0,1]. */
function valueNoise(size: number, seed: number, cells = 16): Float32Array {
  const rand = mulberry32(seed);
  const grid = new Float32Array(cells * cells).map(() => rand());
  const out = new Float32Array(size * size);
  const smooth = (t: number) => t * t * (3 - 2 * t);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = (x / size) * cells;
      const gy = (y / size) * cells;
      const x0 = Math.floor(gx) % cells;
      const y0 = Math.floor(gy) % cells;
      const x1 = (x0 + 1) % cells;
      const y1 = (y0 + 1) % cells;
      const tx = smooth(gx - Math.floor(gx));
      const ty = smooth(gy - Math.floor(gy));
      const a = grid[y0 * cells + x0] * (1 - tx) + grid[y0 * cells + x1] * tx;
      const b = grid[y1 * cells + x0] * (1 - tx) + grid[y1 * cells + x1] * tx;
      // um pouco de grão fino por cima
      out[y * size + x] = (a * (1 - ty) + b * ty) * 0.8 + rand() * 0.2;
    }
  }
  return out;
}

/** Mapa de rugosidade: valores entre 0,85 e 1 (multiplicam a rugosidade do material). */
export function makeNoiseTexture(size: number, seed: number): THREE.DataTexture {
  const n = valueNoise(size, seed);
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < n.length; i++) {
    const v = Math.round((0.85 + n[i] * 0.15) * 255);
    data.set([v, v, v, 255], i * 4);
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.name = 'plastic-roughness';
  tex.needsUpdate = true;
  return tex;
}

/** Normal map derivado do ruído: dá a textura levemente granulada do plástico injetado. */
export function makeNormalFromNoise(size: number, seed: number): THREE.DataTexture {
  const n = valueNoise(size, seed, 32);
  const data = new Uint8Array(size * size * 4);
  const at = (x: number, y: number) => n[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 2;
      const dy = (at(x, y + 1) - at(x, y - 1)) * 2;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      data[i] = Math.round(((-dx / len) * 0.5 + 0.5) * 255);
      data[i + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
      data[i + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.name = 'plastic-normal';
  tex.needsUpdate = true;
  return tex;
}
