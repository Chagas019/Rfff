import { LEVEL_ROWS, TILE, isSolid } from './levels';

export const PHYS = {
  gravity: 980,
  jumpVelocity: 310,
  walkSpeed: 70,
  runSpeed: 115,
  accel: 900,
  maxFall: 380,
  coyote: 0.09,
  jumpBuffer: 0.12,
};

export interface Body {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  onGround: boolean;
}

export function tileAt(tiles: string[][], col: number, row: number): string | undefined {
  if (row < 0) return '.';
  if (row >= LEVEL_ROWS) return '.';
  if (col < 0 || col >= tiles[0].length) return '#'; // paredes invisíveis nas pontas
  return tiles[row][col];
}

function solidAt(tiles: string[][], px: number, py: number) {
  return isSolid(tileAt(tiles, Math.floor(px / TILE), Math.floor(py / TILE)));
}

/** Move o corpo resolvendo colisão eixo a eixo contra o mapa de tiles. */
export function moveBody(b: Body, tiles: string[][], dt: number) {
  // horizontal
  b.x += b.vx * dt;
  const top = b.y + 0.01;
  const bottom = b.y + b.h - 0.01;
  if (b.vx > 0) {
    const right = b.x + b.w;
    if (solidAt(tiles, right, top) || solidAt(tiles, right, bottom) || solidAt(tiles, right, b.y + b.h / 2)) {
      b.x = Math.floor(right / TILE) * TILE - b.w;
      b.vx = 0;
    }
  } else if (b.vx < 0) {
    if (solidAt(tiles, b.x, top) || solidAt(tiles, b.x, bottom) || solidAt(tiles, b.x, b.y + b.h / 2)) {
      b.x = (Math.floor(b.x / TILE) + 1) * TILE;
      b.vx = 0;
    }
  }
  // vertical
  b.y += b.vy * dt;
  const left = b.x + 0.01;
  const right = b.x + b.w - 0.01;
  b.onGround = false;
  if (b.vy > 0) {
    const foot = b.y + b.h;
    if (solidAt(tiles, left, foot) || solidAt(tiles, right, foot)) {
      b.y = Math.floor(foot / TILE) * TILE - b.h;
      b.vy = 0;
      b.onGround = true;
    }
  } else if (b.vy < 0) {
    if (solidAt(tiles, left, b.y) || solidAt(tiles, right, b.y)) {
      b.y = (Math.floor(b.y / TILE) + 1) * TILE;
      b.vy = 0;
    }
  } else {
    // parado: confere se ainda há chão logo abaixo
    b.onGround = solidAt(tiles, left, b.y + b.h + 0.5) || solidAt(tiles, right, b.y + b.h + 0.5);
  }
}

export const rectsOverlap = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
