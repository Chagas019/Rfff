import { gsap } from 'gsap';
import { useEffect, useRef } from 'react';
import type { StatItem } from '../data/types';
import { prefersReducedMotion } from '../hooks/useReducedMotion';

function format(v: number, decimals: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Número que conta de 0 até o valor quando aparece na tela. */
export function Counter({ item }: { item: StatItem }) {
  const ref = useRef<HTMLSpanElement>(null);
  const decimals = item.decimals ?? 0;
  const final = `${item.prefix ?? ''}${format(item.value, decimals)}${item.suffix ?? ''}`;

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return;
    const state = { v: 0 };
    let tween: gsap.core.Tween | null = null;
    el.textContent = `${item.prefix ?? ''}${format(0, decimals)}${item.suffix ?? ''}`;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        tween = gsap.to(state, {
          v: item.value,
          duration: 2.2,
          ease: 'expo.out',
          onUpdate: () => {
            el.textContent = `${item.prefix ?? ''}${format(state.v, decimals)}${item.suffix ?? ''}`;
          },
        });
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      tween?.kill();
      el.textContent = final;
    };
  }, [item, decimals, final]);

  return (
    <span ref={ref} className="tabular-nums" aria-label={final}>
      {final}
    </span>
  );
}
