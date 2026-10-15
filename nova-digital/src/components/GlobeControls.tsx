import { Crosshair, Maximize2, Minimize2, Minus, Pause, Play, Plus, X } from 'lucide-react';
import { useEffect, useState, type ReactNode, type RefObject } from 'react';
import { useAutoRotate } from '../hooks/useGlobeController';
import type { GlobeController } from '../lib/globeController';

interface GlobeControlsProps {
  controller: GlobeController;
  onCenter: () => void;
  onClear?: () => void;
  canClear?: boolean;
  /** Elemento que vai para tela cheia. Sem ele, o botão não aparece. */
  fullscreenTarget?: RefObject<HTMLElement>;
  showZoom?: boolean;
  className?: string;
}

function ControlButton({
  label,
  onClick,
  children,
  pressed,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  pressed?: boolean;
}) {
  return (
    <button type="button" className="icon-btn" onClick={onClick} aria-label={label} title={label} aria-pressed={pressed}>
      {children}
    </button>
  );
}

function canFullscreen(): boolean {
  return (
    typeof document !== 'undefined' && document.fullscreenEnabled === true && typeof HTMLElement.prototype.requestFullscreen === 'function'
  );
}

/** Barra de controles do globo: zoom, centralizar, rotação automática, tela cheia e limpar. */
export function GlobeControls({
  controller,
  onCenter,
  onClear,
  canClear,
  fullscreenTarget,
  showZoom = true,
  className = '',
}: GlobeControlsProps) {
  const autoRotate = useAutoRotate(controller);
  const [isFull, setIsFull] = useState(false);
  const fullscreenSupported = !!fullscreenTarget && canFullscreen();

  useEffect(() => {
    const onChange = () => setIsFull(document.fullscreenElement !== null);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await fullscreenTarget?.current?.requestFullscreen();
    } catch (err) {
      console.warn('[globe] Tela cheia indisponível:', err);
    }
  };

  return (
    <div
      role="toolbar"
      aria-label="Controles do globo"
      className={`glass pointer-events-auto flex items-center gap-1 rounded-full p-1.5 ${className}`}
    >
      {showZoom && (
        <>
          <ControlButton label="Afastar" onClick={() => controller.zoomBy(1.18)}>
            <Minus className="h-4 w-4" aria-hidden />
          </ControlButton>
          <ControlButton label="Aproximar" onClick={() => controller.zoomBy(1 / 1.18)}>
            <Plus className="h-4 w-4" aria-hidden />
          </ControlButton>
          <span className="mx-0.5 h-5 w-px bg-white/10" aria-hidden />
        </>
      )}
      <ControlButton label="Centralizar o globo" onClick={onCenter}>
        <Crosshair className="h-4 w-4" aria-hidden />
      </ControlButton>
      <ControlButton
        label={autoRotate ? 'Pausar rotação automática' : 'Ativar rotação automática'}
        onClick={() => controller.toggleAutoRotate()}
        pressed={autoRotate}
      >
        {autoRotate ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
      </ControlButton>
      {fullscreenSupported && (
        <ControlButton label={isFull ? 'Sair da tela cheia' : 'Tela cheia'} onClick={toggleFullscreen}>
          {isFull ? <Minimize2 className="h-4 w-4" aria-hidden /> : <Maximize2 className="h-4 w-4" aria-hidden />}
        </ControlButton>
      )}
      {onClear && canClear && (
        <ControlButton label="Limpar seleção" onClick={onClear}>
          <X className="h-4 w-4" aria-hidden />
        </ControlButton>
      )}
    </div>
  );
}
