interface PlayerChipProps {
  name: string;
  headshot?: string;
  team?: string;
  teamLogo?: string;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export function PlayerChip({ name, headshot, team, teamLogo, onClick, size = 'md' }: PlayerChipProps) {
  const imgSize = size === 'sm' ? 28 : 36;
  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-2)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {headshot && (
        <img src={headshot} alt={name} style={{
          width: imgSize, height: imgSize, borderRadius: '50%',
          objectFit: 'cover', background: 'var(--court)',
          border: '2px solid var(--line)',
        }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      )}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: size === 'sm' ? 'var(--t-xs)' : 'var(--t-sm)',
          fontWeight: 600, color: 'var(--chalk)',
          lineHeight: 1.2,
        }}>
          {name}
        </span>
        {team && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 'var(--sp-1)',
            fontFamily: 'var(--font-body)', fontSize: 'var(--t-xs)',
            color: 'var(--chalk-2)',
          }}>
            {teamLogo && <img src={teamLogo} alt={team} style={{ width: 14, height: 14, objectFit: 'contain' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
            {team}
          </span>
        )}
      </div>
    </div>
  );
}
