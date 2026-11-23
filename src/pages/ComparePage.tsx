import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const PROXY = import.meta.env.VITE_PROXY_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? '/api'
    : 'http://localhost:3001/api');

const C = {
  bg: 'var(--ink)',
  surface: 'var(--court)',
  border: 'var(--line)',
  text: 'var(--chalk)',
  textSub: 'var(--chalk-2)',
  textMuted: 'var(--chalk-2)',
  heat: 'var(--heat)',
  heatDim: 'rgba(229,50,45,0.12)',
  chalk2: 'var(--chalk-2)',
};

interface PlayerData {
  id: string;
  name: string;
  team: string;
  teamCity: string;
  jersey: string;
  position: string;
  headshot: string;
  stats: Record<string, number>;
  error?: boolean;
}

const STAT_KEYS = [
  { key: 'PTS', label: 'PPG' },
  { key: 'REB', label: 'RPG' },
  { key: 'AST', label: 'APG' },
  { key: 'STL', label: 'SPG' },
  { key: 'BLK', label: 'BPG' },
  { key: 'FG_PCT', label: 'FG%', isPct: true },
  { key: 'FG3_PCT', label: '3P%', isPct: true },
  { key: 'FT_PCT', label: 'FT%', isPct: true },
];

function parseResultSet(data: any, setName?: string) {
  const rs = setName
    ? data?.resultSets?.find((r: any) => r.name === setName)
    : data?.resultSet || data?.resultSets?.[0];
  if (!rs) return { headers: [] as string[], rows: [] as any[] };
  const headers: string[] = rs.headers;
  const rows = rs.rowSet.map((row: any[]) =>
    Object.fromEntries(headers.map((h, i) => [h, row[i]]))
  );
  return { headers, rows };
}

async function fetchPlayer(playerId: string): Promise<PlayerData> {
  const result: PlayerData = {
    id: playerId,
    name: '',
    team: '',
    teamCity: '',
    jersey: '',
    position: '',
    headshot: `https://cdn.nba.com/headshots/nba/latest/1040x760/${playerId}.png`,
    stats: {},
  };

  try {
    const [infoRes, careerRes] = await Promise.all([
      fetch(`${PROXY}/player-info/${playerId}`),
      fetch(`${PROXY}/player-career/${playerId}`),
    ]);

    if (infoRes.ok) {
      const infoData = await infoRes.json();
      const { rows } = parseResultSet(infoData, 'CommonPlayerInfo');
      const bio = rows[0];
      if (bio) {
        result.name = bio.DISPLAY_FIRST_LAST || bio.PLAYER_NAME || '';
        result.team = bio.TEAM_NAME || '';
        result.teamCity = bio.TEAM_CITY || '';
        result.jersey = bio.JERSEY || '';
        result.position = bio.POSITION || '';
      }
    }

    if (careerRes.ok) {
      const careerData = await careerRes.json();
      const { rows } = parseResultSet(careerData, 'SeasonTotalsRegularSeason');
      // Last row is the most recent (current) season
      if (rows.length > 0) {
        const current = rows[rows.length - 1];
        for (const { key } of STAT_KEYS) {
          const val = parseFloat(current[key]);
          if (!isNaN(val)) result.stats[key] = val;
        }
      }
    }

    if (!result.name) {
      result.error = true;
    }
  } catch (e) {
    console.error(`Failed to fetch player ${playerId}:`, e);
    result.error = true;
  }

  return result;
}

function formatStat(value: number | undefined, isPct: boolean): string {
  if (value === undefined || isNaN(value)) return '--';
  if (isPct) return `${(value * 100).toFixed(1)}%`;
  return value.toFixed(1);
}

export default function ComparePage() {
  const { matchup } = useParams<{ matchup: string }>();
  const navigate = useNavigate();
  const [playerA, setPlayerA] = useState<PlayerData | null>(null);
  const [playerB, setPlayerB] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);

  const ids = (matchup || '').split('-vs-');
  const idA = ids[0] || '';
  const idB = ids[1] || '';

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!idA || !idB) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([fetchPlayer(idA), fetchPlayer(idB)]).then(([a, b]) => {
      setPlayerA(a);
      setPlayerB(b);
      setLoading(false);
    });
  }, [idA, idB]);

  return (
    <div style={{ color: C.text, fontFamily: "var(--font-body)" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Back button */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
          padding: '6px 14px', color: C.textSub, cursor: 'pointer', fontSize: 13,
        }}>← Back</button>
        <span style={{ color: C.textMuted, fontSize: 13 }}>Player Compare</span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${C.border}`, borderTopColor: C.heat, animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: C.textMuted, fontSize: 14 }}>Loading comparison...</p>
        </div>
      ) : !idA || !idB ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', color: C.textMuted, fontSize: 15 }}>
          Invalid comparison URL. Use format: /compare/playerId1-vs-playerId2
        </div>
      ) : (
        <div style={{ maxWidth: 900, margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
          {/* Player headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 24, marginBottom: 40 }}>
            {/* Player A */}
            <PlayerHeader player={playerA} align="right" />
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 800, color: C.textMuted, fontFamily: 'var(--font-display)',
              letterSpacing: '0.05em',
            }}>VS</div>
            {/* Player B */}
            <PlayerHeader player={playerB} align="left" />
          </div>

          {/* Stat bars */}
          <div style={{
            background: C.surface, borderRadius: 16, padding: 28,
            border: `1px solid ${C.border}`,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
              color: C.textMuted, marginBottom: 24, textAlign: 'center',
            }}>Season Stats Comparison</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {STAT_KEYS.map(({ key, label, isPct }) => {
                const valA = playerA?.stats[key];
                const valB = playerB?.stats[key];
                const numA = valA ?? 0;
                const numB = valB ?? 0;
                const max = Math.max(numA, numB, 0.001);
                const aWins = numA > numB;
                const bWins = numB > numA;
                const tied = numA === numB && numA > 0;

                return (
                  <div key={key}>
                    {/* Label centered */}
                    <div style={{ textAlign: 'center', marginBottom: 6 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                        textTransform: 'uppercase', color: C.textMuted,
                      }}>{label}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                      {/* Left bar (Player A) - grows right to left */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700,
                          color: aWins ? C.heat : tied ? C.text : C.textSub,
                          minWidth: 52, textAlign: 'left', fontVariantNumeric: 'tabular-nums',
                        }}>{formatStat(valA, !!isPct)}</span>
                        <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 99, overflow: 'hidden', direction: 'rtl' }}>
                          <div style={{
                            height: '100%',
                            width: max > 0 ? `${(numA / max) * 100}%` : '0%',
                            background: aWins || tied ? C.heat : C.chalk2,
                            opacity: aWins || tied ? 0.8 : 0.35,
                            borderRadius: 99,
                            transition: 'width 500ms ease',
                          }} />
                        </div>
                      </div>
                      {/* Right bar (Player B) - grows left to right */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: max > 0 ? `${(numB / max) * 100}%` : '0%',
                            background: bWins || tied ? C.heat : C.chalk2,
                            opacity: bWins || tied ? 0.8 : 0.35,
                            borderRadius: 99,
                            transition: 'width 500ms ease',
                          }} />
                        </div>
                        <span style={{
                          fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700,
                          color: bWins ? C.heat : tied ? C.text : C.textSub,
                          minWidth: 52, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
                        }}>{formatStat(valB, !!isPct)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: C.textMuted }}>
            Data from NBA.com / ESPN. Stats are per-game averages for the current season.
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerHeader({ player, align }: { player: PlayerData | null; align: 'left' | 'right' }) {
  const isRight = align === 'left'; // "left" align means player is on right side
  if (!player) return <div />;

  if (player.error) {
    return (
      <div style={{ textAlign: align, padding: '20px 0' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: C.textMuted }}>Player not found</div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: isRight ? 'flex-start' : 'flex-end',
      gap: 12,
    }}>
      <div style={{
        width: 100, height: 100, borderRadius: 16, overflow: 'hidden',
        background: C.surface, border: `2px solid ${C.border}`,
        alignSelf: isRight ? 'flex-start' : 'flex-end',
      }}>
        <img
          src={player.headshot}
          alt={player.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
          onError={(e) => { (e.target as HTMLImageElement).src = `https://cdn.nba.com/headshots/nba/latest/260x190/${player.id}.png`; }}
        />
      </div>
      <div style={{ textAlign: align }}>
        <div style={{
          fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)',
          letterSpacing: '-0.01em', lineHeight: 1.1, color: C.text,
        }}>{player.name}</div>
        <div style={{
          fontSize: 13, color: C.heat, fontWeight: 600, marginTop: 4,
        }}>
          {player.teamCity} {player.team}
        </div>
        <div style={{
          display: 'flex', gap: 12, marginTop: 6,
          justifyContent: isRight ? 'flex-start' : 'flex-end',
        }}>
          {player.jersey && (
            <span style={{ fontSize: 11, color: C.textMuted }}>#{player.jersey}</span>
          )}
          {player.position && (
            <span style={{ fontSize: 11, color: C.textMuted }}>{player.position}</span>
          )}
        </div>
      </div>
    </div>
  );
}
