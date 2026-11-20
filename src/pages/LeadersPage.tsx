import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentSeasonLabel } from '../season';

const PROXY = import.meta.env.VITE_PROXY_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? '/api'
    : 'http://localhost:3001/api');

interface Leader {
  name: string;
  team: string;
  value: string;
  playerId: string;
  gp: number;
}

const CATEGORIES = [
  { label: 'Points', stat: 'PTS' },
  { label: 'Rebounds', stat: 'REB' },
  { label: 'Assists', stat: 'AST' },
  { label: 'Steals', stat: 'STL' },
  { label: 'Blocks', stat: 'BLK' },
  { label: '3PM', stat: 'FG3M' },
];

function parseLeaders(data: any, stat: string): Leader[] {
  const rs = data?.resultSets?.[0] ?? data?.resultSet;
  if (!rs?.rowSet) return [];
  const headers: string[] = rs.headers;
  const rows: any[][] = rs.rowSet;
  const nameIdx = headers.indexOf('PLAYER');
  const teamIdx = headers.indexOf('TEAM');
  const statIdx = headers.indexOf(stat);
  const idIdx = headers.indexOf('PLAYER_ID');
  const gpIdx = headers.indexOf('GP');
  return rows.slice(0, 15).map(row => ({
    name: row[nameIdx] || '',
    team: row[teamIdx] || '',
    value: Number(row[statIdx] || 0).toFixed(1),
    playerId: String(row[idIdx] || ''),
    gp: Number(row[gpIdx] || 0),
  }));
}

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
  const [active, setActive] = useState('PTS');
  const [leaders, setLeaders] = useState<Record<string, Leader[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (leaders[active]) return;
    setLoading(true);
    setError('');
    fetch(`${PROXY}/leaders?stat=${active}`, { signal: AbortSignal.timeout(12000) })
      .then(r => {
        if (!r.ok) throw new Error(`API ${r.status}`);
        return r.json();
      })
      .then(data => {
        const parsed = parseLeaders(data, active);
        setLeaders(prev => ({ ...prev, [active]: parsed }));
        setLoading(false);
      })
      .catch(e => {
        setError(e.message || 'Failed to load leaders.');
        setLoading(false);
      });
  }, [active]);

  const list = leaders[active] || [];
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
          const isActive = cat.stat === active;
          return (
            <button
              key={cat.stat}
              onClick={() => setActive(cat.stat)}
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
            gridTemplateColumns: '36px 48px 1fr 60px 60px',
            gap: 'var(--sp-2)',
            padding: '10px var(--sp-4)',
            borderBottom: '1px solid var(--line)',
          }}>
            {['#', '', 'Player', 'GP', CATEGORIES.find(c => c.stat === active)?.label || active].map((h, i) => (
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
                  gridTemplateColumns: '36px 48px 1fr 60px 60px',
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
                    src={`https://cdn.nba.com/headshots/nba/latest/260x190/${p.playerId}.png`}
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

                {/* GP */}
                <span style={{
                  fontSize: 'var(--t-sm)',
                  fontFamily: 'var(--font-body)',
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--chalk-2)',
                  textAlign: 'right',
                }}>
                  {p.gp}
                </span>

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
