import type { Team } from '../types';

/**
 * EQUIPES DA TEMPORADA 2026 (11 equipes)
 * Fonte: lista de inscritos FIA/F1 2026 (formula1.com/en/teams).
 * Títulos de construtores contabilizados até o fim da temporada 2025.
 * Cores = aproximações para a interface, não códigos oficiais de pintura.
 */
export const teams: Team[] = [
  {
    id: 'mclaren', name: 'McLaren', fullName: 'McLaren Formula 1 Team', base: 'Woking, Reino Unido',
    teamPrincipal: 'Andrea Stella', powerUnit: 'Mercedes', firstEntry: 1966, constructorsTitles: 10,
    color: '#FF8000', accent: '#47C7FC',
    history: 'Fundada por Bruce McLaren, é uma das equipes mais vitoriosas da história. Chegou a 2026 como bicampeã de construtores (2024 e 2025) e com Lando Norris como campeão mundial de pilotos de 2025.',
  },
  {
    id: 'ferrari', name: 'Ferrari', fullName: 'Scuderia Ferrari HP', base: 'Maranello, Itália',
    teamPrincipal: 'Frédéric Vasseur', powerUnit: 'Ferrari', firstEntry: 1950, constructorsTitles: 16,
    color: '#E8002D', accent: '#FFEB3B',
    history: 'A única equipe presente em todas as temporadas do Mundial desde 1950 e a maior campeã de construtores. Em 2026 mantém a dupla Charles Leclerc e Lewis Hamilton.',
  },
  {
    id: 'red-bull', name: 'Red Bull Racing', fullName: 'Oracle Red Bull Racing', base: 'Milton Keynes, Reino Unido',
    teamPrincipal: 'Laurent Mekies', powerUnit: 'Red Bull Ford', firstEntry: 2005, constructorsTitles: 6,
    color: '#3671C6', accent: '#FFD700',
    history: 'Dominou as eras de 2010–2013 e 2022–2023. Em 2026 estreia sua própria unidade de potência, desenvolvida pela Red Bull Powertrains em parceria com a Ford.',
  },
  {
    id: 'mercedes', name: 'Mercedes', fullName: 'Mercedes-AMG PETRONAS F1 Team', base: 'Brackley, Reino Unido',
    teamPrincipal: 'Toto Wolff', powerUnit: 'Mercedes', firstEntry: 2010, constructorsTitles: 8,
    color: '#27F4D2', accent: '#C0C0C0',
    history: 'Conquistou oito títulos de construtores consecutivos entre 2014 e 2021, na era híbrida. Em 2026 corre com George Russell e Andrea Kimi Antonelli.',
  },
  {
    id: 'aston-martin', name: 'Aston Martin', fullName: 'Aston Martin Aramco F1 Team', base: 'Silverstone, Reino Unido',
    teamPrincipal: 'Adrian Newey', powerUnit: 'Honda', firstEntry: 2021, constructorsTitles: 0,
    color: '#229971', accent: '#CEDC00',
    history: 'Herdeira da estrutura nascida como Jordan (1991). Em 2026 inicia a parceria de fábrica com a Honda e tem Adrian Newey no comando técnico.',
  },
  {
    id: 'alpine', name: 'Alpine', fullName: 'BWT Alpine F1 Team', base: 'Enstone, Reino Unido',
    teamPrincipal: 'Flavio Briatore (diretor-executivo)', powerUnit: 'Mercedes', firstEntry: 2021, constructorsTitles: 0,
    color: '#0093CC', accent: '#FF87BC',
    history: 'Equipe de Enstone, que já correu como Toleman, Benetton, Renault e Lotus. Os títulos de 2005 e 2006 foram conquistados como Renault. A partir de 2026 usa motores Mercedes.',
  },
  {
    id: 'williams', name: 'Williams', fullName: 'Atlassian Williams Racing', base: 'Grove, Reino Unido',
    teamPrincipal: 'James Vowles', powerUnit: 'Mercedes', firstEntry: 1977, constructorsTitles: 9,
    color: '#64C4FF', accent: '#00205B',
    history: 'Fundada por Sir Frank Williams e Patrick Head, soma nove títulos de construtores. Vive um processo de reconstrução com Alex Albon e Carlos Sainz.',
  },
  {
    id: 'racing-bulls', name: 'Racing Bulls', fullName: 'Visa Cash App Racing Bulls F1 Team', base: 'Faenza, Itália',
    teamPrincipal: 'Alan Permane', powerUnit: 'Red Bull Ford', firstEntry: 2006, constructorsTitles: 0,
    color: '#6692FF', accent: '#FFFFFF',
    history: 'Antiga Minardi, Toro Rosso e AlphaTauri, é a equipe-escola da Red Bull. Em 2026 aposta no estreante Arvid Lindblad ao lado de Liam Lawson.',
  },
  {
    id: 'haas', name: 'Haas', fullName: 'MoneyGram Haas F1 Team', base: 'Kannapolis, EUA',
    teamPrincipal: 'Ayao Komatsu', powerUnit: 'Ferrari', firstEntry: 2016, constructorsTitles: 0,
    color: '#B6BABD', accent: '#E10600',
    history: 'Equipe americana fundada por Gene Haas, com forte parceria técnica com a Ferrari e parceria com a Toyota.',
  },
  {
    id: 'audi', name: 'Audi', fullName: 'Audi F1 Team', base: 'Hinwil, Suíça',
    teamPrincipal: 'Jonathan Wheatley', powerUnit: 'Audi', firstEntry: 2026, constructorsTitles: 0,
    color: '#BB0A30', accent: '#C0C0C0',
    history: 'Estreia como equipe de fábrica em 2026, a partir da estrutura da Sauber em Hinwil, com motor próprio desenvolvido em Neuburg, na Alemanha.',
  },
  {
    id: 'cadillac', name: 'Cadillac', fullName: 'Cadillac Formula 1 Team', base: 'Fishers (EUA) e Silverstone (Reino Unido)',
    teamPrincipal: 'Graeme Lowdon', powerUnit: 'Ferrari', firstEntry: 2026, constructorsTitles: 0,
    color: '#A8A9AD', accent: '#1E1E1E',
    history: 'A 11ª equipe do grid, apoiada pela General Motors. Estreia em 2026 com dois pilotos experientes: Sergio Pérez e Valtteri Bottas.',
  },
];

export const teamById = (id: string) => teams.find((t) => t.id === id);
