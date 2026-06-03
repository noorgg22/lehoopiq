// Vercel serverless function — NBA league leaders via nbaapi.com
// Uses nbaapi.com instead of stats.nba.com (no IP-level blocking from cloud providers)

// Name → NBA.com numeric ID (for cdn.nba.com headshots)
const PLAYER_NBA_ID = {
  'LeBron James': '2544', 'Luka Dončić': '1629029', 'Stephen Curry': '201939',
  'Kevin Durant': '201142', 'Giannis Antetokounmpo': '203507', 'Nikola Jokić': '203999',
  'Joel Embiid': '203954', 'Kawhi Leonard': '202695', 'Damian Lillard': '203081',
  'James Harden': '201935', 'Anthony Davis': '203076', 'Kyrie Irving': '202681',
  'Devin Booker': '1626164', 'Trae Young': '1629027', 'Ja Morant': '1629630',
  'Jayson Tatum': '1628369', 'Donovan Mitchell': '1628378', 'Bam Adebayo': '1628389',
  'Jimmy Butler': '202710', 'Paul George': '202331', 'Zion Williamson': '1629627',
  'Anthony Edwards': '1630162', 'Shai Gilgeous-Alexander': '1628983',
  "De'Aaron Fox": '1628368', 'Jaylen Brown': '1627759', 'Karl-Anthony Towns': '1626157',
  'Domantas Sabonis': '1627734', 'Tyrese Maxey': '1630178', 'Tyrese Haliburton': '1630169',
  'Jalen Brunson': '1628386', 'Paolo Banchero': '1631094', 'Victor Wembanyama': '1641705',
  'Chet Holmgren': '1631096', 'Franz Wagner': '1630532', 'Scottie Barnes': '1630968',
  'LaMelo Ball': '1630163', 'Miles Bridges': '1628388', 'RJ Barrett': '1629628',
  'Brandon Ingram': '1627742', 'DeMar DeRozan': '201942', 'Pascal Siakam': '1627783',
  'Lauri Markkanen': '1628374', 'Rudy Gobert': '203497', 'Julius Randle': '203944',
  'Dejounte Murray': '1628384', 'OG Anunoby': '1628472', 'Josh Giddey': '1630581',
  'Jalen Williams': '1631114', 'Alperen Şengün': '1631167', 'Cade Cunningham': '1630595',
  'Jalen Green': '1630224', 'Jabari Smith Jr.': '1631099', 'Evan Mobley': '1630596',
  'Darius Garland': '1629636', 'Mikal Bridges': '1628969', 'Anfernee Simons': '1629014',
  'Desmond Bane': '1630235', 'Tyler Herro': '1629625', 'Andrew Wiggins': '203952',
  'Tobias Harris': '202699', 'Nikola Vučević': '202696', 'Brook Lopez': '201572',
  'Khris Middleton': '203114', 'Bobby Portis': '1626171', 'Kristaps Porziņģis': '204001',
  'Fred VanVleet': '1627832', 'Isaiah Hartenstein': '1629598', 'Josh Hart': '1628404',
  'Ivica Zubac': '1627826', 'Deandre Ayton': '1629028', 'Chris Paul': '101108',
  'Austin Reaves': '1630559', 'Immanuel Quickley': '1630193', 'De\'Andre Hunter': '1629631',
  'Cam Thomas': '1631021', 'Scoot Henderson': '1641706', 'Donovan Clingan': '1642270',
  'Walker Kessler': '1631117', 'Jalen Duren': '1631105', 'Jaren Jackson Jr.': '1628991',
  'Dyson Daniels': '1630700', 'Jalen Johnson': '1630552', 'Cason Wallace': '1641717',
  'Stephon Castle': '1642264', 'Andrew Nembhard': '1629614', 'Jaden Ivey': '1631107',
  'Michael Porter Jr.': '1629008', 'Aaron Nesmith': '1630174',
  'Scottie Pippen Jr.': '1630590', 'Keldon Johnson': '1629640', 'Cameron Johnson': '1629661',
  'Tari Eason': '1631108', 'Bogdan Bogdanović': '203992', 'Clint Capela': '203991',
};

const STAT_FIELD = {
  PTS: 'points', REB: 'totalRb', AST: 'assists', STL: 'steals', BLK: 'blocks',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const stat = (req.query.stat || 'PTS').toUpperCase();
  const field = STAT_FIELD[stat] || 'points';

  try {
    const r = await fetch(
      `https://api.server.nbaapi.com/api/playertotals?season=2026&sortBy=${field}&ascending=false&page=1&pageSize=25`,
      { signal: AbortSignal.timeout(12000) }
    );
    if (!r.ok) throw new Error(`nbaapi ${r.status}`);
    const { data } = await r.json();

    const rows = data
      .filter(p => (p.games || 0) >= 5)
      .map(p => {
        const gp  = p.games || 1;
        const val = stat === 'PTS' ? p.points / gp
                  : stat === 'REB' ? p.totalRb / gp
                  : stat === 'AST' ? p.assists / gp
                  : stat === 'STL' ? p.steals / gp
                  : stat === 'BLK' ? p.blocks / gp
                  : 0;
        const nbaId = PLAYER_NBA_ID[p.playerName] || p.playerId;
        return [nbaId, p.playerName, p.team, gp, parseFloat(val.toFixed(1))];
      })
      .sort((a, b) => b[4] - a[4])
      .slice(0, 15);

    res.json({
      resultSets: [{
        name: 'LeagueLeaders',
        headers: ['PLAYER_ID', 'PLAYER', 'TEAM', 'GP', stat],
        rowSet: rows,
      }],
    });
  } catch (e) {
    console.error('leaders error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
