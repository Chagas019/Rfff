import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LEVEL_Y, STAIR, type Level } from '../../data/plan';
import { prefersReducedMotion } from '../../config/quality';
import { useExperience } from '../../store/useExperience';
import { consumeLook, walkInput } from '../../store/walkInput';
import { ELEVATOR_STOP, EYE_HEIGHT, inStairZone, isWalkable, resolve, stairHeight } from '../../utils/collision';
import { nearestInteractable } from '../../utils/interact';

const WALK_SPEED = 2.2;
const RUN_SPEED = 4.6;

/**
 * Caminhada em primeira pessoa: mouse com pointer lock (ou arrastar), WASD/setas,
 * Shift para correr, E para portas e elevador; joystick virtual no celular.
 * Colide com paredes, portas fechadas, vidros, guarda-corpos e móveis grandes,
 * sobe a escada degrau a degrau e troca de pavimento pelo elevador.
 */
export function FirstPersonController() {
  const { camera, gl } = useThree();
  const spawn = useExperience((s) => s.walkSpawn);
  const state = useRef({ x: -1, z: 14, y: 0, level: 0 as Level, yaw: 0, pitch: 0, onStair: false, bob: 0 });
  const keys = useRef<Record<string, boolean>>({});
  const drag = useRef<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 });
  const reduced = useRef(prefersReducedMotion());

  // posição inicial / teletransporte para um cômodo
  useEffect(() => {
    if (!spawn) return;
    const s = state.current;
    s.x = spawn.x;
    s.z = spawn.z;
    s.level = spawn.level;
    s.y = LEVEL_Y[spawn.level];
    s.onStair = false;
    s.yaw = Math.atan2(-(spawn.lookX - spawn.x), -(spawn.lookZ - spawn.z));
    s.pitch = -0.04;
  }, [spawn]);

  useEffect(() => {
    const el = gl.domElement;
    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      keys.current[e.code] = down;
      if (down && e.code === 'KeyE') interact();
    };
    const kd = onKey(true);
    const ku = onKey(false);
    const onClick = () => {
      if (document.pointerLockElement !== el && matchMedia('(pointer: fine)').matches) el.requestPointerLock?.();
    };
    const onMove = (e: PointerEvent) => {
      const s = state.current;
      if (document.pointerLockElement === el) {
        s.yaw -= e.movementX * 0.0022;
        s.pitch -= e.movementY * 0.0022;
      } else if (drag.current.active && e.pointerType === 'mouse') {
        s.yaw -= (e.clientX - drag.current.x) * 0.004;
        s.pitch -= (e.clientY - drag.current.y) * 0.004;
        drag.current.x = e.clientX;
        drag.current.y = e.clientY;
      }
      s.pitch = THREE.MathUtils.clamp(s.pitch, -1.35, 1.35);
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') drag.current = { active: true, x: e.clientX, y: e.clientY };
    };
    const onUp = () => (drag.current.active = false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    el.addEventListener('click', onClick);
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      el.removeEventListener('click', onClick);
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (document.pointerLockElement === el) document.exitPointerLock?.();
      keys.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl]);

  const interact = () => {
    const s = state.current;
    const target = nearestInteractable(s.x, s.z, s.level);
    if (!target) return;
    const st = useExperience.getState();
    if (target.kind === 'door') {
      st.toggleDoor(target.id);
    } else {
      s.level = s.level === 0 ? 1 : 0;
      s.y = LEVEL_Y[s.level];
      s.x = ELEVATOR_STOP.x;
      s.z = ELEVATOR_STOP.z;
      st.notify(s.level === 1 ? 'Elevador: pavimento superior' : 'Elevador: térreo');
    }
  };

  const lastInteract = useRef(0);
  const lastPose = useRef(0);

  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const s = state.current;
    const k = keys.current;
    if (walkInput.interact !== lastInteract.current) {
      lastInteract.current = walkInput.interact;
      interact();
    }
    const look = consumeLook();
    s.yaw -= look.dx * 0.005;
    s.pitch = THREE.MathUtils.clamp(s.pitch - look.dy * 0.005, -1.35, 1.35);

    let fwd = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0) + walkInput.moveY;
    let side = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0) + walkInput.moveX;
    const len = Math.hypot(fwd, side);
    if (len > 1) {
      fwd /= len;
      side /= len;
    }
    const speed = k.ShiftLeft || k.ShiftRight || walkInput.run ? RUN_SPEED : WALK_SPEED;
    const sin = Math.sin(s.yaw);
    const cos = Math.cos(s.yaw);
    const dx = (-sin * fwd + cos * side) * speed * dt;
    const dz = (-cos * fwd - sin * side) * speed * dt;
    const doors = useExperience.getState().doors;

    if (dx || dz) {
      let nx = s.x + dx;
      let nz = s.z + dz;
      const entering = inStairZone(nx, nz) && ((s.level === 0 && s.z > STAIR.zBottom - 0.6) || (s.level === 1 && s.z < STAIR.zTop + 0.4) || s.onStair);
      if (entering) {
        // na escada: só os corrimãos laterais limitam
        s.onStair = true;
        nx = THREE.MathUtils.clamp(nx, STAIR.x0 + 0.3, STAIR.x1 - 0.3);
        s.x = nx;
        s.z = nz;
        s.y = stairHeight(nz);
        if (nz < STAIR.zTop - 0.02) {
          s.onStair = false;
          s.level = 1;
          s.y = LEVEL_Y[1];
        } else if (nz > STAIR.zBottom + 0.3) {
          s.onStair = false;
          s.level = 0;
          s.y = 0;
        } else {
          s.level = s.y > 2 ? 1 : 0;
        }
      } else {
        s.onStair = false;
        // movimento por eixo, para deslizar ao longo das paredes
        const tryMove = (x: number, z: number) => {
          const r = resolve(s.level, x, z, doors);
          if (isWalkable(s.level, r.x, r.z)) {
            s.x = r.x;
            s.z = r.z;
            return true;
          }
          return false;
        };
        if (!tryMove(nx, nz)) {
          if (!tryMove(s.x + dx, s.z)) tryMove(s.x, s.z + dz);
        }
        s.y = LEVEL_Y[s.level];
      }
      if (!reduced.current) s.bob += dt * speed * 2.6;
    }

    const bob = reduced.current ? 0 : Math.sin(s.bob) * 0.025;
    camera.position.set(s.x, s.y + EYE_HEIGHT + bob, s.z);
    camera.rotation.set(s.pitch, s.yaw, 0, 'YXZ');

    if (clock.elapsedTime - lastPose.current > 0.15) {
      lastPose.current = clock.elapsedTime;
      useExperience.getState().setPose({ x: s.x, z: s.z, y: s.y, heading: s.yaw, level: s.level });
    }
  });

  return null;
}
