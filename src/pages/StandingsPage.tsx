import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentSeasonLabel } from '../season';
import { fetchStandings, type StandingsRow } from '../parseStandings';

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

const COLS = ['#', 'Team', 'W', 'L', 'PCT', 'GB', 'L10', 'STRK'];

function ConferenceTable({ rows, conf }: { rows: StandingsRow[]; conf: 'East' | 'West' }) {
  const navigate = useNavigate();
  const filtered = rows.filter(r => r.conf === conf);

  const headerStyle: React.CSSProperties = {
    fontSize: 'var(--t-xs)',
    fontFamily: 'var(--font-body)',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--chalk-2)',
    padding: '10px 8px',
    borderBottom: '1px solid var(--line)',
    textAlign: 'right',
  };

  const cellStyle: React.CSSProperties = {
    fontSize: 'var(--t-sm)',
    fontFamily: 'var(--font-body)',
    fontVariantNumeric: 'tabular-nums',
    color: 'var(--chalk)',
    padding: '12px 8px',
    borderBottom: '1px solid var(--line)',
    textAlign: 'right',
  };

  return (
    <div style={{ flex: 1, minWidth: 320 }}>
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--t-lg)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--chalk)',
        marginBottom: 'var(--sp-4)',
      }}>
        {conf}ern Conference
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'var(--font-body)',
        }}>
          <thead>
            <tr>
              {COLS.map((col, i) => (
                <th key={col} style={{
                  ...headerStyle,
                  textAlign: i <= 1 ? 'left' : 'right',
                  width: i === 0 ? 36 : i === 1 ? 'auto' : 56,
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => {
              // Cutoff lines after seed 6 and seed 10
              const isPlayoffCutoff = row.rank === 6;
              const isPlayinCutoff = row.rank === 10;
              return (
                <tr
                  key={row.abbr}
                  onClick={() => navigate(`/teams/${row.abbr.toLowerCase()}`)}
                  style={{
                    cursor: 'pointer',
                    transition: 'background 120ms ease',
                    borderBottom: isPlayoffCutoff
                      ? '2px solid var(--heat)'
                      : isPlayinCutoff
                        ? '2px solid var(--gold)'
                        : undefined,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--court)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ ...cellStyle, textAlign: 'left', color: 'var(--chalk-2)', fontSize: 'var(--t-xs)', fontWeight: 600 }}>
                    {row.rank}
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img
                        src={row.logo}
                        alt=""
                        style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <span style={{ fontWeight: 500 }}>{row.team}</span>
                    </div>
                  </td>
                  <td style={cellStyle}>{row.wins}</td>
                  <td style={cellStyle}>{row.losses}</td>
                  <td style={{ ...cellStyle, fontWeight: 600 }}>{row.pct}</td>
                  <td style={{ ...cellStyle, color: 'var(--chalk-2)' }}>{row.gb}</td>
                  <td style={{ ...cellStyle, color: 'var(--chalk-2)' }}>{row.last10}</td>
                  <td style={{ ...cellStyle, color: 'var(--chalk-2)' }}>{row.streak}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 'var(--sp-6)', marginTop: 'var(--sp-3)', paddingLeft: 4 }}>
        <span style={{ fontSize: 'var(--t-xs)', color: 'var(--chalk-2)' }}>
          <span style={{ display: 'inline-block', width: 12, height: 2, background: 'var(--heat)', marginRight: 6, verticalAlign: 'middle' }} />
          Playoff cutoff
        </span>
        <span style={{ fontSize: 'var(--t-xs)', color: 'var(--chalk-2)' }}>
          <span style={{ display: 'inline-block', width: 12, height: 2, background: 'var(--gold)', marginRight: 6, verticalAlign: 'middle' }} />
          Play-in cutoff
        </span>
      </div>
    </div>
  );
}

export default function StandingsPage() {
  const [standings, setStandings] = useState<StandingsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'East' | 'West'>('East');

  useEffect(() => {
    (async () => {
      try {
        const parsed = await fetchStandings();
        if (parsed.length > 0) setStandings(parsed);
        else setError('No standings data available.');
      } catch (e: any) {
        setError(e.message || 'Failed to load standings.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
        Standings
      </h2>
      <p style={{ fontSize: 'var(--t-sm)', color: 'var(--chalk-2)', marginBottom: 'var(--sp-6)' }}>
        {getCurrentSeasonLabel()} Season
      </p>

      {loading ? <Spinner /> : error ? (
        <p style={{ color: 'var(--chalk-2)', fontSize: 'var(--t-sm)', textAlign: 'center', padding: 40 }}>{error}</p>
      ) : (
        <>
          {/* Mobile tabs */}
          <div className="standings-mobile-tabs" style={{ display: 'none', gap: 4, marginBottom: 'var(--sp-4)' }}>
            {(['East', 'West'] as const).map(c => (
              <button
                key={c}
                onClick={() => setTab(c)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  fontSize: 'var(--t-sm)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  borderRadius: 'var(--r-sm)',
                  border: tab === c ? '1px solid var(--heat)' : '1px solid var(--line)',
                  background: tab === c ? 'rgba(229,50,45,0.1)' : 'transparent',
                  color: tab === c ? 'var(--heat)' : 'var(--chalk-2)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                {c}ern
              </button>
            ))}
          </div>

          {/* Desktop: side-by-side */}
          <div className="standings-desktop" style={{ display: 'flex', gap: 'var(--sp-8)' }}>
            <ConferenceTable rows={standings} conf="East" />
            <ConferenceTable rows={standings} conf="West" />
          </div>

          {/* Mobile: tab-driven */}
          <div className="standings-mobile-content" style={{ display: 'none' }}>
            <ConferenceTable rows={standings} conf={tab} />
          </div>
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .standings-mobile-tabs { display: flex !important; }
          .standings-desktop { display: none !important; }
          .standings-mobile-content { display: block !important; }
        }
      `}</style>
    </div>
  );
}
