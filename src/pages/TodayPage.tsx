import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCurrentSeasonYear, getCurrentSeasonLabel } from '../season';
import { TEAM_IDS } from '../teams';

const PROXY = import.meta.env.VITE_PROXY_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? '/api'
    : 'http://localhost:3001/api');
const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';

// ── Design tokens (mirrored from CSS vars for inline styles) ─────────
const C = {
  canvas:       'var(--ink)',
  surface:      'var(--court)',
  surfaceRaised:'var(--court)',
  surfaceHover: 'var(--ink)',
  border:       'var(--line)',
  borderStrong: 'var(--line)',
  text:         'var(--chalk)',
  textSub:      'var(--chalk-2)',
  textMuted:    'var(--chalk-2)',
  red:          'var(--heat)',
  redDim:       'rgba(229,50,45,0.10)',
  redBorder:    'rgba(229,50,45,0.28)',
  live:         'var(--heat)',
  liveDim:      'rgba(229,50,45,0.12)',
  amber:        'var(--gold)',
  amberDim:     'rgba(242,179,61,0.10)',
  sky:          'var(--cool)',
  violet:       'var(--cool)',
  rose:         'var(--heat)',
  emerald:      'var(--cool)',
  green:        'var(--cool)',
  mono:         "var(--font-body)",
};

const ACCENT: Record<string, { color: string; dimBg: string }> = {
  Points:   { color: C.red,     dimBg: C.redDim },
  Rebounds: { color: C.sky,     dimBg: 'rgba(77,163,255,0.10)' },
  Assists:  { color: C.emerald, dimBg: 'rgba(77,163,255,0.10)' },
  Steals:   { color: C.violet,  dimBg: 'rgba(77,163,255,0.10)' },
  Blocks:   { color: C.rose,    dimBg: 'rgba(229,50,45,0.10)' },
};

const CATEGORIES = ['Points', 'Rebounds', 'Assists', 'Steals', 'Blocks'];
const STAT_MAP: Record<string, string> = {
  Points: 'PTS', Rebounds: 'REB', Assists: 'AST', Steals: 'STL', Blocks: 'BLK',
};

interface Leader  { name: string; team: string; value: string; playerId: string; }
interface Standing { rank: number; team: string; teamId: string; wins: number; losses: number; pct: string; conf: string; logo: string; abbr: string; }
interface Game    { id: string; home: { name: string; logo: string }; away: { name: string; logo: string }; homeScore: number; awayScore: number; status: string; period: number; clock: string; }

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

const ESPN_LOGO_ABBR: Record<string, string> = {
  'GSW': 'gs', 'NYK': 'ny', 'NOP': 'no', 'SAS': 'sa', 'UTA': 'utah', 'WAS': 'wsh',
};

function parseStandingsFromESPN(espn: any): Standing[] {
  const children = espn?.children || [];
  const rows: Standing[] = [];
  for (const conf of children) {
    const confName = conf.name?.includes('East') ? 'East' : 'West';
    const entries = conf?.standings?.entries || [];
    entries.forEach((entry: any, idx: number) => {
      const team   = entry.team;
      const abbr   = team?.abbreviation || '';
      const espnAbbr = ESPN_LOGO_ABBR[abbr] || abbr.toLowerCase();
      const stats: Record<string, number> = {};
      (entry.stats || []).forEach((s: any) => { stats[s.name] = s.value; });
      const wins   = stats.wins   || 0;
      const losses = stats.losses || 0;
      rows.push({
        rank:   idx + 1,
        team:   team?.displayName || '',
        teamId: team?.id || '',
        wins,
        losses,
        pct:    (wins / Math.max(wins + losses, 1)).toFixed(3).replace('0.', '.'),
        conf:   confName,
        logo:   `https://a.espncdn.com/i/teamlogos/nba/500/${espnAbbr}.png`,
        abbr,
      });
    });
  }
  return rows;
}

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

// ── Standings Table ──────────────────────────────────────────────────
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: accentColor, display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: accentColor }}>{conf}ern Conference</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '18px 1fr 48px 40px', gap: 6, padding: '0 6px 6px', marginBottom: 2 }}>
        <span />
        <span style={{ fontSize: 9, color: C.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Team</span>
        <span style={{ fontSize: 9, color: C.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center' }}>W-L</span>
        <span style={{ fontSize: 9, color: C.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'right' }}>PCT</span>
      </div>
      {filtered.slice(0, 6).map((t, i) => (
        <div
          key={t.team}
          onClick={() => onTeamClick(t.teamId || TEAM_IDS[t.team] || '', t.team, t.abbr)}
          style={{
            display: 'grid', gridTemplateColumns: '18px 1fr 48px 40px',
            gap: 6, padding: '7px 6px', borderRadius: 6,
            cursor: 'pointer', transition: 'background 120ms ease',
            borderLeft: `2px solid ${accentColor}30`,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = C.surfaceHover)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ fontSize: 10, fontFamily: C.mono, color: accentColor, textAlign: 'right', alignSelf: 'center' }}>{t.rank}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
            {t.logo && <img src={t.logo} alt="" style={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0 }} />}
            <span style={{ fontSize: 12, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.team}</span>
          </div>
          <span style={{ fontSize: 11, fontFamily: C.mono, color: C.textSub, textAlign: 'center', alignSelf: 'center', fontVariantNumeric: 'tabular-nums' }}>{t.wins}-{t.losses}</span>
          <span style={{ fontSize: 11, fontFamily: C.mono, textAlign: 'right', alignSelf: 'center', color: accentColor, fontVariantNumeric: 'tabular-nums' }}>{t.pct}</span>
        </div>
      ))}
    </div>
  );
}

// ── Score Card ───────────────────────────────────────────────────────
function ScoreCard({ game }: { game: Game }) {
  const isFinal = game.status.toLowerCase().includes('final');
  const isLive  = !isFinal && game.period > 0;
  const homeWon = game.homeScore > game.awayScore;
  const hasScore = game.period > 0 || isFinal;

  return (
    <div style={{
      background: C.surfaceRaised,
      border: `1px solid ${isLive ? C.redBorder : C.border}`,
      borderRadius: 8, padding: '12px 14px',
      transition: 'border-color 200ms ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        {isLive && <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.live, display: 'inline-block', animation: 'pulse 1.4s ease-in-out infinite' }} />}
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: isLive ? C.live : C.textMuted, fontFamily: C.mono }}>
          {isLive ? `Q${game.period}  ${game.clock}` : game.status}
        </span>
      </div>
      {[
        { team: game.away, score: game.awayScore, won: !homeWon && hasScore },
        { team: game.home, score: game.homeScore, won: homeWon && hasScore },
      ].map((row, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: i === 0 ? 6 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {row.team.logo && <img src={row.team.logo} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />}
            <span style={{ fontSize: 13, fontWeight: row.won ? 600 : 400, color: row.won ? C.text : C.textSub }}>{row.team.name}</span>
          </div>
          <span style={{ fontFamily: C.mono, fontSize: 16, fontWeight: 700, color: row.won ? C.text : C.textMuted, fontVariantNumeric: 'tabular-nums' }}>
            {hasScore ? row.score : '\u2013'}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── League Leaders Panel ─────────────────────────────────────────────
function LeagueLeadersPanel({ proxyOnline }: { proxyOnline: boolean }) {
  const navigate = useNavigate();
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
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {(['Regular Season', 'Playoffs'] as const).map(type => {
          const isActive = seasonType === type;
          return (
            <button key={type} onClick={() => setSeasonType(type)} style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '5px 14px', borderRadius: 6,
              background: isActive ? C.redDim : 'transparent',
              color: isActive ? C.red : C.textMuted,
              border: isActive ? `1px solid ${C.redBorder}` : `1px solid ${C.border}`,
              cursor: 'pointer', transition: 'all 150ms ease',
            }}>{type === 'Regular Season' ? 'Reg. Season' : 'Playoffs'}</button>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, padding: 4, background: C.canvas, borderRadius: 8 }}>
        {CATEGORIES.map(cat => {
          const a = ACCENT[cat];
          const isActive = cat === active;
          return (
            <button key={cat} onClick={() => setActive(cat)} style={{
              flex: 1, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
              padding: '6px 4px', borderRadius: 6,
              background: isActive ? a.dimBg : 'transparent',
              color: isActive ? a.color : C.textMuted,
              border: isActive ? `1px solid ${a.color}35` : '1px solid transparent',
              transition: 'all 150ms ease', cursor: 'pointer',
            }}>{cat}</button>
          );
        })}
      </div>
      {panelLoading ? <Spinner /> : !proxyOnline ? (
        <p style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', padding: '24px 0' }}>Stats are updating.</p>
      ) : list.length === 0 ? (
        <p style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', padding: '24px 0' }}>No data available</p>
      ) : list.map((p, i) => (
        <div key={i}
          onClick={() => navigate(`/players/${p.playerId}`)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', transition: 'background 120ms ease' }}
          onMouseEnter={e => (e.currentTarget.style.background = C.surfaceHover)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ width: 18, textAlign: 'right', fontSize: 10, fontFamily: C.mono, color: i === 0 ? color : C.textMuted, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
          <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, border: i === 0 ? `2px solid ${color}60` : `1px solid ${C.border}`, overflow: 'hidden', background: C.surfaceRaised }}>
            <img src={`https://cdn.nba.com/headshots/nba/latest/260x190/${p.playerId}.png`} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { const el = e.target as HTMLImageElement; el.style.display = 'none'; }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              <span style={{ fontSize: 10, color: C.textMuted, fontFamily: C.mono, flexShrink: 0 }}>{p.team}</span>
            </div>
            <div style={{ marginTop: 5, height: 2, background: C.surfaceRaised, borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(parseFloat(p.value) / max) * 100}%`, background: color, opacity: 0.55, borderRadius: 99, transition: 'width 400ms ease' }} />
            </div>
          </div>
          <span style={{ fontFamily: C.mono, fontSize: 15, fontWeight: 700, color, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Today Page ───────────────────────────────────────────────────────
export default function TodayPage() {
  const navigate = useNavigate();
  const [standings,    setStandings]    = useState<Standing[]>([]);
  const [games,        setGames]        = useState<Game[]>([]);
  const [news,         setNews]         = useState<{ headline: string; time: string; tag: string; link: string }[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [proxyOnline,  setProxyOnline]  = useState(false);
  const [lastUpdated,  setLastUpdated]  = useState('');

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

    try {
      const espnStandRes = await fetch(
        `https://site.api.espn.com/apis/v2/sports/basketball/nba/standings?season=${getCurrentSeasonYear()}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (espnStandRes.ok) {
        const espnStand = await espnStandRes.json();
        const parsed = parseStandingsFromESPN(espnStand);
        if (parsed.length > 0) setStandings(parsed);
      }
    } catch (e) { console.error('Standings fetch failed', e); }

    let pingOk = false;
    try {
      const pingRes = await fetch(`${PROXY}/leaders?stat=PTS`, { signal: AbortSignal.timeout(10000) });
      pingOk = pingRes.ok;
    } catch { pingOk = false; }
    setProxyOnline(pingOk);
    setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleTeamClick = (teamId: string, _teamName: string, teamAbbr: string) => {
    navigate(`/teams/${teamAbbr.toLowerCase()}`);
  };

  return (
    <>
      {/* Proxy banner */}
      {!proxyOnline && !loading && (
        <div style={{
          background: C.amberDim,
          borderBottom: `1px solid ${C.border}`,
          padding: '9px 24px', textAlign: 'center',
          fontSize: 12, color: C.amber, marginBottom: 16, borderRadius: 8,
        }}>
          Stats are updating.
        </div>
      )}

      {/* Home grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '288px 1fr 272px',
        gap: 18,
        alignItems: 'start',
      }}>

        {/* LEFT -- Standings + Games */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={card}>
            <div style={sectionLabel}>Standings Snapshot \u00B7 {getCurrentSeasonLabel()}</div>
            {loading ? <Spinner /> : standings.length === 0 ? (
              <p style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', padding: '20px 0' }}>Stats are updating.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                <StandingsTable teams={standings} conf="East" onTeamClick={handleTeamClick} />
                <StandingsTable teams={standings} conf="West" onTeamClick={handleTeamClick} />
              </div>
            )}
            <Link to="/standings" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 6, marginTop: 16, padding: '9px 12px', borderRadius: 8,
              background: C.redDim, border: `1px solid ${C.redBorder}`,
              textDecoration: 'none', transition: 'all 150ms ease', color: C.red,
              fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
            }}>
              View Full Standings \u2192
            </Link>
          </div>

          <div style={card}>
            <div style={sectionLabel}>Today's Games</div>
            {loading ? <Spinner /> : games.length === 0 ? (
              <p style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', padding: '20px 0' }}>No games scheduled today</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {games.map(g => <ScoreCard key={g.id} game={g} />)}
              </div>
            )}
          </div>
        </div>

        {/* CENTER -- Leaders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={card}>
            <div style={sectionLabel}>League Leaders \u00B7 Top 15</div>
            <LeagueLeadersPanel proxyOnline={proxyOnline} />
          </div>
        </div>

        {/* RIGHT -- News */}
        <div style={{ position: 'sticky', top: 72 }}>
          <div style={card}>
            <div style={sectionLabel}>NBA News</div>
            {loading ? <Spinner /> : news.length === 0 ? (
              <p style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', padding: '20px 0' }}>No news</p>
            ) : news.map((item, i) => (
              <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'block', padding: '10px 8px', borderRadius: 8, textDecoration: 'none',
                  borderBottom: i < news.length - 1 ? `1px solid ${C.border}` : 'none',
                  transition: 'background 120ms ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = C.surfaceHover)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                    background: C.redDim, color: C.red, border: `1px solid ${C.redBorder}`,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}>{item.tag.slice(0, 14)}</span>
                  <span style={{ fontSize: 10, color: C.textMuted, marginLeft: 'auto', fontFamily: C.mono }}>{item.time}</span>
                </div>
                <p style={{ fontSize: 12, color: C.textSub, lineHeight: 1.5 }}>{item.headline}</p>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Data sources strip */}
      <div style={{
        marginTop: 24, background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: '20px 28px',
        display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center',
      }}>
        {[
          { label: 'Data Sources', value: 'NBA Stats API \u00B7 ESPN API \u00B7 nbaapi.com' },
          { label: 'Models', value: 'Bayesian inference \u00B7 Implied probability \u00B7 Efficiency ratings' },
          { label: 'Stack', value: 'React \u00B7 TypeScript \u00B7 Plotly.js \u00B7 Express \u00B7 Vercel' },
          { label: 'Refresh', value: 'Live scores every 60s \u00B7 Stats cached 30min' },
        ].map(({ label, value }) => (
          <div key={label} style={{ minWidth: 150 }}>
            <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 11, color: C.textSub, lineHeight: 1.5 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Shameless Meter CTA */}
      <div style={{ textAlign: 'center', marginTop: 36, paddingBottom: 8 }}>
        <Link to="/shameless-meter" style={{
          display: 'inline-block',
          background: C.redDim, border: `1px solid ${C.redBorder}`,
          borderRadius: 8, padding: '12px 28px', cursor: 'pointer',
          color: C.red, fontSize: 13, fontWeight: 600, letterSpacing: '0.04em',
          textDecoration: 'none', transition: 'all 150ms ease',
        }}>
          View The Shameless Meter \u2192
        </Link>
      </div>

      {/* Updated timestamp */}
      {lastUpdated && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <span style={{ fontSize: 10, color: C.textMuted, fontFamily: C.mono }}>
            Last updated {lastUpdated}
          </span>
        </div>
      )}

      {/* Responsive override for the 3-col grid */}
      <style>{`
        @media (max-width: 1024px) {
          .today-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
