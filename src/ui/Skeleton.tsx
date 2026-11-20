interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ width = '100%', height = 20, radius = 'var(--r-sm)', style }: SkeletonProps) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: 'var(--line)',
      animation: 'skeletonPulse 1.5s ease-in-out infinite',
      ...style,
    }} />
  );
}

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--sp-4)', padding: 'var(--sp-3) 0' }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} width={i === 0 ? 120 : 60} height={16} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </div>
  );
}
