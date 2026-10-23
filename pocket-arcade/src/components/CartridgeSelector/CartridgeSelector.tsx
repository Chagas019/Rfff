import { useEffect, useRef } from 'react';
import type { ArcadeRuntime } from '../../app/runtime';
import type { GameId } from '../../games/engine/types';
import { IconClose } from '../icons';

interface Props {
  runtime: ArcadeRuntime;
  currentGame: GameId | null;
  onClose: () => void;
}

/**
 * Seleção de cartucho. Cada jogo mostra a peça física que o carrega; escolher um jogo
 * anima a peça saindo e voltando ao encaixe no modelo 3D e abre o jogo na tela.
 */
export function CartridgeSelector({ runtime, currentGame, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    runtime.keyboardBlocked = true;
    const first = dialogRef.current?.querySelector<HTMLButtonElement>('.cart-item');
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && dialogRef.current) {
        // foco preso dentro do diálogo
        const items = [...dialogRef.current.querySelectorAll<HTMLElement>('button')];
        const i = items.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && i <= 0) {
          e.preventDefault();
          items[items.length - 1].focus();
        } else if (!e.shiftKey && i === items.length - 1) {
          e.preventDefault();
          items[0].focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      runtime.keyboardBlocked = false;
      window.removeEventListener('keydown', onKey);
    };
  }, [runtime, onClose]);

  return (
    <div className="backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialogRef} className="sheet" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <header>
          <h2 id="cart-title">Selecionar cartucho</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            <IconClose />
          </button>
        </header>
        <p>
          Toque em um jogo para carregá-lo. Você também pode tirar e recolocar as peças direto no modelo 3D: clique no cartucho amarelo,
          no cartão azul ou na peça vermelha.
        </p>
        <ul className="cart-list">
          {runtime.games().map((g) => {
            const inserted = g.cartridge ? runtime.isCartridgeInserted(g.cartridge) : true;
            return (
              <li key={g.id}>
                <button
                  type="button"
                  className="cart-item"
                  aria-current={currentGame === g.id}
                  onClick={() => {
                    runtime.selectGame(g.id);
                    onClose();
                  }}
                >
                  <span className="cart-swatch" style={{ ['--c' as string]: g.color }} aria-hidden />
                  <span>
                    <strong>{g.title}</strong>
                    <small>{g.description}</small>
                    <small>{g.controls}</small>
                  </span>
                  <span className="cart-meta">
                    <b>{runtime.highscores.get(g.id)}</b>
                    recorde
                    <br />
                    {g.cartridgeLabel}
                    {!inserted && (
                      <>
                        <br />
                        <em>fora do encaixe</em>
                      </>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
