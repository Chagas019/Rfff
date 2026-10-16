import { useCallback, useEffect, useRef, useState } from 'react';
import type { AsyncState } from '../types';

interface Options {
  /** Recarrega sozinho a cada N ms enquanto a aba estiver visível (mantém os dados antigos na tela). */
  refreshMs?: number;
}

/**
 * Executa uma função assíncrona com estados de carregamento/erro e opção de tentar de novo.
 * Com `refreshMs`, os dados se atualizam automaticamente em segundo plano — e também quando
 * a pessoa volta para a aba ou a internet reconecta.
 */
export function useAsync<T>(fn: (signal: AbortSignal) => Promise<T>, deps: unknown[], { refreshMs }: Options = {}) {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const hasData = useRef(false);
  const refreshRef = useRef<() => void>();

  useEffect(() => {
    const controller = new AbortController();
    hasData.current = false;
    setState({ status: 'loading' });
    fn(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        hasData.current = true;
        setState({ status: 'success', data });
        setUpdatedAt(new Date());
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', error: err instanceof Error ? err.message : 'Erro inesperado.' });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  // atualização silenciosa em segundo plano
  useEffect(() => {
    if (!refreshMs) return;
    let controller: AbortController | null = null;
    let last = Date.now();
    const refresh = () => {
      if (document.visibilityState !== 'visible' || controller) return;
      controller = new AbortController();
      const c = controller;
      last = Date.now();
      setRefreshing(true);
      fnRef.current(c.signal)
        .then((data) => {
          if (c.signal.aborted) return;
          hasData.current = true;
          setState({ status: 'success', data });
          setUpdatedAt(new Date());
        })
        .catch(() => {
          // falha temporária: mantém o que já está na tela; se ainda não havia nada, tenta de novo
          if (!c.signal.aborted && !hasData.current) setAttempt((a) => a + 1);
        })
        .finally(() => {
          if (controller === c) controller = null;
          if (!c.signal.aborted) setRefreshing(false);
        });
    };
    refreshRef.current = refresh;
    const id = setInterval(refresh, refreshMs);
    const onWake = () => { if (Date.now() - last > Math.min(refreshMs, 60_000)) refresh(); };
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('online', refresh);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('online', refresh);
      controller?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshMs, ...deps]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  /** Atualiza agora sem esconder os dados atuais (só funciona com `refreshMs`). */
  const refreshNow = useCallback(() => (refreshRef.current ? refreshRef.current() : setAttempt((a) => a + 1)), []);
  return { state, retry, refreshNow, updatedAt, refreshing };
}
