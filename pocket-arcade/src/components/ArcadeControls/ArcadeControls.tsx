import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { ArcadeRuntime } from '../../app/runtime';
import type { PadState } from '../../games/engine/types';
import type { ButtonKey } from '../../services/input';
import { Smiley } from '../icons';

interface Props {
  runtime: ArcadeRuntime;
  disabled?: boolean;
  /** Na RA os controles ficam na sobreposição DOM: marcamos para não posicionar o objeto ao tocar. */
  xr?: boolean;
}

const BUTTONS: Array<{ key: ButtonKey; label: string }> = [
  { key: 'blue', label: 'Botão azul (ação principal)' },
  { key: 'yellow', label: 'Botão amarelo (pular / confirmar)' },
  { key: 'red', label: 'Botão vermelho (voltar / pausar)' },
];

/**
 * Controles virtuais na tela, com a mesma disposição do aparelho da foto:
 * botões azul, amarelo e vermelho à esquerda, joystick amarelo à direita e o
 * botão branco (Start/Pausa) abaixo. Funcionam com toque, mouse e teclado.
 */
export function ArcadeControls({ runtime, disabled = false, xr = false }: Props) {
  const [pad, setPad] = useState<PadState>({ x: 0, y: 0, blue: false, yellow: false, red: false, start: false });
  const stickRef = useRef<HTMLDivElement>(null);
  const stickPointer = useRef<number | null>(null);

  useEffect(() => {
    const off = runtime.input.subscribe(setPad);
    return () => {
      off();
    };
  }, [runtime]);

  const press = (key: ButtonKey, down: boolean, id: string) => {
    if (disabled && down) return;
    runtime.pressButton(key, down, id);
  };

  const pointerHandlers = (key: ButtonKey) => ({
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      press(key, true, `p${e.pointerId}`);
    },
    onPointerUp: (e: PointerEvent<HTMLButtonElement>) => press(key, false, `p${e.pointerId}`),
    onPointerCancel: (e: PointerEvent<HTMLButtonElement>) => press(key, false, `p${e.pointerId}`),
    onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => {
      if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
        e.preventDefault();
        press(key, true, 'kbd');
      }
    },
    onKeyUp: (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') press(key, false, 'kbd');
    },
    onBlur: () => press(key, false, 'kbd'),
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
  });

  const stickMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = stickRef.current;
    if (!el || stickPointer.current !== e.pointerId) return;
    const r = el.getBoundingClientRect();
    const radius = r.width / 2;
    let x = (e.clientX - (r.left + radius)) / (radius * 0.75);
    let y = -(e.clientY - (r.top + radius)) / (radius * 0.75);
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    runtime.setStickFromUI(x, y);
  };

  const stickEnd = (e: PointerEvent<HTMLDivElement>) => {
    if (stickPointer.current !== e.pointerId) return;
    stickPointer.current = null;
    runtime.setStickFromUI(0, 0);
  };

  const xrAttr = xr ? { 'data-xr-ui': '' } : {};

  return (
    <div className="pad" role="group" aria-label="Controles do Pocket Arcade" {...xrAttr}>
      <div className="pad-buttons">
        {BUTTONS.map((b) => (
          <button
            key={b.key}
            type="button"
            className="pad-btn"
            data-key={b.key}
            data-down={pad[b.key]}
            aria-label={b.label}
            aria-pressed={pad[b.key]}
            disabled={disabled}
            {...pointerHandlers(b.key)}
          />
        ))}
        <button
          type="button"
          className="pad-start"
          data-down={pad.start}
          aria-label="Botão branco: Start / Pausa"
          aria-pressed={pad.start}
          disabled={disabled}
          {...pointerHandlers('start')}
        >
          START
        </button>
      </div>
      <div
        ref={stickRef}
        className="stick"
        role="group"
        tabIndex={0}
        aria-label="Joystick: arraste, ou use as setas do teclado"
        aria-disabled={disabled}
        onPointerDown={(e) => {
          if (disabled) return;
          e.preventDefault();
          stickPointer.current = e.pointerId;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          stickMove(e);
        }}
        onPointerMove={stickMove}
        onPointerUp={stickEnd}
        onPointerCancel={stickEnd}
      >
        <div className="stick-cap" style={{ transform: `translate(${pad.x * 22}px, ${-pad.y * 22}px)` }}>
          <Smiley />
        </div>
      </div>
    </div>
  );
}
