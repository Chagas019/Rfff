/** "agora", "há 12 min", "há 3 h", "ontem", "há 4 dias". */
export function timeAgo(iso: string | Date, now = new Date()): string {
  const t = typeof iso === 'string' ? new Date(iso) : iso;
  const s = Math.max(0, Math.round((now.getTime() - t.getTime()) / 1000));
  if (s < 60) return 'agora';
  const m = Math.round(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ontem' : `há ${d} dias`;
}

export const clock = (d: Date | string) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
export const dayShort = (d: Date | string) => new Date(d).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace('.', '');
