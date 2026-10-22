import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import type CameraControlsImpl from 'camera-controls';
import * as THREE from 'three';
import { prefersReducedMotion } from '../../config/quality';
import { useExperience, EXTERIOR_SHOT } from '../../store/useExperience';

const INTRO_START: [number, number, number, number, number, number] = [44, 15, 50, -13, 2.5, 3];

/**
 * Câmera orbital (externa, interna em corte e superior). Executa os
 * enquadramentos pedidos pela interface/visita guiada com transições suaves,
 * gira lentamente na tela inicial e faz a revelação cinematográfica ao entrar.
 */
export function CameraController() {
  const ref = useRef<CameraControlsImpl>(null);
  const mode = useExperience((s) => s.mode);
  const shot = useExperience((s) => s.shot);
  const camera = useThree((s) => s.camera);
  const reduced = useRef(prefersReducedMotion());
  const lastPose = useRef(0);

  // enquadramento inicial (ou continuidade vinda do modo caminhada)
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const st = useExperience.getState();
    if (st.mode === 'intro') {
      c.setLookAt(...INTRO_START, false);
    } else {
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      const p = camera.position;
      c.setLookAt(p.x, p.y, p.z, p.x + dir.x * 6, p.y + dir.y * 6, p.z + dir.z * 6, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // limites por modo
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.enabled = mode !== 'intro' && mode !== 'tour';
    c.minDistance = mode === 'interior' ? 1 : mode === 'top' ? 10 : 2;
    c.maxDistance = mode === 'top' ? 130 : mode === 'interior' ? 70 : 170;
    c.minPolarAngle = 0;
    c.maxPolarAngle = mode === 'top' ? 0.55 : Math.PI * 0.495;
    c.dollyToCursor = mode !== 'intro';
    c.smoothTime = reduced.current ? 0.12 : 0.9;
    c.draggingSmoothTime = 0.12;
  }, [mode]);

  // revelação ao sair da tela inicial
  const prevMode = useRef(mode);
  useEffect(() => {
    const c = ref.current;
    const was = prevMode.current;
    prevMode.current = mode;
    if (!c || was !== 'intro' || mode !== 'exterior') return;
    c.smoothTime = reduced.current ? 0.15 : 1.9;
    const s = EXTERIOR_SHOT;
    c.setLookAt(...s.position, ...s.target, true).then(() => {
      if (ref.current) ref.current.smoothTime = reduced.current ? 0.12 : 0.9;
    });
  }, [mode]);

  // enquadramentos pedidos (cômodos, vistas, visita)
  useEffect(() => {
    const c = ref.current;
    if (!c || !shot) return;
    const st = useExperience.getState();
    if (st.mode === 'intro') return;
    c.smoothTime = reduced.current ? 0.12 : (shot.travel ?? 0.9);
    c.setLookAt(...shot.position, ...shot.target, shot.smooth !== false).then(() => {
      if (ref.current && useExperience.getState().mode !== 'tour') ref.current.smoothTime = reduced.current ? 0.12 : 0.9;
    });
  }, [shot]);

  useFrame(({ clock }, dt) => {
    const c = ref.current;
    if (!c) return;
    const st = useExperience.getState();
    if (st.mode === 'intro' && !reduced.current) c.azimuthAngle += dt * 0.035;
    // nunca abaixo do terreno
    if (camera.position.y < 0.6 && st.mode === 'exterior') {
      const t = new THREE.Vector3();
      c.getTarget(t);
      c.setLookAt(camera.position.x, 0.6, camera.position.z, t.x, t.y, t.z, false);
    }
    if (clock.elapsedTime - lastPose.current > 0.2) {
      lastPose.current = clock.elapsedTime;
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      st.setPose({ x: camera.position.x, z: camera.position.z, y: camera.position.y, heading: Math.atan2(-dir.x, -dir.z), level: camera.position.y > 5.5 && camera.position.y < 9 ? 1 : 0 });
    }
  });

  return <CameraControls ref={ref} makeDefault />;
}
