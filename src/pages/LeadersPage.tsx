import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentSeasonYear, getCurrentSeasonLabel } from '../season';

interface Leader {
  name: string;
  team: string;
  value: string;
  playerId: string;
  headshot: string;
}

const ESPN_CATEGORY_MAP: Record<string, string> = {
  pointsPerGame: 'Points',
  reboundsPerGame: 'Rebounds',
  assistsPerGame: 'Assists',
  stealsPerGame: 'Steals',
  blocksPerGame: 'Blocks',
};

const CATEGORIES = [
  { label: 'Points', espnName: 'pointsPerGame' },
  { label: 'Rebounds', espnName: 'reboundsPerGame' },
  { label: 'Assists', espnName: 'assistsPerGame' },
  { label: 'Steals', espnName: 'stealsPerGame' },
  { label: 'Blocks', espnName: 'blocksPerGame' },
];

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        border: '2px solid var(--line)',
        borderTopColor: 'var(--heat)',
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  );
}

export default function LeadersPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState('Points');
  const [allLeaders, setAllLeaders] = useState<Record<string, Leader[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `https://site.api.espn.com/apis/site/v3/sports/basketball/nba/leaders`,
          { signal: AbortSignal.timeout(10000) }
        );
        if (!res.ok) throw new Error(`ESPN ${res.status}`);
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
      } catch (e: any) {
        setError(e.message || 'Failed to load leaders.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const list = allLeaders[active] || [];
  const max = parseFloat(list[0]?.value || '1');

  return (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--t-xl)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--chalk)',
        marginBottom: 4,
      }}>
        League Leaders
      </h2>
      <p style={{ fontSize: 'var(--t-sm)', color: 'var(--chalk-2)', marginBottom: 'var(--sp-6)' }}>
        {getCurrentSeasonLabel()} Season - Per Game
      </p>

      {/* Category tabs */}
      <div style={{
        display: 'flex',
        gap: 'var(--sp-2)',
        marginBottom: 'var(--sp-6)',
        flexWrap: 'wrap',
      }}>
        {CATEGORIES.map(cat => {
          const isActive = cat.label === active;
          return (
            <button
              key={cat.label}
              onClick={() => setActive(cat.label)}
              style={{
                padding: '8px 18px',
                fontSize: 'var(--t-sm)',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                borderRadius: 'var(--r-sm)',
                border: isActive ? '1px solid var(--heat)' : '1px solid var(--line)',
                background: isActive ? 'rgba(229,50,45,0.1)' : 'transparent',
                color: isActive ? 'var(--heat)' : 'var(--chalk-2)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {loading ? <Spinner /> : error ? (
        <p style={{ color: 'var(--chalk-2)', fontSize: 'var(--t-sm)', textAlign: 'center', padding: 40 }}>{error}</p>
      ) : list.length === 0 ? (
        <p style={{ color: 'var(--chalk-2)', fontSize: 'var(--t-sm)', textAlign: 'center', padding: 40 }}>No data available</p>
      ) : (
        <div style={{
          background: 'var(--court)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--r-md)',
          overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '36px 48px 1fr 60px',
            gap: 'var(--sp-2)',
            padding: '10px var(--sp-4)',
            borderBottom: '1px solid var(--line)',
          }}>
            {['#', '', 'Player', active].map((h, i) => (
              <span key={h + i} style={{
                fontSize: 'var(--t-xs)',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--chalk-2)',
                textAlign: i >= 3 ? 'right' : 'left',
              }}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {list.map((p, i) => {
            const pct = (parseFloat(p.value) / max) * 100;
            const isLeader = i === 0;
            return (
              <div
                key={p.playerId + i}
                onClick={() => navigate(`/players/${p.playerId}`)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '36px 48px 1fr 60px',
                  gap: 'var(--sp-2)',
                  padding: '12px var(--sp-4)',
                  borderBottom: i < list.length - 1 ? '1px solid var(--line)' : 'none',
                  cursor: 'pointer',
                  transition: 'background 120ms ease',
                  alignItems: 'center',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--ink)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Rank */}
                <span style={{
                  fontSize: 'var(--t-sm)',
                  fontFamily: 'var(--font-display)',
                  fontVariantNumeric: 'tabular-nums',
                  color: isLeader ? 'var(--gold)' : 'var(--chalk-2)',
                  fontWeight: isLeader ? 700 : 400,
                }}>
                  {i + 1}
                </span>

                {/* Headshot */}
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: isLeader ? '2px solid var(--heat)' : '1px solid var(--line)',
                  background: 'var(--ink)',
                  flexShrink: 0,
                }}>
                  <img
                    loading="lazy"
                    width={40}
                    height={40}
                    src={p.headshot || `https://cdn.nba.com/headshots/nba/latest/260x190/${p.playerId}.png`}
                    alt={p.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>

                {/* Name + team + bar */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{
                      fontSize: 'var(--t-sm)',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 500,
                      color: 'var(--chalk)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {p.name}
                    </span>
                    <span style={{
                      fontSize: 'var(--t-xs)',
                      color: 'var(--chalk-2)',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}>
                      {p.team}
                    </span>
                  </div>
                  {/* Proportion bar */}
                  <div style={{
                    marginTop: 6,
                    height: 3,
                    background: 'var(--line)',
                    borderRadius: 99,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: isLeader ? 'var(--heat)' : 'var(--chalk-2)',
                      opacity: isLeader ? 0.8 : 0.3,
                      borderRadius: 99,
                      transition: 'width 400ms ease',
                    }} />
                  </div>
                </div>

                {/* Value */}
                <span style={{
                  fontSize: 'var(--t-base)',
                  fontFamily: 'var(--font-display)',
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: 700,
                  color: isLeader ? 'var(--heat)' : 'var(--chalk)',
                  textAlign: 'right',
                }}>
                  {p.value}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
