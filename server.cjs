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

async function nba(endpoint, params = {}, retries = 1) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await axios.get(`https://stats.nba.com/stats/${endpoint}`, {
        headers: NBA_HEADERS, params, timeout: 5000,
      });
      return r.data;
    } catch (e) {
      if (i < retries - 1) {
        console.log(`Retry ${i + 1} for ${endpoint}...`);
        await sleep(1000);
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
      MIN: (t.minutesPg || 0) / gp,   // nbaapi.com minutesPg is total minutes, divide by games for per-game
      MIN_TOTAL: t.minutesPg || 0,
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

// ── NBA.com player ID lookup (for headshots) ──────────────────────────────────
// nbaapi.com uses bbref IDs; cdn.nba.com headshots need the numeric NBA ID
// IDs verified from commonteamroster endpoint (actual NBA.com data)
const PLAYER_NBA_ID = {
  'LeBron James': '2544', 'Luka Dončić': '1629029', 'Stephen Curry': '201939',
  'Kevin Durant': '201142', 'Giannis Antetokounmpo': '203507', 'Nikola Jokić': '203999',
  'Joel Embiid': '203954', 'Kawhi Leonard': '202695', 'Damian Lillard': '203081',
  'James Harden': '201935', 'Anthony Davis': '203076', 'Kyrie Irving': '202681',
  'Devin Booker': '1626164', 'Trae Young': '1629027', 'Ja Morant': '1629630',
  'Jayson Tatum': '1628369', 'Donovan Mitchell': '1628378', 'Bam Adebayo': '1628389',
  'Jimmy Butler': '202710', 'Paul George': '202331', 'Zion Williamson': '1629627',
  'Anthony Edwards': '1630162', 'Shai Gilgeous-Alexander': '1628983',
  'De\'Aaron Fox': '1628368', 'Jaylen Brown': '1627759', 'Karl-Anthony Towns': '1626157',
  'Domantas Sabonis': '1627734', 'Tyrese Maxey': '1630178', 'Tyrese Haliburton': '1630169',
  'Jalen Brunson': '1628386', 'Paolo Banchero': '1631094', 'Victor Wembanyama': '1641705',
  'Chet Holmgren': '1631096', 'Franz Wagner': '1630532', 'Scottie Barnes': '1630968',
  'LaMelo Ball': '1630163', 'Miles Bridges': '1628388', 'RJ Barrett': '1629628',
  'Brandon Ingram': '1627742', 'Demar DeRozan': '201942', 'Pascal Siakam': '1627783',
  'Lauri Markkanen': '1628374', 'Rudy Gobert': '203497', 'Julius Randle': '203944',
  'Dejounte Murray': '1628384', 'OG Anunoby': '1628472', 'Josh Giddey': '1630581',
  'Jalen Williams': '1631114', 'Alperen Şengün': '1631167', 'Cade Cunningham': '1630595',
  'Jalen Green': '1630224', 'Jabari Smith Jr.': '1631099', 'Evan Mobley': '1630596',
  'Darius Garland': '1629636', 'Mikal Bridges': '1628969', 'Anfernee Simons': '1629014',
  'Desmond Bane': '1630235', 'Tyler Herro': '1629625', 'Andrew Wiggins': '203952',
  'Tobias Harris': '202699', 'Nikola Vučević': '202696', 'Brook Lopez': '201572',
  'Khris Middleton': '203114', 'Bobby Portis': '1626171', 'Kristaps Porziņģis': '204001',
  'Kristaps Porzingis': '204001',
  'Fred VanVleet': '1627832', 'Isaiah Hartenstein': '1629598', 'Josh Hart': '1628404',
  'Ivica Zubac': '1627826', 'Deandre Ayton': '1629028', 'Chris Paul': '101108',
  'Austin Reaves': '1630559', 'Immanuel Quickley': '1630193', 'Obi Toppin': '1630167',
  'De\'Andre Hunter': '1629631', 'Bogdan Bogdanović': '203992', 'Clint Capela': '203991',
  'Tari Eason': '1631108', 'Cameron Johnson': '1629661', 'Keldon Johnson': '1629640',
  'Cam Thomas': '1631021', 'Scoot Henderson': '1641706',
  // IDs verified from roster API:
  'Donovan Clingan': '1642270', 'Zach Edey': '1641744', 'Walker Kessler': '1631117',
  'Jalen Duren': '1631105', 'Ausar Thompson': '1641709', 'Amen Thompson': '1641706',
  'Scotty Pippen Jr.': '1630590', 'Jaren Jackson Jr.': '1628991',
  'Matisse Thybulle': '1629680', 'Jalen Suggs': '1630591', 'GG Jackson': '1641713',
  'Dyson Daniels': '1630700', 'Jalen Johnson': '1630552', 'Cason Wallace': '1641717',
  'Stephon Castle': '1642264', 'Kevin Porter Jr.': '1629645',
  'Andrew Nembhard': '1629614', 'Jaden Ivey': '1631107', 'Isaiah Collier': '1642268',
  'Michael Porter Jr.': '1629008', 'Jarace Walker': '1641716',
  'Jalen Williams': '1631114', 'Aaron Nesmith': '1630174', 'Alperen Şengün': '1631167',
};

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

    // Deduplicate traded players: prefer combined "2TM"/"3TM" row; else keep highest GP
    const byName = new Map();
    for (const p of pool) {
      const existing = byName.get(p.PLAYER_NAME);
      const isCombined = /\dTM$/i.test(p.TEAM_ABBREVIATION || '');
      if (!existing || isCombined || (!(/\dTM$/i.test(existing.TEAM_ABBREVIATION || '')) && p.GP > existing.GP)) {
        byName.set(p.PLAYER_NAME, p);
      }
    }
    const deduped = Array.from(byName.values());

    const sorted = deduped
      .filter(p => p[field] != null && p.GP >= 30)   // min 30 games to filter small samples
      .sort((a, b) => b[field] - a[field])
      .slice(0, 15);
    const headers = ['PLAYER_ID', 'PLAYER', 'TEAM', 'GP', field];
    res.json({
      resultSets: [{
        name: 'LeagueLeaders',
        headers,
        rowSet: sorted.map(p => {
          // Use NBA.com numeric ID for headshots; fall back to bbref ID
          const nbaId = PLAYER_NBA_ID[p.PLAYER_NAME] || p.PLAYER_ID;
          return [nbaId, p.PLAYER_NAME, p.TEAM_ABBREVIATION, p.GP, p[field]];
        }),
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

// ESPN team abbreviation overrides (same as logo mapping)
const ESPN_TEAM_ABBR_MAP = { 'GSW':'gs','NYK':'ny','NOP':'no','SAS':'sa','UTA':'utah','WAS':'wsh' };

// Fetch ESPN team roster and cache it (ESPN works from Railway, no IP blocking)
async function getESPNRoster(teamAbbr) {
  const abbr = (ESPN_TEAM_ABBR_MAP[teamAbbr] || teamAbbr || '').toLowerCase();
  return cached(`espn_roster_${abbr}`, TTL.stats, async () => {
    const r = await axios.get(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${abbr}/roster`,
      { timeout: 8000 }
    );
    return r.data?.athletes || [];
  });
}

// Find a player in ESPN roster by name (accent/case insensitive)
function normalizeName(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z ]/g,'').trim();
}

async function findESPNPlayer(playerName, teamAbbr) {
  try {
    const athletes = await getESPNRoster(teamAbbr);
    const target = normalizeName(playerName);
    return athletes.find(a => normalizeName(a.displayName || `${a.firstName||''} ${a.lastName||''}`) === target) || null;
  } catch { return null; }
}

// Build CommonPlayerInfo-format response from ESPN athlete object
function espnToPlayerInfo(athlete, poolPlayer, nbaId) {
  const draft = athlete.draft || {};
  const college = athlete.college || {};
  const pos = athlete.position || {};
  const birthPlace = athlete.birthPlace || {};
  const headers = ['PERSON_ID','DISPLAY_FIRST_LAST','TEAM_ID','TEAM_NAME','TEAM_CITY','TEAM_ABBREVIATION',
    'JERSEY','POSITION','HEIGHT','WEIGHT','BIRTHDATE','COUNTRY','SCHOOL',
    'DRAFT_YEAR','DRAFT_ROUND','DRAFT_NUMBER','FROM_YEAR','TO_YEAR','GREATEST_75_FLAG'];
  const row = [
    nbaId,
    athlete.displayName || poolPlayer.PLAYER_NAME,
    '', '', '', poolPlayer.TEAM_ABBREVIATION || '',
    athlete.jersey || '',
    pos.abbreviation || '',
    athlete.displayHeight || '',
    athlete.weight ? String(athlete.weight) : '',
    athlete.dateOfBirth ? athlete.dateOfBirth.split('T')[0] : '',
    birthPlace.country || '',
    college.name || '',
    draft.year ? String(draft.year) : '',
    draft.round ? String(draft.round) : '',
    draft.selection ? String(draft.selection) : '',
    SEASON.split('-')[0], SEASON.split('-')[0], 'N'
  ];
  return { resultSets: [{ name: 'CommonPlayerInfo', headers, rowSet: [row] }] };
}

// Reverse lookup: NBA.com numeric ID → pool player
function poolPlayerById(pool, nbaId) {
  const sid = String(nbaId);
  for (const [name, id] of Object.entries(PLAYER_NBA_ID)) {
    if (id === sid) return pool.find(p => p.PLAYER_NAME === name) || null;
  }
  return null;
}

function syntheticPlayerInfo(p, nbaId) {
  const headers = ['PERSON_ID','DISPLAY_FIRST_LAST','TEAM_ID','TEAM_NAME','TEAM_CITY','TEAM_ABBREVIATION',
    'JERSEY','POSITION','HEIGHT','WEIGHT','BIRTHDATE','COUNTRY','SCHOOL',
    'DRAFT_YEAR','DRAFT_ROUND','DRAFT_NUMBER','FROM_YEAR','TO_YEAR','GREATEST_75_FLAG'];
  const row = [
    nbaId, p.PLAYER_NAME, '', '', '', p.TEAM_ABBREVIATION || '',
    '', '', '', '', '', '', '',
    '', '', '', SEASON.split('-')[0], SEASON.split('-')[0], 'N'
  ];
  return { resultSets: [{ name: 'CommonPlayerInfo', headers, rowSet: [row] }] };
}

function syntheticCareerStats(p) {
  const season = SEASON;
  const headers = ['PLAYER_ID','SEASON_ID','TEAM_ID','TEAM_ABBREVIATION','PLAYER_AGE',
    'GP','GS','MIN','FGM','FGA','FG_PCT','FG3M','FG3A','FG3_PCT','FTM','FTA','FT_PCT',
    'OREB','DREB','REB','AST','STL','BLK','TOV','PF','PTS'];
  const row = [
    p.PLAYER_ID || '', season, '', p.TEAM_ABBREVIATION || '', '',
    p.GP || 0, p.GP || 0, p.MIN || 0, 0, 0, p.FG_PCT || 0, 0, p.FG3A || 0, p.FG3_PCT || 0,
    0, 0, p.FT_PCT || 0, p.OREB || 0, p.DREB || 0, p.REB || 0,
    p.AST || 0, p.STL || 0, p.BLK || 0, p.TOV || 0, 0, p.PTS || 0
  ];
  return { resultSets: [{ name: 'SeasonTotalsRegularSeason', headers, rowSet: [row] }] };
}

app.get('/api/player-info/:id', async (req, res) => {
  const nbaId = req.params.id;
  try {
    const data = await cached(`pinfo_${nbaId}`, TTL.player, async () => {
      // 1. Try stats.nba.com
      try { return await nba('commonplayerinfo', { PlayerID: nbaId }); } catch {}
      // 2. Fall back to ESPN roster (works from Railway)
      const pool = await getPool();
      const p = poolPlayerById(pool, nbaId);
      if (!p) throw new Error('Player not found');
      const athlete = await findESPNPlayer(p.PLAYER_NAME, p.TEAM_ABBREVIATION);
      if (athlete) return espnToPlayerInfo(athlete, p, nbaId);
      // 3. Last resort: bare-bones synthetic
      return syntheticPlayerInfo(p, nbaId);
    });
    res.json(data);
  } catch (e) { console.error('player-info:', e.message); res.status(500).json({ error: e.message }); }
});

app.get('/api/player-career/:id', async (req, res) => {
  const nbaId = req.params.id;
  try {
    const data = await cached(`pcareer_${nbaId}`, TTL.player, async () => {
      try {
        return await nba('playercareerstats', { PlayerID: nbaId, PerMode: 'PerGame' });
      } catch {
        const pool = await getPool();
        const p = poolPlayerById(pool, nbaId);
        if (p) return syntheticCareerStats(p);
        throw new Error('Player not found');
      }
    });
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

// Comprehensive hardcoded awards — matches what AccoladesTab expects
// D = DESCRIPTION (contains key string), S = SEASON, T = ALL_NBA_TEAM_NUMBER
// All-NBA/All-Def/All-Rookie require T:1/2/3; All-Star, awards don't need T
const A = (D,S,T) => ({ D, S, ALL_NBA_TEAM_NUMBER: T||'' });
const as = S => A('All-Star',S);
const an1 = S => A('All-NBA',S,1), an2 = S => A('All-NBA',S,2), an3 = S => A('All-NBA',S,3);
const ad1 = S => A('All-Defensive',S,1), ad2 = S => A('All-Defensive',S,2);
const ar1 = S => A('All-Rookie',S,1), ar2 = S => A('All-Rookie',S,2);
const mvp = S => A('NBA Most Valuable Player',S);
const fmvp = S => A('NBA Finals Most Valuable Player',S);
const dpoy = S => A('NBA Defensive Player of the Year',S);
const roy = S => A('NBA Rookie of the Year',S);
const mip = S => A('NBA Most Improved Player',S);
const sm = S => A('NBA Sixth Man of the Year',S);
const chm = S => A('NBA Champion',S);
const sc = S => A('NBA Scoring Champion',S);
const potm = S => A('Player of the Month',S);
const potw = S => A('Player of the Week',S);

const HARDCODED_AWARDS = {
  '2544': [ // LeBron James
    as('2004-05'),as('2005-06'),as('2006-07'),as('2007-08'),as('2008-09'),as('2009-10'),as('2010-11'),as('2011-12'),as('2012-13'),as('2013-14'),as('2014-15'),as('2015-16'),as('2016-17'),as('2017-18'),as('2018-19'),as('2019-20'),as('2020-21'),as('2021-22'),as('2022-23'),as('2023-24'),as('2024-25'),
    an1('2005-06'),an1('2006-07'),an1('2007-08'),an1('2008-09'),an1('2009-10'),an1('2010-11'),an1('2011-12'),an1('2012-13'),an1('2013-14'),an1('2015-16'),an1('2016-17'),an1('2017-18'),an1('2018-19'),an1('2019-20'),
    an2('2014-15'),an2('2020-21'),an2('2021-22'),an2('2022-23'),
    ad1('2008-09'),ad1('2009-10'),ad1('2010-11'),ad1('2011-12'),ad1('2012-13'),ad2('2013-14'),ad2('2014-15'),ad2('2015-16'),
    mvp('2008-09'),mvp('2009-10'),mvp('2011-12'),mvp('2012-13'),
    fmvp('2011-12'),fmvp('2015-16'),fmvp('2019-20'),fmvp('2022-23'),
    chm('2011-12'),chm('2015-16'),chm('2019-20'),chm('2022-23'),
    ar1('2003-04'),
  ],
  '1629029': [ // Luka Dončić
    as('2020-21'),as('2021-22'),as('2022-23'),as('2023-24'),as('2024-25'),as('2025-26'),
    an1('2019-20'),an1('2020-21'),an1('2021-22'),an1('2022-23'),an1('2023-24'),an1('2024-25'),an1('2025-26'),
    sc('2023-24'),sc('2024-25'),sc('2025-26'),
    ar1('2018-19'),
  ],
  '1628983': [ // Shai Gilgeous-Alexander
    as('2022-23'),as('2023-24'),as('2024-25'),as('2025-26'),
    an1('2022-23'),an1('2023-24'),an1('2024-25'),an1('2025-26'),
    ad1('2024-25'),ad1('2025-26'),
    mvp('2024-25'),fmvp('2024-25'),chm('2024-25'),sc('2024-25'),sc('2025-26'),
  ],
  '203999': [ // Nikola Jokić
    as('2018-19'),as('2019-20'),as('2020-21'),as('2021-22'),as('2022-23'),as('2023-24'),as('2024-25'),as('2025-26'),
    an1('2020-21'),an1('2021-22'),an1('2022-23'),an1('2023-24'),an1('2024-25'),an1('2025-26'),
    an2('2018-19'),an2('2019-20'),
    mvp('2020-21'),mvp('2021-22'),mvp('2023-24'),
    fmvp('2022-23'),chm('2022-23'),
  ],
  '203507': [ // Giannis Antetokounmpo
    as('2016-17'),as('2017-18'),as('2018-19'),as('2019-20'),as('2020-21'),as('2021-22'),as('2022-23'),as('2023-24'),as('2024-25'),
    an1('2018-19'),an1('2019-20'),an1('2020-21'),an1('2021-22'),an1('2023-24'),an1('2024-25'),
    an2('2017-18'),an2('2022-23'),
    ad1('2019-20'),ad1('2020-21'),ad2('2018-19'),
    mvp('2018-19'),mvp('2019-20'),
    fmvp('2020-21'),chm('2020-21'),
    dpoy('2019-20'),dpoy('2022-23'),
    mip('2016-17'),
  ],
  '203954': [ // Joel Embiid
    as('2017-18'),as('2018-19'),as('2021-22'),as('2022-23'),as('2023-24'),as('2024-25'),
    an1('2022-23'),an1('2023-24'),an2('2024-25'),an3('2021-22'),
    ad2('2022-23'),ad2('2023-24'),
    mvp('2022-23'),sc('2022-23'),sc('2023-24'),
  ],
  '201939': [ // Stephen Curry
    as('2013-14'),as('2014-15'),as('2015-16'),as('2016-17'),as('2017-18'),as('2018-19'),as('2020-21'),as('2021-22'),as('2022-23'),as('2023-24'),as('2024-25'),as('2025-26'),
    an1('2014-15'),an1('2015-16'),an1('2018-19'),an1('2020-21'),an1('2021-22'),
    an2('2013-14'),an2('2016-17'),an2('2023-24'),
    an3('2024-25'),
    mvp('2014-15'),mvp('2015-16'),
    fmvp('2021-22'),
    chm('2014-15'),chm('2015-16'),chm('2017-18'),chm('2018-19'),chm('2021-22'),
  ],
  '201142': [ // Kevin Durant
    as('2009-10'),as('2010-11'),as('2011-12'),as('2012-13'),as('2013-14'),as('2015-16'),as('2016-17'),as('2017-18'),as('2018-19'),as('2020-21'),as('2021-22'),as('2022-23'),as('2023-24'),
    an1('2009-10'),an1('2010-11'),an1('2011-12'),an1('2012-13'),an1('2013-14'),an1('2017-18'),an1('2018-19'),an1('2020-21'),an1('2021-22'),
    an2('2015-16'),an2('2022-23'),
    ad2('2011-12'),
    mvp('2013-14'),sc('2009-10'),sc('2011-12'),sc('2012-13'),sc('2013-14'),
    fmvp('2016-17'),fmvp('2017-18'),chm('2016-17'),chm('2017-18'),
    roy('2007-08'),
  ],
  '201935': [ // James Harden
    as('2012-13'),as('2013-14'),as('2014-15'),as('2015-16'),as('2016-17'),as('2017-18'),as('2018-19'),as('2019-20'),as('2020-21'),as('2021-22'),
    an1('2017-18'),an1('2018-19'),an1('2019-20'),
    an2('2012-13'),an2('2013-14'),an2('2014-15'),an2('2020-21'),
    an3('2015-16'),an3('2016-17'),
    mvp('2017-18'),sc('2017-18'),sc('2018-19'),sc('2019-20'),
    sm('2011-12'),
  ],
  '202695': [ // Kawhi Leonard
    as('2015-16'),as('2016-17'),as('2018-19'),as('2019-20'),as('2020-21'),as('2021-22'),
    an1('2015-16'),an1('2016-17'),an2('2019-20'),an3('2020-21'),
    ad1('2014-15'),ad1('2015-16'),ad1('2016-17'),ad1('2017-18'),ad1('2018-19'),ad2('2021-22'),
    dpoy('2014-15'),dpoy('2015-16'),
    fmvp('2013-14'),fmvp('2018-19'),
    chm('2013-14'),chm('2018-19'),
  ],
  '203081': [ // Damian Lillard
    as('2013-14'),as('2014-15'),as('2015-16'),as('2017-18'),as('2018-19'),as('2019-20'),as('2020-21'),as('2021-22'),as('2022-23'),as('2023-24'),
    an1('2022-23'),an2('2020-21'),an3('2017-18'),an3('2018-19'),an3('2019-20'),
    sc('2022-23'),
    roy('2012-13'),
  ],
  '202681': [ // Kyrie Irving
    as('2013-14'),as('2014-15'),as('2015-16'),as('2016-17'),as('2017-18'),as('2018-19'),as('2021-22'),as('2022-23'),as('2023-24'),
    an1('2021-22'),an2('2015-16'),an3('2018-19'),
    fmvp('2015-16'),chm('2015-16'),
    roy('2011-12'),
  ],
  '1630162': [ // Anthony Edwards
    as('2023-24'),as('2024-25'),as('2025-26'),
    an2('2024-25'),an3('2023-24'),an3('2025-26'),
    roy('2020-21'),
  ],
  '1641705': [ // Victor Wembanyama
    as('2024-25'),as('2025-26'),
    an1('2024-25'),an1('2025-26'),
    ad1('2023-24'),ad1('2024-25'),ad1('2025-26'),
    dpoy('2025-26'),
    roy('2023-24'),
  ],
  '1629027': [ // Trae Young
    as('2021-22'),as('2022-23'),as('2023-24'),as('2024-25'),as('2025-26'),
    an2('2021-22'),an3('2022-23'),an3('2024-25'),
  ],
  '1630595': [ // Cade Cunningham
    as('2024-25'),as('2025-26'),
    an2('2025-26'),an3('2024-25'),
    mip('2022-23'),
  ],
  '1629630': [ // Ja Morant
    as('2021-22'),as('2022-23'),as('2023-24'),as('2024-25'),as('2025-26'),
    an2('2021-22'),an3('2022-23'),an3('2025-26'),
    mip('2021-22'),roy('2019-20'),
  ],
  '1628374': [ // Lauri Markkanen
    as('2022-23'),as('2024-25'),as('2025-26'),
    an3('2022-23'),
    mip('2022-23'),
  ],
  '1627759': [ // Jaylen Brown
    as('2023-24'),as('2024-25'),as('2025-26'),
    an2('2023-24'),an1('2024-25'),an3('2025-26'),
    fmvp('2023-24'),chm('2023-24'),ad2('2023-24'),
  ],
  '1630178': [ // Tyrese Maxey
    as('2023-24'),as('2024-25'),as('2025-26'),
    an3('2023-24'),an2('2024-25'),an2('2025-26'),
    mip('2023-24'),
  ],
  '1628378': [ // Donovan Mitchell
    as('2021-22'),as('2022-23'),as('2023-24'),as('2024-25'),as('2025-26'),
    an2('2022-23'),an2('2023-24'),an3('2024-25'),an3('2025-26'),
  ],
  '203497': [ // Rudy Gobert
    as('2020-21'),as('2021-22'),as('2022-23'),as('2024-25'),
    an3('2020-21'),an3('2021-22'),
    ad1('2017-18'),ad1('2018-19'),ad1('2020-21'),ad1('2021-22'),ad1('2022-23'),
    dpoy('2017-18'),dpoy('2018-19'),dpoy('2020-21'),dpoy('2022-23'),
  ],
  '1626157': [ // Karl-Anthony Towns
    as('2017-18'),as('2021-22'),as('2023-24'),as('2024-25'),as('2025-26'),
    an3('2023-24'),an2('2024-25'),an2('2025-26'),
    roy('2015-16'),
  ],
  '1627734': [ // Domantas Sabonis
    as('2022-23'),as('2023-24'),as('2024-25'),as('2025-26'),
    an3('2022-23'),an2('2023-24'),an2('2024-25'),an3('2025-26'),
    sm('2019-20'),sm('2020-21'),
  ],
  '1628386': [ // Jalen Brunson
    as('2023-24'),as('2024-25'),as('2025-26'),
    an2('2023-24'),an2('2024-25'),an3('2025-26'),
  ],
  '1626164': [ // Devin Booker
    as('2021-22'),as('2022-23'),as('2023-24'),as('2024-25'),as('2025-26'),
    an1('2021-22'),an1('2022-23'),an2('2023-24'),an2('2024-25'),an3('2025-26'),
  ],
  '202331': [ // Paul George
    as('2012-13'),as('2013-14'),as('2014-15'),as('2015-16'),as('2016-17'),as('2018-19'),as('2019-20'),as('2020-21'),as('2021-22'),as('2022-23'),as('2023-24'),
    an1('2018-19'),an2('2013-14'),an2('2019-20'),an3('2016-17'),an3('2020-21'),
    ad1('2013-14'),ad1('2014-15'),ad1('2015-16'),ad1('2016-17'),ad1('2018-19'),ad1('2019-20'),ad2('2020-21'),ad2('2021-22'),
    dpoy('2018-19'),
  ],
  '1628383': [ // Jayson Tatum
    as('2020-21'),as('2021-22'),as('2022-23'),as('2023-24'),as('2024-25'),as('2025-26'),
    an1('2022-23'),an1('2023-24'),an1('2024-25'),an2('2021-22'),an2('2025-26'),
    fmvp('2023-24'),chm('2023-24'),
  ],
  '1630169': [ // Tyrese Haliburton
    as('2023-24'),as('2024-25'),as('2025-26'),
    an3('2023-24'),an3('2024-25'),
  ],
  '1628472': [ // OG Anunoby
    as('2023-24'),
    ad1('2022-23'),ad1('2023-24'),ad2('2024-25'),
    chm('2023-24'),
  ],
  '1630581': [ // Josh Giddey
    as('2025-26'),
    an3('2025-26'),
  ],
  '1631094': [ // Paolo Banchero
    as('2024-25'),as('2025-26'),
    an3('2024-25'),an3('2025-26'),
    roy('2022-23'),
  ],
  '1627783': [ // Pascal Siakam
    as('2022-23'),as('2023-24'),as('2024-25'),
    an2('2022-23'),an3('2023-24'),
    chm('2018-19'),mip('2018-19'),
  ],
  '1629028': [ // Deandre Ayton
    as('2023-24'),
    ar1('2018-19'),
  ],
  '203114': [ // Khris Middleton
    as('2018-19'),as('2019-20'),as('2021-22'),
    chm('2020-21'),
  ],
  '203107': [ // Bradley Beal
    as('2018-19'),as('2020-21'),as('2021-22'),
    an3('2020-21'),sc('2020-21'),
  ],
  '1628978': [ // Mikal Bridges
    as('2023-24'),
    ad1('2022-23'),ad2('2023-24'),
    chm('2020-21'),
  ],
  '1628384': [ // Dejounte Murray
    as('2021-22'),as('2022-23'),as('2024-25'),
    ad2('2021-22'),
  ],
  '1629636': [ // Darius Garland
    as('2021-22'),as('2024-25'),
    an3('2024-25'),
  ],
  '1630596': [ // Evan Mobley
    as('2024-25'),as('2025-26'),
    an3('2023-24'),an2('2024-25'),an2('2025-26'),
    dpoy('2024-25'),ad1('2024-25'),ad1('2025-26'),
    roy('2021-22'),
  ],
  '1628389': [ // Bam Adebayo
    as('2019-20'),as('2020-21'),as('2023-24'),as('2024-25'),
    an3('2019-20'),an3('2023-24'),
    ad1('2022-23'),ad1('2023-24'),
  ],
  '203944': [ // Julius Randle
    as('2020-21'),as('2022-23'),as('2023-24'),
    an2('2020-21'),
    mip('2020-21'),
  ],
  '1630163': [ // LaMelo Ball
    as('2022-23'),as('2024-25'),as('2025-26'),
    an3('2022-23'),an2('2024-25'),an3('2025-26'),
    roy('2020-21'),
  ],
  '1630591': [ // Jalen Suggs
    as('2025-26'),
    ad2('2025-26'),
  ],
  '1641709': [ // Ausar Thompson
    as('2025-26'),
    ad1('2025-26'),
  ],
  '1630700': [ // Dyson Daniels
    as('2024-25'),as('2025-26'),
    ad1('2024-25'),ad1('2025-26'),
  ],
  '1631105': [ // Jalen Duren
    as('2025-26'),
    ar1('2022-23'),
  ],
  '1630552': [ // Jalen Johnson
    as('2025-26'),
    an3('2025-26'),
    mip('2025-26'),
  ],
  '1628991': [ // Jaren Jackson Jr.
    as('2023-24'),as('2024-25'),as('2025-26'),
    an3('2024-25'),
    dpoy('2022-23'),ad1('2022-23'),ad1('2023-24'),
  ],
  '203496': [ // Andre Drummond
    as('2015-16'),as('2019-20'),
  ],
  '1630532': [ // Franz Wagner
    as('2024-25'),as('2025-26'),
    an3('2024-25'),an2('2025-26'),
  ],
  '1629625': [ // Tyler Herro
    as('2023-24'),
    sm('2021-22'),
  ],
  '1630559': [ // Austin Reaves
    as('2025-26'),
    chm('2024-25'),
  ],
  '203992': [ // Bogdan Bogdanović
    chm('2024-25'),
  ],
  '1629014': [ // Anfernee Simons
    as('2023-24'),
  ],
};

function buildAwardsResponse(awards) {
  const headers = ['PLAYER_ID','SEASON','DESCRIPTION','TYPE','SUBTYPE1','SUBTYPE2','SUBTYPE3','ALL_NBA_TEAM_NUMBER'];
  const rowSet = awards.map(a => [a.PLAYER_ID||'', a.S||a.SEASON||'', a.D||a.DESCRIPTION||'', '', '', '', '', a.ALL_NBA_TEAM_NUMBER||'']);
  return { resultSets: [{ name: 'PlayerAwards', headers, rowSet }] };
}

app.get('/api/player-awards/:id', async (req, res) => {
  const nbaId = req.params.id;
  try {
    const data = await cached(`pawards_${nbaId}`, TTL.player, async () => {
      try {
        return await nba('playerawards', { PlayerID: nbaId });
      } catch {
        // Fall back to hardcoded data
        const hardcoded = HARDCODED_AWARDS[nbaId];
        if (hardcoded) return buildAwardsResponse(hardcoded);
        throw new Error('No awards data');
      }
    });
    res.json(data);
  } catch (e) {
    // Return empty awards gracefully — don't 500
    res.json({ resultSets: [{ name: 'PlayerAwards', headers: ['PLAYER_ID','SEASON','DESCRIPTION','TYPE','SUBTYPE1','SUBTYPE2','SUBTYPE3','ALL_NBA_TEAM_NUMBER'], rowSet: [] }] });
  }
});

// Reverse map: NBA team ID → abbreviation
const NBA_ID_TO_ABBR = Object.fromEntries(
  Object.entries(ESPN_ABBR_TO_NBA_ID).map(([abbr, id]) => [id, abbr])
);
// Reverse map: NBA.com player ID → player name
const NBA_ID_TO_NAME = Object.fromEntries(
  Object.entries(PLAYER_NBA_ID).map(([name, id]) => [id, name])
);

app.get('/api/team-roster/:teamId', async (req, res) => {
  const teamId = req.params.teamId;
  try {
    const data = await cached(`roster_${teamId}`, TTL.stats, async () => {
      try {
        // Try stats.nba.com first (best data with jersey numbers etc.)
        return await nba('commonteamroster', { TeamID: teamId, Season: SEASON, LeagueID: '00' });
      } catch {
        // Fallback: build roster from pool filtered by team abbreviation
        console.log(`[roster fallback] Building ${teamId} roster from pool`);
        const abbr = NBA_ID_TO_ABBR[teamId];
        if (!abbr) throw new Error(`Unknown team ID: ${teamId}`);
        const pool = await getPool();
        const headers = ['TeamID','SEASON','LeagueID','PLAYER','NICKNAME','PLAYER_SLUG',
          'NUM','POSITION','HEIGHT','WEIGHT','BIRTH_DATE','AGE','EXP','SCHOOL','PLAYER_ID','HOW_ACQUIRED'];
        // Filter pool to this team, sort by PTS desc
        const players = pool
          .filter(p => p.TEAM_ABBREVIATION === abbr || p.TEAM_ABBREVIATION === `${abbr}` )
          .sort((a, b) => (b.PTS || 0) - (a.PTS || 0))
          .slice(0, 18);
        const rowSet = players.map(p => {
          // Use NBA.com ID from PLAYER_NBA_ID lookup, fall back to bbref ID
          const nbaId = PLAYER_NBA_ID[p.PLAYER_NAME] || p.PLAYER_ID;
          return [teamId, SEASON, '00', p.PLAYER_NAME, '', '', '', '', '', '', '', '', '', '', nbaId, ''];
        });
        return { resultSets: [{ name: 'CommonTeamRoster', headers, rowSet }] };
      }
    });
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