import { gsap } from 'gsap';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../hooks/useReducedMotion';
import { completeIntro, introState } from '../lib/sceneState';

interface LoadingScreenProps {
  /** `true` quando o globo (ou o fallback) está pronto. */
  ready: boolean;
  onDone?: () => void;
}

/** Tempo máximo esperando as texturas antes de seguir mesmo assim. */
const MAX_WAIT = 7;

/**
 * Sequência de abertura:
 * tela preta → linha luminosa no centro → expansão horizontal → partículas → globo surge
 * → atmosfera acende → título com máscara → textos secundários → navegação.
 * Qualquer clique, tecla, roda do mouse ou toque acelera a sequência.
 */
export function LoadingScreen({ ready, onDone }: LoadingScreenProps) {
  const overlay = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLParagraphElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const readyRef = useRef(ready);
  const [gone, setGone] = useState(false);
  const [waitingLong, setWaitingLong] = useState(false);

  readyRef.current = ready;

  useLayoutEffect(() => {
    const reduced = prefersReducedMotion();
    const title = '[data-intro="hero-title"] .mask-line > span';
    const sub = '[data-intro="hero-sub"]';
    const nav = '[data-intro="nav"]';

    if (reduced) {
      completeIntro();
      setGone(true);
      onDone?.();
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(title, { yPercent: 115 });
      gsap.set(sub, { opacity: 0, y: 22 });
      gsap.set(nav, { opacity: 0, y: -16 });
      gsap.set(line.current, { scaleX: 0, opacity: 1 });
      Object.assign(introState, { particles: 0, globe: 0, atmosphere: 0 });

      const t = gsap.timeline({ defaults: { ease: 'expo.out' } });
      t.to(line.current, { scaleX: 0.06, duration: 0.55, ease: 'power2.out' }, 0.25)
        .to(line.current, { scaleX: 1, duration: 1.0, ease: 'expo.inOut' }, 0.85)
        .to(label.current, { opacity: 1, duration: 0.5 }, 1.2)
        .to(introState, { particles: 1, duration: 1.6, ease: 'power2.out' }, 1.35)
        .addLabel('wait', 1.9)
        // pausa aqui até o globo estar pronto
        .call(
          () => {
            if (!readyRef.current) t.pause();
          },
          [],
          'wait',
        )
        .addLabel('reveal')
        .to(label.current, { opacity: 0, duration: 0.3 }, 'reveal')
        .to(line.current, { scaleY: 0.4, opacity: 0, duration: 1.1, ease: 'power2.inOut' }, 'reveal')
        .to(overlay.current, { opacity: 0, duration: 1.1, ease: 'power2.inOut' }, 'reveal')
        .to(introState, { globe: 1, duration: 1.8, ease: 'power3.out' }, 'reveal+=0.1')
        .to(introState, { atmosphere: 1, duration: 2.2, ease: 'power2.out' }, 'reveal+=0.45')
        .to(title, { yPercent: 0, duration: 1.3, stagger: 0.13 }, 'reveal+=0.55')
        .to(sub, { opacity: 1, y: 0, duration: 1.1, stagger: 0.08, ease: 'power3.out' }, 'reveal+=1.0')
        .to(nav, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', clearProps: 'transform' }, 'reveal+=1.2')
        .call(() => {
          setGone(true);
          onDone?.();
        });
      tl.current = t;
    });

    // atalho: interação do usuário acelera a abertura
    const skip = () => {
      const t = tl.current;
      if (!t) return;
      t.timeScale(4);
      if (readyRef.current && t.paused()) t.play();
    };
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, skip, { passive: true, once: true }));

    const slow = window.setTimeout(() => setWaitingLong(true), 3500);
    const giveUp = window.setTimeout(() => {
      readyRef.current = true;
      tl.current?.play();
    }, MAX_WAIT * 1000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, skip));
      window.clearTimeout(slow);
      window.clearTimeout(giveUp);
      ctx.revert();
      completeIntro();
    };
    // a abertura roda uma única vez
  }, []);

  // quando o globo fica pronto, continua a timeline pausada
  useEffect(() => {
    if (ready && tl.current?.paused()) tl.current.play();
  }, [ready]);

  if (gone) return null;

  return (
    <div
      ref={overlay}
      className="fixed inset-0 z-[80] grid place-items-center bg-void"
      role="status"
      aria-live="polite"
      aria-label={ready ? 'Experiência pronta' : 'Carregando a experiência'}
    >
      <div
        ref={line}
        className="absolute left-0 right-0 top-1/2 h-px origin-center bg-gradient-to-r from-transparent via-ink to-transparent"
        aria-hidden
      />
      <p ref={label} className="eyebrow absolute top-[calc(50%+22px)] opacity-0">
        {waitingLong && !ready ? 'Carregando o planeta…' : 'Preparando o planeta'}
      </p>
    </div>
  );
}
