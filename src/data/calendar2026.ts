import type { Race } from '../types';

/**
 * CALENDÁRIO OFICIAL DA TEMPORADA 2026 DE FÓRMULA 1
 * ----------------------------------------------------------------------------
 * Fonte das DATAS: calendário publicado pela Formula 1 / FIA
 *   https://www.formula1.com/en/racing/2026
 *   Calendário de Sprints: https://www.formula1.com/en/latest/article/formula-1-and-fia-announce-2026-sprint-calendar.3PyLPAazrBNe8kQIS3wOfY
 * Revisão de março/2026: as datas de abril dos GPs do Bahrein e da Arábia Saudita
 * foram canceladas por causa do conflito no Oriente Médio. Depois, o GP do Bahrein
 * foi transferido para Sepang (Malásia, 4/out) — temporada com 23 etapas.
 * Rodadas conferidas com a Jolpica-F1 (https://api.jolpi.ca/ergast/f1/2026.json).
 *
 * HORÁRIOS: horários oficiais das sessões, publicados pela OpenF1
 * (https://api.openf1.org/v1/sessions?year=2026), no fuso local de cada circuito.
 *
 * COMO ATUALIZAR: edite apenas este arquivo. Todas as páginas (calendário,
 * contagem regressiva, circuitos e busca) leem estes dados.
 * Última revisão: 2026-11-06.
 */

export const SEASON = 2026;

export const races: Race[] = [
  {
    id: 'australia', round: 1, name: 'GP da Austrália', officialName: 'Formula 1 Australian Grand Prix 2026',
    country: 'Austrália', countryCode: 'AU', city: 'Melbourne', circuitId: 'albert-park', sprint: false,
    weekendStart: '2026-03-06', weekendEnd: '2026-03-08', timesConfirmed: true,
    sessions: [
      { type: 'fp1', start: '2026-03-06T12:30:00+11:00' },
      { type: 'fp2', start: '2026-03-06T16:00:00+11:00' },
      { type: 'fp3', start: '2026-03-07T12:30:00+11:00' },
      { type: 'quali', start: '2026-03-07T16:00:00+11:00' },
      { type: 'race', start: '2026-03-08T15:00:00+11:00' },
    ],
  },
  {
    id: 'china', round: 2, name: 'GP da China', officialName: 'Formula 1 Chinese Grand Prix 2026',
    country: 'China', countryCode: 'CN', city: 'Xangai', circuitId: 'shanghai', sprint: true,
    weekendStart: '2026-03-13', weekendEnd: '2026-03-15', timesConfirmed: true,
    sessions: [
      { type: 'fp1', start: '2026-03-13T11:30:00+08:00' },
      { type: 'sprintQuali', start: '2026-03-13T15:30:00+08:00' },
      { type: 'sprint', start: '2026-03-14T11:00:00+08:00' },
      { type: 'quali', start: '2026-03-14T15:00:00+08:00' },
      { type: 'race', start: '2026-03-15T15:00:00+08:00' },
    ],
  },
  {
    id: 'japan', round: 3, name: 'GP do Japão', officialName: 'Formula 1 Japanese Grand Prix 2026',
    country: 'Japão', countryCode: 'JP', city: 'Suzuka', circuitId: 'suzuka', sprint: false,
    weekendStart: '2026-03-27', weekendEnd: '2026-03-29', timesConfirmed: true,
    sessions: [
      { type: 'fp1', start: '2026-03-27T11:30:00+09:00' },
      { type: 'fp2', start: '2026-03-27T15:00:00+09:00' },
      { type: 'fp3', start: '2026-03-28T11:30:00+09:00' },
      { type: 'quali', start: '2026-03-28T15:00:00+09:00' },
      { type: 'race', start: '2026-03-29T14:00:00+09:00' },
    ],
  },
  {
    id: 'bahrain', round: null, name: 'GP do Bahrein', officialName: 'Formula 1 Bahrain Grand Prix 2026',
    country: 'Bahrein', countryCode: 'BH', city: 'Sakhir', circuitId: 'bahrain', sprint: false,
    cancelled: true, cancelledNote: 'Data de abril cancelada pela F1 em março/2026 devido ao conflito no Oriente Médio. A prova foi transferida para Sepang, na Malásia, e disputada em 4 de outubro (rodada 16).',
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
    weekendStart: '2026-05-01', weekendEnd: '2026-05-03', timesConfirmed: true,
    sessions: [
      { type: 'fp1', start: '2026-05-01T12:00:00-04:00' },
      { type: 'sprintQuali', start: '2026-05-01T16:30:00-04:00' },
      { type: 'sprint', start: '2026-05-02T12:00:00-04:00' },
      { type: 'quali', start: '2026-05-02T16:00:00-04:00' },
      { type: 'race', start: '2026-05-03T13:00:00-04:00' },
    ],
  },
  {
    id: 'canada', round: 5, name: 'GP do Canadá', officialName: 'Formula 1 Grand Prix du Canada 2026',
    country: 'Canadá', countryCode: 'CA', city: 'Montreal', circuitId: 'montreal', sprint: true,
    weekendStart: '2026-05-22', weekendEnd: '2026-05-24', timesConfirmed: true,
    sessions: [
      { type: 'fp1', start: '2026-05-22T12:30:00-04:00' },
      { type: 'sprintQuali', start: '2026-05-22T16:30:00-04:00' },
      { type: 'sprint', start: '2026-05-23T12:00:00-04:00' },
      { type: 'quali', start: '2026-05-23T16:00:00-04:00' },
      { type: 'race', start: '2026-05-24T16:00:00-04:00' },
    ],
  },
  {
    id: 'monaco', round: 6, name: 'GP de Mônaco', officialName: 'Formula 1 Grand Prix de Monaco 2026',
    country: 'Mônaco', countryCode: 'MC', city: 'Monte Carlo', circuitId: 'monaco', sprint: false,
    weekendStart: '2026-06-05', weekendEnd: '2026-06-07', timesConfirmed: true,
    sessions: [
      { type: 'fp1', start: '2026-06-05T13:30:00+02:00' },
      { type: 'fp2', start: '2026-06-05T17:00:00+02:00' },
      { type: 'fp3', start: '2026-06-06T12:30:00+02:00' },
      { type: 'quali', start: '2026-06-06T16:00:00+02:00' },
      { type: 'race', start: '2026-06-07T15:00:00+02:00' },
    ],
  },
  {
    id: 'barcelona', round: 7, name: 'GP de Barcelona-Catalunha', officialName: 'Formula 1 Gran Premio de Barcelona-Catalunya 2026',
    country: 'Espanha', countryCode: 'ES', city: 'Barcelona', circuitId: 'catalunya', sprint: false,
    weekendStart: '2026-06-12', weekendEnd: '2026-06-14', timesConfirmed: true,
    sessions: [
      { type: 'fp1', start: '2026-06-12T13:30:00+02:00' },
      { type: 'fp2', start: '2026-06-12T17:00:00+02:00' },
      { type: 'fp3', start: '2026-06-13T12:30:00+02:00' },
      { type: 'quali', start: '2026-06-13T16:00:00+02:00' },
      { type: 'race', start: '2026-06-14T15:00:00+02:00' },
    ],
  },
  {
    id: 'austria', round: 8, name: 'GP da Áustria', officialName: 'Formula 1 Grosser Preis von Österreich 2026',
    country: 'Áustria', countryCode: 'AT', city: 'Spielberg', circuitId: 'red-bull-ring', sprint: false,
    weekendStart: '2026-06-26', weekendEnd: '2026-06-28', timesConfirmed: true,
    sessions: [
      { type: 'fp1', start: '2026-06-26T13:30:00+02:00' },
      { type: 'fp2', start: '2026-06-26T17:00:00+02:00' },
      { type: 'fp3', start: '2026-06-27T12:30:00+02:00' },
      { type: 'quali', start: '2026-06-27T16:00:00+02:00' },
      { type: 'race', start: '2026-06-28T15:00:00+02:00' },
    ],
  },
  {
    id: 'great-britain', round: 9, name: 'GP da Grã-Bretanha', officialName: 'Formula 1 British Grand Prix 2026',
    country: 'Reino Unido', countryCode: 'GB', city: 'Silverstone', circuitId: 'silverstone', sprint: true,
    weekendStart: '2026-07-03', weekendEnd: '2026-07-05', timesConfirmed: true,
    sessions: [
      { type: 'fp1', start: '2026-07-03T12:30:00+01:00' },
      { type: 'sprintQuali', start: '2026-07-03T16:30:00+01:00' },
      { type: 'sprint', start: '2026-07-04T12:00:00+01:00' },
      { type: 'quali', start: '2026-07-04T16:00:00+01:00' },
      { type: 'race', start: '2026-07-05T15:00:00+01:00' },
    ],
  },
  {
    id: 'belgium', round: 10, name: 'GP da Bélgica', officialName: 'Formula 1 Belgian Grand Prix 2026',
    country: 'Bélgica', countryCode: 'BE', city: 'Spa-Francorchamps', circuitId: 'spa', sprint: false,
    weekendStart: '2026-07-17', weekendEnd: '2026-07-19', timesConfirmed: true,
    sessions: [
      { type: 'fp1', start: '2026-07-17T13:30:00+02:00' },
      { type: 'fp2', start: '2026-07-17T17:00:00+02:00' },
      { type: 'fp3', start: '2026-07-18T12:30:00+02:00' },
      { type: 'quali', start: '2026-07-18T16:00:00+02:00' },
      { type: 'race', start: '2026-07-19T15:00:00+02:00' },
    ],
  },
  {
    id: 'hungary', round: 11, name: 'GP da Hungria', officialName: 'Formula 1 Hungarian Grand Prix 2026',
    country: 'Hungria', countryCode: 'HU', city: 'Budapeste', circuitId: 'hungaroring', sprint: false,
    weekendStart: '2026-07-24', weekendEnd: '2026-07-26', timesConfirmed: true,
    sessions: [
      { type: 'fp1', start: '2026-07-24T13:30:00+02:00' },
      { type: 'fp2', start: '2026-07-24T17:00:00+02:00' },
      { type: 'fp3', start: '2026-07-25T12:30:00+02:00' },
      { type: 'quali', start: '2026-07-25T16:00:00+02:00' },
      { type: 'race', start: '2026-07-26T15:00:00+02:00' },
    ],
  },
  {
    id: 'netherlands', round: 12, name: 'GP da Holanda', officialName: 'Formula 1 Dutch Grand Prix 2026',
    country: 'Holanda', countryCode: 'NL', city: 'Zandvoort', circuitId: 'zandvoort', sprint: true,
    weekendStart: '2026-08-21', weekendEnd: '2026-08-23', timesConfirmed: true,
    sessions: [
      { type: 'fp1', start: '2026-08-21T12:30:00+02:00' },
      { type: 'sprintQuali', start: '2026-08-21T16:30:00+02:00' },
      { type: 'sprint', start: '2026-08-22T12:00:00+02:00' },
      { type: 'quali', start: '2026-08-22T16:00:00+02:00' },
      { type: 'race', start: '2026-08-23T15:00:00+02:00' },
    ],
  },
  {
    id: 'italy', round: 13, name: 'GP da Itália', officialName: "Formula 1 Gran Premio d'Italia 2026",
    country: 'Itália', countryCode: 'IT', city: 'Monza', circuitId: 'monza', sprint: false,
    weekendStart: '2026-09-04', weekendEnd: '2026-09-06', timesConfirmed: true,
    sessions: [
      { type: 'fp1', start: '2026-09-04T12:30:00+02:00' },
      { type: 'fp2', start: '2026-09-04T16:00:00+02:00' },
      { type: 'fp3', start: '2026-09-05T12:30:00+02:00' },
      { type: 'quali', start: '2026-09-05T16:00:00+02:00' },
      { type: 'race', start: '2026-09-06T15:00:00+02:00' },
    ],
  },
  {
    id: 'spain', round: 14, name: 'GP da Espanha', officialName: 'Formula 1 Gran Premio de España 2026',
    country: 'Espanha', countryCode: 'ES', city: 'Madri', circuitId: 'madring', sprint: false,
    weekendStart: '2026-09-11', weekendEnd: '2026-09-13', timesConfirmed: true,
    sessions: [
      { type: 'fp1', start: '2026-09-11T13:30:00+02:00' },
      { type: 'fp2', start: '2026-09-11T17:00:00+02:00' },
      { type: 'fp3', start: '2026-09-12T12:30:00+02:00' },
      { type: 'quali', start: '2026-09-12T16:00:00+02:00' },
      { type: 'race', start: '2026-09-13T15:00:00+02:00' },
    ],
  },
  {
    id: 'azerbaijan', round: 15, name: 'GP do Azerbaijão', officialName: 'Formula 1 Azerbaijan Grand Prix 2026',
    country: 'Azerbaijão', countryCode: 'AZ', city: 'Baku', circuitId: 'baku', sprint: false,
    weekendStart: '2026-09-24', weekendEnd: '2026-09-26', timesConfirmed: true,
    // Corrida no sábado: fim de semana de quinta a sábado.
    sessions: [
      { type: 'fp1', start: '2026-09-24T12:30:00+04:00' },
      { type: 'fp2', start: '2026-09-24T16:00:00+04:00' },
      { type: 'fp3', start: '2026-09-25T12:30:00+04:00' },
      { type: 'quali', start: '2026-09-25T16:00:00+04:00' },
      { type: 'race', start: '2026-09-26T15:00:00+04:00' },
    ],
  },
  {
    id: 'malaysia', round: 16, name: 'GP do Bahrein (na Malásia)', officialName: 'Formula 1 Bahrain Grand Prix in Malaysia 2026',
    country: 'Malásia', countryCode: 'MY', city: 'Sepang', circuitId: 'sepang', sprint: false,
    weekendStart: '2026-10-02', weekendEnd: '2026-10-04', timesConfirmed: true,
    sessions: [
      { type: 'fp1', start: '2026-10-02T12:30:00+08:00' },
      { type: 'fp2', start: '2026-10-02T16:00:00+08:00' },
      { type: 'fp3', start: '2026-10-03T12:30:00+08:00' },
      { type: 'quali', start: '2026-10-03T16:00:00+08:00' },
      { type: 'race', start: '2026-10-04T15:00:00+08:00' },
    ],
  },
  {
    id: 'singapore', round: 17, name: 'GP de Singapura', officialName: 'Formula 1 Singapore Grand Prix 2026',
    country: 'Singapura', countryCode: 'SG', city: 'Marina Bay', circuitId: 'singapore', sprint: true,
    weekendStart: '2026-10-09', weekendEnd: '2026-10-11', timesConfirmed: true,
    sessions: [
      { type: 'fp1', start: '2026-10-09T16:30:00+08:00' },
      { type: 'sprintQuali', start: '2026-10-09T20:30:00+08:00' },
      { type: 'sprint', start: '2026-10-10T17:00:00+08:00' },
      { type: 'quali', start: '2026-10-10T21:00:00+08:00' },
      { type: 'race', start: '2026-10-11T20:00:00+08:00' },
    ],
  },
  {
    id: 'united-states', round: 18, name: 'GP dos Estados Unidos', officialName: 'Formula 1 United States Grand Prix 2026',
    country: 'Estados Unidos', countryCode: 'US', city: 'Austin', circuitId: 'cota', sprint: false,
    weekendStart: '2026-10-23', weekendEnd: '2026-10-25', timesConfirmed: true,
    sessions: [
      { type: 'fp1', start: '2026-10-23T12:30:00-05:00' },
      { type: 'fp2', start: '2026-10-23T16:00:00-05:00' },
      { type: 'fp3', start: '2026-10-24T12:30:00-05:00' },
      { type: 'quali', start: '2026-10-24T16:00:00-05:00' },
      { type: 'race', start: '2026-10-25T15:00:00-05:00' },
    ],
  },
  {
    id: 'mexico', round: 19, name: 'GP da Cidade do México', officialName: 'Formula 1 Gran Premio de la Ciudad de México 2026',
    country: 'México', countryCode: 'MX', city: 'Cidade do México', circuitId: 'mexico', sprint: false,
    weekendStart: '2026-10-30', weekendEnd: '2026-11-01', timesConfirmed: true,
    sessions: [
      { type: 'fp1', start: '2026-10-30T12:30:00-06:00' },
      { type: 'fp2', start: '2026-10-30T16:00:00-06:00' },
      { type: 'fp3', start: '2026-10-31T11:30:00-06:00' },
      { type: 'quali', start: '2026-10-31T15:00:00-06:00' },
      { type: 'race', start: '2026-11-01T14:00:00-06:00' },
    ],
  },
  {
    id: 'brazil', round: 20, name: 'GP de São Paulo', officialName: 'Formula 1 Grande Prêmio de São Paulo 2026',
    country: 'Brasil', countryCode: 'BR', city: 'São Paulo', circuitId: 'interlagos', sprint: false,
    weekendStart: '2026-11-06', weekendEnd: '2026-11-08', timesConfirmed: true,
    sessions: [
      { type: 'fp1', start: '2026-11-06T12:30:00-03:00' },
      { type: 'fp2', start: '2026-11-06T16:00:00-03:00' },
      { type: 'fp3', start: '2026-11-07T11:30:00-03:00' },
      { type: 'quali', start: '2026-11-07T15:00:00-03:00' },
      { type: 'race', start: '2026-11-08T14:00:00-03:00' },
    ],
  },
  {
    id: 'las-vegas', round: 21, name: 'GP de Las Vegas', officialName: 'Formula 1 Las Vegas Grand Prix 2026',
    country: 'Estados Unidos', countryCode: 'US', city: 'Las Vegas', circuitId: 'las-vegas', sprint: false,
    weekendStart: '2026-11-19', weekendEnd: '2026-11-21', timesConfirmed: true,
    // Corrida noturna no sábado.
    sessions: [
      { type: 'fp1', start: '2026-11-19T16:30:00-08:00' },
      { type: 'fp2', start: '2026-11-19T20:00:00-08:00' },
      { type: 'fp3', start: '2026-11-20T16:30:00-08:00' },
      { type: 'quali', start: '2026-11-20T20:00:00-08:00' },
      { type: 'race', start: '2026-11-21T20:00:00-08:00' },
    ],
  },
  {
    id: 'qatar', round: 22, name: 'GP do Catar', officialName: 'Formula 1 Qatar Grand Prix 2026',
    country: 'Catar', countryCode: 'QA', city: 'Lusail', circuitId: 'lusail', sprint: false,
    weekendStart: '2026-11-27', weekendEnd: '2026-11-29', timesConfirmed: true,
    sessions: [
      { type: 'fp1', start: '2026-11-27T16:30:00+03:00' },
      { type: 'fp2', start: '2026-11-27T20:00:00+03:00' },
      { type: 'fp3', start: '2026-11-28T17:30:00+03:00' },
      { type: 'quali', start: '2026-11-28T21:00:00+03:00' },
      { type: 'race', start: '2026-11-29T19:00:00+03:00' },
    ],
  },
  {
    id: 'abu-dhabi', round: 23, name: 'GP de Abu Dhabi', officialName: 'Formula 1 Abu Dhabi Grand Prix 2026',
    country: 'Emirados Árabes Unidos', countryCode: 'AE', city: 'Yas Marina', circuitId: 'yas-marina', sprint: false,
    weekendStart: '2026-12-04', weekendEnd: '2026-12-06', timesConfirmed: true,
    sessions: [
      { type: 'fp1', start: '2026-12-04T13:30:00+04:00' },
      { type: 'fp2', start: '2026-12-04T17:00:00+04:00' },
      { type: 'fp3', start: '2026-12-05T14:30:00+04:00' },
      { type: 'quali', start: '2026-12-05T18:00:00+04:00' },
      { type: 'race', start: '2026-12-06T17:00:00+04:00' },
    ],
  },
];

export const CALENDAR_SOURCE = {
  label: 'Formula 1 / FIA — calendário oficial 2026 (horários via OpenF1)',
  url: 'https://www.formula1.com/en/racing/2026',
  updatedAt: '2026-11-06',
};
