import { useEffect } from 'react';
import { TOUR } from '../../data/tour';
import { prefersReducedMotion } from '../../config/quality';
import { useExperience } from '../../store/useExperience';

/**
 * Visita guiada: a cada passo aplica o corte, horário e esquadrias do roteiro,
 * pede o enquadramento à câmera e agenda o próximo passo (pausa/avanço pela UI).
 */
export function TourController() {
  const mode = useExperience((s) => s.mode);
  const step = useExperience((s) => s.tourStep);
  const playing = useExperience((s) => s.tourPlaying);

  useEffect(() => {
    if (mode !== 'tour') return;
    const st = useExperience.getState();
    const s = TOUR[step];
    if (!s) return;
    st.setCutLevel(s.cut ?? null);
    if (s.time) st.setTime(s.time);
    st.selectRoom(s.room ?? null);
    for (const id of s.open ?? []) if (!st.doors[id]) st.toggleDoor(id);
    if (s.fade && step > 0) {
      // corte seco escondido por um fade, para a câmera não atravessar paredes
      st.requestFade();
      const id = window.setTimeout(() => st.requestShot({ position: s.position, target: s.target, smooth: false }), 380);
      return () => window.clearTimeout(id);
    }
    st.requestShot({ position: s.position, target: s.target, smooth: true, travel: s.travel });
  }, [mode, step]);

  useEffect(() => {
    if (mode !== 'tour' || !playing) return;
    const s = TOUR[step];
    if (!s) return;
    const reduced = prefersReducedMotion();
    const ms = (s.hold + (reduced ? 0.3 : s.travel * 1.6)) * 1000;
    const id = window.setTimeout(() => {
      const st = useExperience.getState();
      if (step + 1 < TOUR.length) st.setTourStep(step + 1);
      else {
        st.setTourPlaying(false);
        st.notify('Visita concluída — explore livremente.');
        st.setMode('exterior');
      }
    }, ms);
    return () => window.clearTimeout(id);
  }, [mode, step, playing]);

  return null;
}
