interface TeamChipProps {
  name: string;
  abbr: string;
  logo?: string;
  record?: string;
  onClick?: () => void;
}

export function TeamChip({ name, abbr, logo, record, onClick }: TeamChipProps) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-2)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {logo && (
        <img src={logo} alt={abbr} style={{ width: 24, height: 24, objectFit: 'contain' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      )}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 'var(--t-sm)',
          fontWeight: 600, color: 'var(--chalk)', lineHeight: 1.2,
        }}>
          {name}
        </span>
        {record && (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--t-xs)', color: 'var(--chalk-2)', fontVariantNumeric: 'tabular-nums' }}>
            {record}
          </span>
        )}
      </div>
    </div>
  );
}
