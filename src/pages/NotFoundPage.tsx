import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { ArrowLeft, CalendarDays, Trophy, Users } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260713_234424_b1332b69-2e69-4302-8dbc-40f86846afbd.mp4';
const EASE = [0.16, 1, 0.3, 1] as const;

const SHORTCUTS = [
  { to: '/calendario', label: 'Calendário', icon: CalendarDays },
  { to: '/classificacao', label: 'Classificação', icon: Trophy },
  { to: '/pilotos', label: 'Pilotos', icon: Users },
];

/** "404" gigante: estica na vertical até ocupar a tela (altura da janela ÷ altura do texto × 1,4). */
function useScaleY(ref: React.RefObject<HTMLElement>) {
  const [scaleY, setScaleY] = useState(1);
  useLayoutEffect(() => {
    const measure = () => {
      const h = ref.current?.offsetHeight;
      if (h) setScaleY((window.innerHeight / h) * 1.4);
    };
    measure();
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => window.removeEventListener('resize', measure);
  }, [ref]);
  return scaleY;
}

/** Página 404 em tela cheia: degradê vermelho da largada, "404" gigante e vídeo no centro. */
export function NotFoundPage() {
  const textRef = useRef<HTMLDivElement>(null);
  const scaleY = useScaleY(textRef);
  const reduce = useReducedMotion();

  // o "404" acompanha o ponteiro de leve (paralaxe)
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 18 });
  const sy = useSpring(py, { stiffness: 60, damping: 18 });
  const bgX = useTransform(sx, (v) => v * -24);
  const bgY = useTransform(sy, (v) => v * -16);
  const fgX = useTransform(sx, (v) => v * 14);
  const fgY = useTransform(sy, (v) => v * 10);
  useEffect(() => {
    if (reduce) return;
    const onMove = (e: PointerEvent) => {
      px.set(e.clientX / window.innerWidth - 0.5);
      py.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [px, py, reduce]);

  return (
    <section
      className="relative flex h-[100svh] w-full flex-col overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #E10600 0%, #8B0000 70%, #1a0000 100%)' }}
      aria-labelledby="nf-title"
    >
      {/* "404" gigante + oval branco, com máscara que some embaixo */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          x: bgX,
          y: bgY,
          opacity: 0.8,
          maskImage: 'linear-gradient(to bottom, black 40%, transparent 95%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 95%)',
        }}
        aria-hidden
      >
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={reduce ? false : { opacity: 0, scale: 1.25, filter: 'blur(24px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.4, ease: EASE }}
        >
          <div
            ref={textRef}
            className="whitespace-nowrap font-albert font-black leading-none tracking-tighter text-white"
            style={{ fontSize: 'clamp(200px, 48vw, 800px)', transform: `scale(1.15, ${scaleY * 1.4})` }}
          >
            404
          </div>
        </motion.div>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="h-[22vh] rounded-full bg-white sm:h-[26vh] md:h-[50vh]"
            style={{ width: 'clamp(120px, 20vw, 400px)', transform: `scaleY(${scaleY})`, transformOrigin: 'center' }}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.9, ease: EASE }}
          />
        </div>
      </motion.div>

      {/* vídeo central */}
      <motion.div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        style={{ marginTop: 'calc(-6vh - 40px)', x: fgX, y: fgY }}
        aria-hidden
      >
        <motion.div
          className="h-[85vh] w-[120vw] sm:h-[70vh] sm:w-[70vw] md:h-[78vh] md:w-[62vw]"
          initial={reduce ? false : { opacity: 0, y: 40, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.35, duration: 1.1, ease: EASE }}
        >
          <video src={VIDEO} autoPlay loop muted playsInline className="pointer-events-none h-full w-full object-contain mix-blend-darken" />
        </motion.div>
      </motion.div>

      {/* texto e ações */}
      <div className="relative z-30 mt-auto flex flex-col items-center px-4 pb-8 text-center sm:pb-16">
        <motion.p
          className="mb-2 text-[13px] text-white/70"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.9, ease: EASE }}
        >
          Erro 404 · página não encontrada
        </motion.p>
        <div className="overflow-hidden pb-1">
          <h1 id="nf-title" className="mb-4 font-albert text-[clamp(28px,4vw,48px)] font-semibold leading-[0.95] tracking-[-0.04em] text-white animate-speed-reveal anim-delay-700">
            Saiu da pista! Esta página não existe.
          </h1>
        </div>
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.9, ease: EASE }}
        >
          <Link
            to="/"
            className="group inline-flex items-center gap-2 bg-white px-6 py-3 text-sm font-semibold text-black shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)] transition-all hover:scale-105 hover:bg-gold sm:px-8 sm:py-4 sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 sm:h-5 sm:w-5" aria-hidden />
            Voltar ao início
          </Link>
          <nav className="flex flex-wrap justify-center gap-2" aria-label="Atalhos">
            {SHORTCUTS.map((s) => (
              <Link
                key={s.to}
                to={s.to}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/25"
              >
                <s.icon className="h-3.5 w-3.5" aria-hidden />
                {s.label}
              </Link>
            ))}
          </nav>
        </motion.div>
      </div>
    </section>
  );
}
