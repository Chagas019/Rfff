const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

/** "06 – 08 mar" ou "30 out – 01 nov" a partir de datas AAAA-MM-DD. */
export function formatWeekend(start: string, end: string): string {
  const [, sm, sd] = start.split('-').map(Number);
  const [, em, ed] = end.split('-').map(Number);
  if (sm === em) return `${String(sd).padStart(2, '0')} – ${String(ed).padStart(2, '0')} ${MONTHS[em - 1]}`;
  return `${String(sd).padStart(2, '0')} ${MONTHS[sm - 1]} – ${String(ed).padStart(2, '0')} ${MONTHS[em - 1]}`;
}

/** Data e hora no fuso do usuário. */
export function formatDateTime(iso: string | Date, opts: Intl.DateTimeFormatOptions = {}): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', ...opts,
  }).format(d);
}

export function userTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'local';
  }
}

/** Mês (0–11) do último dia do fim de semana. */
export function raceMonth(weekendEnd: string): number {
  return Number(weekendEnd.split('-')[1]) - 1;
}

/** Converte código ISO-3166 em emoji de bandeira. */
export function flagEmoji(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function age(birthDate: string, now: Date = new Date()): number {
  const b = new Date(`${birthDate}T00:00:00`);
  let a = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
  return a;
}
