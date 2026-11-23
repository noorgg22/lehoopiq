export interface NBATeam {
  id: string;
  name: string;
  abbr: string;
  espn: string;
  conf: 'East' | 'West';
}

export const NBA_TEAM_LIST: NBATeam[] = [
  { id: '1610612737', name: 'Atlanta Hawks',         abbr: 'ATL', espn: 'atl',  conf: 'East' },
  { id: '1610612738', name: 'Boston Celtics',         abbr: 'BOS', espn: 'bos',  conf: 'East' },
  { id: '1610612751', name: 'Brooklyn Nets',          abbr: 'BKN', espn: 'bkn',  conf: 'East' },
  { id: '1610612766', name: 'Charlotte Hornets',      abbr: 'CHA', espn: 'cha',  conf: 'East' },
  { id: '1610612741', name: 'Chicago Bulls',          abbr: 'CHI', espn: 'chi',  conf: 'East' },
  { id: '1610612739', name: 'Cleveland Cavaliers',    abbr: 'CLE', espn: 'cle',  conf: 'East' },
  { id: '1610612742', name: 'Dallas Mavericks',       abbr: 'DAL', espn: 'dal',  conf: 'West' },
  { id: '1610612743', name: 'Denver Nuggets',         abbr: 'DEN', espn: 'den',  conf: 'West' },
  { id: '1610612765', name: 'Detroit Pistons',        abbr: 'DET', espn: 'det',  conf: 'East' },
  { id: '1610612744', name: 'Golden State Warriors',  abbr: 'GSW', espn: 'gs',   conf: 'West' },
  { id: '1610612745', name: 'Houston Rockets',        abbr: 'HOU', espn: 'hou',  conf: 'West' },
  { id: '1610612754', name: 'Indiana Pacers',         abbr: 'IND', espn: 'ind',  conf: 'East' },
  { id: '1610612746', name: 'Los Angeles Clippers',   abbr: 'LAC', espn: 'lac',  conf: 'West' },
  { id: '1610612747', name: 'Los Angeles Lakers',     abbr: 'LAL', espn: 'lal',  conf: 'West' },
  { id: '1610612763', name: 'Memphis Grizzlies',      abbr: 'MEM', espn: 'mem',  conf: 'West' },
  { id: '1610612748', name: 'Miami Heat',             abbr: 'MIA', espn: 'mia',  conf: 'East' },
  { id: '1610612749', name: 'Milwaukee Bucks',        abbr: 'MIL', espn: 'mil',  conf: 'East' },
  { id: '1610612750', name: 'Minnesota Timberwolves', abbr: 'MIN', espn: 'min',  conf: 'West' },
  { id: '1610612740', name: 'New Orleans Pelicans',   abbr: 'NOP', espn: 'no',   conf: 'West' },
  { id: '1610612752', name: 'New York Knicks',        abbr: 'NYK', espn: 'ny',   conf: 'East' },
  { id: '1610612760', name: 'Oklahoma City Thunder',  abbr: 'OKC', espn: 'okc',  conf: 'West' },
  { id: '1610612753', name: 'Orlando Magic',          abbr: 'ORL', espn: 'orl',  conf: 'East' },
  { id: '1610612755', name: 'Philadelphia 76ers',     abbr: 'PHI', espn: 'phi',  conf: 'East' },
  { id: '1610612756', name: 'Phoenix Suns',           abbr: 'PHX', espn: 'phx',  conf: 'West' },
  { id: '1610612757', name: 'Portland Trail Blazers', abbr: 'POR', espn: 'por',  conf: 'West' },
  { id: '1610612758', name: 'Sacramento Kings',       abbr: 'SAC', espn: 'sac',  conf: 'West' },
  { id: '1610612759', name: 'San Antonio Spurs',      abbr: 'SAS', espn: 'sa',   conf: 'West' },
  { id: '1610612761', name: 'Toronto Raptors',        abbr: 'TOR', espn: 'tor',  conf: 'East' },
  { id: '1610612762', name: 'Utah Jazz',              abbr: 'UTA', espn: 'utah', conf: 'West' },
  { id: '1610612764', name: 'Washington Wizards',     abbr: 'WAS', espn: 'wsh',  conf: 'East' },
];

/** Look up a team by abbreviation (case-insensitive) */
export function teamByAbbr(abbr: string): NBATeam | undefined {
  const upper = abbr.toUpperCase();
  return NBA_TEAM_LIST.find(t => t.abbr === upper);
}

/** Map team full name -> NBA team ID */
export const TEAM_IDS: Record<string, string> = Object.fromEntries(
  NBA_TEAM_LIST.map(t => [t.name, t.id])
);
