import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCurrentSeasonLabel } from './season';

const PROXY = import.meta.env.VITE_PROXY_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? '/api'
    : 'http://localhost:3001/api');

const C = {
  bg: 'var(--ink)', surface: 'var(--court)', surfaceHi: 'var(--court)',
  border: 'var(--line)', text: 'var(--chalk)', textSub: 'var(--chalk-2)', textMuted: 'var(--chalk-2)',
  orange: 'var(--heat)', orangeDim: 'rgba(229,50,45,0.12)',
  emerald: 'var(--gold)', amber: 'var(--gold)', sky: 'var(--cool)',
  violet: 'var(--cool)', rose: 'var(--heat)', green: 'var(--gold)', pink: 'var(--heat)',
};

const ATTRIBUTES = [
  { key: 'scoring',    label: 'Scoring',      color: 'var(--heat)' },
  { key: 'playmaking', label: 'Playmaking',   color: 'var(--gold)' },
  { key: 'threePoint', label: '3PT Shooting', color: 'var(--cool)' },
  { key: 'rimFinish',  label: 'Rim Finish',   color: 'var(--chalk-2)' },
  { key: 'midrange',   label: 'Midrange',     color: 'var(--gold)' },
  { key: 'creation',   label: 'Shot Creation',color: 'var(--heat)' },
  { key: 'defense',    label: 'Defense',      color: 'var(--cool)' },
  { key: 'rebounding', label: 'Rebounding',   color: 'var(--chalk-2)' },
  { key: 'intangibles',label: 'Intangibles',  color: 'var(--cool)' },
];

const STAT_EXPLANATIONS: Record<string, string> = {
  'Off Rating': 'Points scored per 100 possessions. League avg ~115.',
  'Def Rating': 'Points allowed per 100 possessions. Lower is better.',
  'Net Rating': 'Off Rating minus Def Rating. Overall impact per 100 possessions.',
  'USG%': 'Percentage of team plays used by player while on floor.',
  'AST%': 'Percentage of teammate field goals assisted while on floor.',
  'REB%': 'Percentage of available rebounds grabbed while on floor.',
  'STL%': 'Percentage of opponent possessions ending in steal per game.',
  'BLK%': 'Percentage of opponent 2PT attempts blocked while on floor.',
  'BPM': 'Box Plus/Minus. Points above avg per 100 possessions vs replacement.',
  'TS%': 'True Shooting %. Shooting efficiency accounting for 2s, 3s & FTs.',
  'eFG%': 'Effective FG%. Adjusts for 3-pointers being worth more than 2s.',
  'VORP': 'Value Over Replacement Player. Total value above a replacement-level player.',
};


function getAwardConfig(description: string) {
  const configs: Record<string, { color: string; shortLabel: string }> = {
    'NBA Most Valuable Player': { color: 'var(--gold)', shortLabel: 'MVP' },
    'NBA Finals Most Valuable Player': { color: 'var(--gold)', shortLabel: 'Finals MVP' },
    'Conference Finals Most Valuable Player': { color: 'var(--cool)', shortLabel: 'CF MVP' },
    'NBA Defensive Player of the Year': { color: 'var(--gold)', shortLabel: 'DPOY' },
    'NBA Rookie of the Year': { color: 'var(--cool)', shortLabel: 'ROY' },
    'NBA Most Improved Player': { color: 'var(--cool)', shortLabel: 'MIP' },
    'NBA Sixth Man of the Year': { color: 'var(--heat)', shortLabel: '6MOY' },
    'NBA Champion': { color: 'var(--gold)', shortLabel: 'Champion' },
    'NBA Scoring Champion': { color: 'var(--heat)', shortLabel: 'Scoring Champ' },
  };
  for (const [key, val] of Object.entries(configs)) {
    if (description?.includes(key)) return val;
  }
  return { color: 'var(--chalk-2)', shortLabel: description?.slice(0, 15) || 'Award' };
}

function percentile(value: number, allValues: number[], higherIsBetter = true): number {
  if (!allValues.length || value === null || value === undefined || isNaN(value)) return 0;
  const sorted = [...allValues].filter(v => !isNaN(v) && v !== null).sort((a, b) => a - b);
  const rank = sorted.filter(v => (higherIsBetter ? v <= value : v >= value)).length;
  return Math.round((rank / sorted.length) * 100);
}

function parseResultSet(data: any, setName?: string) {
  const rs = setName
    ? data?.resultSets?.find((r: any) => r.name === setName)
    : data?.resultSet || data?.resultSets?.[0];
  if (!rs) return { headers: [], rows: [] };
  const headers: string[] = rs.headers;
  const rows = rs.rowSet.map((row: any[]) =>
    Object.fromEntries(headers.map((h, i) => [h, row[i]]))
  );
  return { headers, rows };
}

function getTooltipStats(attr: string, player: any): { label: string; value: string }[] {
  const p = player || {};
  const fmt = (v: any) => v != null && !isNaN(+v) ? (+v).toFixed(1) : 'N/A';
  const fmtp = (v: any) => v != null && !isNaN(+v) ? `${(+v * 100).toFixed(1)}%` : 'N/A';
  const maps: Record<string, { label: string; value: string }[]> = {
    scoring: [{ label: 'True Shooting %', value: fmtp(p.TS_PCT) }, { label: 'eFG%', value: fmtp(p.EFG_PCT) }, { label: 'FG%', value: fmtp(p.FG_PCT) }, { label: 'AST/TO', value: fmt(p.AST_TO) }, { label: 'USG%', value: fmtp(p.USG_PCT) }, { label: 'PTS/g', value: fmt(p.PTS) }],
    playmaking: [{ label: 'AST%', value: fmtp(p.AST_PCT) }, { label: 'AST/TO', value: fmt(p.AST_TO) }, { label: 'AST/g', value: fmt(p.AST) }, { label: 'TOV/g', value: fmt(p.TOV) }, { label: 'USG%', value: fmtp(p.USG_PCT) }],
    threePoint: [{ label: '3P%', value: fmtp(p.FG3_PCT) }, { label: '3PA/g', value: fmt(p.FG3A) }, { label: '3P Att Rate', value: fmtp(p.FG3A_RATE) }, { label: 'eFG%', value: fmtp(p.EFG_PCT) }],
    rimFinish: [{ label: 'FG%', value: fmtp(p.FG_PCT) }, { label: 'eFG%', value: fmtp(p.EFG_PCT) }, { label: 'TS%', value: fmtp(p.TS_PCT) }, { label: 'OREB/g', value: fmt(p.OREB) }],
    midrange: [{ label: 'FG%', value: fmtp(p.FG_PCT) }, { label: 'eFG%', value: fmtp(p.EFG_PCT) }, { label: 'USG%', value: fmtp(p.USG_PCT) }, { label: 'AST/TO', value: fmt(p.AST_TO) }],
    creation: [{ label: 'USG%', value: fmtp(p.USG_PCT) }, { label: 'AST%', value: fmtp(p.AST_PCT) }, { label: 'AST/TO', value: fmt(p.AST_TO) }, { label: 'PTS/g', value: fmt(p.PTS) }, { label: 'TOV/g', value: fmt(p.TOV) }],
    defense: [{ label: 'STL%', value: fmtp(p.STL_PCT) }, { label: 'BLK%', value: fmtp(p.BLK_PCT) }, { label: 'STL/g', value: fmt(p.STL) }, { label: 'BLK/g', value: fmt(p.BLK) }, { label: 'DREB%', value: fmtp(p.DREB_PCT) }],
    rebounding: [{ label: 'OREB%', value: fmtp(p.OREB_PCT) }, { label: 'DREB%', value: fmtp(p.DREB_PCT) }, { label: 'REB%', value: fmtp(p.REB_PCT) }, { label: 'OREB/g', value: fmt(p.OREB) }, { label: 'DREB/g', value: fmt(p.DREB) }, { label: 'REB/g', value: fmt(p.REB) }],
    intangibles: [{ label: 'BPM', value: fmt(p.BPM) }, { label: 'VORP', value: fmt(p.VORP) }, { label: 'Win Shares', value: fmt(p.WIN_SHARES) }, { label: 'TS%', value: fmtp(p.TS_PCT) }, { label: 'USG%', value: fmtp(p.USG_PCT) }, { label: 'AST/TO', value: fmt(p.AST_TO) }],
  };
  return maps[attr] || [];
}

function StatCard({ label, value }: { label: string; value: string }) {
  const [showTip, setShowTip] = useState(false);
  const explanation = STAT_EXPLANATIONS[label];
  return (
    <div style={{ background: C.surfaceHi, borderRadius: 8, padding: '8px 12px', position: 'relative', cursor: explanation ? 'help' : 'default' }}
      onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
        <div style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
        {explanation && <div style={{ fontSize: 9, color: C.textMuted, opacity: 0.6 }}>ⓘ</div>}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: 'var(--font-display)' }}>{value}</div>
      {showTip && explanation && (
        <div style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', background: '#09090b', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', minWidth: 200, maxWidth: 260, zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.8)', fontSize: 11, color: C.textSub, lineHeight: 1.5, pointerEvents: 'none' }}>
          <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>{label}</div>
          {explanation}
          <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `5px solid ${C.border}` }} />
        </div>
      )}
    </div>
  );
}

function HonorBadge({ label, color, years }: { label: string; color: string; years: string[] }) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div style={{ position: 'relative', cursor: 'pointer' }}
      onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: `${color}15`, border: `1px solid ${color}40`, borderRadius: 10, padding: '8px 14px', transition: 'all 0.15s ease', boxShadow: showTip ? `0 0 12px ${color}30` : 'none' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color }}>{label}</div>
          <div style={{ fontSize: 10, color: C.textMuted }}>{years.length}×</div>
        </div>
      </div>
      {showTip && years.length > 0 && (
        <div style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', background: '#09090b', border: `1px solid ${color}40`, borderRadius: 10, padding: '10px 14px', zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.8)', pointerEvents: 'none', minWidth: 140 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {years.sort().map((y, i) => <div key={i} style={{ fontSize: 10, background: `${color}20`, color, padding: '2px 6px', borderRadius: 4 }}>{y}</div>)}
          </div>
          <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `5px solid ${color}40` }} />
        </div>
      )}
    </div>
  );
}

function AttributeDiagram({ scores, playerName, playerImg, playerStats }: { scores: Record<string, number>; playerName: string; playerImg: string; playerStats: any }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [tooltipAttr, setTooltipAttr] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const W = 500, H = 500, CX = W / 2, CY = H / 2;
  const MAX_R = 180, CENTER_R = 52, N = ATTRIBUTES.length;
  const getCoords = (angle: number, r: number) => ({ x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) });
  const segments = ATTRIBUTES.map((attr, i) => {
    const startAngle = (i / N) * 2 * Math.PI - Math.PI / 2;
    const endAngle = ((i + 1) / N) * 2 * Math.PI - Math.PI / 2;
    const midAngle = (startAngle + endAngle) / 2;
    const score = scores[attr.key] ?? 0;
    const r = CENTER_R + (score / 100) * (MAX_R - CENTER_R);
    return { attr, startAngle, endAngle, midAngle, score, r, gapAngle: 0.04 };
  });
  const handleMouseMove = (e: React.MouseEvent, attrKey: string) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTooltipAttr(attrKey); setHovered(attrKey);
  };
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <svg ref={svgRef} width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {[25, 50, 75, 100].map(pct => (<circle key={pct} cx={CX} cy={CY} r={CENTER_R + (pct / 100) * (MAX_R - CENTER_R)} fill="none" stroke="#27272a" strokeWidth={0.5} strokeDasharray="3,3" />))}
        {segments.map(({ attr, startAngle, endAngle, midAngle, score, r, gapAngle }) => {
          const isHov = hovered === attr.key;
          const pts = [getCoords(startAngle + gapAngle, CENTER_R), getCoords(startAngle + gapAngle, r), getCoords(endAngle - gapAngle, r), getCoords(endAngle - gapAngle, CENTER_R)];
          const pathD = `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y} A${r},${r} 0 0,1 ${pts[2].x},${pts[2].y} L${pts[3].x},${pts[3].y} A${CENTER_R},${CENTER_R} 0 0,0 ${pts[0].x},${pts[0].y}`;
          const labelPos = getCoords(midAngle, MAX_R + 28);
          const scorePos = getCoords(midAngle, CENTER_R + (score / 100) * (MAX_R - CENTER_R) + 14);
          return (
            <g key={attr.key} onMouseMove={e => handleMouseMove(e, attr.key)} onMouseLeave={() => { setHovered(null); setTooltipAttr(null); }} style={{ cursor: 'pointer' }}>
              <path d={pathD} fill={attr.color} fillOpacity={isHov ? 0.85 : 0.55} stroke={attr.color} strokeWidth={isHov ? 2 : 0.5} strokeOpacity={0.8} style={{ transition: 'all 0.15s ease' }} />
              {score > 15 && <text x={scorePos.x} y={scorePos.y + 4} textAnchor="middle" fontSize={9} fontWeight="700" fill="#09090b" fillOpacity={0.8}>{score}</text>}
              <text x={labelPos.x} y={labelPos.y - 6} textAnchor="middle" fontSize={9.5} fontWeight={isHov ? '700' : '600'} fill={isHov ? attr.color : '#a1a1aa'} style={{ transition: 'all 0.15s ease' }}>{attr.label}</text>
              <text x={labelPos.x} y={labelPos.y + 9} textAnchor="middle" fontSize={11} fontWeight="700" fill={attr.color} fillOpacity={isHov ? 1 : 0.7}>{score}</text>
            </g>
          );
        })}
        <defs><clipPath id="centerClip"><circle cx={CX} cy={CY} r={CENTER_R - 3} /></clipPath></defs>
        <circle cx={CX} cy={CY} r={CENTER_R} fill="#18181b" stroke="#3f3f46" strokeWidth={2} />
        {playerImg && <image href={playerImg} x={CX - CENTER_R + 3} y={CY - CENTER_R + 3} width={(CENTER_R - 3) * 2} height={(CENTER_R - 3) * 2} clipPath="url(#centerClip)" preserveAspectRatio="xMidYMid slice" />}
      </svg>
      {tooltipAttr && hovered && playerStats && (
        <div style={{ position: 'absolute', left: tooltipPos.x + 12, top: tooltipPos.y - 10, background: '#09090b', border: `1px solid ${ATTRIBUTES.find(a => a.key === tooltipAttr)?.color}40`, borderRadius: 12, padding: '10px 14px', minWidth: 180, zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', pointerEvents: 'none' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: ATTRIBUTES.find(a => a.key === tooltipAttr)?.color, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{ATTRIBUTES.find(a => a.key === tooltipAttr)?.label}</div>
          {getTooltipStats(tooltipAttr, playerStats).map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: '#a1a1aa' }}>{s.label}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#fafafa', fontFamily: 'monospace' }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PercentileBar({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: C.textSub }}>{label}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontFamily: 'monospace', color: C.text }}>{value}</span>
          <span style={{ fontSize: 10, color, fontWeight: 700, width: 32, textAlign: 'right' }}>{pct}th</span>
        </div>
      </div>
      <div style={{ height: 4, background: '#27272a', borderRadius: 99 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

const COL_EXPLANATIONS: Record<string, string> = {
  'Season': 'NBA Season', 'Team': 'Team', 'Age': 'Age', 'GP': 'Games Played',
  'GS': 'Games Started', 'MIN': 'Minutes Per Game', 'FG': 'Field Goals Made',
  'FGA': 'Field Goal Attempts', 'FG%': 'Field Goal Percentage',
  '3P': '3-Pointers Made', '3PA': '3-Point Attempts', '3P%': '3-Point Percentage',
  'FT': 'Free Throws Made', 'FTA': 'Free Throw Attempts', 'FT%': 'Free Throw Percentage',
  'ORB': 'Offensive Rebounds', 'DRB': 'Defensive Rebounds', 'TRB': 'Total Rebounds',
  'AST': 'Assists', 'STL': 'Steals', 'BLK': 'Blocks', 'TOV': 'Turnovers',
  'PF': 'Personal Fouls', 'PTS': 'Points Per Game',
};

const OUTSTANDING_THRESHOLDS: Record<string, { threshold: number; label: string; higherIsBetter: boolean }> = {
  PTS: { threshold: 30, label: '30+ PPG — Elite scoring season', higherIsBetter: true },
  AST: { threshold: 9, label: '9+ APG — Elite playmaking season', higherIsBetter: true },
  REB: { threshold: 12, label: '12+ RPG — Elite rebounding season', higherIsBetter: true },
  STL: { threshold: 2.0, label: '2.0+ SPG — Elite steal season', higherIsBetter: true },
  BLK: { threshold: 2.5, label: '2.5+ BPG — Elite shot-blocking season', higherIsBetter: true },
  FG3M: { threshold: 3.5, label: '3.5+ 3PM — Elite three-point volume', higherIsBetter: true },
  FG_PCT: { threshold: 0.55, label: '55%+ FG% — Historically efficient season', higherIsBetter: true },
  FG3_PCT: { threshold: 0.42, label: '42%+ 3P% — Elite three-point accuracy', higherIsBetter: true },
  FT_PCT: { threshold: 0.90, label: '90%+ FT% — Elite free throw shooter', higherIsBetter: true },
  MIN: { threshold: 37, label: '37+ MPG — Ironman workload', higherIsBetter: true },
};

const colToThreshold: Record<string, string> = {
  PTS: 'PTS', AST: 'AST', REB: 'REB', STL: 'STL', BLK: 'BLK',
  FG3M: 'FG3M', FG_PCT: 'FG_PCT', FG3_PCT: 'FG3_PCT', FT_PCT: 'FT_PCT', MIN: 'MIN',
};

function ColHeader({ label, tip }: { label: string; tip: string }) {
  const [show, setShow] = useState(false);
  return (
    <th style={{ padding: '6px 8px', textAlign: label === 'Season' || label === 'Team' ? 'left' : 'right', color: C.textMuted, fontWeight: 600, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap', position: 'sticky', top: 0, background: C.surface, cursor: 'help' }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {label}
        {show && (
          <div style={{ position: 'absolute', bottom: '130%', left: '50%', transform: 'translateX(-50%)', background: '#09090b', border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 10, color: C.text, fontWeight: 600, whiteSpace: 'nowrap', zIndex: 300, boxShadow: '0 4px 16px rgba(0,0,0,0.8)', pointerEvents: 'none', textTransform: 'none', letterSpacing: 0 }}>
            {tip}
            <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `4px solid ${C.border}` }} />
          </div>
        )}
      </div>
    </th>
  );
}

function CareerTable({ seasons }: { seasons: any[] }) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: string } | null>(null);
  const [hoveredSummary, setHoveredSummary] = useState<{ type: 'avg' | 'high'; col: string } | null>(null);

  const cols = ['SEASON_ID', 'TEAM_ABBREVIATION', 'PLAYER_AGE', 'GP', 'GS', 'MIN', 'FGM', 'FGA', 'FG_PCT', 'FG3M', 'FG3A', 'FG3_PCT', 'FTM', 'FTA', 'FT_PCT', 'OREB', 'DREB', 'REB', 'AST', 'STL', 'BLK', 'TOV', 'PF', 'PTS'];
  const labels = ['Season', 'Team', 'Age', 'GP', 'GS', 'MIN', 'FG', 'FGA', 'FG%', '3P', '3PA', '3P%', 'FT', 'FTA', 'FT%', 'ORB', 'DRB', 'TRB', 'AST', 'STL', 'BLK', 'TOV', 'PF', 'PTS'];

  const fmtPct = (v: any) => v != null && !isNaN(+v) ? `${(+v * 100).toFixed(1)}%` : '—';
  const fmt1 = (v: any) => v != null && !isNaN(+v) ? (+v).toFixed(1) : '—';
  const fmt0 = (v: any) => v != null && !isNaN(+v) ? Math.round(+v).toString() : '—';
  const isText = (i: number) => i < 2;
  const isPct = (col: string) => col.includes('PCT');
  const isInt = (col: string) => ['GP', 'GS', 'PLAYER_AGE'].includes(col);

  // Career highs with season
  const careerHighs: Record<string, { val: number; season: string }> = {};
  cols.forEach((col, ci) => {
    if (isText(ci)) return;
    let best = -Infinity; let bestSeason = '';
    seasons.forEach(row => {
      const v = +row[col];
      if (!isNaN(v) && v > best) { best = v; bestSeason = row.SEASON_ID || ''; }
    });
    if (best > -Infinity) careerHighs[col] = { val: best, season: bestSeason };
  });

  // Career averages weighted by GP
  const careerAvgs: Record<string, number> = {};
  cols.forEach((col, ci) => {
    if (isText(ci)) return;
    if (isPct(col)) {
      const madeCol = col === 'FG_PCT' ? 'FGM' : col === 'FG3_PCT' ? 'FG3M' : col === 'FT_PCT' ? 'FTM' : null;
      const attCol = col === 'FG_PCT' ? 'FGA' : col === 'FG3_PCT' ? 'FG3A' : col === 'FT_PCT' ? 'FTA' : null;
      if (madeCol && attCol) {
        let totalMade = 0, totalAtt = 0;
        seasons.forEach(row => {
          const gp = +row.GP || 0;
          totalMade += (+row[madeCol] || 0) * gp;
          totalAtt += (+row[attCol] || 0) * gp;
        });
        careerAvgs[col] = totalAtt > 0 ? totalMade / totalAtt : 0;
      }
    } else {
      let totalW = 0, totalGP = 0;
      seasons.forEach(row => {
        const gp = +row.GP || 0;
        const v = +row[col];
        if (!isNaN(v)) { totalW += v * gp; totalGP += gp; }
      });
      careerAvgs[col] = totalGP > 0 ? totalW / totalGP : 0;
    }
  });

  const fmtVal = (col: string, ci: number, val: number) => {
    if (isNaN(val) || val === 0) return '—';
    if (isPct(col)) return fmtPct(val);
    if (isInt(col)) return fmt0(val);
    return fmt1(val);
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 8, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <span>Hover column headers for full names</span>
        <span style={{ color: C.amber }}>■ Gold = Career high in that stat</span>
        <span style={{ color: '#ef4444' }}>■ Red = Outstanding / historically elite</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr>{labels.map((l, i) => <ColHeader key={i} label={l} tip={COL_EXPLANATIONS[l] || l} />)}</tr>
        </thead>
        <tbody>
          {seasons.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: `1px solid #1f1f23` }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1f1f23')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              {cols.map((col, ci) => {
                const val = row[col];
                const numVal = +val;
                let display = '—';
                if (isPct(col)) display = fmtPct(val);
                else if (isText(ci)) display = val ?? '—';
                else if (isInt(col)) display = fmt0(val);
                else display = fmt1(val);
                const isCareerHigh = !isText(ci) && !isNaN(numVal) && careerHighs[col] !== undefined && numVal === careerHighs[col].val && numVal > 0;
                const thresh = colToThreshold[col] ? OUTSTANDING_THRESHOLDS[colToThreshold[col]] : null;
                const isOutstanding = thresh && !isNaN(numVal) && (thresh.higherIsBetter ? numVal >= thresh.threshold : numVal <= thresh.threshold);
                const isHovered = hoveredCell?.row === ri && hoveredCell?.col === col;
                return (
                  <td key={ci}
                    style={{ padding: '6px 8px', textAlign: isText(ci) ? 'left' : 'right', color: isText(ci) ? C.textSub : isOutstanding ? '#ef4444' : isCareerHigh ? C.amber : C.text, fontFamily: isText(ci) ? 'inherit' : 'monospace', fontSize: 11, whiteSpace: 'nowrap', fontWeight: isCareerHigh || isOutstanding ? 800 : 400, position: 'relative', cursor: isOutstanding ? 'help' : 'default' }}
                    onMouseEnter={() => isOutstanding && setHoveredCell({ row: ri, col })}
                    onMouseLeave={() => setHoveredCell(null)}>
                    {display}
                    {isOutstanding && isHovered && (
                      <div style={{ position: 'absolute', bottom: '120%', right: 0, background: '#09090b', border: '1px solid #ef4444', borderRadius: 8, padding: '6px 10px', fontSize: 10, color: '#fafafa', whiteSpace: 'nowrap', zIndex: 300, boxShadow: '0 4px 16px rgba(0,0,0,0.8)', pointerEvents: 'none', minWidth: 180, textAlign: 'left' }}>
                        <div style={{ color: '#ef4444', fontWeight: 700, marginBottom: 3 }}>Outstanding</div>
                        {thresh?.label}
                        <div style={{ position: 'absolute', top: '100%', right: 12, width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid #ef4444' }} />
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Spacer */}
          <tr><td colSpan={cols.length} style={{ height: 8, background: 'transparent' }} /></tr>

          {/* Career Averages Row */}
          <tr style={{ background: 'rgba(249,115,22,0.08)', borderTop: `2px solid ${C.orange}` }}>
            {cols.map((col, ci) => {
              if (ci === 0) return <td key={ci} style={{ padding: '8px 8px', textAlign: 'left', color: C.orange, fontWeight: 800, fontSize: 11, whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>CAREER AVG</td>;
              if (ci === 1) return <td key={ci} style={{ padding: '8px 8px' }} />;
              const val = careerAvgs[col];
              return (
                <td key={ci} style={{ padding: '8px 8px', textAlign: 'right', color: C.orange, fontFamily: 'monospace', fontSize: 11, whiteSpace: 'nowrap', fontWeight: 700 }}>
                  {fmtVal(col, ci, val)}
                </td>
              );
            })}
          </tr>

          {/* Career Highs Row */}
          <tr style={{ background: 'rgba(251,191,36,0.08)', borderTop: `1px solid rgba(251,191,36,0.3)` }}>
            {cols.map((col, ci) => {
              const high = careerHighs[col];
              const isHov = hoveredSummary?.type === 'high' && hoveredSummary?.col === col;
              if (ci === 0) return <td key={ci} style={{ padding: '8px 8px', textAlign: 'left', color: C.amber, fontWeight: 800, fontSize: 11, whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>CAREER HIGH</td>;
              if (ci === 1) return <td key={ci} style={{ padding: '8px 8px' }} />;
              if (!high) return <td key={ci} style={{ padding: '8px 8px', textAlign: 'right', color: C.textMuted, fontFamily: 'monospace', fontSize: 11 }}>—</td>;
              return (
                <td key={ci}
                  style={{ padding: '8px 8px', textAlign: 'right', color: C.amber, fontFamily: 'monospace', fontSize: 11, whiteSpace: 'nowrap', fontWeight: 800, position: 'relative', cursor: 'help' }}
                  onMouseEnter={() => setHoveredSummary({ type: 'high', col })}
                  onMouseLeave={() => setHoveredSummary(null)}>
                  {fmtVal(col, ci, high.val)}
                  {isHov && high.season && (
                    <div style={{ position: 'absolute', bottom: '130%', right: 0, background: '#09090b', border: `1px solid ${C.amber}`, borderRadius: 8, padding: '6px 10px', fontSize: 10, color: C.text, whiteSpace: 'nowrap', zIndex: 300, boxShadow: '0 4px 16px rgba(0,0,0,0.8)', pointerEvents: 'none', textAlign: 'left' }}>
                      <div style={{ color: C.amber, fontWeight: 700, marginBottom: 2 }}>Career High</div>
                      <div style={{ color: C.textSub }}>Season: <span style={{ color: C.text, fontWeight: 700 }}>{high.season}</span></div>
                      <div style={{ position: 'absolute', top: '100%', right: 12, width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `4px solid ${C.amber}` }} />
                    </div>
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function AccoladesTab({ playerId, awards }: {
  playerId: string; awards: any[];
}) {
  const honorGroups: Record<string, { color: string; label: string; years: string[] }> = {};
  const addHonor = (key: string, color: string, label: string, season: string) => {
    if (!honorGroups[key]) honorGroups[key] = { color, label, years: [] };
    if (season && !honorGroups[key].years.includes(season)) honorGroups[key].years.push(season);
  };

  awards.forEach(a => {
    const desc = a.DESCRIPTION || '';
    const season = a.SEASON || '';
    const teamNum = +a.ALL_NBA_TEAM_NUMBER;
    if (desc.includes('NBA Most Valuable Player') && !desc.includes('Finals')) addHonor('mvp', 'var(--gold)', 'MVP', season);
    else if (desc.includes('NBA Finals Most Valuable Player')) addHonor('finalsmvp', 'var(--gold)', 'Finals MVP', season);
    else if (desc.includes('Conference Finals Most Valuable Player')) addHonor('cfmvp', 'var(--cool)', 'CF MVP', season);
    else if (desc.includes('NBA Defensive Player of the Year')) addHonor('dpoy', 'var(--gold)', 'DPOY', season);
    else if (desc.includes('NBA Rookie of the Year')) addHonor('roy', 'var(--cool)', 'ROY', season);
    else if (desc.includes('NBA Most Improved Player')) addHonor('mip', 'var(--cool)', 'MIP', season);
    else if (desc.includes('NBA Sixth Man')) addHonor('6moy', 'var(--heat)', '6MOY', season);
    else if (desc.includes('NBA Champion')) addHonor('champ', 'var(--gold)', 'Champion', season);
    else if (desc.includes('NBA Scoring Champion')) addHonor('scoring', 'var(--heat)', 'Scoring Champ', season);
    else if (desc.includes('All-NBA') && !desc.includes('All-Defensive') && teamNum === 1) addHonor('allnba1', 'var(--gold)', 'All-NBA 1st Team', season);
    else if (desc.includes('All-NBA') && !desc.includes('All-Defensive') && teamNum === 2) addHonor('allnba2', 'var(--chalk-2)', 'All-NBA 2nd Team', season);
    else if (desc.includes('All-NBA') && !desc.includes('All-Defensive') && teamNum === 3) addHonor('allnba3', 'var(--chalk-2)', 'All-NBA 3rd Team', season);
    else if (desc.includes('All-Defensive') && teamNum === 1) addHonor('alldef1', 'var(--gold)', 'All-Def 1st Team', season);
    else if (desc.includes('All-Defensive') && teamNum === 2) addHonor('alldef2', 'var(--gold)', 'All-Def 2nd Team', season);
    else if (desc.includes('All-Star') && !desc.includes('MVP') && !desc.includes('Defensive')) addHonor('allstar', 'var(--cool)', 'All-Star', season);
    else if (desc.includes('All-Rookie') && teamNum === 1) addHonor('allrook1', 'var(--cool)', 'All-Rookie 1st', season);
    else if (desc.includes('All-Rookie') && teamNum === 2) addHonor('allrook2', 'var(--cool)', 'All-Rookie 2nd', season);
    else if (desc.includes('Player of the Month') && !desc.includes('Defensive')) addHonor('potm', 'var(--heat)', 'POTM', season);
    else if (desc.includes('Defensive Player of the Month')) addHonor('dpotm', 'var(--gold)', 'DPOTM', season);
    else if (desc.includes('Player of the Week') && !desc.includes('Defensive')) addHonor('potw', 'var(--cool)', 'POTW', season);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {Object.keys(honorGroups).length > 0 && (
        <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textMuted, marginBottom: 16 }}>League Honors -- Hover any badge for years</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {Object.values(honorGroups).sort((a, b) => b.years.length - a.years.length).map((h, i) => (
              <HonorBadge key={i} label={h.label} color={h.color} years={h.years} />
            ))}
          </div>
        </div>
      )}
      {Object.keys(honorGroups).length === 0 && (
        <div style={{ background: C.surface, borderRadius: 20, padding: 40, border: `1px solid ${C.border}`, textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.textMuted, marginBottom: 12 }}>No Data</div>
          <p style={{ color: C.textMuted, fontSize: 13 }}>No accolade data available for this player.</p>
        </div>
      )}
    </div>
  );
}

export default function PlayerProfile() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const playerId = slug || '';
  const onBack = () => navigate(-1);
  const [bio, setBio] = useState<any>(null);

  // Derive display name and team from bio once loaded
  const playerName = bio?.DISPLAY_FIRST_LAST || bio?.PLAYER_NAME || '';
  const team = bio?.TEAM_NAME || bio?.TEAM_CITY ? `${bio.TEAM_CITY || ''} ${bio.TEAM_NAME || ''}`.trim() : '';
  const [career, setCareer] = useState<any[]>([]);
  const [currentStats, setCurrentStats] = useState<any>(null);
  const [splitsStats, setSplitsStats] = useState<any>(null);
  const [awards, setAwards] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'career' | 'accolades'>('overview');

  const playerImg = `https://cdn.nba.com/headshots/nba/latest/1040x760/${playerId}.png`;

  useEffect(() => {
    window.scrollTo(0, 0);
    async function load() {
      setLoading(true);
      try {
        // Fetch pool data once — all-players endpoint handles all stat types
        const poolPromise = fetch(`${PROXY}/all-players`).then(r => r.json());
        const [infoRes, careerRes, tradRes, advRes, hustleRes, drivesRes, catchRes, pullupRes, rebRes, passRes, defRes, splitsRes, awardsRes] = await Promise.allSettled([
          fetch(`${PROXY}/player-info/${playerId}`).then(r => r.json()),
          fetch(`${PROXY}/player-career/${playerId}`).then(r => r.json()),
          poolPromise, // traditional
          poolPromise, // advanced
          poolPromise, // hustle
          poolPromise, // drives/tracking
          poolPromise, // catchshoot
          poolPromise, // pullup
          poolPromise, // rebounding
          poolPromise, // passing
          poolPromise, // defense
          fetch(`${PROXY}/player-splits/${playerId}`).then(r => r.json()),
          fetch(`${PROXY}/player-awards/${playerId}`).then(r => r.json()),
        ]);

        if (infoRes.status === 'fulfilled') {
          const { rows } = parseResultSet(infoRes.value, 'CommonPlayerInfo');
          if (rows[0]) setBio(rows[0]);
        }
        if (careerRes.status === 'fulfilled') {
          const { rows } = parseResultSet(careerRes.value, 'SeasonTotalsRegularSeason');
          setCareer(rows.reverse());
        }
        if (awardsRes.status === 'fulfilled') {
          const { rows } = parseResultSet(awardsRes.value, 'PlayerAwards');
          setAwards(rows);
        }
        if (splitsRes.status === 'fulfilled') {
          const { rows } = parseResultSet(splitsRes.value, 'OverallPlayerDashboard');
          if (rows[0]) setSplitsStats(rows[0]);
        }

        const playerKey = +playerId;
        const merge: any = {};
        function extract(res: PromiseSettledResult<any>) {
          if (res.status !== 'fulfilled') return [];
          const { rows } = parseResultSet(res.value);
          const me = rows.find((r: any) => +r.PLAYER_ID === playerKey || r.PLAYER_NAME === playerName);
          if (me) Object.assign(merge, me);
          return rows;
        }

        const tradRows = extract(tradRes);
        const advRows = extract(advRes);
        const hustleRows = extract(hustleRes);
        const drivesRows = extract(drivesRes);
        extract(catchRes); extract(pullupRes); extract(rebRes); extract(passRes); extract(defRes);

        const qualified = tradRows.filter((r: any) => +r.MIN * +r.GP >= 750);
        const qualifiedIds = new Set(qualified.map((r: any) => +r.PLAYER_ID));
        setCurrentStats(merge);

        const pool = (rows: any[], key: string) => rows.filter((r: any) => qualifiedIds.has(+r.PLAYER_ID)).map((r: any) => +r[key]).filter(v => !isNaN(v));
        const p = (rows: any[], key: string, val: any, higherBetter = true) => percentile(+val, pool(rows, key), higherBetter);

        const scoring = Math.round(p(advRows, 'TS_PCT', merge.TS_PCT) * 0.30 + p(advRows, 'EFG_PCT', merge.EFG_PCT) * 0.20 + p(advRows, 'OFF_RATING', merge.OFF_RATING) * 0.25 + p(advRows, 'PIE', merge.PIE) * 0.25);
        const playmaking = Math.round(p(advRows, 'AST_PCT', merge.AST_PCT) * 0.35 + p(advRows, 'AST_TO', merge.AST_TO) * 0.30 + p(passRes.status === 'fulfilled' ? parseResultSet(passRes.value).rows : [], 'POTENTIAL_AST', merge.POTENTIAL_AST) * 0.20 + p(advRows, 'AST_RATIO', merge.AST_RATIO) * 0.15);
        const threePoint = Math.round(p(tradRows, 'FG3_PCT', merge.FG3_PCT) * 0.40 + p(catchRes.status === 'fulfilled' ? parseResultSet(catchRes.value).rows : [], 'CATCH_SHOOT_PCT', merge.CATCH_SHOOT_PCT) * 0.30 + p(tradRows, 'FG3A', merge.FG3A) * 0.15 + p(advRows, 'FG3A_RATE', merge.FG3A_RATE) * 0.15);
        const rimFinish = Math.round(p(drivesRows, 'DRIVE_FG_PCT', merge.DRIVE_FG_PCT) * 0.35 + p(drivesRows, 'DRIVES', merge.DRIVES) * 0.25 + p(tradRows, 'FG_PCT', merge.FG_PCT) * 0.25 + p(drivesRows, 'PAINT_TOUCHES', merge.PAINT_TOUCHES) * 0.15);
        const midrange = Math.round(p(pullupRes.status === 'fulfilled' ? parseResultSet(pullupRes.value).rows : [], 'PULL_UP_FG_PCT', merge.PULL_UP_FG_PCT) * 0.40 + p(tradRows, 'FG_PCT', merge.FG_PCT) * 0.35 + p(advRows, 'USG_PCT', merge.USG_PCT) * 0.25);
        const creation = Math.round(p(advRows, 'USG_PCT', merge.USG_PCT) * 0.35 + p(advRows, 'AST_PCT', merge.AST_PCT) * 0.25 + p(drivesRows, 'DRIVES', merge.DRIVES) * 0.25 + p(advRows, 'PIE', merge.PIE) * 0.15);
        const defense = Math.round(p(advRows, 'STL_PCT', merge.STL_PCT) * 0.25 + p(advRows, 'BLK_PCT', merge.BLK_PCT) * 0.25 + p(advRows, 'DEF_RATING', merge.DEF_RATING, false) * 0.30 + p(hustleRows, 'DEFLECTIONS', merge.DEFLECTIONS) * 0.10 + p(hustleRows, 'CONTESTED_SHOTS', merge.CONTESTED_SHOTS) * 0.10);
        const rebounding = Math.round(p(advRows, 'OREB_PCT', merge.OREB_PCT) * 0.25 + p(advRows, 'DREB_PCT', merge.DREB_PCT) * 0.30 + p(advRows, 'REB_PCT', merge.REB_PCT) * 0.25 + p(tradRows, 'REB', merge.REB) * 0.20);
        const intangibles = Math.round(p(advRows, 'NET_RATING', merge.NET_RATING) * 0.25 + p(advRows, 'PIE', merge.PIE) * 0.30 + p(tradRows, 'PLUS_MINUS', merge.PLUS_MINUS) * 0.25 + p(advRows, 'USG_PCT', merge.USG_PCT) * 0.20);

        setScores({
          scoring: Math.min(99, Math.max(1, scoring)),
          playmaking: Math.min(99, Math.max(1, playmaking)),
          threePoint: Math.min(99, Math.max(1, threePoint)),
          rimFinish: Math.min(99, Math.max(1, rimFinish)),
          midrange: Math.min(99, Math.max(1, midrange)),
          creation: Math.min(99, Math.max(1, creation)),
          defense: Math.min(99, Math.max(1, defense)),
          rebounding: Math.min(99, Math.max(1, rebounding)),
          intangibles: Math.min(99, Math.max(1, intangibles)),
        });
      } catch (e) { console.error('Profile load error:', e); }
      setLoading(false);
    }
    load();
  }, [playerId]);

  const overall = Object.keys(scores).length > 0 ? Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length) : 0;
  const fmtPct = (v: any) => v != null && !isNaN(+v) ? `${(+v * 100).toFixed(1)}%` : '—';
  const fmt1 = (v: any) => v != null && !isNaN(+v) ? (+v).toFixed(1) : '—';
  const displayStats = { ...currentStats, OFF_RATING: splitsStats?.OFF_RATING ?? currentStats?.OFF_RATING, DEF_RATING: splitsStats?.DEF_RATING ?? currentStats?.DEF_RATING, NET_RATING: splitsStats?.NET_RATING ?? currentStats?.NET_RATING };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "var(--font-body, 'DM Sans','Segoe UI',system-ui,sans-serif)" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}*{box-sizing:border-box;margin:0;padding:0}`}</style>

      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(9,9,11,0.95)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}`, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onBack} style={{ background: C.surfaceHi, border: 'none', borderRadius: 8, padding: '6px 14px', color: C.textSub, cursor: 'pointer', fontSize: 13 }}>← Back</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="LeHoopIQ" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover' }} />
          <span style={{ fontSize: 16, fontWeight: 700 }}>LeHoopIQ</span>
        </div>
        <span style={{ color: C.textMuted, fontSize: 13 }}>/ Player Profile /</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{playerName}</span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${C.border}`, borderTopColor: C.orange, animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: C.textMuted, fontSize: 14 }}>Loading {playerName}'s profile...</p>
        </div>
      ) : (
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 24px', animation: 'fadeIn 0.4s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, marginBottom: 24, background: C.surface, borderRadius: 20, padding: 28, border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img src={playerImg} alt={playerName} style={{ width: 140, height: 140, borderRadius: 16, objectFit: 'cover', objectPosition: 'top', background: C.surfaceHi, border: `2px solid ${C.border}` }}
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://cdn.nba.com/headshots/nba/latest/260x190/${playerId}.png`; }} />
                <div style={{ position: 'absolute', bottom: -12, right: -12, width: 44, height: 44, borderRadius: '50%', background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `3px solid ${C.bg}` }}>
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-display)' }}>{overall}</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 4, fontFamily: 'var(--font-display)' }}>{playerName}</div>
                <div style={{ fontSize: 15, color: C.orange, fontWeight: 600, marginBottom: 12 }}>{team}</div>
                {bio && (
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Position', value: bio.POSITION },
                      { label: 'Height', value: bio.HEIGHT },
                      { label: 'Weight', value: bio.WEIGHT ? `${bio.WEIGHT} lbs` : null },
                      { label: 'Age', value: bio.BIRTHDATE ? `${new Date().getFullYear() - new Date(bio.BIRTHDATE).getFullYear()}` : null },
                      { label: 'College', value: bio.SCHOOL || null },
                      { label: 'Draft', value: bio.DRAFT_YEAR ? `${bio.DRAFT_YEAR} R${bio.DRAFT_ROUND} #${bio.DRAFT_NUMBER}` : null },
                      { label: 'Experience', value: bio.SEASON_EXP ? `${bio.SEASON_EXP} years` : null },
                      { label: 'Country', value: bio.COUNTRY },
                    ].filter(i => i.value).map((item, i) => (
                      <div key={i}>
                        <div style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>{item.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {currentStats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, alignContent: 'start' }}>
                {[
                  { label: 'PPG', value: fmt1(currentStats.PTS) },
                  { label: 'RPG', value: fmt1(currentStats.REB) },
                  { label: 'APG', value: fmt1(currentStats.AST) },
                  { label: 'TS%', value: fmtPct(currentStats.TS_PCT) },
                  { label: 'STL', value: fmt1(currentStats.STL) },
                  { label: 'BLK', value: fmt1(currentStats.BLK) },
                  { label: 'FG%', value: fmtPct(currentStats.FG_PCT) },
                  { label: '3P%', value: fmtPct(currentStats.FG3_PCT) },
                ].map((s, i) => (
                  <div key={i} style={{ background: C.surfaceHi, borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.orange, fontFamily: 'var(--font-display)' }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 4, marginBottom: 24, padding: 4, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, width: 'fit-content' }}>
            {(['overview', 'career', 'accolades'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: activeTab === tab ? C.orange : 'transparent', color: activeTab === tab ? '#fff' : C.textMuted }}>
                {tab === 'overview' ? 'Attribute Diagram' : tab === 'career' ? 'Career Stats' : 'Accolades'}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '500px 1fr', gap: 24 }}>
              <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textMuted, marginBottom: 16 }}>Player Attributes · {getCurrentSeasonLabel()} Season</div>
                <AttributeDiagram scores={scores} playerName={playerName} playerImg={playerImg} playerStats={currentStats || {}} />
                <p style={{ fontSize: 10, color: C.textMuted, textAlign: 'center', marginTop: 8 }}>Hover over each segment to see individual stats · Based on percentile vs all qualified players (750+ min)</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textMuted, marginBottom: 16 }}>Percentile Rankings</div>
                  {ATTRIBUTES.map(attr => <PercentileBar key={attr.key} label={attr.label} value={`${scores[attr.key] ?? 0}`} pct={scores[attr.key] ?? 0} color={attr.color} />)}
                </div>
                {displayStats && (
                  <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textMuted, marginBottom: 16 }}>Advanced Stats · {getCurrentSeasonLabel()} <span style={{ fontSize: 9, fontWeight: 400 }}>· Hover ⓘ for explanations</span></div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      {[
                        { label: 'Off Rating', value: fmt1(displayStats.OFF_RATING) },
                        { label: 'Def Rating', value: fmt1(displayStats.DEF_RATING) },
                        { label: 'Net Rating', value: fmt1(displayStats.NET_RATING) },
                        { label: 'USG%', value: fmtPct(displayStats.USG_PCT) },
                        { label: 'AST%', value: fmtPct(displayStats.AST_PCT) },
                        { label: 'REB%', value: fmtPct(displayStats.REB_PCT) },
                        { label: 'STL%', value: fmtPct(displayStats.STL_PCT) },
                        { label: 'BLK%', value: fmtPct(displayStats.BLK_PCT) },
                        { label: 'BPM', value: fmt1(displayStats.BPM) },
                        { label: 'TS%', value: fmtPct(displayStats.TS_PCT) },
                        { label: 'eFG%', value: fmtPct(displayStats.EFG_PCT) },
                        { label: 'VORP', value: fmt1(displayStats.VORP) },
                      ].map((s, i) => <StatCard key={i} label={s.label} value={s.value} />)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'career' && (
            <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textMuted, marginBottom: 16 }}>Year-by-Year Stats</div>
              {career.length > 0 ? <CareerTable seasons={career} /> : <p style={{ color: C.textMuted, fontSize: 13 }}>No career data available</p>}
            </div>
          )}

          {activeTab === 'accolades' && (
            <AccoladesTab playerId={playerId} awards={awards} />
          )}
        </div>
      )}
    </div>
  );
}