import { useEffect, useRef, useState } from 'react';

const CHECK_MS = 5 * 60 * 1000;

/**
 * Atualização automática do próprio site: de tempos em tempos consulta /version.json.
 * Quando há uma publicação nova na Vercel, devolve `true` — o App recarrega sozinho
 * na próxima troca de página (ou na hora, se a aba estiver em segundo plano).
 */
export function useAppUpdate(): boolean {
  const [available, setAvailable] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    if (import.meta.env.DEV || typeof fetch === 'undefined') return;
    let stopped = false;
    const check = async () => {
      if (stopped || Date.now() - last.current < 30_000) return;
      last.current = Date.now();
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const { id } = (await res.json()) as { id?: string };
        if (id && id !== __BUILD_ID__ && !stopped) {
          if (document.visibilityState === 'hidden') window.location.reload();
          else setAvailable(true);
        }
      } catch {
        /* offline: tenta na próxima */
      }
    };
    const id = setInterval(check, CHECK_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', check);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', check);
    };
  }, []);

  return available;
}
