interface GameTileProps {
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  homeRecord?: string;
  awayRecord?: string;
  homeScore?: number;
  awayScore?: number;
  status: string;
  isLive?: boolean;
  network?: string;
  onClick?: () => void;
}

export function GameTile({
  homeTeam, awayTeam, homeLogo, awayLogo,
  homeRecord, awayRecord, homeScore, awayScore,
  status, isLive, network, onClick,
}: GameTileProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--court)',
        borderRadius: 'var(--r-md)',
        border: `1px solid ${isLive ? 'var(--heat)' : 'var(--line)'}`,
        padding: 'var(--sp-4)',
        cursor: onClick ? 'pointer' : 'default',
        minWidth: 180,
        transition: 'border-color 0.2s ease',
      }}
    >
      {/* Status bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 'var(--sp-3)',
      }}>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--t-xs)',
          fontWeight: 600,
          color: isLive ? 'var(--heat)' : 'var(--chalk-2)',
          display: 'flex', alignItems: 'center', gap: 'var(--sp-1)',
        }}>
          {isLive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--heat)', animation: 'pulse 1.5s infinite' }} />}
          {status}
        </span>
        {network && (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--t-xs)', color: 'var(--chalk-2)' }}>
            {network}
          </span>
        )}
      </div>

      {/* Teams */}
      {[{ team: awayTeam, logo: awayLogo, record: awayRecord, score: awayScore },
        { team: homeTeam, logo: homeLogo, record: homeRecord, score: homeScore }]
        .map(({ team, logo, record, score }) => (
        <div key={team} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--sp-2) 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <img src={logo} alt={team} style={{ width: 24, height: 24, objectFit: 'contain' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--t-sm)', fontWeight: 600, color: 'var(--chalk)' }}>
              {team}
            </span>
            {record && (
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--t-xs)', color: 'var(--chalk-2)' }}>
                {record}
              </span>
            )}
          </div>
          {score !== undefined && (
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 'var(--t-lg)', fontWeight: 700,
              fontVariantNumeric: 'tabular-nums', color: 'var(--chalk)',
            }}>
              {score}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
