import { EffectComposer, Bloom, BrightnessContrast, N8AO, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { QUALITY } from '../config/quality';
import { useExperience } from '../store/useExperience';

/**
 * Pós-processamento discreto: oclusão de ambiente (N8AO) para o contato entre
 * objetos, bloom só para fontes realmente brilhantes (LEDs, lâmpadas), SMAA,
 * tone mapping ACES e vinheta leve. Desligado no perfil "baixa".
 */
export function PostFX() {
  const quality = useExperience((s) => s.quality);
  const time = useExperience((s) => s.time);
  const mode = useExperience((s) => s.mode);
  const q = QUALITY[quality];
  if (!q.postprocessing) return null;
  const interior = mode === 'walk';
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {q.ao ? <N8AO halfRes={quality !== 'ultra'} aoRadius={interior ? 1.2 : 2.2} distanceFalloff={1} intensity={interior ? 2.4 : 2.0} quality={quality === 'ultra' ? 'high' : 'medium'} /> : <></>}
      {q.bloom && time !== 'day' ? <Bloom mipmapBlur luminanceThreshold={time === 'night' ? 1.1 : 1.4} luminanceSmoothing={0.25} intensity={time === 'night' ? 0.8 : 0.45} radius={0.65} /> : <></>}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <BrightnessContrast brightness={time === 'day' ? -0.02 : 0} contrast={time === 'day' ? 0.1 : 0.05} />
      <SMAA />
      <Vignette eskil={false} offset={0.28} darkness={0.42} />
    </EffectComposer>
  );
}
