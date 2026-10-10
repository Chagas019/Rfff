import type { Driver } from '../types';

/**
 * PILOTOS TITULARES DA TEMPORADA 2026 (22 pilotos)
 * Fonte: lista oficial de números 2026 — formula1.com
 *   https://www.formula1.com/en/latest/article/all-the-2026-f1-driver-numbers-confirmed-in-full.5rh7o9mPntG7NerzVk9onc
 * Biografias e títulos referem-se à carreira até o fim da temporada 2025.
 * Estatísticas da temporada atual (pontos, vitórias, pódios) NÃO ficam aqui:
 * são buscadas em tempo real na API Jolpica (veja src/services/f1Api.ts).
 * Não há fotos oficiais no projeto: o card usa uma arte gerada (capacete).
 * Para usar fotos, preencha `photoUrl` e `photoCredit` com imagens licenciadas.
 */
export const drivers: Driver[] = [
  {
    id: 'norris', apiId: 'norris', firstName: 'Lando', lastName: 'Norris', number: 1, code: 'NOR', teamId: 'mclaren',
    nationality: 'Britânico', countryCode: 'GB', birthDate: '1999-11-13', birthPlace: 'Bristol, Inglaterra', debutYear: 2019, worldTitles: 1,
    bio: 'Revelado pela McLaren, conquistou o título mundial de 2025 e corre em 2026 com o número 1.',
    career: ['Campeão da F3 Europeia em 2017', 'Estreia na F1 pela McLaren em 2019', 'Primeira vitória no GP de Miami de 2024', 'Campeão mundial de 2025'],
  },
  {
    id: 'piastri', apiId: 'piastri', firstName: 'Oscar', lastName: 'Piastri', number: 81, code: 'PIA', teamId: 'mclaren',
    nationality: 'Australiano', countryCode: 'AU', birthDate: '2001-04-06', birthPlace: 'Melbourne, Austrália', debutYear: 2023, worldTitles: 0,
    bio: 'Campeão consecutivo da F3 e da F2 em seus anos de estreia, é conhecido pela frieza em corrida.',
    career: ['Campeão da F3 FIA em 2020', 'Campeão da F2 em 2021', 'Estreia na F1 pela McLaren em 2023', 'Primeira vitória no GP da Hungria de 2024'],
  },
  {
    id: 'leclerc', apiId: 'leclerc', firstName: 'Charles', lastName: 'Leclerc', number: 16, code: 'LEC', teamId: 'ferrari',
    nationality: 'Monegasco', countryCode: 'MC', birthDate: '1997-10-16', birthPlace: 'Monte Carlo, Mônaco', debutYear: 2018, worldTitles: 0,
    bio: 'Especialista em voltas de classificação, é piloto da Ferrari desde 2019.',
    career: ['Campeão da F2 em 2017', 'Estreia pela Sauber em 2018', 'Na Ferrari desde 2019', 'Venceu o GP de Mônaco, em casa, em 2024'],
  },
  {
    id: 'hamilton', apiId: 'hamilton', firstName: 'Lewis', lastName: 'Hamilton', number: 44, code: 'HAM', teamId: 'ferrari',
    nationality: 'Britânico', countryCode: 'GB', birthDate: '1985-01-07', birthPlace: 'Stevenage, Inglaterra', debutYear: 2007, worldTitles: 7,
    bio: 'Heptacampeão mundial, recordista de vitórias e pole positions na história da F1. Na Ferrari desde 2025.',
    career: ['Campeão em 2008 pela McLaren', 'Hexacampeão com a Mercedes (2014, 2015, 2017, 2018, 2019, 2020)', 'Transferiu-se para a Ferrari em 2025'],
  },
  {
    id: 'verstappen', apiId: 'max_verstappen', firstName: 'Max', lastName: 'Verstappen', number: 3, code: 'VER', teamId: 'red-bull',
    nationality: 'Neerlandês', countryCode: 'NL', birthDate: '1997-09-30', birthPlace: 'Hasselt, Bélgica', debutYear: 2015, worldTitles: 4,
    bio: 'Tetracampeão mundial (2021–2024). Em 2026 trocou o número 33 pelo 3.',
    career: ['Estreia aos 17 anos pela Toro Rosso em 2015', 'Venceu na estreia pela Red Bull, na Espanha, em 2016', 'Campeão em 2021, 2022, 2023 e 2024'],
  },
  {
    id: 'hadjar', apiId: 'hadjar', firstName: 'Isack', lastName: 'Hadjar', number: 6, code: 'HAD', teamId: 'red-bull',
    nationality: 'Francês', countryCode: 'FR', birthDate: '2004-09-28', birthPlace: 'Paris, França', debutYear: 2025, worldTitles: 0,
    bio: 'Promovido à Red Bull em 2026 após a temporada de estreia na Racing Bulls.',
    career: ['Vice-campeão da F2 em 2024', 'Estreia pela Racing Bulls em 2025', 'Primeiro pódio no GP da Holanda de 2025', 'Piloto da Red Bull Racing em 2026'],
  },
  {
    id: 'russell', apiId: 'russell', firstName: 'George', lastName: 'Russell', number: 63, code: 'RUS', teamId: 'mercedes',
    nationality: 'Britânico', countryCode: 'GB', birthDate: '1998-02-15', birthPlace: "King's Lynn, Inglaterra", debutYear: 2019, worldTitles: 0,
    bio: 'Líder da Mercedes, chegou à equipe em 2022 após três temporadas na Williams.',
    career: ['Campeão da GP3 em 2017 e da F2 em 2018', 'Williams de 2019 a 2021', 'Mercedes desde 2022', 'Primeira vitória no GP de São Paulo de 2022'],
  },
  {
    id: 'antonelli', apiId: 'antonelli', firstName: 'Andrea Kimi', lastName: 'Antonelli', number: 12, code: 'ANT', teamId: 'mercedes',
    nationality: 'Italiano', countryCode: 'IT', birthDate: '2006-08-25', birthPlace: 'Bolonha, Itália', debutYear: 2025, worldTitles: 0,
    bio: 'Talento lapidado pela Mercedes, assumiu a vaga de Lewis Hamilton em 2025, aos 18 anos.',
    career: ['Campeão da Fórmula Regional Europeia em 2023', 'Estreia na F1 pela Mercedes em 2025', 'Primeiro pódio no GP do Canadá de 2025'],
  },
  {
    id: 'alonso', apiId: 'alonso', firstName: 'Fernando', lastName: 'Alonso', number: 14, code: 'ALO', teamId: 'aston-martin',
    nationality: 'Espanhol', countryCode: 'ES', birthDate: '1981-07-29', birthPlace: 'Oviedo, Espanha', debutYear: 2001, worldTitles: 2,
    bio: 'Bicampeão mundial e piloto com mais largadas na história da F1.',
    career: ['Estreia pela Minardi em 2001', 'Campeão em 2005 e 2006 pela Renault', 'Passagens por McLaren, Ferrari e Alpine', 'Aston Martin desde 2023'],
  },
  {
    id: 'stroll', apiId: 'stroll', firstName: 'Lance', lastName: 'Stroll', number: 18, code: 'STR', teamId: 'aston-martin',
    nationality: 'Canadense', countryCode: 'CA', birthDate: '1998-10-29', birthPlace: 'Montreal, Canadá', debutYear: 2017, worldTitles: 0,
    bio: 'Piloto da Aston Martin desde a estreia da marca na F1, em 2021.',
    career: ['Campeão da F3 Europeia em 2016', 'Pódio no GP do Azerbaijão de 2017, como estreante', 'Pole position no GP da Turquia de 2020'],
  },
  {
    id: 'gasly', apiId: 'gasly', firstName: 'Pierre', lastName: 'Gasly', number: 10, code: 'GAS', teamId: 'alpine',
    nationality: 'Francês', countryCode: 'FR', birthDate: '1996-02-07', birthPlace: 'Rouen, França', debutYear: 2017, worldTitles: 0,
    bio: 'Vencedor do GP da Itália de 2020, lidera o projeto da Alpine.',
    career: ['Campeão da GP2 em 2016', 'Vitória no GP da Itália de 2020 pela AlphaTauri', 'Alpine desde 2023'],
  },
  {
    id: 'colapinto', apiId: 'colapinto', firstName: 'Franco', lastName: 'Colapinto', number: 43, code: 'COL', teamId: 'alpine',
    nationality: 'Argentino', countryCode: 'AR', birthDate: '2003-05-27', birthPlace: 'Pilar, Argentina', debutYear: 2024, worldTitles: 0,
    bio: 'Primeiro argentino titular na F1 desde 2001.',
    career: ['Estreia pela Williams no GP da Itália de 2024', 'Pontuou na segunda corrida, no Azerbaijão', 'Alpine desde 2025'],
  },
  {
    id: 'albon', apiId: 'albon', firstName: 'Alexander', lastName: 'Albon', number: 23, code: 'ALB', teamId: 'williams',
    nationality: 'Tailandês', countryCode: 'TH', birthDate: '1996-03-23', birthPlace: 'Londres, Inglaterra', debutYear: 2019, worldTitles: 0,
    bio: 'Representa a Tailândia; é a principal referência da Williams desde 2022.',
    career: ['Estreia pela Toro Rosso em 2019', 'Dois pódios pela Red Bull em 2020', 'Williams desde 2022'],
  },
  {
    id: 'sainz', apiId: 'sainz', firstName: 'Carlos', lastName: 'Sainz', number: 55, code: 'SAI', teamId: 'williams',
    nationality: 'Espanhol', countryCode: 'ES', birthDate: '1994-09-01', birthPlace: 'Madri, Espanha', debutYear: 2015, worldTitles: 0,
    bio: 'Vencedor de corridas pela Ferrari, chegou à Williams em 2025.',
    career: ['Estreia pela Toro Rosso em 2015', 'Primeira vitória no GP da Grã-Bretanha de 2022', 'Ferrari de 2021 a 2024', 'Williams desde 2025'],
  },
  {
    id: 'lawson', apiId: 'lawson', firstName: 'Liam', lastName: 'Lawson', number: 30, code: 'LAW', teamId: 'racing-bulls',
    nationality: 'Neozelandês', countryCode: 'NZ', birthDate: '2002-02-11', birthPlace: 'Hastings, Nova Zelândia', debutYear: 2023, worldTitles: 0,
    bio: 'Formado no programa de jovens da Red Bull, segue na Racing Bulls em 2026.',
    career: ['Estreia como substituto em 2023', 'Iniciou 2025 na Red Bull Racing', 'Racing Bulls desde o GP do Japão de 2025'],
  },
  {
    id: 'lindblad', apiId: 'arvid_lindblad', firstName: 'Arvid', lastName: 'Lindblad', number: 41, code: 'LIN', teamId: 'racing-bulls',
    nationality: 'Britânico', countryCode: 'GB', birthDate: '2007-08-08', birthPlace: 'Virginia Water, Inglaterra', debutYear: 2026, worldTitles: 0,
    bio: 'Único estreante do grid de 2026, revelado pelo programa de jovens da Red Bull.',
    career: ['Vencedor de corridas na F3 e na F2', 'Estreia na F1 pela Racing Bulls em 2026'],
  },
  {
    id: 'ocon', apiId: 'ocon', firstName: 'Esteban', lastName: 'Ocon', number: 31, code: 'OCO', teamId: 'haas',
    nationality: 'Francês', countryCode: 'FR', birthDate: '1996-09-17', birthPlace: 'Évreux, França', debutYear: 2016, worldTitles: 0,
    bio: 'Vencedor do GP da Hungria de 2021, corre pela Haas desde 2025.',
    career: ['Campeão da F3 Europeia em 2014', 'Vitória no GP da Hungria de 2021 pela Alpine', 'Haas desde 2025'],
  },
  {
    id: 'bearman', apiId: 'bearman', firstName: 'Oliver', lastName: 'Bearman', number: 87, code: 'BEA', teamId: 'haas',
    nationality: 'Britânico', countryCode: 'GB', birthDate: '2005-05-08', birthPlace: 'Chelmsford, Inglaterra', debutYear: 2024, worldTitles: 0,
    bio: 'Estreou substituindo Carlos Sainz na Ferrari, na Arábia Saudita, em 2024, e pontuou logo de cara.',
    career: ['Estreia pela Ferrari no GP da Arábia Saudita de 2024', 'Titular da Haas desde 2025'],
  },
  {
    id: 'hulkenberg', apiId: 'hulkenberg', firstName: 'Nico', lastName: 'Hülkenberg', number: 27, code: 'HUL', teamId: 'audi',
    nationality: 'Alemão', countryCode: 'DE', birthDate: '1987-08-19', birthPlace: 'Emmerich am Rhein, Alemanha', debutYear: 2010, worldTitles: 0,
    bio: 'Veterano de mais de uma década na F1, conquistou o primeiro pódio na Grã-Bretanha em 2025.',
    career: ['Campeão da GP2 em 2009', 'Pole no GP do Brasil de 2010 pela Williams', 'Vencedor das 24 Horas de Le Mans de 2015', 'Primeiro pódio na F1 em Silverstone, 2025'],
  },
  {
    id: 'bortoleto', apiId: 'bortoleto', firstName: 'Gabriel', lastName: 'Bortoleto', number: 5, code: 'BOR', teamId: 'audi',
    nationality: 'Brasileiro', countryCode: 'BR', birthDate: '2004-10-14', birthPlace: 'Osasco, Brasil', debutYear: 2025, worldTitles: 0,
    bio: 'Campeão da F3 e da F2 em anos consecutivos, é o representante do Brasil no grid.',
    career: ['Campeão da F3 FIA em 2023', 'Campeão da F2 em 2024', 'Estreia pela Sauber em 2025', 'Piloto da Audi em 2026'],
  },
  {
    id: 'perez', apiId: 'perez', firstName: 'Sergio', lastName: 'Pérez', number: 11, code: 'PER', teamId: 'cadillac',
    nationality: 'Mexicano', countryCode: 'MX', birthDate: '1990-01-26', birthPlace: 'Guadalajara, México', debutYear: 2011, worldTitles: 0,
    bio: 'O mexicano mais vitorioso da F1 volta ao grid em 2026 para liderar a Cadillac.',
    career: ['Estreia pela Sauber em 2011', 'Primeira vitória no GP de Sakhir de 2020', 'Red Bull de 2021 a 2024', 'Cadillac em 2026'],
  },
  {
    id: 'bottas', apiId: 'bottas', firstName: 'Valtteri', lastName: 'Bottas', number: 77, code: 'BOT', teamId: 'cadillac',
    nationality: 'Finlandês', countryCode: 'FI', birthDate: '1989-08-28', birthPlace: 'Nastola, Finlândia', debutYear: 2013, worldTitles: 0,
    bio: 'Vencedor de corridas pela Mercedes, retorna como titular pela Cadillac após um ano como reserva.',
    career: ['Estreia pela Williams em 2013', 'Mercedes de 2017 a 2021', 'Sauber de 2022 a 2024', 'Cadillac em 2026'],
  },
];

export const DRIVERS_SOURCE = {
  label: 'formula1.com — pilotos e números 2026',
  url: 'https://www.formula1.com/en/drivers',
};
