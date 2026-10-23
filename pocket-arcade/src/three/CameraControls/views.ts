import * as THREE from 'three';

export type ViewId = 'hero' | 'front' | 'left' | 'right' | 'back' | 'top' | 'play';

export interface ViewPreset {
  id: ViewId;
  label: string;
  /** Azimute em graus (0 = de frente, negativo = câmera à esquerda). */
  azimuth: number;
  /** Elevação em graus (positivo = câmera acima). */
  elevation: number;
  /**
   * Pose do aparelho (rotação X, Y, Z em radianos). Na foto o topo está inclinado para
   * trás e o corpo levemente girado; nas demais vistas o aparelho fica reto.
   */
  pose: [number, number, number];
  /** Altura e largura (cm) que precisam caber no quadro. */
  frameHeight: number;
  frameWidth: number;
  target: [number, number, number];
}

export const VIEWS: Record<ViewId, ViewPreset> = {
  hero: { id: 'hero', label: 'Como na foto', azimuth: -35, elevation: 0, pose: [-0.3, 0, 0.07], frameHeight: 21.5, frameWidth: 16, target: [0.6, -0.5, 0] },
  front: { id: 'front', label: 'Frente', azimuth: 0, elevation: 0, pose: [0, 0, 0], frameHeight: 19, frameWidth: 14, target: [0, -0.6, 0] },
  left: { id: 'left', label: 'Lateral esquerda', azimuth: -90, elevation: 0, pose: [0, 0, 0], frameHeight: 19, frameWidth: 10, target: [0, -0.6, 0] },
  right: { id: 'right', label: 'Lateral direita', azimuth: 90, elevation: 0, pose: [0, 0, 0], frameHeight: 19, frameWidth: 10, target: [0, -0.6, 0] },
  back: { id: 'back', label: 'Traseira', azimuth: 180, elevation: 0, pose: [0, 0, 0], frameHeight: 19, frameWidth: 14, target: [0, -0.6, 0] },
  top: { id: 'top', label: 'Topo', azimuth: 0, elevation: 82, pose: [0, 0, 0], frameHeight: 12, frameWidth: 14, target: [0, 0, 0] },
  play: { id: 'play', label: 'Jogar', azimuth: 0, elevation: 0, pose: [0, 0, 0], frameHeight: 14.6, frameWidth: 11.2, target: [0, 0, 0] },
};

/** Distância da câmera para enquadrar uma área (cm) com o FOV vertical e a proporção atuais. */
export function fitDistance(fovDeg: number, aspect: number, frameW: number, frameH: number) {
  const vFov = THREE.MathUtils.degToRad(fovDeg);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  const dH = frameH / 2 / Math.tan(vFov / 2);
  const dW = frameW / 2 / Math.tan(hFov / 2);
  return Math.max(dH, dW);
}

/** Posição da câmera para um preset (coordenadas esféricas em volta do alvo). */
export function cameraPositionFor(view: ViewPreset, distance: number) {
  const az = THREE.MathUtils.degToRad(view.azimuth);
  const el = THREE.MathUtils.degToRad(view.elevation);
  const t = new THREE.Vector3(...view.target);
  return new THREE.Vector3(
    t.x + distance * Math.cos(el) * Math.sin(az),
    t.y + distance * Math.sin(el),
    t.z + distance * Math.cos(el) * Math.cos(az),
  );
}

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
