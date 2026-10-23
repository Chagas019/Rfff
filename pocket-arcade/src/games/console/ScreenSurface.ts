import * as THREE from 'three';
import { SCREEN_RES } from '../../three/ArcadeModel/layout';

const SCALE = 3;

/**
 * Tela do aparelho: os jogos desenham em um canvas de 300×200 pixels lógicos.
 * Esse canvas é ampliado 3× sem suavização, com a grade de pixels de LCD que aparece
 * na foto, e vira a textura da tela do modelo 3D.
 */
export class ScreenSurface {
  readonly width = SCREEN_RES.width;
  readonly height = SCREEN_RES.height;
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D | null;
  readonly output: HTMLCanvasElement;
  readonly texture: THREE.CanvasTexture;
  private outCtx: CanvasRenderingContext2D | null;
  private grid: CanvasPattern | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = safeContext(this.canvas);
    this.output = document.createElement('canvas');
    this.output.width = this.width * SCALE;
    this.output.height = this.height * SCALE;
    this.outCtx = safeContext(this.output);
    if (this.outCtx) {
      this.outCtx.imageSmoothingEnabled = false;
      const cell = document.createElement('canvas');
      cell.width = SCALE;
      cell.height = SCALE;
      const c = safeContext(cell);
      if (c) {
        c.fillStyle = 'rgba(0,0,0,0.22)';
        c.fillRect(SCALE - 1, 0, 1, SCALE);
        c.fillRect(0, SCALE - 1, SCALE, 1);
        this.grid = this.outCtx.createPattern(cell, 'repeat');
      }
    }
    this.texture = new THREE.CanvasTexture(this.output);
    this.texture.name = 'screen';
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.anisotropy = 8;
    this.texture.userData.shared = true;
    this.texture.userData.mimeType = 'image/jpeg';
  }

  /** Copia o quadro lógico para a textura (com a grade do LCD). */
  present() {
    if (!this.outCtx) return;
    this.outCtx.drawImage(this.canvas, 0, 0, this.output.width, this.output.height);
    if (this.grid) {
      this.outCtx.fillStyle = this.grid;
      this.outCtx.fillRect(0, 0, this.output.width, this.output.height);
    }
    this.texture.needsUpdate = true;
  }
}

function safeContext(c: HTMLCanvasElement): CanvasRenderingContext2D | null {
  try {
    return c.getContext('2d');
  } catch {
    return null;
  }
}
