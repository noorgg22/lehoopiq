import type { ReactNode } from 'react';

interface ChartFrameProps {
  headline: string;
  howToRead?: string;
  source?: string;
  updatedAt?: string;
  children: ReactNode;
}

export function ChartFrame({ headline, howToRead, source, updatedAt, children }: ChartFrameProps) {
  return (
    <div style={{
      background: 'var(--court)',
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--line)',
      padding: 'var(--sp-6)',
      display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)',
    }}>
      <div>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--t-lg)',
          fontWeight: 600,
          color: 'var(--chalk)',
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
          margin: 0,
        }}>
          {headline}
        </h3>
        {howToRead && (
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--t-xs)',
            color: 'var(--chalk-2)',
            marginTop: 'var(--sp-1)',
          }}>
            {howToRead}
          </p>
        )}
      </div>

      <div style={{ width: '100%' }}>
        {children}
      </div>

      {(source || updatedAt) && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTop: '1px solid var(--line)',
          paddingTop: 'var(--sp-2)',
        }}>
          {source && (
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--t-xs)', color: 'var(--chalk-2)' }}>
              Source: {source}
            </span>
          )}
          {updatedAt && (
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--t-xs)', color: 'var(--chalk-2)' }}>
              Updated {updatedAt}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
