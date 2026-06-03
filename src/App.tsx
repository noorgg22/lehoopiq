import React, { useState, useEffect, useCallback } from 'react';
import PlayerProfile from './PlayerProfile';
import ShamelessMeter from './ShamelessMeter';
import TeamPage from './TeamPage';

const PROXY = import.meta.env.VITE_PROXY_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? '/api'
    : 'http://localhost:3001/api');
const ESPN  = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';

// ── Design tokens (mirrored from CSS vars for inline styles) ─────────────────
const C = {
  canvas:       '#0d0e10',
  surface:      '#141519',
  surfaceRaised:'#1c1d22',
  surfaceHover: '#22232a',
  border:       '#26272e',
  borderStrong: 'rgba(255,255,255,0.10)',
  text:         '#f0f0f2',
  textSub:      '#9a9ba6',
  textMuted:    '#5a5b66',
  red:          '#c8102e',
  redDim:       'rgba(200,16,46,0.10)',
  redBorder:    'rgba(200,16,46,0.28)',
  live:         '#22c55e',
  liveDim:      'rgba(34,197,94,0.12)',
  amber:        '#f59e0b',
  amberDim:     'rgba(245,158,11,0.10)',
  sky:          '#38bdf8',
  violet:       '#a78bfa',
  rose:         '#fb7185',
  emerald:      '#34d399',
  green:        '#4ade80',
  mono:         "'Geist Mono','SF Mono',ui-monospace,Menlo,monospace",
};

const ACCENT: Record<string, { color: string; dimBg: string }> = {
  Points:   { color: C.red,     dimBg: C.redDim },
  Rebounds: { color: C.sky,     dimBg: 'rgba(56,189,248,0.10)' },
  Assists:  { color: C.emerald, dimBg: 'rgba(52,211,153,0.10)' },
  Steals:   { color: C.violet,  dimBg: 'rgba(167,139,250,0.10)' },
  Blocks:   { color: C.rose,    dimBg: 'rgba(251,113,133,0.10)' },
};

const ODDS_ACCENT: Record<string, { color: string; dimBg: string }> = {
  'Championship': { color: C.red,     dimBg: C.redDim },
  'Eastern Conf': { color: C.emerald, dimBg: 'rgba(52,211,153,0.10)' },
  'Western Conf': { color: C.sky,     dimBg: 'rgba(56,189,248,0.10)' },
};

const CATEGORIES = ['Points', 'Rebounds', 'Assists', 'Steals', 'Blocks'];
const ODDS_TABS  = ['Championship', 'Eastern Conf', 'Western Conf'];

// NBA Finals: San Antonio Spurs vs New York Knicks — updated June 2, 2026
const ODDS_UPDATED = 'June 2, 2026';
const ODDS: Record<string, { team: string; odds: string; abbr: string }[]> = {
  'Championship': [
    { team: 'San Antonio Spurs',      odds: '-145',  abbr: 'sa'  },
    { team: 'New York Knicks',        odds: '+120',  abbr: 'ny'  },
  ],
  'Eastern Conf': [
    { team: 'New York Knicks',        odds: '-10000', abbr: 'ny'  },
  ],
  'Western Conf': [
    { team: 'San Antonio Spurs',      odds: '-10000', abbr: 'sa'  },
  ],
};

const NBA_TEAM_LIST = [
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

const TEAM_IDS: Record<string, string> = {
  'Atlanta Hawks': '1610612737', 'Boston Celtics': '1610612738',
  'Brooklyn Nets': '1610612751', 'Charlotte Hornets': '1610612766',
  'Chicago Bulls': '1610612741', 'Cleveland Cavaliers': '1610612739',
  'Dallas Mavericks': '1610612742', 'Denver Nuggets': '1610612743',
  'Detroit Pistons': '1610612765', 'Golden State Warriors': '1610612744',
  'Houston Rockets': '1610612745', 'Indiana Pacers': '1610612754',
  'Los Angeles Clippers': '1610612746', 'Los Angeles Lakers': '1610612747',
  'Memphis Grizzlies': '1610612763', 'Miami Heat': '1610612748',
  'Milwaukee Bucks': '1610612749', 'Minnesota Timberwolves': '1610612750',
  'New Orleans Pelicans': '1610612740', 'New York Knicks': '1610612752',
  'Oklahoma City Thunder': '1610612760', 'Orlando Magic': '1610612753',
  'Philadelphia 76ers': '1610612755', 'Phoenix Suns': '1610612756',
  'Portland Trail Blazers': '1610612757', 'Sacramento Kings': '1610612758',
  'San Antonio Spurs': '1610612759', 'Toronto Raptors': '1610612761',
  'Utah Jazz': '1610612762', 'Washington Wizards': '1610612764',
};

interface Leader  { name: string; team: string; value: string; playerId: string; }
interface Standing { rank: number; team: string; teamId: string; wins: number; losses: number; pct: string; conf: string; logo: string; abbr: string; }
interface Game    { id: string; home: { name: string; logo: string }; away: { name: string; logo: string }; homeScore: number; awayScore: number; status: string; period: number; clock: string; }

// ── Shared style primitives ───────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 12,
  padding: '20px 20px',
};

const sectionLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: C.textMuted,
  marginBottom: 16,
};

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 28 }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        border: `2px solid ${C.border}`,
        borderTopColor: C.red,
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  );
}

// ── Standings ─────────────────────────────────────────────────────────────────
function StandingsTable({ teams, conf, onTeamClick }: {
  teams: Standing[];
  conf: string;
  onTeamClick: (teamId: string, teamName: string, teamAbbr: string) => void;
}) {
  const isEast = conf === 'East';
  const accentColor = isEast ? C.emerald : C.sky;
  const filtered = teams.filter(t => t.conf === conf);

  return (
    <div>
      {/* Conf header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: accentColor, display: 'inline-block', flexShrink: 0,
        }} />
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: accentColor,
        }}>{conf}ern Conference</span>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '18px 1fr 48px 40px',
        gap: 6, padding: '0 6px 6px', marginBottom: 2,
      }}>
        <span />
        <span style={{ fontSize: 9, color: C.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Team</span>
        <span style={{ fontSize: 9, color: C.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center' }}>W-L</span>
        <span style={{ fontSize: 9, color: C.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'right' }}>PCT</span>
      </div>

      {filtered.map((t, i) => (
        <React.Fragment key={t.team}>
          <div
            onClick={() => onTeamClick(t.teamId || TEAM_IDS[t.team] || '', t.team, t.abbr)}
            style={{
              display: 'grid', gridTemplateColumns: '18px 1fr 48px 40px',
              gap: 6, padding: '7px 6px', borderRadius: 6,
              opacity: i >= 10 ? 0.38 : 1,
              cursor: 'pointer',
              transition: 'background 120ms ease',
              borderLeft: i < 6 ? `2px solid ${accentColor}30` : '2px solid transparent',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = C.surfaceHover)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span style={{
              fontSize: 10, fontFamily: C.mono,
              color: i < 8 ? accentColor : C.textMuted,
              textAlign: 'right', alignSelf: 'center',
            }}>{t.rank}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
              {t.logo && (
                <img src={t.logo} alt="" style={{
                  width: 18, height: 18, objectFit: 'contain', flexShrink: 0,
                }} />
              )}
              <span style={{
                fontSize: 12, color: C.text,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{t.team}</span>
            </div>
            <span style={{
              fontSize: 11, fontFamily: C.mono, color: C.textSub,
              textAlign: 'center', alignSelf: 'center',
              fontVariantNumeric: 'tabular-nums',
            }}>{t.wins}–{t.losses}</span>
            <span style={{
              fontSize: 11, fontFamily: C.mono, textAlign: 'right', alignSelf: 'center',
              color: i < 8 ? accentColor : C.textMuted,
              fontVariantNumeric: 'tabular-nums',
            }}>{t.pct}</span>
          </div>
          {i === 9 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 6px' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(239,68,68,0.3)', borderTop: '1px dashed rgba(239,68,68,0.4)' }} />
              <span style={{ fontSize: 8, color: 'rgba(239,68,68,0.65)', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', flexShrink: 0 }}>Play-In</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(239,68,68,0.3)', borderTop: '1px dashed rgba(239,68,68,0.4)' }} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Score Card ────────────────────────────────────────────────────────────────
function ScoreCard({ game }: { game: Game }) {
  const isFinal = game.status.toLowerCase().includes('final');
  const isLive  = !isFinal && game.period > 0;
  const homeWon = game.homeScore > game.awayScore;
  const hasScore = game.period > 0 || isFinal;

  return (
    <div style={{
      background: C.surfaceRaised,
      border: `1px solid ${isLive ? 'rgba(34,197,94,0.25)' : C.border}`,
      borderRadius: 8, padding: '12px 14px',
      transition: 'border-color 200ms ease',
    }}>
      {/* Status row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        {isLive && (
          <span style={{
            width: 5, height: 5, borderRadius: '50%',
            background: C.live, display: 'inline-block',
            animation: 'pulse 1.4s ease-in-out infinite',
          }} />
        )}
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: isLive ? C.live : C.textMuted,
          fontFamily: C.mono,
        }}>
          {isLive ? `Q${game.period}  ${game.clock}` : game.status}
        </span>
      </div>

      {/* Teams */}
      {[
        { team: game.away, score: game.awayScore, won: !homeWon && hasScore },
        { team: game.home, score: game.homeScore, won: homeWon && hasScore },
      ].map((row, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: i === 0 ? 6 : 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {row.team.logo && (
              <img src={row.team.logo} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
            )}
            <span style={{
              fontSize: 13, fontWeight: row.won ? 600 : 400,
              color: row.won ? C.text : C.textSub,
            }}>{row.team.name}</span>
          </div>
          <span style={{
            fontFamily: C.mono, fontSize: 16, fontWeight: 700,
            color: row.won ? C.text : C.textMuted,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {hasScore ? row.score : '–'}
          </span>
        </div>
      ))}
    </div>
  );
}

const STAT_MAP: Record<string, string> = {
  Points: 'PTS', Rebounds: 'REB', Assists: 'AST', Steals: 'STL', Blocks: 'BLK',
};

// ── League Leaders ────────────────────────────────────────────────────────────
function LeagueLeadersPanel({ proxyOnline, onPlayerClick }: {
  proxyOnline: boolean;
  onPlayerClick: (id: string, name: string, team: string) => void;
}) {
  const [active, setActive]         = useState('Points');
  const [seasonType, setSeasonType] = useState<'Regular Season' | 'Playoffs'>('Regular Season');
  const [leaders, setLeaders]       = useState<Record<string, Leader[]>>({});
  const [panelLoading, setPanelLoading] = useState(false);

  useEffect(() => {
    if (!proxyOnline) return;
    setPanelLoading(true);
    const stat = STAT_MAP[active];
    fetch(`${PROXY}/leaders?stat=${stat}&seasonType=${encodeURIComponent(seasonType)}`)
      .then(r => r.json())
      .then(data => {
        setLeaders(prev => ({ ...prev, [`${active}_${seasonType}`]: parseLeaders(data, stat) }));
        setPanelLoading(false);
      })
      .catch(() => setPanelLoading(false));
  }, [active, seasonType, proxyOnline]);

  const key   = `${active}_${seasonType}`;
  const { color, dimBg } = ACCENT[active];
  const list  = leaders[key] || [];
  const max   = parseFloat(list[0]?.value || '1');

  return (
    <div>
      {/* Season type toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {(['Regular Season', 'Playoffs'] as const).map(type => {
          const isActive = seasonType === type;
          return (
            <button
              key={type}
              onClick={() => setSeasonType(type)}
              style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', padding: '5px 14px', borderRadius: 6,
                background: isActive ? C.redDim : 'transparent',
                color: isActive ? C.red : C.textMuted,
                border: isActive ? `1px solid ${C.redBorder}` : `1px solid ${C.border}`,
                cursor: 'pointer', transition: 'all 150ms ease',
              }}
            >{type === 'Regular Season' ? 'Reg. Season' : 'Playoffs'}</button>
          );
        })}
      </div>

      {/* Category tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 16,
        padding: 4, background: C.canvas, borderRadius: 8,
      }}>
        {CATEGORIES.map(cat => {
          const a = ACCENT[cat];
          const isActive = cat === active;
          return (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              style={{
                flex: 1, fontSize: 9, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '6px 4px', borderRadius: 6,
                background: isActive ? a.dimBg : 'transparent',
                color: isActive ? a.color : C.textMuted,
                border: isActive ? `1px solid ${a.color}35` : '1px solid transparent',
                transition: 'all 150ms ease', cursor: 'pointer',
              }}
            >{cat}</button>
          );
        })}
      </div>

      {panelLoading ? (
        <Spinner />
      ) : !proxyOnline ? (
        <p style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', padding: '24px 0' }}>
          Connect to the proxy to load live stats
        </p>
      ) : list.length === 0 ? (
        <p style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', padding: '24px 0' }}>
          No data available
        </p>
      ) : list.map((p, i) => (
        <div
          key={i}
          onClick={() => onPlayerClick(p.playerId, p.name, p.team)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
            transition: 'background 120ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = C.surfaceHover)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {/* Rank */}
          <span style={{
            width: 18, textAlign: 'right', fontSize: 10,
            fontFamily: C.mono, color: i === 0 ? color : C.textMuted,
            fontVariantNumeric: 'tabular-nums',
          }}>{i + 1}</span>

          {/* Photo */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            border: i === 0 ? `2px solid ${color}60` : `1px solid ${C.border}`,
            overflow: 'hidden', background: C.surfaceRaised,
          }}>
            <img
              src={`https://cdn.nba.com/headshots/nba/latest/260x190/${p.playerId}.png`}
              alt={p.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                el.src = `https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${p.playerId}.png`;
                el.onerror = () => { el.style.display = 'none'; };
              }}
            />
          </div>

          {/* Name + bar */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
              <span style={{
                fontSize: 13, fontWeight: 500, color: C.text,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{p.name}</span>
              <span style={{ fontSize: 10, color: C.textMuted, fontFamily: C.mono, flexShrink: 0 }}>{p.team}</span>
            </div>
            <div style={{
              marginTop: 5, height: 2, background: C.surfaceRaised,
              borderRadius: 99, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${(parseFloat(p.value) / max) * 100}%`,
                background: color, opacity: 0.55, borderRadius: 99,
                transition: 'width 400ms ease',
              }} />
            </div>
          </div>

          {/* Value */}
          <span style={{
            fontFamily: C.mono, fontSize: 15, fontWeight: 700,
            color, flexShrink: 0,
            fontVariantNumeric: 'tabular-nums',
          }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Betting Odds ──────────────────────────────────────────────────────────────
// Convert American odds to implied probability
function impliedProb(odds: string): string {
  const n = parseInt(odds);
  if (isNaN(n)) return '—';
  const prob = n < 0 ? (-n / (-n + 100)) : (100 / (n + 100));
  return `${(prob * 100).toFixed(1)}%`;
}

function BettingOddsPanel() {
  const isFav = (odds: string) => odds.startsWith('-') || parseInt(odds.replace('+', '')) <= 300;

  // Finals matchup: Spurs vs Knicks
  const spursOdds = '-145';
  const knicksOdds = '+120';
  const spursProb = parseFloat(impliedProb(spursOdds));
  const knicksProb = parseFloat(impliedProb(knicksOdds));

  return (
    <div>
      {/* NBA Finals Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(200,16,46,0.08), rgba(29,66,138,0.08))',
        border: `1px solid rgba(200,16,46,0.2)`,
        borderRadius: 10, padding: '14px 16px', marginBottom: 16,
      }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: C.red, textTransform: 'uppercase', marginBottom: 10 }}>
          🏆 2026 NBA Finals
        </div>

        {/* Matchup */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          {/* Spurs */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <img src="https://a.espncdn.com/i/teamlogos/nba/500/sa.png" alt="Spurs"
              style={{ width: 36, height: 36, objectFit: 'contain', marginBottom: 4 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>San Antonio</div>
            <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: '0.05em' }}>SPURS</div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted }}>vs</div>
          {/* Knicks */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <img src="https://a.espncdn.com/i/teamlogos/nba/500/ny.png" alt="Knicks"
              style={{ width: 36, height: 36, objectFit: 'contain', marginBottom: 4 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>New York</div>
            <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: '0.05em' }}>KNICKS</div>
          </div>
        </div>

        {/* Win probability bar */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: C.mono, color: C.green }}>
              {impliedProb(spursOdds)}
            </span>
            <span style={{ fontSize: 9, color: C.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', alignSelf: 'center' }}>
              Implied Win Prob
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: C.mono, color: C.sky }}>
              {impliedProb(knicksOdds)}
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: C.surfaceRaised, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(spursProb / (spursProb + knicksProb)) * 100}%`,
              background: `linear-gradient(90deg, ${C.green}, ${C.emerald})`,
              borderRadius: 99,
            }} />
          </div>
        </div>

        {/* Odds row */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            flex: 1, textAlign: 'center', padding: '6px 0',
            background: 'rgba(74,222,128,0.08)', borderRadius: 6,
            border: '1px solid rgba(74,222,128,0.2)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: C.mono, color: C.green }}>{spursOdds}</div>
            <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: '0.08em' }}>SPURS · FAV</div>
          </div>
          <div style={{
            flex: 1, textAlign: 'center', padding: '6px 0',
            background: 'rgba(56,189,248,0.08)', borderRadius: 6,
            border: '1px solid rgba(56,189,248,0.2)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: C.mono, color: C.sky }}>{knicksOdds}</div>
            <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: '0.08em' }}>KNICKS · DOG</div>
          </div>
        </div>
      </div>

      {/* Vig / overround note */}
      <div style={{
        padding: '8px 10px', background: C.surfaceRaised,
        borderRadius: 6, marginBottom: 4,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 10, color: C.textMuted }}>Market overround (vig)</span>
        <span style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 600, color: C.amber }}>
          {((spursProb + knicksProb) - 100).toFixed(1)}%
        </span>
      </div>

      <p style={{ fontSize: 9, color: C.textMuted, textAlign: 'center', marginTop: 12, letterSpacing: '0.05em' }}>
        ODDS VIA DRAFTKINGS · UPDATED {ODDS_UPDATED.toUpperCase()}
      </p>
    </div>
  );
}

// ── Rosters Page ─────────────────────────────────────────────────────────────
function RostersPage({ onTeamClick }: {
  onTeamClick: (teamId: string, teamName: string, teamAbbr: string) => void;
}) {
  const confs = [
    { label: 'Eastern Conference', color: C.emerald, teams: NBA_TEAM_LIST.filter((_, i) => i < 15) },
    { label: 'Western Conference', color: C.sky,     teams: NBA_TEAM_LIST.filter((_, i) => i >= 15) },
  ];
  return (
    <div>
      {confs.map(conf => (
        <div key={conf.label} style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: conf.color, display: 'inline-block' }} />
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: conf.color,
            }}>{conf.label}</span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 10,
          }}>
            {conf.teams.map(team => (
              <button
                key={team.id}
                onClick={() => onTeamClick(team.id, team.name, team.abbr)}
                style={{
                  background: C.surfaceRaised, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: '16px 10px',
                  cursor: 'pointer', textAlign: 'center',
                  transition: 'all 150ms ease',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = C.surfaceHover;
                  e.currentTarget.style.borderColor = `${conf.color}50`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = C.surfaceRaised;
                  e.currentTarget.style.borderColor = C.border;
                }}
              >
                <img
                  src={`https://a.espncdn.com/i/teamlogos/nba/500/${team.espn}.png`}
                  alt={team.name}
                  style={{ width: 44, height: 44, objectFit: 'contain', marginBottom: 8 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div style={{ fontSize: 11, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>
                  {team.name}
                </div>
                <div style={{
                  fontSize: 9, color: conf.color, fontFamily: C.mono,
                  fontWeight: 700, letterSpacing: '0.1em', marginTop: 4,
                }}>{team.abbr}</div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Data parsers ──────────────────────────────────────────────────────────────
function parseLeaders(data: any, stat: string): Leader[] {
  const rs = data?.resultSets?.[0] ?? data?.resultSet;
  if (!rs?.rowSet) return [];
  const headers: string[] = rs.headers;
  const rows: any[][] = rs.rowSet;
  const nameIdx = headers.indexOf('PLAYER');
  const teamIdx = headers.indexOf('TEAM');
  const statIdx = headers.indexOf(stat);
  const idIdx   = headers.indexOf('PLAYER_ID');
  return rows.slice(0, 15).map(row => ({
    name:     row[nameIdx] || '',
    team:     row[teamIdx] || '',
    value:    Number(row[statIdx] || 0).toFixed(1),
    playerId: String(row[idIdx]   || ''),
  }));
}

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
    const conf     = get(row, 'Conference');
    const teamId   = get(row, 'TeamID');
    const abbr     = get(row, 'TeamAbbreviation') || '';
    const espnAbbr = ESPN_LOGO_ABBR[abbr] || abbr.toLowerCase();
    return {
      rank:   parseInt(get(row, 'PlayoffRank')) || idx + 1,
      team:   get(row, 'TeamCity') + ' ' + get(row, 'TeamName'),
      teamId: String(teamId || ''),
      wins:   parseInt(get(row, 'WINS')) || 0,
      losses: parseInt(get(row, 'LOSSES')) || 0,
      pct:    (parseFloat(get(row, 'WinPCT')) || 0).toFixed(3).replace('0.', '.'),
      conf:   conf === 'East' ? 'East' : 'West',
      logo:   `https://a.espncdn.com/i/teamlogos/nba/500/${espnAbbr}.png`,
      abbr,
    };
  });
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [standings,    setStandings]    = useState<Standing[]>([]);
  const [games,        setGames]        = useState<Game[]>([]);
  const [news,         setNews]         = useState<{ headline: string; time: string; tag: string; link: string }[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [proxyOnline,  setProxyOnline]  = useState(false);
  const [lastUpdated,  setLastUpdated]  = useState('');
  const [activePage,   setActivePage]   = useState<'home' | 'rosters'>('home');

  const [showShameless,  setShowShameless]  = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; name: string; team: string } | null>(null);
  const [selectedTeam,   setSelectedTeam]   = useState<{ teamId: string; teamName: string; teamAbbr: string } | null>(null);
  const [cameFromTeam,   setCameFromTeam]   = useState(false);

  const now = new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
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
        const comp   = e.competitions?.[0];
        const home   = comp?.competitors?.find((c: any) => c.homeAway === 'home');
        const away   = comp?.competitors?.find((c: any) => c.homeAway === 'away');
        const status = comp?.status;
        const isPre  = status?.type?.state === 'pre';
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
          clock:  status?.displayClock || '',
        };
      }));
      const newsData = await newsRes.json();
      setNews((newsData.articles || []).slice(0, 8).map((a: any) => ({
        headline: a.headline || '',
        time:     a.published ? new Date(a.published).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '',
        tag:      a.categories?.[0]?.description || 'NBA',
        link:     a.links?.web?.href || '#',
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
        const standData = await fetch(`${PROXY}/standings`).then(r => r.json());
        const parsed = parseStandings(standData);
        if (parsed.length > 0) setStandings(parsed);
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

  // ── Routing ────────────────────────────────────────────────────────────────
  if (showShameless) return <ShamelessMeter onBack={() => setShowShameless(false)} />;

  if (selectedPlayer) {
    return (
      <PlayerProfile
        playerId={selectedPlayer.id}
        playerName={selectedPlayer.name}
        team={selectedPlayer.team}
        onBack={() => {
          setSelectedPlayer(null);
          if (cameFromTeam) setCameFromTeam(false);
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

  // ── Home ───────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: C.canvas,
      color: C.text,
      fontFamily: "'Inter',system-ui,-apple-system,sans-serif",
    }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(13,14,16,0.88)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{
          maxWidth: 1520, margin: '0 auto',
          padding: '0 24px', height: 56,
          display: 'flex', alignItems: 'center', gap: 24,
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: C.red, display: 'flex', alignItems: 'center',
              justifyContent: 'center', overflow: 'hidden',
            }}>
              <img src="/logo.png" alt="LeHoopIQ"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.025em', color: C.text }}>
              LeHoop<span style={{ color: C.red }}>IQ</span>
            </span>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: C.border }} />

          {/* Nav */}
          <nav style={{ display: 'flex', gap: 4, flex: 1 }}>
            {([
              { id: 'home',    label: 'Home' },
              { id: 'rosters', label: 'Rosters' },
            ] as const).map(tab => {
              const isActive = activePage === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePage(tab.id)}
                  style={{
                    padding: '5px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                    background: isActive ? C.redDim : 'transparent',
                    color: isActive ? C.red : C.textSub,
                    border: isActive ? `1px solid ${C.redBorder}` : '1px solid transparent',
                    cursor: 'pointer', transition: 'all 150ms ease',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = C.text; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = C.textSub; }}
                >{tab.label}</button>
              );
            })}
          </nav>

          {/* Right info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            {lastUpdated && (
              <span style={{ fontSize: 10, color: C.textMuted, fontFamily: C.mono }}>
                ↻ {lastUpdated}
              </span>
            )}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 99,
              background: proxyOnline ? C.liveDim : C.amberDim,
              border: `1px solid ${proxyOnline ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: proxyOnline ? C.live : C.amber,
                display: 'inline-block',
                animation: proxyOnline ? 'pulse 2s ease-in-out infinite' : 'none',
              }} />
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
                color: proxyOnline ? C.live : C.amber,
              }}>{proxyOnline ? 'LIVE' : 'OFFLINE'}</span>
            </div>
            <span style={{ fontSize: 11, color: C.textMuted }}>{now}</span>
          </div>
        </div>
      </header>

      {/* ── Proxy banner ───────────────────────────────────────────────────── */}
      {!proxyOnline && !loading && (
        <div style={{
          background: 'rgba(245,158,11,0.06)',
          borderBottom: `1px solid rgba(245,158,11,0.18)`,
          padding: '9px 24px', textAlign: 'center',
          fontSize: 12, color: C.amber,
        }}>
          Run{' '}
          <code style={{
            background: 'rgba(0,0,0,0.35)', padding: '2px 7px',
            borderRadius: 4, fontFamily: C.mono, fontSize: 11,
          }}>npm run dev</code>
          {' '}in a second terminal to load live NBA stats
        </div>
      )}

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 1520, margin: '0 auto', padding: '24px 24px 60px' }}>

        {/* ── Rosters Page ─────────────────────────────────────────────────── */}
        {activePage === 'rosters' && (
          <div style={card}>
            <div style={sectionLabel}>Teams & Rosters — Click to explore</div>
            <RostersPage
              onTeamClick={(id, name, abbr) => setSelectedTeam({ teamId: id, teamName: name, teamAbbr: abbr })}
            />
          </div>
        )}

        {/* ── Home grid ────────────────────────────────────────────────────── */}
        {activePage === 'home' && <div style={{
          display: 'grid',
          gridTemplateColumns: '288px 1fr 272px',
          gap: 18,
          alignItems: 'start',
        }}>

          {/* ── LEFT — Standings + Games ─────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Standings */}
            <div style={card}>
              <div style={sectionLabel}>Standings · 2025–26</div>
              {loading ? <Spinner /> : standings.length === 0 ? (
                <p style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', padding: '20px 0' }}>
                  Run <code style={{ fontFamily: C.mono }}>npm run dev</code> to load standings
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                  <StandingsTable teams={standings} conf="East"
                    onTeamClick={(id, name, abbr) => setSelectedTeam({ teamId: id, teamName: name, teamAbbr: abbr })} />
                  <StandingsTable teams={standings} conf="West"
                    onTeamClick={(id, name, abbr) => setSelectedTeam({ teamId: id, teamName: name, teamAbbr: abbr })} />
                </div>
              )}

              {/* Playoff bracket link */}
              <a
                href="https://www.nba.com/playoffs"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 6, marginTop: 16, padding: '9px 12px', borderRadius: 8,
                  background: C.redDim, border: `1px solid ${C.redBorder}`,
                  textDecoration: 'none', transition: 'all 150ms ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(200,16,46,0.16)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = C.redDim; }}
              >
                <span style={{ fontSize: 13 }}>🏆</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.red, letterSpacing: '0.05em' }}>
                  View 2026 Playoff Bracket
                </span>
                <span style={{ fontSize: 11, color: C.redBorder }}>↗</span>
              </a>
            </div>

            {/* Games */}
            <div style={card}>
              <div style={sectionLabel}>Today's Games</div>
              {loading ? <Spinner /> : games.length === 0 ? (
                <p style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', padding: '20px 0' }}>
                  No games scheduled today
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {games.map(g => <ScoreCard key={g.id} game={g} />)}
                </div>
              )}
            </div>
          </div>

          {/* ── CENTER — Leaders + Odds ───────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={card}>
              <div style={sectionLabel}>League Leaders · Top 15</div>
              <LeagueLeadersPanel
                proxyOnline={proxyOnline}
                onPlayerClick={(id, name, team) => {
                  setCameFromTeam(false);
                  setSelectedPlayer({ id, name, team });
                }}
              />
            </div>
            <div style={card}>
              <div style={sectionLabel}>Championship & Conference Odds</div>
              <BettingOddsPanel />
            </div>
          </div>

          {/* ── RIGHT — News ─────────────────────────────────────────────── */}
          <div style={{ position: 'sticky', top: 72 }}>
            <div style={card}>
              <div style={sectionLabel}>NBA News</div>
              {loading ? <Spinner /> : news.length === 0 ? (
                <p style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', padding: '20px 0' }}>No news</p>
              ) : news.map((item, i) => (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block', padding: '10px 8px',
                    borderRadius: 8, textDecoration: 'none',
                    borderBottom: i < news.length - 1 ? `1px solid ${C.border}` : 'none',
                    transition: 'background 120ms ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.surfaceHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{
                      fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                      background: C.redDim, color: C.red,
                      border: `1px solid ${C.redBorder}`,
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                    }}>{item.tag.slice(0, 14)}</span>
                    <span style={{ fontSize: 10, color: C.textMuted, marginLeft: 'auto', fontFamily: C.mono }}>
                      {item.time}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: C.textSub, lineHeight: 1.5 }}>{item.headline}</p>
                </a>
              ))}
            </div>
          </div>

        </div>}

        {/* ── Methodology strip ───────────────────────────────────────────── */}
        <div style={{
          marginTop: 24,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 12, padding: '20px 28px',
          display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.red, marginBottom: 4 }}>
              Analytics Stack
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>LeHoopIQ</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Basketball Intelligence Platform</div>
          </div>
          <div style={{ width: 1, height: 40, background: C.border, flexShrink: 0 }} />
          {[
            { label: 'Data Sources', value: 'NBA Stats API · ESPN API · nbaapi.com' },
            { label: 'Models', value: 'Bayesian inference · Implied probability · Efficiency ratings' },
            { label: 'Stack', value: 'React · TypeScript · Plotly.js · Express · Vercel' },
            { label: 'Refresh', value: 'Live scores every 60s · Stats cached 30min' },
          ].map(({ label, value }) => (
            <div key={label} style={{ minWidth: 150 }}>
              <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 11, color: C.textSub, lineHeight: 1.5 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* ── Shameless Meter CTA ─────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginTop: 36, paddingBottom: 8 }}>
          <button
            onClick={() => setShowShameless(true)}
            style={{
              background: 'rgba(200,16,46,0.08)',
              border: `1px solid rgba(200,16,46,0.25)`,
              borderRadius: 8, padding: '12px 28px', cursor: 'pointer',
              color: C.red, fontSize: 13, fontWeight: 600,
              letterSpacing: '0.04em',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(200,16,46,0.14)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(200,16,46,0.45)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(200,16,46,0.08)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(200,16,46,0.25)';
            }}
          >
            🚨 View The Shameless Meter →
          </button>
        </div>
      </main>
    </div>
  );
}
