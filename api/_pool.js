// Shared nbaapi.com pool fetcher — not exposed as an endpoint (underscore prefix)

async function fetchAllPages(path) {
  let page = 1;
  const allData = [];
  while (true) {
    const r = await fetch(
      `https://api.server.nbaapi.com/api/${path}&page=${page}&pageSize=500`,
      { signal: AbortSignal.timeout(15000) }
    );
    if (!r.ok) throw new Error(`nbaapi ${r.status}`);
    const { data, pagination } = await r.json();
    allData.push(...data);
    if (page >= pagination.pages) break;
    page++;
  }
  return allData;
}

export async function getPool() {
  const [totals, advanced] = await Promise.all([
    fetchAllPages('playertotals?season=2026&sortBy=points&ascending=false'),
    fetchAllPages('playeradvancedstats?season=2026&sortBy=win_shares&ascending=false'),
  ]);

  const advMap = {};
  for (const a of advanced) advMap[a.playerName] = a;

  return totals.map(t => {
    const a = advMap[t.playerName] || {};
    const gp = t.games || 1;
    return {
      PLAYER_ID:        t.playerId,
      PLAYER_NAME:      t.playerName,
      TEAM_ABBREVIATION:t.team,
      GP:               gp,
      MIN:              (t.minutesPg || 0) / gp,
      MIN_TOTAL:        t.minutesPg || 0,
      PTS:              t.points / gp,
      REB:              t.totalRb / gp,
      AST:              t.assists / gp,
      STL:              t.steals / gp,
      BLK:              t.blocks / gp,
      TOV:              t.turnovers / gp,
      PLUS_MINUS:       null,
      FG_PCT:           t.fieldPercent,
      FG3_PCT:          t.threePercent,
      FG3A:             t.threeAttempts / gp,
      FT_PCT:           t.ftPercent,
      OREB:             t.offensiveRb / gp,
      DREB:             t.defensiveRb / gp,
      TS_PCT:           a.tsPercent,
      EFG_PCT:          t.effectFgPercent,
      USG_PCT:          a.usagePercent ? a.usagePercent / 100 : null,
      AST_PCT:          a.assistPercent ? a.assistPercent / 100 : null,
      AST_TO:           t.assists && t.turnovers ? (t.assists / t.turnovers) : null,
      AST_RATIO:        null,
      OREB_PCT:         a.offensiveRBPercent ? a.offensiveRBPercent / 100 : null,
      DREB_PCT:         a.defensiveRBPercent ? a.defensiveRBPercent / 100 : null,
      REB_PCT:          a.totalRBPercent ? a.totalRBPercent / 100 : null,
      STL_PCT:          a.stealPercent ? a.stealPercent / 100 : null,
      BLK_PCT:          a.blockPercent ? a.blockPercent / 100 : null,
      OFF_RATING:       null,
      DEF_RATING:       null,
      NET_RATING:       null,
      PIE:              a.per ? a.per / 100 : null,
      FG3A_RATE:        t.threeAttempts && t.fieldAttempts ? t.threeAttempts / t.fieldAttempts : null,
      BPM:              a.box,
      DBPM:             a.defensiveBox,
      VORP:             a.vorp,
      WIN_SHARES:       a.winShares,
      DRIVES:           null,
      DRIVE_FG_PCT:     null,
      PAINT_TOUCHES:    null,
      CATCH_SHOOT_PCT:  null,
      PULL_UP_FG_PCT:   null,
      POTENTIAL_AST:    null,
      DEFLECTIONS:      null,
      CONTESTED_SHOTS:  null,
      CHARGES_DRAWN:    null,
    };
  });
}

export function poolResponse(rows) {
  const headers = Object.keys(rows[0] || {});
  return {
    resultSets: [{
      name: 'LeagueDashPlayerStats',
      headers,
      rowSet: rows.map(r => headers.map(h => r[h] ?? null)),
    }],
  };
}
