import { useEffect, useRef, useState } from 'react';

interface StatNumberProps {
  value: number | string;
  label?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  highlight?: boolean;
  animate?: boolean;
}

const SIZES = {
  sm: 'var(--t-lg)',
  md: 'var(--t-xl)',
  lg: 'var(--t-2xl)',
  xl: 'var(--t-3xl)',
};

export function StatNumber({ value, label, size = 'md', highlight = false, animate = true }: StatNumberProps) {
  const [displayed, setDisplayed] = useState(animate ? 0 : value);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!animate || typeof value !== 'number' || hasAnimated.current) return;

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || hasAnimated.current) return;
      hasAnimated.current = true;

      const start = performance.now();
      const duration = 800;
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        setDisplayed(Math.round(ease * (value as number)));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      observer.disconnect();
    }, { threshold: 0.3 });

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, animate]);

  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: SIZES[size],
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
        color: highlight ? 'var(--gold)' : 'var(--chalk)',
        letterSpacing: '-0.02em',
      }}>
        {prefersReduced || !animate ? value : displayed}
      </span>
      {label && (
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--t-xs)',
          color: 'var(--chalk-2)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 500,
        }}>
          {label}
        </span>
      )}
    </div>
  );
}
