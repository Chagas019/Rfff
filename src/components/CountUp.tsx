import { useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

/** Conta de 0 até `target` com ease-out cúbico (como os "Season Points" da landing), começando depois de `delay` ms. */
export function useCountUp(target: number | null, delay = 0, duration = 2200, start = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === null || !start) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setValue(target); return; }
    let raf = 0;
    const timer = setTimeout(() => {
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        setValue(p < 1 ? Math.round(target * (1 - Math.pow(1 - p, 3))) : target);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [target, delay, duration, start]);
  return value;
}

/** Número que conta quando aparece na tela. Mantém o valor final para leitores de tela. */
export function CountUp({ value, delay = 0, duration = 1800, className, style }: { value: number; delay?: number; duration?: number; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const n = useCountUp(value, delay, duration, inView);
  return (
    <span ref={ref} className={className} style={style}>
      <span aria-hidden>{Number.isInteger(n) ? n : n.toFixed(1)}</span>
      <span className="sr-only">{value}</span>
    </span>
  );
}
