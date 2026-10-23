import { useEffect } from 'react';
import type { ArcadeRuntime } from '../../app/runtime';
import type { ARState } from '../ARExperience/ARExperience';
import { unavailableReason } from '../../services/arSupport';
import { IconClose } from '../icons';

interface Props {
  ar: ARState;
  runtime: ArcadeRuntime | null;
  onClose: () => void;
}

const AR_TEXT = {
  webxr: 'Disponível: WebXR com detecção de superfície. O aparelho fica sobre a mesa, os jogos continuam funcionando e dá para girar, mover e redimensionar.',
  'quick-look': 'Disponível pelo AR Quick Look da Apple (modelo USDZ). No Quick Look o aparelho aparece estático; os jogos funcionam no modo 3D.',
  'scene-viewer': 'Disponível pelo Scene Viewer do Google (modelo GLB). No Scene Viewer o aparelho aparece estático; os jogos funcionam no modo 3D.',
} as const;

export function HelpSheet({ ar, runtime, onClose }: Props) {
  useEffect(() => {
    if (runtime) runtime.keyboardBlocked = true;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      if (runtime) runtime.keyboardBlocked = false;
      window.removeEventListener('keydown', onKey);
    };
  }, [runtime, onClose]);

  const arStatus =
    !ar.support || !ar.route ? 'Verificando…' : ar.route === 'unavailable' ? unavailableReason(ar.support) : AR_TEXT[ar.route];

  return (
    <div className="backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <header>
          <h2 id="help-title">Como usar</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar" autoFocus>
            <IconClose />
          </button>
        </header>
        <dl className="keys">
          <dt>Joystick amarelo</dt>
          <dd>
            Direcional. Arraste o topo do joystick no modelo ou no controle da tela; no teclado, <kbd>←</kbd>
            <kbd>↑</kbd>
            <kbd>→</kbd>
            <kbd>↓</kbd> ou <kbd>W</kbd>
            <kbd>A</kbd>
            <kbd>S</kbd>
            <kbd>D</kbd>.
          </dd>
          <dt>Botão azul</dt>
          <dd>
            Ação principal (atirar, correr, lançar a bola). <kbd>Z</kbd> ou <kbd>J</kbd>.
          </dd>
          <dt>Botão amarelo</dt>
          <dd>
            Confirmar e pular. <kbd>X</kbd>, <kbd>K</kbd> ou <kbd>Espaço</kbd>.
          </dd>
          <dt>Botão vermelho</dt>
          <dd>
            Voltar, pausar e sair. <kbd>C</kbd>, <kbd>L</kbd> ou <kbd>Esc</kbd>.
          </dd>
          <dt>Botão branco</dt>
          <dd>
            Start / Pausa. <kbd>Enter</kbd> ou <kbd>P</kbd>.
          </dd>
          <dt>Cartuchos</dt>
          <dd>Clique no cartucho amarelo, no cartão azul ou na peça vermelha para tirar; clique de novo para recolocar e carregar o jogo.</dd>
          <dt>Gamepad</dt>
          <dd>A = amarelo, X/Y = azul, B = vermelho, Start = branco, direcional e analógico = joystick.</dd>
        </dl>
        <h2 style={{ fontSize: 15, marginTop: 18 }}>Realidade aumentada neste navegador</h2>
        <p>{arStatus}</p>
        <h2 style={{ fontSize: 15, marginTop: 18 }}>Sobre o projeto</h2>
        <p>
          Os botões desta versão web são controles virtuais: eles não acionam um aparelho físico. O modelo foi reconstruído em 3D a partir de
          uma única fotografia de frente; a traseira e as medidas exatas não aparecem na foto e foram completadas de forma discreta. Os quatro
          jogos são originais.
        </p>
      </div>
    </div>
  );
}
