import type { CSSProperties, ReactNode } from 'react';

interface Column<T> {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  render?: (row: T, idx: number) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T, idx: number) => string;
  onRowClick?: (row: T) => void;
  highlightRow?: (row: T) => boolean;
  compact?: boolean;
}

const cellBase: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--t-sm)',
  fontVariantNumeric: 'tabular-nums',
  padding: 'var(--sp-3) var(--sp-4)',
  borderBottom: '1px solid var(--line)',
  whiteSpace: 'nowrap',
};

export function Table<T>({ columns, data, rowKey, onRowClick, highlightRow, compact }: TableProps<T>) {
  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontFamily: 'var(--font-body)',
      }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={{
                ...cellBase,
                fontSize: 'var(--t-xs)',
                fontWeight: 600,
                color: 'var(--chalk-2)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                textAlign: (col.align || 'left') as CSSProperties['textAlign'],
                width: col.width,
                padding: compact ? 'var(--sp-2) var(--sp-3)' : cellBase.padding,
                borderBottom: '2px solid var(--line)',
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={rowKey(row, idx)}
              onClick={() => onRowClick?.(row)}
              style={{
                cursor: onRowClick ? 'pointer' : 'default',
                background: highlightRow?.(row) ? 'rgba(242,179,61,0.06)' : 'transparent',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => { if (onRowClick) (e.currentTarget.style.background = 'rgba(255,255,255,0.03)'); }}
              onMouseLeave={e => { e.currentTarget.style.background = highlightRow?.(row) ? 'rgba(242,179,61,0.06)' : 'transparent'; }}
            >
              {columns.map(col => (
                <td key={col.key} style={{
                  ...cellBase,
                  color: 'var(--chalk)',
                  textAlign: (col.align || 'left') as CSSProperties['textAlign'],
                  padding: compact ? 'var(--sp-2) var(--sp-3)' : cellBase.padding,
                }}>
                  {col.render
                    ? col.render(row, idx)
                    : String((row as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
