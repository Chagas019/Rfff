import { motion, useTransform, type MotionValue } from 'framer-motion';
import { helmetImages } from '../data/carImages';

/**
 * Capacete com transição futurística (controlada pelo progresso 0–1):
 *  1. surge como holograma em linhas, com falhas de sinal (glitch);
 *  2. um anel de varredura sobe e "materializa" o capacete real;
 *  3. inclina em 3D, com anéis orbitando à frente e atrás e marcações de HUD.
 * Imagens: public/helmets/leclerc.png (recorte) e leclerc-holo.png (contornos).
 */

const HUD: { label: string; x: number; y: number; side: 'left' | 'right' }[] = [
  { label: 'Viseira com faixa de Zylon', x: 92, y: 47, side: 'right' },
  { label: 'Casco de fibra de carbono', x: 96, y: 20, side: 'right' },
  { label: 'Homologação FIA 8860', x: 96, y: 74, side: 'right' },
];

function Ring({ p, tilt, size, color, dur, reverse, front }: { p: MotionValue<number>; tilt: number; size: number; color: string; dur: number; reverse?: boolean; front: boolean }) {
  const rot = useTransform(p, [0, 1], reverse ? [40, -320] : [-40, 320]);
  const opacity = useTransform(p, [0, 0.15, 0.9, 1], [0, 0.9, 0.9, 0.5]);
  // metade de trás (atrás do capacete) ou da frente (sobre ele)
  const clip = front ? 'inset(50% 0 0 0)' : 'inset(0 0 50% 0)';
  return (
    <motion.div className="pointer-events-none absolute left-1/2 top-1/2" style={{ width: `${size}%`, aspectRatio: '1', x: '-50%', y: '-50%', rotateX: tilt, opacity, clipPath: clip }}>
      <motion.svg viewBox="0 0 100 100" className="h-full w-full" style={{ rotate: rot }} aria-hidden>
        <circle cx="50" cy="50" r="48" fill="none" stroke={color} strokeWidth="0.35" strokeDasharray={`${dur} 4 1 4`} />
        <circle cx="50" cy="2" r="1.1" fill={color} />
      </motion.svg>
    </motion.div>
  );
}

export function HelmetHolo({ progress }: { progress: MotionValue<number> }) {
  const img = helmetImages.leclerc;
  // 0–0.18 entrada com glitch, 0.15–0.6 varredura, depois inclinação e HUD
  const enter = useTransform(progress, [0, 0.12], [0, 1]);
  const scale = useTransform(progress, [0, 0.2, 1], [0.6, 1, 1.04]);
  const reveal = useTransform(progress, [0.15, 0.6], [0, 100], { clamp: true });
  const solidClip = useTransform(reveal, (r) => `inset(${100 - r}% 0 0 0)`);
  const holoClip = useTransform(reveal, (r) => `inset(0 0 ${r}% 0)`);
  const scanTop = useTransform(reveal, (r) => `${100 - r}%`);
  const scanOpacity = useTransform(progress, [0.13, 0.17, 0.57, 0.62], [0, 1, 1, 0]);
  const rotY = useTransform(progress, [0.1, 0.6, 1], [-35, 0, 22]);
  const rotX = useTransform(progress, [0.1, 0.6, 1], [14, 0, -5]);
  const glitchX = useTransform(progress, [0, 0.03, 0.05, 0.07, 0.09, 0.12], [0, 14, -10, 6, -3, 0]);
  const holoGlow = useTransform(progress, [0.55, 0.75], [1, 0.25]);
  const hudOpacity = useTransform(progress, [0.62, 0.75], [0, 1]);
  const solidGlow = useTransform(progress, [0.55, 0.7], ['drop-shadow(0 0 0px rgba(225,6,0,0))', 'drop-shadow(0 30px 40px rgba(0,0,0,0.6)) drop-shadow(0 0 40px rgba(225,6,0,0.35))']);

  if (!img) return null;

  return (
    <div className="pointer-events-none relative mx-auto aspect-[510/611] h-[46%] max-h-[560px] sm:h-[52%] lg:h-[62%]" style={{ perspective: 1200 }}>
      {/* brilho e grade de fundo */}
      <motion.div style={{ opacity: enter }} className="absolute -inset-[30%] rounded-full bg-[radial-gradient(circle,rgba(225,6,0,0.28),transparent_60%)] blur-2xl" aria-hidden />
      <motion.div style={{ opacity: enter }} className="absolute -inset-[20%] [background-image:linear-gradient(rgba(255,60,48,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,60,48,0.12)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(circle,black,transparent_65%)]" aria-hidden />

      {/* anéis — metade de trás */}
      <Ring p={progress} tilt={72} size={150} color="#ff3b30" dur={30} front={false} />
      <Ring p={progress} tilt={64} size={175} color="#60a5fa" dur={14} reverse front={false} />

      <motion.div className="absolute inset-0 [transform-style:preserve-3d]" style={{ scale, rotateY: rotY, rotateX: rotX, x: glitchX, opacity: enter }}>
        {/* capacete real, revelado de baixo para cima */}
        <motion.img src={img.src} alt={img.caption} draggable={false} className="absolute inset-0 h-full w-full select-none object-contain" style={{ clipPath: solidClip, filter: solidGlow }} />
        {/* holograma em linhas (parte ainda não materializada) */}
        <motion.img src="/helmets/leclerc-holo.png" alt="" aria-hidden draggable={false} className="absolute inset-0 h-full w-full select-none object-contain mix-blend-screen" style={{ clipPath: holoClip, opacity: holoGlow }} />
        <motion.img src="/helmets/leclerc-holo.png" alt="" aria-hidden draggable={false} className="absolute inset-0 h-full w-full select-none object-contain opacity-60 mix-blend-screen blur-[6px]" style={{ clipPath: holoClip }} />
        {/* anel de varredura */}
        <motion.div className="absolute inset-x-[-12%]" style={{ top: scanTop, opacity: scanOpacity }} aria-hidden>
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#ff6a5f] to-transparent shadow-[0_0_18px_4px_rgba(255,59,48,0.8)]" />
          <div className="h-10 w-full -translate-y-full bg-gradient-to-t from-race/30 to-transparent" />
        </motion.div>
      </motion.div>

      {/* anéis — metade da frente */}
      <Ring p={progress} tilt={72} size={150} color="#ff3b30" dur={30} front />
      <Ring p={progress} tilt={64} size={175} color="#60a5fa" dur={14} reverse front />

      {/* marcações de HUD */}
      <motion.div style={{ opacity: hudOpacity }} className="absolute inset-0 hidden sm:block">
        {HUD.map((h) => (
          <div key={h.label} className="absolute flex items-center gap-2" style={{ top: `${h.y}%`, ...(h.side === 'left' ? { right: `${100 - h.x}%`, flexDirection: 'row-reverse' } : { left: `${h.x}%` }) }}>
            <span className="h-2 w-2 rounded-full bg-race shadow-[0_0_10px_#e10600]" />
            <span className="h-px w-14 bg-gradient-to-r from-race to-white/40" />
            <span className="glass whitespace-nowrap rounded-md border border-white/10 px-2 py-1 font-condensed text-xs uppercase tracking-[0.15em] text-white">{h.label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
