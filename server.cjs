const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN ? process.env.ALLOWED_ORIGIN.split(',') : '*',
}));

// ── In-memory cache ───────────────────────────────────────────────────────────
const cache = new Map();
const TTL = {
  live:   5  * 60 * 1000,
  stats:  30 * 60 * 1000,
  league: 60 * 60 * 1000,
  player: 15 * 60 * 1000,
};

async function cached(key, ttl, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < ttl) {
    console.log(`[cache ✓] ${key}`);
    return hit.data;
  }
  console.log(`[fetch  ] ${key}`);
  const data = await fn();
  cache.set(key, { data, ts: Date.now() });
  return data;
}

// ── NBA.com config ────────────────────────────────────────────────────────────
const SEASON = '2025-26';
const NBA_HEADERS = {
  'Host': 'stats.nba.com',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'x-nba-stats-origin': 'stats',
  'x-nba-stats-token': 'true',
  'Connection': 'keep-alive',
  'Referer': 'https://www.nba.com/',
  'Origin': 'https://www.nba.com',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-site',
  'Sec-Ch-Ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"macOS"',
};

const STD = { LeagueID: '00', Season: SEASON, SeasonType: 'Regular Season' };

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function nba(endpoint, params = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await axios.get(`https://stats.nba.com/stats/${endpoint}`, {
        headers: NBA_HEADERS, params, timeout: 30000,
      });
      return r.data;
    } catch (e) {
      if (i < retries - 1) {
        console.log(`Retry ${i + 1} for ${endpoint}...`);
        await sleep(2000 * (i + 1));
      } else {
        throw e;
      }
    }
  }
}

// ── nbaapi.com fetcher ────────────────────────────────────────────────────────
async function fetchAllPages(path) {
  let page = 1;
  let allData = [];
  while (true) {
    const r = await axios.get(`https://api.server.nbaapi.com/api/${path}&page=${page}&pageSize=500`, { timeout: 15000 });
    const { data, pagination } = r.data;
    allData = allData.concat(data);
    if (page >= pagination.pages) break;
    page++;
  }
  return allData;
}

// ── Build merged pool ─────────────────────────────────────────────────────────
function buildMergedPool(totals, advanced) {
  const advMap = {};
  for (const a of advanced) {
    advMap[a.playerName] = a;
  }
  return totals.map(t => {
    const a = advMap[t.playerName] || {};
    const gp = t.games || 1;
    return {
      PLAYER_ID: t.playerId,
      PLAYER_NAME: t.playerName,
      TEAM_ABBREVIATION: t.team,
      GP: gp,
      MIN: t.minutesPg,
      MIN_TOTAL: (t.minutesPg || 0) * gp,
      PTS: t.points / gp,
      REB: t.totalRb / gp,
      AST: t.assists / gp,
      STL: t.steals / gp,
      BLK: t.blocks / gp,
      TOV: t.turnovers / gp,
      PLUS_MINUS: null,
      FG_PCT: t.fieldPercent,
      FG3_PCT: t.threePercent,
      FG3A: t.threeAttempts / gp,
      FT_PCT: t.ftPercent,
      OREB: t.offensiveRb / gp,
      DREB: t.defensiveRb / gp,
      TS_PCT: a.tsPercent,
      EFG_PCT: t.effectFgPercent,
      USG_PCT: a.usagePercent ? a.usagePercent / 100 : null,
      AST_PCT: a.assistPercent ? a.assistPercent / 100 : null,
      AST_TO: t.assists && t.turnovers ? (t.assists / t.turnovers) : null,
      AST_RATIO: null,
      OREB_PCT: a.offensiveRBPercent ? a.offensiveRBPercent / 100 : null,
      DREB_PCT: a.defensiveRBPercent ? a.defensiveRBPercent / 100 : null,
      REB_PCT: a.totalRBPercent ? a.totalRBPercent / 100 : null,
      STL_PCT: a.stealPercent ? a.stealPercent / 100 : null,
      BLK_PCT: a.blockPercent ? a.blockPercent / 100 : null,
      OFF_RATING: null,
      DEF_RATING: null,
      NET_RATING: null,
      PIE: a.per ? a.per / 100 : null,
      FG3A_RATE: t.threeAttempts && t.fieldAttempts ? t.threeAttempts / t.fieldAttempts : null,
      BPM: a.box,
      DBPM: a.defensiveBox,
      VORP: a.vorp,
      WIN_SHARES: a.winShares,
      DRIVES: null,
      DRIVE_FG_PCT: null,
      PAINT_TOUCHES: null,
      CATCH_SHOOT_PCT: null,
      PULL_UP_FG_PCT: null,
      POTENTIAL_AST: null,
      DEFLECTIONS: null,
      CONTESTED_SHOTS: null,
      CHARGES_DRAWN: null,
    };
  });
}

// ── Get pool ──────────────────────────────────────────────────────────────────
async function getPool() {
  return cached('pool_merged', TTL.league, async () => {
    console.log('[pool] Fetching totals from nbaapi.com...');
    const totals = await fetchAllPages('playertotals?season=2026&sortBy=points&ascending=false');
    console.log(`[pool] Got ${totals.length} totals rows`);
    console.log('[pool] Fetching advanced from nbaapi.com...');
    const advanced = await fetchAllPages('playeradvancedstats?season=2026&sortBy=win_shares&ascending=false');
    console.log(`[pool] Got ${advanced.length} advanced rows`);
    const merged = buildMergedPool(totals, advanced);
    console.log(`[pool] Merged ${merged.length} players`);
    return merged;
  });
}

function poolResponse(rows) {
  const headers = Object.keys(rows[0] || {});
  return {
    resultSets: [{
      name: 'LeagueDashPlayerStats',
      headers,
      rowSet: rows.map(r => headers.map(h => r[h] ?? null)),
    }]
  };
}

// ── HOME PAGE ─────────────────────────────────────────────────────────────────

// Leaders: built from our nbaapi.com pool (works from Railway)
app.get('/api/leaders', async (req, res) => {
  try {
    const { stat = 'PTS' } = req.query;
    const STAT_MAP = {
      PTS: 'PTS', REB: 'REB', AST: 'AST', STL: 'STL', BLK: 'BLK',
    };
    const field = STAT_MAP[stat] || 'PTS';
    const pool = await getPool();
    const sorted = [...pool]
      .filter(p => p[field] != null)
      .sort((a, b) => b[field] - a[field])
      .slice(0, 15);
    const headers = ['PLAYER_ID', 'PLAYER', 'TEAM', 'GP', field];
    res.json({
      resultSets: [{
        name: 'LeagueLeaders',
        headers,
        rowSet: sorted.map(p => [p.PLAYER_ID, p.PLAYER_NAME, p.TEAM_ABBREVIATION, p.GP, p[field]]),
      }]
    });
  } catch (e) { console.error('leaders:', e.message); res.status(500).json({ error: e.message }); }
});

// Standings: ESPN API (works from Railway, no IP blocking)
const ESPN_ABBR_TO_NBA_ID = {
  'ATL':'1610612737','BOS':'1610612738','BKN':'1610612751','CHA':'1610612766',
  'CHI':'1610612741','CLE':'1610612739','DAL':'1610612742','DEN':'1610612743',
  'DET':'1610612765','GSW':'1610612744','HOU':'1610612745','IND':'1610612754',
  'LAC':'1610612746','LAL':'1610612747','MEM':'1610612763','MIA':'1610612748',
  'MIL':'1610612749','MIN':'1610612750','NOP':'1610612740','NYK':'1610612752',
  'OKC':'1610612760','ORL':'1610612753','PHI':'1610612755','PHX':'1610612756',
  'POR':'1610612757','SAC':'1610612758','SAS':'1610612759','TOR':'1610612761',
  'UTA':'1610612762','WAS':'1610612764',
};
app.get('/api/standings', async (req, res) => {
  try {
    const data = await cached('standings', TTL.stats, async () => {
      const r = await axios.get(
        'https://site.web.api.espn.com/apis/v2/sports/basketball/nba/standings?level=3&sort=gamesbehind%3Aasc%2Cwins%3Adesc%2Closses%3Aasc&type=0&seasontype=2',
        { timeout: 10000 }
      );
      const rows = [];
      // ESPN structure: root.children = conferences → conf.children = divisions → div.standings.entries = teams
      for (const conf of (r.data.children || [])) {
        const confName = conf.name?.includes('East') ? 'East' : 'West';
        for (const division of (conf.children || [])) {
          for (const entry of (division.standings?.entries || [])) {
            const team = entry.team;
            const abbr = team.abbreviation;
            const nbaId = ESPN_ABBR_TO_NBA_ID[abbr] || team.id;
            const stats = {};
            for (const s of (entry.stats || [])) { stats[s.name] = s.get ? s.get('value') : s.value; }
            const winPct = stats.winPercent || 0;
            const losses = Math.round(stats.losses || 0);
            // ESPN doesn't expose wins directly — derive it
            const wins = winPct < 1 ? Math.round(losses * winPct / (1 - winPct)) : losses;
            const seed = Math.round(stats.playoffSeed || 0);
            const parts = (team.displayName || '').split(' ');
            const teamName = parts.slice(-1)[0];
            const teamCity = parts.slice(0, -1).join(' ');
            rows.push([nbaId, teamCity, teamName, wins, losses, winPct.toFixed(3), confName, abbr, seed]);
          }
        }
      }
      // Sort by conference then seed
      rows.sort((a, b) => a[6].localeCompare(b[6]) || a[8] - b[8]);
      return {
        resultSets: [{
          name: 'Standings',
          headers: ['TeamID','TeamCity','TeamName','WINS','LOSSES','WinPCT','Conference','TeamAbbreviation','PlayoffRank'],
          rowSet: rows,
        }]
      };
    });
    res.json(data);
  } catch (e) { console.error('standings:', e.message); res.status(500).json({ error: e.message }); }
});

// Scoreboard: ESPN API (works from Railway)
app.get('/api/scoreboard', async (req, res) => {
  try {
    const data = await cached('scoreboard', TTL.live, async () => {
      const r = await axios.get(
        'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
        { timeout: 10000 }
      );
      return r.data;
    });
    res.json(data);
  } catch (e) { console.error('scoreboard:', e.message); res.status(500).json({ error: e.message }); }
});

app.get('/api/news', async (req, res) => {
  try {
    const data = await cached('news', TTL.live, async () => {
      const r = await axios.get('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news?limit=8', { timeout: 10000 });
      return r.data;
    });
    res.json(data);
  } catch (e) { console.error('news:', e.message); res.status(500).json({ error: e.message }); }
});

// ── PLAYER PROFILE — individual data ─────────────────────────────────────────

app.get('/api/player-info/:id', async (req, res) => {
  try {
    const data = await cached(`pinfo_${req.params.id}`, TTL.player, () =>
      nba('commonplayerinfo', { PlayerID: req.params.id })
    );
    res.json(data);
  } catch (e) { console.error('player-info:', e.message); res.status(500).json({ error: e.message }); }
});

app.get('/api/player-career/:id', async (req, res) => {
  try {
    const data = await cached(`pcareer_${req.params.id}`, TTL.player, () =>
      nba('playercareerstats', { PlayerID: req.params.id, PerMode: 'PerGame' })
    );
    res.json(data);
  } catch (e) { console.error('player-career:', e.message); res.status(500).json({ error: e.message }); }
});

app.get('/api/player-splits/:id', async (req, res) => {
  try {
    const data = await cached(`psplits_${req.params.id}`, TTL.player, () =>
      nba('playerdashboardbygeneralsplits', {
        PlayerID: req.params.id,
        Season: SEASON,
        SeasonType: 'Regular Season',
        PerMode: 'PerGame',
        MeasureType: 'Advanced',
        PaceAdjust: 'N',
        PlusMinus: 'N',
        Rank: 'N',
        LeagueID: '00',
      })
    );
    res.json(data);
  } catch (e) { console.error('player-splits:', e.message); res.status(500).json({ error: e.message }); }
});

app.get('/api/player-awards/:id', async (req, res) => {
  try {
    const data = await cached(`pawards_${req.params.id}`, TTL.player, () =>
      nba('playerawards', { PlayerID: req.params.id })
    );
    res.json(data);
  } catch (e) { console.error('player-awards:', e.message); res.status(500).json({ error: e.message }); }
});

app.get('/api/team-roster/:teamId', async (req, res) => {
  try {
    // Use stats.nba.com commonteamroster — this returns real NBA.com player IDs
    // that match the headshot CDN (cdn.nba.com/headshots/nba/latest/...)
    const data = await cached(`roster_${req.params.teamId}`, TTL.stats, () =>
      nba('commonteamroster', {
        TeamID: req.params.teamId,
        Season: SEASON,
        LeagueID: '00',
      })
    );
    res.json(data);
  } catch (e) {
    console.error('team-roster:', e.message);
    res.json({ resultSets: [{ name: 'CommonTeamRoster', headers: [], rowSet: [] }] });
  }
});

app.get('/api/team-info/:teamId', async (req, res) => {
  try {
    const data = await cached(`tinfo_${req.params.teamId}`, TTL.league, () =>
      nba('teaminfocommon', {
        TeamID: req.params.teamId,
        Season: SEASON,
        LeagueID: '00',
        SeasonType: 'Regular Season',
      })
    );
    res.json(data);
  } catch (e) { console.error('team-info:', e.message); res.status(500).json({ error: e.message }); }
});

app.get('/api/player-news/:espnId', async (req, res) => {
  try {
    const data = await cached(`pnews_${req.params.espnId}`, TTL.live, async () => {
      const r = await axios.get(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/athletes/${req.params.espnId}/news?limit=5`, { timeout: 10000 });
      return r.data;
    });
    res.json(data);
  } catch (e) { console.error('player-news:', e.message); res.status(500).json({ error: e.message }); }
});

// ── POOL ENDPOINTS ────────────────────────────────────────────────────────────

app.get('/api/all-players-traditional', async (req, res) => {
  try { res.json(poolResponse(await getPool())); }
  catch (e) { console.error('all-trad:', e.message); res.status(500).json({ error: e.message }); }
});

app.get('/api/all-players-advanced', async (req, res) => {
  try { res.json(poolResponse(await getPool())); }
  catch (e) { console.error('all-adv:', e.message); res.status(500).json({ error: e.message }); }
});

app.get('/api/all-players-hustle', async (req, res) => {
  try { res.json(poolResponse(await getPool())); }
  catch (e) { console.error('all-hustle:', e.message); res.status(500).json({ error: e.message }); }
});

app.get('/api/all-players-defense', async (req, res) => {
  try { res.json(poolResponse(await getPool())); }
  catch (e) { console.error('all-def:', e.message); res.status(500).json({ error: e.message }); }
});

app.get('/api/all-players-catchshoot', async (req, res) => {
  try { res.json(poolResponse(await getPool())); }
  catch (e) { console.error('catchshoot:', e.message); res.status(500).json({ error: e.message }); }
});

app.get('/api/all-players-pullup', async (req, res) => {
  try { res.json(poolResponse(await getPool())); }
  catch (e) { console.error('pullup:', e.message); res.status(500).json({ error: e.message }); }
});

app.get('/api/all-players-passing', async (req, res) => {
  try { res.json(poolResponse(await getPool())); }
  catch (e) { console.error('passing:', e.message); res.status(500).json({ error: e.message }); }
});

app.get('/api/all-players-rebounding', async (req, res) => {
  try { res.json(poolResponse(await getPool())); }
  catch (e) { console.error('rebounding:', e.message); res.status(500).json({ error: e.message }); }
});

app.get('/api/all-players-tracking', async (req, res) => {
  try { res.json(poolResponse(await getPool())); }
  catch (e) { console.error('tracking:', e.message); res.status(500).json({ error: e.message }); }
});

app.get('/api/all-players-speed', async (req, res) => {
  try { res.json(poolResponse(await getPool())); }
  catch (e) { console.error('speed:', e.message); res.status(500).json({ error: e.message }); }
});

app.get('/api/all-players-shotdash', async (req, res) => {
  try { res.json(poolResponse(await getPool())); }
  catch (e) { console.error('shotdash:', e.message); res.status(500).json({ error: e.message }); }
});

app.get('/api/synergy', async (req, res) => {
  try { res.json(poolResponse(await getPool())); }
  catch (e) { console.error('synergy:', e.message); res.status(500).json({ error: e.message }); }
});

app.get('/api/advanced-box', async (req, res) => {
  try { res.json(poolResponse(await getPool())); }
  catch (e) { console.error('advanced-box:', e.message); res.status(500).json({ error: e.message }); }
});

// ── Cache status ──────────────────────────────────────────────────────────────
app.get('/api/cache-status', (req, res) => {
  const status = {};
  cache.forEach((v, k) => {
    status[k] = {
      age: Math.round((Date.now() - v.ts) / 1000) + 's ago',
      size: JSON.stringify(v.data).length + ' bytes',
    };
  });
  res.json(status);
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🏀 LeHoopIQ Proxy Server running on http://localhost:${PORT}`);
  console.log(`   Pool data: api.server.nbaapi.com (no blocking!)`);
  console.log(`   Home page: stats.nba.com (unchanged)`);
  console.log(`\n   Home:    /api/leaders  /api/standings  /api/scoreboard  /api/news`);
  console.log(`   Profile: /api/player-info/:id  /api/player-career/:id`);
  console.log(`   Splits:  /api/player-splits/:id`);
  console.log(`   Awards:  /api/player-awards/:id`);
  console.log(`   Pools:   /api/all-players-traditional  /api/all-players-advanced  etc.`);
  console.log(`   Debug:   /api/cache-status\n`);
});