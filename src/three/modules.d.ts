// Tipos mínimos para os módulos JS do modelo 3D (F1 Rules Explorer).
declare module '*/car/build.js' {
  import type { Group, Object3D } from 'three';
  interface Wing { flapPivots: Object3D[]; flapAngles: number[] }
  export function buildCar(): { root: Group; reg: unknown; M: unknown; aero: { frontWing: Wing; rearWing: Wing } };
}
declare module '*/car/materials.js' {
  export function setLiveryColor(hex: string): void;
}
declare module '*/studio.js' {
  import type { Mesh, Object3D, Scene, WebGLRenderer } from 'three';
  export const STUDIO_BG: number;
  export function createStudio(renderer: WebGLRenderer, scene: Scene): {
    floor: Mesh;
    invalidate(): void;
    update(hide?: Object3D[]): void;
    setSize(w: number, h: number): void;
    setUnderside(on: boolean): void;
  };
}
