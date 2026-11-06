import type { ReactNode } from 'react';
import { useInView } from '../hooks/useInView';

/** Monta (e busca os dados de) uma seção só quando ela se aproxima da tela. */
export function Lazy({ children, minHeight = 320 }: { children: ReactNode; minHeight?: number }) {
  const { ref, inView } = useInView<HTMLDivElement>('400px');
  return <div ref={ref} style={inView ? undefined : { minHeight }}>{inView ? children : null}</div>;
}
