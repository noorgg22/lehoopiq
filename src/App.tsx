import React, { useState, useEffect, useCallback } from 'react';
import PlayerProfile from './PlayerProfile';
import ShamelessMeter from './ShamelessMeter';
import TeamPage from './TeamPage';

const PROXY = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001/api';
const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';

const C = {
  bg: '#09090b', surface: '#18181b', surfaceHi: '#27272a',
  borderSub: '#27272a', text: '#fafafa', textSub: '#a1a1aa', textMuted: '#52525b',
  orange: '#f97316', orangeDim: 'rgba(249,115,22,0.12)',
  emerald: '#34d399', amber: '#fbbf24', sky: '#38bdf8', violet: '#a78bfa', rose: '#fb7185',
  green: '#4ade80',
};

const ACCENT: Record<string, { color: string; dimBg: string }> = {
  Points:   { color: C.orange,  dimBg: 'rgba(249,115,22,0.10)' },
  Rebounds: { color: C.sky,     dimBg: 'rgba(56,189,248,0.10)' },
  Assists:  { color: C.emerald, dimBg: 'rgba(52,211,153,0.10)' },
  Steals:   { color: C.violet,  dimBg: 'rgba(167,139,250,0.10)' },
  Blocks:   { color: C.rose,    dimBg: 'rgba(251,113,133,0.10)' },
};

const ODDS_ACCENT: Record<string, { color: string; dimBg: string }> = {
  'Championship': { color: C.orange,  dimBg: 'rgba(249,115,22,0.10)' },
  'Eastern Conf': { color: C.emerald, dimBg: 'rgba(52,211,153,0.10)' },
  'Western Conf': { color: C.sky,     dimBg: 'rgba(56,189,248,0.10)' },
};

const CATEGORIES = ['Points', 'Rebounds', 'Assists', 'Steals', 'Blocks'];
const STAT_CODES: Record<string, string> = {
  Points: 'PTS', Rebounds: 'REB', Assists: 'AST', Steals: 'STL', Blocks: 'BLK',
};
const ODDS_TABS = ['Championship', 'Eastern Conf', 'Western Conf'];

const ODDS_UPDATED = 'April 7, 2026';
const ODDS: Record<string, { team: string; odds: string; abbr: string }[]> = {
  'Championship': [
    { team: 'Oklahoma City Thunder',  odds: '+130',  abbr: 'okc' },
    { team: 'Boston Celtics',         odds: '+550',  abbr: 'bos' },
    { team: 'San Antonio Spurs',      odds: '+600',  abbr: 'sa'  },
    { team: 'Denver Nuggets',         odds: '+800',  abbr: 'den' },
    { team: 'Cleveland Cavaliers',    odds: '+1300', abbr: 'cle' },
    { team: 'New York Knicks',        odds: '+1600', abbr: 'ny'  },
    { team: 'Detroit Pistons',        odds: '+2500', abbr: 'det' },
    { team: 'Los Angeles Lakers',     odds: '+3000', abbr: 'lal' },
    { team: 'Minnesota Timberwolves', odds: '+4500', abbr: 'min' },
    { team: 'Houston Rockets',        odds: '+7500', abbr: 'hou' },
    { team: 'Philadelphia 76ers',     odds: '+8000', abbr: 'phi' },
    { team: 'Atlanta Hawks',          odds: '+10000',abbr: 'atl' },
    { team: 'Golden State Warriors',  odds: '+12000',abbr: 'gs'  },
    { team: 'Los Angeles Clippers',   odds: '+15000',abbr: 'lac' },
    { team: 'Phoenix Suns',           odds: '+20000',abbr: 'phx' },
  ],
  'Eastern Conf': [
    { team: 'Boston Celtics',         odds: '+150',  abbr: 'bos' },
    { team: 'Cleveland Cavaliers',    odds: '+350',  abbr: 'cle' },
    { team: 'New York Knicks',        odds: '+400',  abbr: 'ny'  },
    { team: 'Detroit Pistons',        odds: '+500',  abbr: 'det' },
    { team: 'Atlanta Hawks',          odds: '+1200', abbr: 'atl' },
    { team: 'Philadelphia 76ers',     odds: '+1400', abbr: 'phi' },
    { team: 'Toronto Raptors',        odds: '+3000', abbr: 'tor' },
    { team: 'Charlotte Hornets',      odds: '+5000', abbr: 'cha' },
    { team: 'Orlando Magic',          odds: '+8000', abbr: 'orl' },
    { team: 'Miami Heat',             odds: '+10000',abbr: 'mia' },
  ],
  'Western Conf': [
    { team: 'Oklahoma City Thunder',  odds: '-130',  abbr: 'okc' },
    { team: 'San Antonio Spurs',      odds: '+300',  abbr: 'sa'  },
    { team: 'Denver Nuggets',         odds: '+550',  abbr: 'den' },
    { team: 'Los Angeles Lakers',     odds: '+700',  abbr: 'lal' },
    { team: 'Houston Rockets',        odds: '+1200', abbr: 'hou' },
    { team: 'Minnesota Timberwolves', odds: '+1800', abbr: 'min' },
    { team: 'Golden State Warriors',  odds: '+4000', abbr: 'gs'  },
    { team: 'Los Angeles Clippers',   odds: '+5000', abbr: 'lac' },
    { team: 'Portland Trail Blazers', odds: '+8000', abbr: 'por' },
  ],
};

// ── NBA Team ID map for clickable standings ───────────────────────────────────
const TEAM_IDS: Record<string, string> = {
  'Atlanta Hawks': '1610612737',
  'Boston Celtics': '1610612738',
  'Brooklyn Nets': '1610612751',
  'Charlotte Hornets': '1610612766',
  'Chicago Bulls': '1610612741',
  'Cleveland Cavaliers': '1610612739',
  'Dallas Mavericks': '1610612742',
  'Denver Nuggets': '1610612743',
  'Detroit Pistons': '1610612765',
  'Golden State Warriors': '1610612744',
  'Houston Rockets': '1610612745',
  'Indiana Pacers': '1610612754',
  'Los Angeles Clippers': '1610612746',
  'Los Angeles Lakers': '1610612747',
  'Memphis Grizzlies': '1610612763',
  'Miami Heat': '1610612748',
  'Milwaukee Bucks': '1610612749',
  'Minnesota Timberwolves': '1610612750',
  'New Orleans Pelicans': '1610612740',
  'New York Knicks': '1610612752',
  'Oklahoma City Thunder': '1610612760',
  'Orlando Magic': '1610612753',
  'Philadelphia 76ers': '1610612755',
  'Phoenix Suns': '1610612756',
  'Portland Trail Blazers': '1610612757',
  'Sacramento Kings': '1610612758',
  'San Antonio Spurs': '1610612759',
  'Toronto Raptors': '1610612761',
  'Utah Jazz': '1610612762',
  'Washington Wizards': '1610612764',
};

interface Leader { name: string; team: string; value: string; playerId: string; }
interface Standing { rank: number; team: string; teamId: string; wins: number; losses: number; pct: string; conf: string; logo: string; abbr: string; }
interface Game { id: string; home: { name: string; logo: string }; away: { name: string; logo: string }; homeScore: number; awayScore: number; status: string; period: number; clock: string; }

const card: React.CSSProperties = { background: C.surface, border: `1px solid ${C.borderSub}`, borderRadius: 18, padding: 20 };
const secTitle: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textMuted, marginBottom: 16 };

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${C.borderSub}`, borderTopColor: C.orange, animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

function StandingsTable({ teams, conf, onTeamClick }: {
  teams: Standing[];
  conf: string;
  onTeamClick: (teamId: string, teamName: string, teamAbbr: string) => void;
}) {
  const color = conf === 'East' ? C.emerald : C.amber;
  const filtered = teams.filter(t => t.conf === conf);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color }}>{conf}ern</span>
      </div>
      {filtered.map((t, i) => (
        <div key={t.team}>
          <div
            onClick={() => onTeamClick(t.teamId || TEAM_IDS[t.team] || '', t.team, t.abbr)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '5px 4px', borderRadius: 8,
              borderBottom: i === 5 ? `1px solid ${C.borderSub}` : 'none',
              opacity: i >= 10 ? 0.35 : 1,
              cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = C.surfaceHi)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span style={{ fontSize: 10, color: C.textMuted, width: 18, textAlign: 'right', flexShrink: 0 }}>{t.rank}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, overflow: 'hidden' }}>
              {t.logo && <img src={t.logo} alt="" style={{ width: 16, height: 16, objectFit: 'contain', flexShrink: 0 }} />}
              <span style={{ fontSize: 11, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.team}</span>
            </div>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: C.textSub, flexShrink: 0 }}>{t.wins}-{t.losses}</span>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: i < 8 ? color : C.textMuted, width: 36, textAlign: 'right', flexShrink: 0 }}>{t.pct}</span>
          </div>
          {i === 9 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '3px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(239,68,68,0.5)', borderTop: '1px dashed rgba(239,68,68,0.6)' }} />
              <span style={{ fontSize: 8, color: 'rgba(239,68,68,0.7)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}>Play-In</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(239,68,68,0.5)', borderTop: '1px dashed rgba(239,68,68,0.6)' }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ScoreCard({ game }: { game: Game }) {
  const homeWon = game.homeScore > game.awayScore;
  const isFinal = game.status.toLowerCase().includes('final');
  const isLive = !isFinal && game.period > 0;
  return (
    <div style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${C.borderSub}`, borderRadius: 12, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        {isLive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.emerald, display: 'inline-block', animation: 'pulse 2s infinite' }} />}
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: isLive ? C.emerald : C.orange }}>
          {isLive ? `Q${game.period} · ${game.clock}` : game.status}
        </span>
      </div>
      {[
        { team: game.away, score: game.awayScore, won: !homeWon && (game.homeScore > 0 || game.awayScore > 0) },
        { team: game.home, score: game.homeScore, won: homeWon && (game.homeScore > 0 || game.awayScore > 0) },
      ].map((row, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: i === 0 ? 6 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {row.team.logo && <img src={row.team.logo} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />}
            <span style={{ fontSize: 13, fontWeight: 500, color: row.won ? C.text : C.textSub }}>{row.team.name}</span>
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: 17, fontWeight: 700, color: row.won ? C.text : C.textMuted }}>
            {game.period > 0 || isFinal ? row.score : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

function LeagueLeadersPanel({ leaders, onPlayerClick }: {
  leaders: Record<string, Leader[]>;
  onPlayerClick: (id: string, name: string, team: string) => void;
}) {
  const [active, setActive] = useState('Points');
  const { color, dimBg } = ACCENT[active];
  const list = leaders[active] || [];
  const max = parseFloat(list[0]?.value || '1');

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, padding: 4, background: 'rgba(0,0,0,0.3)', borderRadius: 12 }}>
        {CATEGORIES.map(cat => {
          const a = ACCENT[cat]; const isActive = cat === active;
          return (
            <button key={cat} onClick={() => setActive(cat)} style={{
              flex: 1, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '7px 4px', borderRadius: 8, cursor: 'pointer',
              background: isActive ? a.dimBg : 'transparent', color: isActive ? a.color : C.textMuted,
              border: isActive ? `1px solid ${a.color}40` : '1px solid transparent',
            }}>{cat}</button>
          );
        })}
      </div>
      {list.length === 0 ? (
        <p style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', padding: 20 }}>
          Start the proxy server to load live stats
        </p>
      ) : list.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 10, cursor: 'pointer' }}
          onClick={() => onPlayerClick(p.playerId, p.name, p.team)}
          onMouseEnter={e => (e.currentTarget.style.background = '#27272a')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ width: 20, textAlign: 'right', fontSize: 11, color: C.textMuted, fontFamily: 'monospace' }}>{i + 1}</span>
          <img
            src={`https://cdn.nba.com/headshots/nba/latest/260x190/${p.playerId}.png`}
            alt={p.name}
            style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', background: C.surfaceHi, flexShrink: 0 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              <span style={{ fontSize: 10, color: C.textMuted, fontFamily: 'monospace', flexShrink: 0 }}>{p.team}</span>
            </div>
            <div style={{ marginTop: 4, height: 3, background: C.surfaceHi, borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(parseFloat(p.value) / max) * 100}%`, background: color, opacity: 0.6, borderRadius: 99 }} />
            </div>
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color, flexShrink: 0 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function BettingOddsPanel() {
  const [active, setActive] = useState('Championship');
  const { color } = ODDS_ACCENT[active];
  const list = ODDS[active] || [];
  const isFav = (odds: string) => odds.startsWith('-') || parseInt(odds.replace('+', '')) <= 300;

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, padding: 4, background: 'rgba(0,0,0,0.3)', borderRadius: 12 }}>
        {ODDS_TABS.map(tab => {
          const a = ODDS_ACCENT[tab]; const isActive = tab === active;
          return (
            <button key={tab} onClick={() => setActive(tab)} style={{
              flex: 1, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '7px 4px', borderRadius: 8, cursor: 'pointer',
              background: isActive ? a.dimBg : 'transparent', color: isActive ? a.color : C.textMuted,
              border: isActive ? `1px solid ${a.color}40` : '1px solid transparent',
            }}>{tab}</button>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', marginBottom: 8 }}>
        <span style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Team</span>
        <span style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>DraftKings</span>
      </div>
      {list.map((item, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 10,
          background: i === 0 ? `${color}08` : 'transparent',
          border: i === 0 ? `1px solid ${color}20` : '1px solid transparent',
          marginBottom: 2,
        }}>
          <span style={{ width: 20, textAlign: 'right', fontSize: 11, color: C.textMuted, fontFamily: 'monospace' }}>{i + 1}</span>
          <img src={`https://a.espncdn.com/i/teamlogos/nba/500/${item.abbr}.png`} alt={item.team}
            style={{ width: 24, height: 24, objectFit: 'contain', flexShrink: 0 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span style={{ flex: 1, fontSize: 12, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.team}</span>
          <span style={{
            fontFamily: 'monospace', fontSize: 13, fontWeight: 700, flexShrink: 0,
            color: isFav(item.odds) ? C.green : C.textSub,
            background: isFav(item.odds) ? 'rgba(74,222,128,0.08)' : 'transparent',
            padding: '2px 8px', borderRadius: 6,
          }}>{item.odds}</span>
        </div>
      ))}
      <p style={{ fontSize: 10, color: C.textMuted, textAlign: 'center', marginTop: 12 }}>
        Odds via DraftKings · Updated {ODDS_UPDATED}
      </p>
    </div>
  );
}

function parseLeaders(data: any, stat: string): Leader[] {
  // Server returns { resultSets: [{ name, headers, rowSet }] }
  const rs = data?.resultSets?.[0] ?? data?.resultSet;
  if (!rs?.rowSet) return [];
  const headers: string[] = rs.headers;
  const rows: any[][] = rs.rowSet;
  const nameIdx = headers.indexOf('PLAYER');
  const teamIdx = headers.indexOf('TEAM');
  const statIdx = headers.indexOf(stat);
  const idIdx = headers.indexOf('PLAYER_ID');
  return rows.slice(0, 15).map(row => ({
    name: row[nameIdx] || '',
    team: row[teamIdx] || '',
    value: Number(row[statIdx] || 0).toFixed(1),
    playerId: String(row[idIdx] || ''),
  }));
}

// ESPN logo abbreviations differ from NBA abbreviations for some teams
const ESPN_LOGO_ABBR: Record<string, string> = {
  'GSW': 'gs', 'NYK': 'ny', 'NOP': 'no', 'SAS': 'sa', 'UTA': 'utah', 'WAS': 'wsh',
};

function parseStandings(data: any): Standing[] {
  if (!data?.resultSets) return [];
  const rs = data.resultSets.find((r: any) => r.name === 'Standings');
  if (!rs) return [];
  const h = rs.headers;
  const rows: any[][] = rs.rowSet;
  const get = (row: any[], name: string) => row[h.indexOf(name)];
  return rows.map((row, idx) => {
    const conf = get(row, 'Conference');
    const teamId = get(row, 'TeamID');
    const teamCity = get(row, 'TeamCity');
    const teamName = get(row, 'TeamName');
    const abbr = get(row, 'TeamAbbreviation') || '';
    const espnAbbr = ESPN_LOGO_ABBR[abbr] || abbr.toLowerCase();
    return {
      rank: parseInt(get(row, 'PlayoffRank')) || idx + 1,
      team: teamCity + ' ' + teamName,
      teamId: String(teamId || ''),
      wins: parseInt(get(row, 'WINS')) || 0,
      losses: parseInt(get(row, 'LOSSES')) || 0,
      pct: (parseFloat(get(row, 'WinPCT')) || 0).toFixed(3).replace('0.', '.'),
      conf: conf === 'East' ? 'East' : 'West',
      logo: `https://a.espncdn.com/i/teamlogos/nba/500/${espnAbbr}.png`,
      abbr,
    };
  });
}

export default function App() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [leaders, setLeaders] = useState<Record<string, Leader[]>>({});
  const [news, setNews] = useState<{ headline: string; time: string; tag: string; link: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [proxyOnline, setProxyOnline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // ── Navigation state ─────────────────────────────────────────────────────
  const [showShameless, setShowShameless] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; name: string; team: string } | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<{ teamId: string; teamName: string; teamAbbr: string } | null>(null);
  // Track where to go back after viewing a player from team page
  const [cameFromTeam, setCameFromTeam] = useState(false);

  const now = new Date().toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  });

  const fetchAll = useCallback(async () => {
    try {
      const [scoreRes, newsRes] = await Promise.all([
        fetch(`${ESPN}/scoreboard`),
        fetch(`${ESPN}/news?limit=8`),
      ]);
      const scoreData = await scoreRes.json();
      setGames((scoreData.events || []).map((e: any) => {
        const comp = e.competitions?.[0];
        const home = comp?.competitors?.find((c: any) => c.homeAway === 'home');
        const away = comp?.competitors?.find((c: any) => c.homeAway === 'away');
        const status = comp?.status;
        const isPre = status?.type?.state === 'pre';
        return {
          id: e.id,
          home: { name: home?.team?.shortDisplayName || '', logo: home?.team?.logo || '' },
          away: { name: away?.team?.shortDisplayName || '', logo: away?.team?.logo || '' },
          homeScore: parseInt(home?.score || '0'),
          awayScore: parseInt(away?.score || '0'),
          status: isPre
            ? new Date(e.date).toLocaleString('en-US', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
            : status?.type?.shortDetail || '',
          period: status?.period || 0,
          clock: status?.displayClock || '',
        };
      }));

      const newsData = await newsRes.json();
      setNews((newsData.articles || []).slice(0, 8).map((a: any) => ({
        headline: a.headline || '',
        time: a.published ? new Date(a.published).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '',
        tag: a.categories?.[0]?.description || 'NBA',
        link: a.links?.web?.href || '#',
      })));
    } catch (e) { console.error('ESPN fetch failed', e); }

    let pingOk = false;
    try {
      const pingRes = await fetch(`${PROXY}/news`, { signal: AbortSignal.timeout(12000) });
      pingOk = pingRes.ok;
    } catch { pingOk = false; }

    setProxyOnline(pingOk);

    if (pingOk) {
      try {
        const [standData, pts, reb, ast, stl, blk] = await Promise.all([
          fetch(`${PROXY}/standings`).then(r => r.json()),
          ...(['PTS', 'REB', 'AST', 'STL', 'BLK'] as string[]).map(stat =>
            fetch(`${PROXY}/leaders?stat=${stat}`).then(r => r.json())
          ),
        ]);
        const parsed = parseStandings(standData);
        if (parsed.length > 0) setStandings(parsed);
        setLeaders({
          Points:   parseLeaders(pts, 'PTS'),
          Rebounds: parseLeaders(reb, 'REB'),
          Assists:  parseLeaders(ast, 'AST'),
          Steals:   parseLeaders(stl, 'STL'),
          Blocks:   parseLeaders(blk, 'BLK'),
        });
      } catch (e) { console.error('Data fetch error:', e); }
    }

    setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // ── Routing ──────────────────────────────────────────────────────────────
  if (showShameless) {
    return <ShamelessMeter onBack={() => setShowShameless(false)} />;
  }

  if (selectedPlayer) {
    return (
      <PlayerProfile
        playerId={selectedPlayer.id}
        playerName={selectedPlayer.name}
        team={selectedPlayer.team}
        onBack={() => {
          setSelectedPlayer(null);
          // If came from team page, go back to team page
          if (cameFromTeam) {
            setCameFromTeam(false);
            // selectedTeam is still set so team page will show
          }
        }}
      />
    );
  }

  if (selectedTeam) {
    return (
      <TeamPage
        teamId={selectedTeam.teamId}
        teamName={selectedTeam.teamName}
        teamAbbr={selectedTeam.teamAbbr}
        onBack={() => setSelectedTeam(null)}
        onPlayerClick={(playerId, playerName, team) => {
          setCameFromTeam(true);
          setSelectedPlayer({ id: playerId, name: playerName, team });
        }}
      />
    );
  }

  // ── Home page ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { font-family: inherit; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 99px; }
      `}</style>

      {/* HEADER */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(9,9,11,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.borderSub}` }}>
        <div style={{ maxWidth: 1500, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt="LeHoopIQ" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>LeHoopIQ</span>
          </div>
          <nav style={{ display: 'flex', gap: 4, flex: 1 }}>
            <a href="#" style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none', background: C.orangeDim, color: C.orange }}>Home</a>
          </nav>
          <div style={{ fontSize: 11, color: C.textMuted, display: 'flex', alignItems: 'center', gap: 12 }}>
            {lastUpdated && (
              <span style={{ fontSize: 10, color: C.textMuted }}>Updated {lastUpdated}</span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: proxyOnline ? C.emerald : C.amber, display: 'inline-block' }} />
              <span style={{ fontSize: 10 }}>{proxyOnline ? 'NBA Live' : 'Proxy Offline'}</span>
            </span>
            <span style={{ color: C.textMuted }}>{now}</span>
          </div>
        </div>
      </header>

      {/* PROXY BANNER */}
      {!proxyOnline && !loading && (
        <div style={{ background: 'rgba(251,191,36,0.08)', borderBottom: `1px solid rgba(251,191,36,0.2)`, padding: '10px 24px', textAlign: 'center', fontSize: 12, color: C.amber }}>
          ⚡ Start the proxy server for live stats: open a new terminal in VS Code and run{' '}
          <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4 }}>npm run dev</code>
        </div>
      )}

      <main style={{ maxWidth: 1500, margin: '0 auto', padding: '28px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 280px', gap: 20, alignItems: 'start' }}>

          {/* LEFT — Standings + Games */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={card}>
              <div style={secTitle}>Standings · 2025–26</div>
              {loading ? <Spinner /> : standings.length === 0 ? (
                <p style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', padding: 20 }}>
                  Run <code>npm run dev</code> to load live standings
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <StandingsTable
                    teams={standings}
                    conf="East"
                    onTeamClick={(teamId, teamName, teamAbbr) => setSelectedTeam({ teamId, teamName, teamAbbr })}
                  />
                  <StandingsTable
                    teams={standings}
                    conf="West"
                    onTeamClick={(teamId, teamName, teamAbbr) => setSelectedTeam({ teamId, teamName, teamAbbr })}
                  />
                </div>
              )}
            </div>
            <div style={card}>
              <div style={secTitle}>Today's Games</div>
              {loading ? <Spinner /> : games.length === 0 ? (
                <p style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', padding: 20 }}>No games today.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {games.map(g => <ScoreCard key={g.id} game={g} />)}
                </div>
              )}
            </div>
          </div>

          {/* CENTER — Leaders + Odds */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={card}>
              <div style={secTitle}>League Leaders · Top 15</div>
              {loading ? <Spinner /> : (
                <LeagueLeadersPanel
                  leaders={leaders}
                  onPlayerClick={(id, name, team) => {
                    setCameFromTeam(false);
                    setSelectedPlayer({ id, name, team });
                  }}
                />
              )}
            </div>
            <div style={card}>
              <div style={secTitle}>Championship & Conference Odds</div>
              <BettingOddsPanel />
            </div>
          </div>

          {/* RIGHT — News */}
          <div style={{ position: 'sticky', top: 72 }}>
            <div style={card}>
              <div style={secTitle}>NBA News</div>
              {loading ? <Spinner /> : news.length === 0 ? (
                <p style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', padding: 20 }}>No news</p>
              ) : news.map((item, i) => (
                <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', padding: 10, borderRadius: 10, textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.surfaceHi)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: C.orangeDim, color: C.orange, border: `1px solid ${C.orange}40`, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>
                    {item.tag.slice(0, 14)}
                  </span>
                  <p style={{ fontSize: 13, color: C.textSub, lineHeight: 1.45 }}>{item.headline}</p>
                  <p style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{item.time}</p>
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* SHAMELESS METER BUTTON */}
        <div style={{ textAlign: 'center', marginTop: 32, paddingBottom: 16 }}>
          <button
            onClick={() => setShowShameless(true)}
            style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 12, padding: '14px 28px', cursor: 'pointer', color: '#ef4444',
              fontSize: 14, fontWeight: 700, letterSpacing: '0.05em',
            }}
          >
            🚨 View The Shameless Meter →
          </button>
        </div>
      </main>
    </div>
  );
}