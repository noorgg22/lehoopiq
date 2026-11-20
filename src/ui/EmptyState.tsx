interface EmptyStateProps {
  message: string;
  detail?: string;
  lastUpdated?: string;
}

export function EmptyState({ message, detail, lastUpdated }: EmptyStateProps) {
  return (
    <div style={{
      background: 'var(--court)',
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--line)',
      padding: 'var(--sp-10) var(--sp-6)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-2)',
    }}>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--t-sm)',
        fontWeight: 500,
        color: 'var(--chalk-2)',
      }}>
        {message}
      </p>
      {detail && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--t-xs)', color: 'var(--chalk-2)' }}>
          {detail}
        </p>
      )}
      {lastUpdated && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--t-xs)', color: 'var(--chalk-2)', opacity: 0.6 }}>
          Last good data from {lastUpdated}
        </p>
      )}
    </div>
  );
}
