import { setCors, NBA_HEADERS, SEASON } from '../_nba.js';
import { getPool } from '../_pool.js';

// NBA.com player ID → name lookup (for reverse lookup from pool)
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
  'Donovan Clingan': '1642270', 'Zach Edey': '1641744', 'Walker Kessler': '1631117',
  'Jalen Duren': '1631105', 'Ausar Thompson': '1641709', 'Amen Thompson': '1641706',
  'Scotty Pippen Jr.': '1630590', 'Jaren Jackson Jr.': '1628991',
  'Matisse Thybulle': '1629680', 'Jalen Suggs': '1630591', 'GG Jackson': '1641713',
  'Dyson Daniels': '1630700', 'Jalen Johnson': '1630552', 'Cason Wallace': '1641717',
  'Stephon Castle': '1642264', 'Kevin Porter Jr.': '1629645',
  'Andrew Nembhard': '1629614', 'Jaden Ivey': '1631107', 'Isaiah Collier': '1642268',
  'Michael Porter Jr.': '1629008', 'Jarace Walker': '1641716',
};

function poolPlayerById(pool, nbaId) {
  const sid = String(nbaId);
  for (const [name, id] of Object.entries(PLAYER_NBA_ID)) {
    if (id === sid) return pool.find(p => p.PLAYER_NAME === name) || null;
  }
  return null;
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

export default async function handler(req, res) {
  setCors(res);
  const { playerId } = req.query;
  try {
    // 1. Try stats.nba.com with short timeout
    try {
      console.log(`[player-career] Trying stats.nba.com for ${playerId}`);
      const url = `https://stats.nba.com/stats/playercareerstats?${new URLSearchParams({ PlayerID: playerId, PerMode: 'PerGame' })}`;
      const response = await fetch(url, {
        headers: NBA_HEADERS,
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        const data = await response.json();
        console.log(`[player-career] stats.nba.com succeeded for ${playerId}`);
        return res.json(data);
      }
    } catch (e) {
      console.log(`[player-career] stats.nba.com failed: ${e.message}`);
    }

    // 2. Fall back to synthetic career stats from nbaapi.com pool
    console.log(`[player-career] Trying pool fallback for ${playerId}`);
    const pool = await getPool();
    const p = poolPlayerById(pool, playerId);
    if (p) {
      console.log(`[player-career] Using synthetic career stats for ${p.PLAYER_NAME}`);
      return res.json(syntheticCareerStats(p));
    }

    // Player not found
    console.log(`[player-career] Player ${playerId} not found in any source`);
    res.status(404).json({ error: 'Player not found' });
  } catch (e) {
    console.error('player-career error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
