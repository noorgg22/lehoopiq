export interface NBATeam {
  id: string;
  name: string;
  abbr: string;
  espn: string;
}

export const NBA_TEAM_LIST: NBATeam[] = [
  { id: '1610612737', name: 'Atlanta Hawks',         abbr: 'ATL', espn: 'atl'  },
  { id: '1610612738', name: 'Boston Celtics',         abbr: 'BOS', espn: 'bos'  },
  { id: '1610612751', name: 'Brooklyn Nets',          abbr: 'BKN', espn: 'bkn'  },
  { id: '1610612766', name: 'Charlotte Hornets',      abbr: 'CHA', espn: 'cha'  },
  { id: '1610612741', name: 'Chicago Bulls',          abbr: 'CHI', espn: 'chi'  },
  { id: '1610612739', name: 'Cleveland Cavaliers',    abbr: 'CLE', espn: 'cle'  },
  { id: '1610612742', name: 'Dallas Mavericks',       abbr: 'DAL', espn: 'dal'  },
  { id: '1610612743', name: 'Denver Nuggets',         abbr: 'DEN', espn: 'den'  },
  { id: '1610612765', name: 'Detroit Pistons',        abbr: 'DET', espn: 'det'  },
  { id: '1610612744', name: 'Golden State Warriors',  abbr: 'GSW', espn: 'gs'   },
  { id: '1610612745', name: 'Houston Rockets',        abbr: 'HOU', espn: 'hou'  },
  { id: '1610612754', name: 'Indiana Pacers',         abbr: 'IND', espn: 'ind'  },
  { id: '1610612746', name: 'Los Angeles Clippers',   abbr: 'LAC', espn: 'lac'  },
  { id: '1610612747', name: 'Los Angeles Lakers',     abbr: 'LAL', espn: 'lal'  },
  { id: '1610612763', name: 'Memphis Grizzlies',      abbr: 'MEM', espn: 'mem'  },
  { id: '1610612748', name: 'Miami Heat',             abbr: 'MIA', espn: 'mia'  },
  { id: '1610612749', name: 'Milwaukee Bucks',        abbr: 'MIL', espn: 'mil'  },
  { id: '1610612750', name: 'Minnesota Timberwolves', abbr: 'MIN', espn: 'min'  },
  { id: '1610612740', name: 'New Orleans Pelicans',   abbr: 'NOP', espn: 'no'   },
  { id: '1610612752', name: 'New York Knicks',        abbr: 'NYK', espn: 'ny'   },
  { id: '1610612760', name: 'Oklahoma City Thunder',  abbr: 'OKC', espn: 'okc'  },
  { id: '1610612753', name: 'Orlando Magic',          abbr: 'ORL', espn: 'orl'  },
  { id: '1610612755', name: 'Philadelphia 76ers',     abbr: 'PHI', espn: 'phi'  },
  { id: '1610612756', name: 'Phoenix Suns',           abbr: 'PHX', espn: 'phx'  },
  { id: '1610612757', name: 'Portland Trail Blazers', abbr: 'POR', espn: 'por'  },
  { id: '1610612758', name: 'Sacramento Kings',       abbr: 'SAC', espn: 'sac'  },
  { id: '1610612759', name: 'San Antonio Spurs',      abbr: 'SAS', espn: 'sa'   },
  { id: '1610612761', name: 'Toronto Raptors',        abbr: 'TOR', espn: 'tor'  },
  { id: '1610612762', name: 'Utah Jazz',              abbr: 'UTA', espn: 'utah' },
  { id: '1610612764', name: 'Washington Wizards',     abbr: 'WAS', espn: 'wsh'  },
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
