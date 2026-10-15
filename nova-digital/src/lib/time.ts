/** Deslocamento (em minutos) de um fuso IANA em relação ao UTC, na data informada. */
export function utcOffsetMinutes(timezone: string, date = new Date()): number | null {
  try {
    const name = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'shortOffset' })
      .formatToParts(date)
      .find((p) => p.type === 'timeZoneName')?.value;
    if (!name) return null;
    if (name === 'GMT') return 0;
    const m = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(name);
    if (!m) return null;
    const sign = m[1] === '-' ? -1 : 1;
    return sign * (Number(m[2]) * 60 + Number(m[3] ?? 0));
  } catch {
    return null;
  }
}

/** Diferença de fuso entre duas cidades, formatada ("+11 h", "−3 h 30 min", "mesmo fuso"). */
export function formatTzDiff(fromTz: string, toTz: string, date = new Date()): string {
  const a = utcOffsetMinutes(fromTz, date);
  const b = utcOffsetMinutes(toTz, date);
  if (a === null || b === null) return '—';
  const diff = b - a;
  if (diff === 0) return 'mesmo fuso';
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 60);
  const min = abs % 60;
  return `${diff > 0 ? '+' : '−'}${h} h${min ? ` ${min} min` : ''}`;
}
