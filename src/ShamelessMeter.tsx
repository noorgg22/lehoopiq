import React, { useState } from 'react';

const C = {
  bg: '#09090b', surface: '#18181b', surfaceHi: '#27272a',
  border: '#27272a', text: '#fafafa', textSub: '#a1a1aa', textMuted: '#52525b',
  orange: '#f97316', orangeDim: 'rgba(249,115,22,0.12)',
  emerald: '#34d399', amber: '#fbbf24', sky: '#38bdf8',
  violet: '#a78bfa', rose: '#fb7185', green: '#4ade80',
  red: '#ef4444', yellow: '#eab308',
};

const TIERS = [
  { id: 'tier1', label: 'Certified Shameless', emoji: '🔴', color: '#ef4444', description: 'No remorse. No conscience. Just buckets... at the free throw line.' },
  { id: 'tier2', label: 'Habitual Offenders', emoji: '🟠', color: '#f97316', description: 'They know what they\'re doing. The refs know. Everyone knows.' },
  { id: 'tier3', label: 'Suspicious Activity', emoji: '🟡', color: '#eab308', description: 'Plausible deniability. But we see you.' },
  { id: 'tier4', label: 'Sneaky Foul Baiters', emoji: '⚪', color: '#a1a1aa', description: 'Occasional offenders. Still not innocent.' },
];

const OFFENSIVE: {
  name: string; team: string; tier: string; playerId: string;
  shamelessScore: number; signature: string; videoFile: string | null;
}[] = [
  { name: 'Joel Embiid',   team: 'PHI', tier: 'tier1', playerId: '203954', shamelessScore: 1000, signature: 'THE BIG PATHETIC DISGRACEFUL FLAILER', videoFile: null },
  { name: 'Shai Gilgeous-Alexander', team: 'OKC', tier: 'tier1', playerId: '1628983', shamelessScore: 100, signature: 'The slow gather, the hop, shoulder bumb, the arm grab', videoFile: 'sga.mp4'
 },
   { name: 'James Harden',  team: 'LAC', tier: 'tier2', playerId: '201935',  shamelessScore: 95, signature: 'MASTER BAITER', videoFile: null },
  { name: 'Jalen Brunson', team: 'NYK', tier: 'tier2', playerId: '1628973', shamelessScore: 93, signature: 'THE BOBBER', videoFile: null },
  { name: 'Trae Young',    team: 'ATL', tier: 'tier2', playerId: '1629027', shamelessScore: 91, signature: 'Backing into defenders on pull-ups', videoFile: null },
  { name: 'Luka Dončić',   team: 'LAL', tier: 'tier2', playerId: '1629029', shamelessScore: 88, signature: 'The hop-step arm hook', videoFile: null },
  { name: 'Giannis Antetokounmpo', team: 'MIL', tier: 'tier2', playerId: '203507', shamelessScore: 85, signature: 'Lowering the shoulder and barreling in', videoFile: null },
  { name: 'Jaylen Brown',  team: 'BOS', tier: 'tier2', playerId: '1627759', shamelessScore: 72, signature: 'The jump-into-the-defender three', videoFile: null },
  { name: 'Donovan Mitchell', team: 'CLE', tier: 'tier3', playerId: '1628378', shamelessScore: 70, signature: 'Leaning into bodies on pull-ups', videoFile: null },
  { name: 'LeBron James',  team: 'LAL', tier: 'tier3', playerId: '2544',    shamelessScore: 65, signature: 'The power dribble into the chest', videoFile: null },
];

const DEFENSIVE: {
  name: string; team: string; tier: string; playerId: string;
  shamelessScore: number; signature: string; videoFile: string | null;
}[] = [
  { name: 'Marcus Smart',     team: 'MEM', tier: 'tier1', playerId: '203935', shamelessScore: 99, signature: 'Falls down if someone breathes near him', videoFile: null },
  { name: 'Draymond Green',   team: 'GSW', tier: 'tier2', playerId: '203110', shamelessScore: 88, signature: 'Takes charges that aren\'t charges', videoFile: null },
  { name: 'Kyle Lowry',       team: 'MIA', tier: 'tier2', playerId: '200768', shamelessScore: 84, signature: 'The pre-emptive flop before contact', videoFile: null },
  { name: 'Alex Caruso',      team: 'OKC', tier: 'tier3', playerId: '1028384', shamelessScore: 73, signature: 'The dramatic charge take on ball handlers', videoFile: null },
  { name: 'Patrick Beverley', team: 'FA',  tier: 'tier3', playerId: '201976', shamelessScore: 70, signature: 'Initiates contact then acts shocked', videoFile: null },
];

function ShamelessCard({ player, onClick }: {
  player: typeof OFFENSIVE[0];
  onClick: (player: typeof OFFENSIVE[0]) => void;
}) {
  const tier = TIERS.find(t => t.id === player.tier)!;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => onClick(player)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
        background: hovered ? C.surfaceHi : 'transparent',
        border: `1px solid ${hovered ? tier.color + '40' : 'transparent'}`,
        transition: 'all 0.15s ease',
      }}
    >
      {/* Player headshot */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img
          src={`https://cdn.nba.com/headshots/nba/latest/260x190/${player.playerId}.png`}
          alt={player.name}
          style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', background: C.surfaceHi, border: `2px solid ${tier.color}40` }}
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
        />
        {/* Shameless score badge */}
        <div style={{
          position: 'absolute', bottom: -4, right: -4,
          width: 22, height: 22, borderRadius: '50%',
          background: tier.color, border: `2px solid ${C.bg}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 900, color: '#fff',
        }}>{player.shamelessScore}</div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{player.name}</span>
          <span style={{ fontSize: 10, color: C.textMuted, fontFamily: 'monospace' }}>{player.team}</span>
          {player.videoFile && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: tier.color + '20', color: tier.color, border: `1px solid ${tier.color}40` }}>
              ▶ WATCH
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, fontStyle: 'italic' }}>"{player.signature}"</div>
      </div>

      {/* Shameless meter bar */}
      <div style={{ width: 120, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Shameless</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: tier.color, fontFamily: 'monospace' }}>{player.shamelessScore}</span>
        </div>
        <div style={{ height: 5, background: C.surfaceHi, borderRadius: 99 }}>
          <div style={{
            height: '100%', width: `${player.shamelessScore}%`,
            background: tier.color, borderRadius: 99,
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>

      {/* Arrow */}
      <span style={{ color: C.textMuted, fontSize: 16, flexShrink: 0 }}>›</span>
    </div>
  );
}

function VideoModal({ player, onClose }: {
  player: typeof OFFENSIVE[0] | null;
  onClose: () => void;
}) {
  if (!player) return null;
  const tier = TIERS.find(t => t.id === player.tier)!;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.surface, borderRadius: 20, padding: 28,
          border: `1px solid ${tier.color}40`,
          maxWidth: 720, width: '100%',
          boxShadow: `0 0 60px ${tier.color}20`,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src={`https://cdn.nba.com/headshots/nba/latest/260x190/${player.playerId}.png`}
              alt={player.name}
              style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', background: C.surfaceHi }}
            />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{player.name}</div>
              <div style={{ fontSize: 12, color: tier.color, fontWeight: 600 }}>{tier.emoji} {tier.label}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: C.surfaceHi, border: 'none', borderRadius: 8, padding: '6px 12px', color: C.textSub, cursor: 'pointer', fontSize: 13 }}
          >✕ Close</button>
        </div>

        {/* Video or placeholder */}
        {player.videoFile ? (
         <video
  src={`/SHAMELESS VIDS/${player.videoFile}`}
  controls
  style={{ width: '100%', borderRadius: 12, background: '#000' }}
/>
        ) : (
          <div style={{
            width: '100%', aspectRatio: '16/9', borderRadius: 12,
            background: C.surfaceHi, border: `2px dashed ${C.border}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 48 }}>🎬</span>
            <span style={{ fontSize: 14, color: C.textMuted }}>Video coming soon...</span>
            <span style={{ fontSize: 12, color: C.textMuted, fontStyle: 'italic' }}>"{player.signature}"</span>
          </div>
        )}

        {/* Signature move */}
        <div style={{ marginTop: 16, padding: '12px 16px', background: C.surfaceHi, borderRadius: 10 }}>
          <span style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Signature Move: </span>
          <span style={{ fontSize: 13, color: C.text, fontStyle: 'italic' }}>"{player.signature}"</span>
        </div>
      </div>
    </div>
  );
}

interface ShamelessMeterProps {
  onBack: () => void;
}

export default function ShamelessMeter({ onBack }: ShamelessMeterProps) {
  const [activeTab, setActiveTab] = useState<'offensive' | 'defensive'>('offensive');
  const [selectedPlayer, setSelectedPlayer] = useState<typeof OFFENSIVE[0] | null>(null);

  const players = activeTab === 'offensive' ? OFFENSIVE : DEFENSIVE;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { font-family: inherit; }
      `}</style>

      {/* TOP BAR */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(9,9,11,0.95)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}`, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onBack} style={{ background: C.surfaceHi, border: 'none', borderRadius: 8, padding: '6px 14px', color: C.textSub, cursor: 'pointer', fontSize: 13 }}>
          ← Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="LeHoopIQ" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover' }} />
          <span style={{ fontSize: 16, fontWeight: 700 }}>LeHoopIQ</span>
        </div>
        <span style={{ color: C.textMuted, fontSize: 13 }}>/ The Shameless Meter</span>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px', animation: 'fadeIn 0.4s ease' }}>

        {/* HERO */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚨</div>
          <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>
            The Shameless Meter
          </h1>
          <p style={{ fontSize: 16, color: C.textSub, maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
            A tribute to the players who have turned foul baiting into an art form.
            Ranked by pure, unfiltered shamelessness. 🎭
          </p>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 32, padding: 4, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, width: 'fit-content', margin: '0 auto 32px' }}>
          <button onClick={() => setActiveTab('offensive')} style={{
            padding: '8px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
            background: activeTab === 'offensive' ? '#ef4444' : 'transparent',
            color: activeTab === 'offensive' ? '#fff' : C.textMuted,
          }}>🏀 Offensive Foul Baiters</button>
          <button onClick={() => setActiveTab('defensive')} style={{
            padding: '8px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
            background: activeTab === 'defensive' ? '#ef4444' : 'transparent',
            color: activeTab === 'defensive' ? '#fff' : C.textMuted,
          }}>🎭 Defensive Floppers</button>
        </div>

        {/* TIERS */}
        {TIERS.map(tier => {
          const tierPlayers = players.filter(p => p.tier === tier.id);
          if (tierPlayers.length === 0) return null;
          return (
            <div key={tier.id} style={{ marginBottom: 32 }}>
              {/* Tier header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
                padding: '10px 16px', borderRadius: 10,
                background: tier.color + '10', border: `1px solid ${tier.color}30`,
              }}>
                <span style={{ fontSize: 20 }}>{tier.emoji}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: tier.color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{tier.label}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, fontStyle: 'italic' }}>{tier.description}</div>
                </div>
              </div>

              {/* Players in tier */}
              <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                {tierPlayers.map((player, i) => (
                  <div key={player.name} style={{ borderBottom: i < tierPlayers.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <ShamelessCard player={player} onClick={setSelectedPlayer} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 40, padding: 24, background: C.surface, borderRadius: 16, border: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.7 }}>
            🎵 This page is dedicated to ethical basketball. Play hard, play fair, play like you actually want to score — not just get fouled.
          </p>
          <p style={{ fontSize: 11, color: C.textMuted, marginTop: 8 }}>
            Ratings are based on FTA rate, foul drawing frequency, and pure vibes.
          </p>
        </div>

      </div>

      {/* VIDEO MODAL */}
      <VideoModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
    </div>
  );
}