import { useNavigate } from 'react-router-dom';
import { NBA_TEAM_LIST } from '../teams';

const C = {
  surfaceRaised: 'var(--court)',
  surfaceHover:  'var(--ink)',
  border:        'var(--line)',
  text:          'var(--chalk)',
  textMuted:     'var(--chalk-2)',
  emerald:       'var(--cool)',
  sky:           'var(--cool)',
  mono:          'var(--font-body)',
};

const confs = [
  { label: 'Eastern Conference', color: C.emerald, teams: NBA_TEAM_LIST.filter((_, i) => i < 15) },
  { label: 'Western Conference', color: C.sky,     teams: NBA_TEAM_LIST.filter((_, i) => i >= 15) },
];

export default function TeamsPage() {
  const navigate = useNavigate();

  return (
    <div>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--t-xl)',
          color: 'var(--chalk)',
          marginBottom: 'var(--sp-6)',
        }}
      >
        Teams & Rosters
      </h2>
      {confs.map(conf => (
        <div key={conf.label} style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: conf.color, display: 'inline-block' }} />
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: conf.color }}>{conf.label}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {conf.teams.map(team => (
              <button
                key={team.id}
                onClick={() => navigate(`/teams/${team.abbr.toLowerCase()}`)}
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
                <div style={{ fontSize: 9, color: conf.color, fontFamily: C.mono, fontWeight: 700, letterSpacing: '0.1em', marginTop: 4 }}>{team.abbr}</div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
