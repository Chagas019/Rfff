import type { Race, RaceSession, SessionType } from '../types';

/**
 * CALENDÁRIO OFICIAL DA TEMPORADA 2026 DE FÓRMULA 1
 * ----------------------------------------------------------------------------
 * Fonte das DATAS: calendário publicado pela Formula 1 / FIA
 *   https://www.formula1.com/en/racing/2026
 *   Calendário de Sprints: https://www.formula1.com/en/latest/article/formula-1-and-fia-announce-2026-sprint-calendar.3PyLPAazrBNe8kQIS3wOfY
 * Revisão de março/2026: os GPs do Bahrein e da Arábia Saudita foram cancelados
 * pela F1 por causa do conflito no Oriente Médio e não foram substituídos
 * (temporada com 22 etapas). As rodadas abaixo seguem a numeração revisada.
 *
 * HORÁRIOS: os horários das sessões abaixo são ESTIMADOS a partir do padrão de
 * grade de cada evento (`timesConfirmed: false`). Antes de usar em produção,
 * confira os horários oficiais em formula1.com e atualize este arquivo.
 *
 * COMO ATUALIZAR: edite apenas este arquivo. Todas as páginas (calendário,
 * contagem regressiva, circuitos e busca) leem estes dados.
 * Última revisão: 2026-10-10.
 */

type Day = 'd1' | 'd2' | 'd3';
type Slot = [SessionType, Day, string];

const STANDARD: Slot[] = [
  ['fp1', 'd1', '13:30'],
  ['fp2', 'd1', '17:00'],
  ['fp3', 'd2', '12:30'],
  ['quali', 'd2', '16:00'],
  ['race', 'd3', '15:00'],
];

const SPRINT: Slot[] = [
  ['fp1', 'd1', '12:30'],
  ['sprintQuali', 'd1', '16:30'],
  ['sprint', 'd2', '12:00'],
  ['quali', 'd2', '16:00'],
  ['race', 'd3', '15:00'],
];

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Monta as sessões a partir do primeiro dia, do fuso local e de um modelo de horários. */
function sessions(firstDay: string, utcOffset: string, template: Slot[], overrides: Partial<Record<SessionType, string>> = {}): RaceSession[] {
  const days: Record<Day, string> = { d1: firstDay, d2: addDays(firstDay, 1), d3: addDays(firstDay, 2) };
  return template.map(([type, day, time]) => ({
    type,
    start: `${days[day]}T${overrides[type] ?? time}:00${utcOffset}`,
  }));
}

export const SEASON = 2026;

export const races: Race[] = [
  {
    id: 'australia', round: 1, name: 'GP da Austrália', officialName: 'Formula 1 Australian Grand Prix 2026',
    country: 'Austrália', countryCode: 'AU', city: 'Melbourne', circuitId: 'albert-park', sprint: false,
    weekendStart: '2026-03-06', weekendEnd: '2026-03-08', timesConfirmed: false,
    sessions: sessions('2026-03-06', '+11:00', STANDARD, { fp1: '12:30', fp2: '16:00' }),
  },
  {
    id: 'china', round: 2, name: 'GP da China', officialName: 'Formula 1 Chinese Grand Prix 2026',
    country: 'China', countryCode: 'CN', city: 'Xangai', circuitId: 'shanghai', sprint: true,
    weekendStart: '2026-03-13', weekendEnd: '2026-03-15', timesConfirmed: false,
    sessions: sessions('2026-03-13', '+08:00', SPRINT, { fp1: '11:30', sprintQuali: '15:30', sprint: '11:00', quali: '15:00' }),
  },
  {
    id: 'japan', round: 3, name: 'GP do Japão', officialName: 'Formula 1 Japanese Grand Prix 2026',
    country: 'Japão', countryCode: 'JP', city: 'Suzuka', circuitId: 'suzuka', sprint: false,
    weekendStart: '2026-03-27', weekendEnd: '2026-03-29', timesConfirmed: false,
    sessions: sessions('2026-03-27', '+09:00', STANDARD, { fp1: '11:30', fp2: '15:00', fp3: '11:30', quali: '15:00', race: '14:00' }),
  },
  {
    id: 'bahrain', round: null, name: 'GP do Bahrein', officialName: 'Formula 1 Bahrain Grand Prix 2026',
    country: 'Bahrein', countryCode: 'BH', city: 'Sakhir', circuitId: 'bahrain', sprint: false,
    cancelled: true, cancelledNote: 'Cancelado pela F1 em março/2026 devido ao conflito no Oriente Médio. Não foi substituído.',
    weekendStart: '2026-04-10', weekendEnd: '2026-04-12', timesConfirmed: false, sessions: [],
  },
  {
    id: 'saudi-arabia', round: null, name: 'GP da Arábia Saudita', officialName: 'Formula 1 Saudi Arabian Grand Prix 2026',
    country: 'Arábia Saudita', countryCode: 'SA', city: 'Jidá', circuitId: 'jeddah', sprint: false,
    cancelled: true, cancelledNote: 'Cancelado pela F1 em março/2026 devido ao conflito no Oriente Médio. Não foi substituído.',
    weekendStart: '2026-04-17', weekendEnd: '2026-04-19', timesConfirmed: false, sessions: [],
  },
  {
    id: 'miami', round: 4, name: 'GP de Miami', officialName: 'Formula 1 Miami Grand Prix 2026',
    country: 'Estados Unidos', countryCode: 'US', city: 'Miami', circuitId: 'miami', sprint: true,
    weekendStart: '2026-05-01', weekendEnd: '2026-05-03', timesConfirmed: false,
    sessions: sessions('2026-05-01', '-04:00', SPRINT, { race: '16:00' }),
  },
  {
    id: 'canada', round: 5, name: 'GP do Canadá', officialName: 'Formula 1 Grand Prix du Canada 2026',
    country: 'Canadá', countryCode: 'CA', city: 'Montreal', circuitId: 'montreal', sprint: true,
    weekendStart: '2026-05-22', weekendEnd: '2026-05-24', timesConfirmed: false,
    sessions: sessions('2026-05-22', '-04:00', SPRINT, { race: '16:00' }),
  },
  {
    id: 'monaco', round: 6, name: 'GP de Mônaco', officialName: 'Formula 1 Grand Prix de Monaco 2026',
    country: 'Mônaco', countryCode: 'MC', city: 'Monte Carlo', circuitId: 'monaco', sprint: false,
    weekendStart: '2026-06-05', weekendEnd: '2026-06-07', timesConfirmed: false,
    sessions: sessions('2026-06-05', '+02:00', STANDARD),
  },
  {
    id: 'barcelona', round: 7, name: 'GP de Barcelona-Catalunha', officialName: 'Formula 1 Gran Premio de Barcelona-Catalunya 2026',
    country: 'Espanha', countryCode: 'ES', city: 'Barcelona', circuitId: 'catalunya', sprint: false,
    weekendStart: '2026-06-12', weekendEnd: '2026-06-14', timesConfirmed: false,
    sessions: sessions('2026-06-12', '+02:00', STANDARD),
  },
  {
    id: 'austria', round: 8, name: 'GP da Áustria', officialName: 'Formula 1 Grosser Preis von Österreich 2026',
    country: 'Áustria', countryCode: 'AT', city: 'Spielberg', circuitId: 'red-bull-ring', sprint: false,
    weekendStart: '2026-06-26', weekendEnd: '2026-06-28', timesConfirmed: false,
    sessions: sessions('2026-06-26', '+02:00', STANDARD),
  },
  {
    id: 'great-britain', round: 9, name: 'GP da Grã-Bretanha', officialName: 'Formula 1 British Grand Prix 2026',
    country: 'Reino Unido', countryCode: 'GB', city: 'Silverstone', circuitId: 'silverstone', sprint: true,
    weekendStart: '2026-07-03', weekendEnd: '2026-07-05', timesConfirmed: false,
    sessions: sessions('2026-07-03', '+01:00', SPRINT),
  },
  {
    id: 'belgium', round: 10, name: 'GP da Bélgica', officialName: 'Formula 1 Belgian Grand Prix 2026',
    country: 'Bélgica', countryCode: 'BE', city: 'Spa-Francorchamps', circuitId: 'spa', sprint: false,
    weekendStart: '2026-07-17', weekendEnd: '2026-07-19', timesConfirmed: false,
    sessions: sessions('2026-07-17', '+02:00', STANDARD),
  },
  {
    id: 'hungary', round: 11, name: 'GP da Hungria', officialName: 'Formula 1 Hungarian Grand Prix 2026',
    country: 'Hungria', countryCode: 'HU', city: 'Budapeste', circuitId: 'hungaroring', sprint: false,
    weekendStart: '2026-07-24', weekendEnd: '2026-07-26', timesConfirmed: false,
    sessions: sessions('2026-07-24', '+02:00', STANDARD),
  },
  {
    id: 'netherlands', round: 12, name: 'GP da Holanda', officialName: 'Formula 1 Dutch Grand Prix 2026',
    country: 'Holanda', countryCode: 'NL', city: 'Zandvoort', circuitId: 'zandvoort', sprint: true,
    weekendStart: '2026-08-21', weekendEnd: '2026-08-23', timesConfirmed: false,
    sessions: sessions('2026-08-21', '+02:00', SPRINT),
  },
  {
    id: 'italy', round: 13, name: 'GP da Itália', officialName: "Formula 1 Gran Premio d'Italia 2026",
    country: 'Itália', countryCode: 'IT', city: 'Monza', circuitId: 'monza', sprint: false,
    weekendStart: '2026-09-04', weekendEnd: '2026-09-06', timesConfirmed: false,
    sessions: sessions('2026-09-04', '+02:00', STANDARD),
  },
  {
    id: 'spain', round: 14, name: 'GP da Espanha', officialName: 'Formula 1 Gran Premio de España 2026',
    country: 'Espanha', countryCode: 'ES', city: 'Madri', circuitId: 'madring', sprint: false,
    weekendStart: '2026-09-11', weekendEnd: '2026-09-13', timesConfirmed: false,
    sessions: sessions('2026-09-11', '+02:00', STANDARD),
  },
  {
    id: 'azerbaijan', round: 15, name: 'GP do Azerbaijão', officialName: 'Formula 1 Azerbaijan Grand Prix 2026',
    country: 'Azerbaijão', countryCode: 'AZ', city: 'Baku', circuitId: 'baku', sprint: false,
    weekendStart: '2026-09-24', weekendEnd: '2026-09-26', timesConfirmed: false,
    // Corrida no sábado: fim de semana de quinta a sábado.
    sessions: sessions('2026-09-24', '+04:00', STANDARD, { fp1: '12:30', fp2: '16:00' }),
  },
  {
    id: 'singapore', round: 16, name: 'GP de Singapura', officialName: 'Formula 1 Singapore Grand Prix 2026',
    country: 'Singapura', countryCode: 'SG', city: 'Marina Bay', circuitId: 'singapore', sprint: true,
    weekendStart: '2026-10-09', weekendEnd: '2026-10-11', timesConfirmed: false,
    sessions: sessions('2026-10-09', '+08:00', SPRINT, { fp1: '16:30', sprintQuali: '20:30', sprint: '17:00', quali: '21:00', race: '20:00' }),
  },
  {
    id: 'united-states', round: 17, name: 'GP dos Estados Unidos', officialName: 'Formula 1 United States Grand Prix 2026',
    country: 'Estados Unidos', countryCode: 'US', city: 'Austin', circuitId: 'cota', sprint: false,
    weekendStart: '2026-10-23', weekendEnd: '2026-10-25', timesConfirmed: false,
    sessions: sessions('2026-10-23', '-05:00', STANDARD, { fp1: '12:30', fp2: '16:00', race: '14:00' }),
  },
  {
    id: 'mexico', round: 18, name: 'GP da Cidade do México', officialName: 'Formula 1 Gran Premio de la Ciudad de México 2026',
    country: 'México', countryCode: 'MX', city: 'Cidade do México', circuitId: 'mexico', sprint: false,
    weekendStart: '2026-10-30', weekendEnd: '2026-11-01', timesConfirmed: false,
    sessions: sessions('2026-10-30', '-06:00', STANDARD, { fp1: '12:30', fp2: '16:00', fp3: '10:30', quali: '14:00', race: '14:00' }),
  },
  {
    id: 'brazil', round: 19, name: 'GP de São Paulo', officialName: 'Formula 1 Grande Prêmio de São Paulo 2026',
    country: 'Brasil', countryCode: 'BR', city: 'São Paulo', circuitId: 'interlagos', sprint: false,
    weekendStart: '2026-11-06', weekendEnd: '2026-11-08', timesConfirmed: false,
    sessions: sessions('2026-11-06', '-03:00', STANDARD, { fp1: '11:30', fp2: '15:00', fp3: '11:30', quali: '15:00', race: '14:00' }),
  },
  {
    id: 'las-vegas', round: 20, name: 'GP de Las Vegas', officialName: 'Formula 1 Las Vegas Grand Prix 2026',
    country: 'Estados Unidos', countryCode: 'US', city: 'Las Vegas', circuitId: 'las-vegas', sprint: false,
    weekendStart: '2026-11-19', weekendEnd: '2026-11-21', timesConfirmed: false,
    // Corrida noturna no sábado.
    sessions: sessions('2026-11-19', '-08:00', STANDARD, { fp1: '18:30', fp2: '22:00', fp3: '18:30', quali: '22:00', race: '20:00' }),
  },
  {
    id: 'qatar', round: 21, name: 'GP do Catar', officialName: 'Formula 1 Qatar Grand Prix 2026',
    country: 'Catar', countryCode: 'QA', city: 'Lusail', circuitId: 'lusail', sprint: false,
    weekendStart: '2026-11-27', weekendEnd: '2026-11-29', timesConfirmed: false,
    sessions: sessions('2026-11-27', '+03:00', STANDARD, { fp1: '16:30', fp2: '20:00', fp3: '17:30', quali: '21:00', race: '19:00' }),
  },
  {
    id: 'abu-dhabi', round: 22, name: 'GP de Abu Dhabi', officialName: 'Formula 1 Abu Dhabi Grand Prix 2026',
    country: 'Emirados Árabes Unidos', countryCode: 'AE', city: 'Yas Marina', circuitId: 'yas-marina', sprint: false,
    weekendStart: '2026-12-04', weekendEnd: '2026-12-06', timesConfirmed: false,
    sessions: sessions('2026-12-04', '+04:00', STANDARD, { fp3: '14:30', quali: '18:00', race: '17:00' }),
  },
];

export const CALENDAR_SOURCE = {
  label: 'Formula 1 / FIA — calendário oficial 2026 (revisado em março/2026)',
  url: 'https://www.formula1.com/en/racing/2026',
  updatedAt: '2026-10-10',
};
