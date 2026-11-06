import { useEffect, useRef, useState } from 'react';

/** true quando o elemento chega perto da tela (para carregar seções sob demanda). */
export function useInView<T extends Element>(rootMargin = '300px') {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    if (inView || !ref.current) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } }, { rootMargin });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [inView, rootMargin]);
  return { ref, inView };
}
