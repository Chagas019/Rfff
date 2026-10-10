import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { isSoundOn, onSoundChange, playPassSound, setSoundOn } from '../services/sound';

export function SoundToggle() {
  const [on, setOn] = useState(isSoundOn);
  useEffect(() => onSoundChange(setOn), []);
  return (
    <button
      type="button"
      className="btn-icon"
      onClick={() => { const next = !on; setSoundOn(next); if (next) playPassSound(); }}
      aria-pressed={on}
      aria-label={on ? 'Desligar som das transições' : 'Ligar som das transições'}
      title={on ? 'Som ligado' : 'Som desligado'}
    >
      {on ? <Volume2 className="h-4 w-4" aria-hidden /> : <VolumeX className="h-4 w-4" aria-hidden />}
    </button>
  );
}
