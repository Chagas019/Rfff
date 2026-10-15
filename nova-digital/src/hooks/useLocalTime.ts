import { useEffect, useState } from 'react';

/** Hora local de um fuso IANA, atualizada a cada 30 s. */
export function useLocalTime(timezone: string | undefined): string {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  if (!timezone) return '';
  try {
    return new Intl.DateTimeFormat('pt-BR', { timeZone: timezone, hour: '2-digit', minute: '2-digit' }).format(now);
  } catch {
    return '';
  }
}
