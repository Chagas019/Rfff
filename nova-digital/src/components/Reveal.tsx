import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLayoutEffect, useRef, type ElementType, type ReactNode } from 'react';
import { prefersReducedMotion } from '../hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

interface MaskTitleProps {
  /** Cada item vira uma linha que sobe por trás de uma máscara. */
  lines: ReactNode[];
  as?: ElementType;
  className?: string;
  lineClassName?: (index: number) => string;
  id?: string;
  /** `scroll`: anima ao entrar na tela. `manual`: quem controla é a timeline da abertura. */
  trigger?: 'scroll' | 'manual';
  delay?: number;
}

/** Título com linhas reveladas por máscara e movimento vertical. */
export function MaskTitle({ lines, as: Tag = 'h2', className = '', lineClassName, id, trigger = 'scroll', delay = 0 }: MaskTitleProps) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || trigger !== 'scroll' || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll('.mask-line > span'), {
        yPercent: 110,
        rotate: 2,
        duration: 1.15,
        ease: 'expo.out',
        stagger: 0.09,
        delay,
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
    }, el);
    return () => ctx.revert();
  }, [trigger, delay]);

  return (
    <Tag ref={ref} id={id} className={className}>
      {lines.map((line, i) => (
        <span key={i} className="mask-line">
          <span className={lineClassName?.(i) ?? ''}>{line}</span>
        </span>
      ))}
    </Tag>
  );
}

interface FadeUpProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  delay?: number;
  y?: number;
  stagger?: string;
}

/** Elemento (ou filhos, com `stagger`) que sobe e aparece ao entrar na tela. */
export function FadeUp({ children, className = '', as: Tag = 'div', delay = 0, y = 28, stagger }: FadeUpProps) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const targets = stagger ? el.querySelectorAll(stagger) : el;
      gsap.from(targets, {
        y,
        opacity: 0,
        filter: 'blur(6px)',
        duration: 1,
        ease: 'power3.out',
        delay,
        stagger: stagger ? 0.08 : 0,
        clearProps: 'filter',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    }, el);
    return () => ctx.revert();
  }, [delay, y, stagger]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
