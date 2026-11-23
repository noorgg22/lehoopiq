import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCurrentSeasonYear, getCurrentSeasonLabel } from '../season';
import { TEAM_IDS } from '../teams';
import { fetchStandings, type StandingsRow } from '../parseStandings';

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

const ESPN_CATEGORY_MAP: Record<string, string> = {
  pointsPerGame: 'Points',
  reboundsPerGame: 'Rebounds',
  assistsPerGame: 'Assists',
  stealsPerGame: 'Steals',
  blocksPerGame: 'Blocks',
};

interface Leader  { name: string; team: string; value: string; playerId: string; headshot: string; }
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


// ── Standings Table ──────────────────────────────────────────────────
function StandingsTable({ teams, conf, onTeamClick }: {
  teams: StandingsRow[];
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
            <span style={{ fontSize: 12, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.shortName}</span>
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
function LeagueLeadersPanel() {
  const navigate = useNavigate();
  const [active, setActive]         = useState('Points');
  const [allLeaders, setAllLeaders] = useState<Record<string, Leader[]>>({});
  const [panelLoading, setPanelLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `https://site.api.espn.com/apis/site/v3/sports/basketball/nba/leaders`,
          { signal: AbortSignal.timeout(8000) }
        );
        if (!res.ok) { setPanelLoading(false); return; }
        const data = await res.json();
        const cats = data?.leaders?.categories || [];
        const parsed: Record<string, Leader[]> = {};
        for (const cat of cats) {
          const displayName = ESPN_CATEGORY_MAP[cat.name];
          if (!displayName) continue;
          parsed[displayName] = (cat.leaders || []).slice(0, 10).map((l: any) => ({
            name: l.athlete?.displayName || '',
            team: l.athlete?.team?.abbreviation || '',
            value: l.displayValue || '',
            playerId: String(l.athlete?.id || ''),
            headshot: l.athlete?.headshot?.href || '',
          }));
        }
        setAllLeaders(parsed);
      } catch (e) { console.error('Leaders fetch failed', e); }
      setPanelLoading(false);
    })();
  }, []);

  const { color, dimBg } = ACCENT[active];
  const list  = allLeaders[active] || [];
  const max   = parseFloat(list[0]?.value || '1');

  return (
    <div>
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
      {panelLoading ? <Spinner /> : list.length === 0 ? (
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
            <img src={p.headshot || `https://cdn.nba.com/headshots/nba/latest/260x190/${p.playerId}.png`} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
  const [standings,    setStandings]    = useState<StandingsRow[]>([]);
  const [games,        setGames]        = useState<Game[]>([]);
  const [news,         setNews]         = useState<{ headline: string; time: string; tag: string; link: string }[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [lastUpdated,  setLastUpdated]  = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const [scoreRes, newsRes] = await Promise.all([
        fetch(`${ESPN}/scoreboard`),
        fetch(`${ESPN}/news?limit=12`),
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
      // Filter: keep only articles where every league-type category is NBA or Fantasy
      const nbaArticles = (newsData.articles || []).filter((a: any) => {
        const cats = a.categories || [];
        const leagueCats = cats.filter((c: any) => c.type === 'league');
        if (leagueCats.length === 0) return true; // no league tag = keep
        return leagueCats.every((c: any) => c.description === 'NBA' || c.description === 'Fantasy');
      });
      setNews(nbaArticles.slice(0, 8).map((a: any) => ({
        headline: a.headline || '',
        time:     a.published ? new Date(a.published).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '',
        tag:      a.categories?.[0]?.description || 'NBA',
        link:     a.links?.web?.href || '#',
      })));
    } catch (e) { console.error('ESPN fetch failed', e); }

    try {
      const parsed = await fetchStandings();
      if (parsed.length > 0) setStandings(parsed);
    } catch (e) { console.error('Standings fetch failed', e); }

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
      {/* Home grid */}
      <div className="today-grid" style={{
        display: 'grid',
        gridTemplateColumns: '288px 1fr 272px',
        gap: 18,
        alignItems: 'start',
      }}>

        {/* LEFT -- Standings + Games */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={card}>
            <div style={sectionLabel}>Standings Snapshot {'\u00B7'} {getCurrentSeasonLabel()}</div>
            {loading ? <Spinner /> : standings.length === 0 ? (
              <p style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', padding: '20px 0' }}>No standings data available.</p>
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
              View Full Standings {'\u2192'}
            </Link>
          </div>

          <div style={card}>
            <div style={sectionLabel}>Today{'\u2019'}s Games</div>
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
            <div style={sectionLabel}>League Leaders {'\u00B7'} Top 10</div>
            <LeagueLeadersPanel />
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

      {/* Footer */}
      <div style={{
        marginTop: 24, padding: '16px 28px', textAlign: 'center',
        fontSize: 11, color: C.textMuted, lineHeight: 1.6,
      }}>
        Data from ESPN.{lastUpdated ? ` Updated ${lastUpdated}.` : ''}
      </div>

      {/* Shameless Meter CTA */}
      <div style={{ textAlign: 'center', marginTop: 12, paddingBottom: 8 }}>
        <Link to="/shameless-meter" style={{
          display: 'inline-block',
          background: C.redDim, border: `1px solid ${C.redBorder}`,
          borderRadius: 8, padding: '12px 28px', cursor: 'pointer',
          color: C.red, fontSize: 13, fontWeight: 600, letterSpacing: '0.04em',
          textDecoration: 'none', transition: 'all 150ms ease',
        }}>
          View The Shameless Meter {'\u2192'}
        </Link>
      </div>

      {/* Responsive override for the 3-col grid */}
      <style>{`
        @media (max-width: 1024px) {
          .today-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
