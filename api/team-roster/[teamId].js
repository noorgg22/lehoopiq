// Team roster via ESPN — no IP blocking, public CORS-accessible API
// Maps NBA team IDs to ESPN abbreviations

const NBA_TO_ESPN = {
  '1610612737': 'atl', '1610612738': 'bos', '1610612751': 'bkn',
  '1610612766': 'cha', '1610612741': 'chi', '1610612739': 'cle',
  '1610612742': 'dal', '1610612743': 'den', '1610612765': 'det',
  '1610612744': 'gs',  '1610612745': 'hou', '1610612754': 'ind',
  '1610612746': 'lac', '1610612747': 'lal', '1610612763': 'mem',
  '1610612748': 'mia', '1610612749': 'mil', '1610612750': 'min',
  '1610612740': 'no',  '1610612752': 'ny',  '1610612760': 'okc',
  '1610612753': 'orl', '1610612755': 'phi', '1610612756': 'phx',
  '1610612757': 'por', '1610612758': 'sac', '1610612759': 'sa',
  '1610612761': 'tor', '1610612762': 'utah','1610612764': 'wsh',
};

function inchesToFeet(inches) {
  if (!inches) return '';
  const ft = Math.floor(inches / 12);
  const inn = Math.round(inches % 12);
  return `${ft}-${inn}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { teamId } = req.query;
  const espnAbbr = NBA_TO_ESPN[teamId];

  if (!espnAbbr) {
    return res.status(400).json({ error: `Unknown team ID: ${teamId}` });
  }

  try {
    const r = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${espnAbbr}/roster`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!r.ok) throw new Error(`ESPN ${r.status}`);
    const data = await r.json();

    const athletes = data.athletes || [];
    const headers = [
      'TeamID','SEASON','LeagueID','PLAYER','NICKNAME','PLAYER_SLUG',
      'NUM','POSITION','HEIGHT','WEIGHT','BIRTH_DATE','AGE','EXP','SCHOOL','PLAYER_ID','HOW_ACQUIRED',
    ];
    const rowSet = athletes.map(a => [
      teamId, '2025-26', '00',
      a.displayName || '',
      '',
      (a.displayName || '').toLowerCase().replace(/\s+/g, '-'),
      a.jersey || '',
      a.position?.abbreviation || '',
      inchesToFeet(a.height),
      a.weight ? `${a.weight} lbs` : '',
      '',
      '',
      String(a.experience?.years ?? ''),
      '',
      a.id || '',   // ESPN athlete ID — used for headshots below
      '',
    ]);

    res.json({
      resultSets: [{
        name: 'CommonTeamRoster',
        headers,
        rowSet,
      }],
      // Extra field: tells the frontend which headshot CDN to use
      headshot_base: 'https://a.espncdn.com/i/headshots/nba/players/full',
    });
  } catch (e) {
    console.error('team-roster error:', e.message);
    res.json({ resultSets: [{ name: 'CommonTeamRoster', headers: [], rowSet: [] }] });
  }
}
