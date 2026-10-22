import { useEffect, useRef, useState } from 'react';
import { isTouchDevice } from '../config/quality';
import { DOOR_NAMES } from '../data/doors';
import { roomById, ROOMS, LEVEL_NAMES } from '../data/plan';
import { useExperience } from '../store/useExperience';
import { walkInput } from '../store/walkInput';
import { nearestInteractable } from '../utils/interact';
import { FloorPlan } from './FloorPlan';
import { IconElevator, IconHand } from './icons';

/** Nome amigável de uma esquadria ("Porta de correr", "Portão da garagem"...). */
function doorLabel(id: string, open: boolean) {
  const base = DOOR_NAMES[id] ?? (id.toLowerCase().includes('balcony') || id.toLowerCase().includes('terrace') || id.toLowerCase().includes('pool') ? 'Porta de correr' : 'Porta');
  return `${open ? 'Fechar' : 'Abrir'} ${base.charAt(0).toLowerCase()}${base.slice(1)}`;
}

/**
 * Interface do modo caminhada: mira, cômodo atual, ação contextual (porta /
 * elevador), minimapa ao vivo e, no celular, joystick e área de olhar.
 */
export function WalkHUD() {
  const pose = useExperience((s) => s.pose);
  const doors = useExperience((s) => s.doors);
  const touch = isTouchDevice();
  const target = nearestInteractable(pose.x, pose.z, pose.level);
  const room = ROOMS.find((r) => r.level === pose.level && pose.x >= r.rect.x0 && pose.x <= r.rect.x1 && pose.z >= r.rect.z0 && pose.z <= r.rect.z1);
  const label = target ? (target.kind === 'elevator' ? `Elevador para o ${pose.level === 0 ? 'pavimento superior' : 'térreo'}` : doorLabel(target.id, !!doors[target.id])) : null;

  return (
    <>
      <div className="pointer-events-none fixed left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70" aria-hidden="true" />
      <div className="pointer-events-none fixed left-1/2 top-[4.4rem] -translate-x-1/2 text-center sm:top-24" aria-live="polite">
        <p className="eyebrow">{LEVEL_NAMES[pose.level]}</p>
        <p className="mt-1 font-display text-2xl font-light text-bone drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)] sm:text-3xl">{room ? roomById(room.id)?.name : 'Jardim'}</p>
      </div>
      {label && (
        <button
          className="glass pointer-events-auto fixed bottom-40 left-1/2 flex min-h-[46px] -translate-x-1/2 items-center gap-3 px-5 text-[11px] uppercase tracking-[0.18em] text-bone sm:bottom-32"
          onClick={() => (walkInput.interact += 1)}
        >
          {target?.kind === 'elevator' ? <IconElevator size={18} /> : <IconHand size={18} />}
          {!touch && <kbd className="border border-gold/60 px-1.5 text-[11px] text-gold">E</kbd>}
          {label}
        </button>
      )}
      <div className="glass pointer-events-none fixed bottom-24 right-6 hidden h-44 w-56 overflow-hidden sm:block" aria-hidden="true">
        <FloorPlan level={pose.level} compact />
      </div>
      {!touch && (
        <p className="pointer-events-none fixed bottom-7 left-1/2 hidden -translate-x-1/2 text-[10.5px] uppercase tracking-[0.18em] text-bone/70 drop-shadow lg:block">Clique para olhar · WASD anda · Shift corre · E interage · Esc solta o mouse</p>
      )}
      {touch && <TouchControls />}
    </>
  );
}

/** Joystick virtual (esquerda) e área de arrastar para olhar (direita). */
function TouchControls() {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const base = useRef<HTMLDivElement>(null);
  const joyId = useRef<number | null>(null);
  const lookId = useRef<number | null>(null);
  const lookLast = useRef({ x: 0, y: 0 });

  useEffect(
    () => () => {
      walkInput.moveX = 0;
      walkInput.moveY = 0;
    },
    [],
  );

  const R = 48;
  const onJoy = (e: React.PointerEvent) => {
    if (joyId.current !== e.pointerId || !base.current) return;
    const r = base.current.getBoundingClientRect();
    let x = e.clientX - (r.left + r.width / 2);
    let y = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(x, y);
    if (len > R) {
      x = (x / len) * R;
      y = (y / len) * R;
    }
    setKnob({ x, y });
    walkInput.moveX = x / R;
    walkInput.moveY = -y / R;
    walkInput.run = len > R * 0.95;
  };
  const endJoy = () => {
    joyId.current = null;
    setKnob({ x: 0, y: 0 });
    walkInput.moveX = 0;
    walkInput.moveY = 0;
    walkInput.run = false;
  };

  return (
    <>
      <div
        ref={base}
        className="pointer-events-auto fixed bottom-24 left-6 h-32 w-32 touch-none rounded-full border border-white/25 bg-black/25 backdrop-blur-md"
        onPointerDown={(e) => {
          joyId.current = e.pointerId;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          onJoy(e);
        }}
        onPointerMove={onJoy}
        onPointerUp={endJoy}
        onPointerCancel={endJoy}
        role="application"
        aria-label="Joystick de movimento"
      >
        <div className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full border border-gold/70 bg-bone/80" style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }} />
      </div>
      <div
        className="pointer-events-auto fixed bottom-0 right-0 top-24 w-1/2 touch-none"
        onPointerDown={(e) => {
          lookId.current = e.pointerId;
          lookLast.current = { x: e.clientX, y: e.clientY };
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (lookId.current !== e.pointerId) return;
          walkInput.lookDX += e.clientX - lookLast.current.x;
          walkInput.lookDY += e.clientY - lookLast.current.y;
          lookLast.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={() => (lookId.current = null)}
        onPointerCancel={() => (lookId.current = null)}
        aria-hidden="true"
      />
    </>
  );
}
