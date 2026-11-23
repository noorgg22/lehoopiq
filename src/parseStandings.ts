import { getCurrentSeasonYear } from './season';

export interface StandingsRow {
  rank: number;
  team: string;
  shortName: string;
  abbr: string;
  logo: string;
  teamId: string;
  wins: number;
  losses: number;
  pct: string;
  gb: string;
  last10: string;
  streak: string;
  conf: 'East' | 'West';
}

const ESPN_LOGO_ABBR: Record<string, string> = {
  GSW: 'gs', NYK: 'ny', NOP: 'no', SAS: 'sa', UTA: 'utah', WAS: 'wsh',
};

export async function fetchStandings(): Promise<StandingsRow[]> {
  const res = await fetch(
    `https://site.api.espn.com/apis/v2/sports/basketball/nba/standings?season=${getCurrentSeasonYear()}`,
    { signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return parseESPNStandings(data);
}

export function parseESPNStandings(data: any): StandingsRow[] {
  const rows: StandingsRow[] = [];
  for (const child of data?.children || []) {
    const confName = child.name || '';
    const conf: 'East' | 'West' = confName.includes('East') ? 'East' : 'West';

    const entries = child.standings?.entries || [];

    // Sort by playoffSeed ascending (ESPN returns in arbitrary order)
    const sorted = [...entries].sort((a: any, b: any) => {
      const seedA = a.stats?.find((s: any) => s.name === 'playoffSeed')?.value ?? 99;
      const seedB = b.stats?.find((s: any) => s.name === 'playoffSeed')?.value ?? 99;
      return seedA - seedB;
    });

    for (let i = 0; i < sorted.length; i++) {
      const entry = sorted[i];
      const team = entry.team || {};
      const abbr = team.abbreviation || '';
      const espnAbbr = ESPN_LOGO_ABBR[abbr] || abbr.toLowerCase();
      const stats = entry.stats || [];
      const getStat = (name: string) => {
        const s = stats.find((s: any) => s.name === name);
        return s?.displayValue ?? s?.value ?? '';
      };

      const wins = parseInt(getStat('wins')) || 0;
      const losses = parseInt(getStat('losses')) || 0;

      // Games behind
      const gbVal = getStat('gamesBehind');
      const gb = gbVal === '' || gbVal === '0' || gbVal === 0 ? '-' : String(gbVal);

      rows.push({
        rank: i + 1,
        team: team.displayName || '',
        shortName: team.shortDisplayName || team.abbreviation || '',
        abbr: abbr.toUpperCase(),
        logo: `https://a.espncdn.com/i/teamlogos/nba/500/${espnAbbr}.png`,
        teamId: String(team.id || ''),
        wins,
        losses,
        pct: (wins / Math.max(wins + losses, 1)).toFixed(3).replace(/^0/, ''),
        gb,
        last10: getStat('record') || '',
        streak: getStat('streak') || '',
        conf,
      });
    }
  }
  return rows;
}
