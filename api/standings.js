// Vercel serverless function — proxies NBA standings via ESPN (no CORS issues)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const response = await fetch(
      'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings?season=2026',
      { signal: AbortSignal.timeout(8000) }
    );

    if (!response.ok) throw new Error(`ESPN API ${response.status}`);
    const espn = await response.json();

    // Parse ESPN standings into the format the frontend expects
    const children = espn?.children || [];
    const rows = [];

    for (const conf of children) {
      const confName = conf.name?.includes('East') ? 'East' : 'West';
      const standings = conf?.standings?.entries || [];

      standings.forEach((entry, idx) => {
        const team = entry.team;
        const abbr = team?.abbreviation || '';
        const ESPN_MAP = { GSW:'gs',NYK:'ny',NOP:'no',SAS:'sa',UTA:'utah',WAS:'wsh' };
        const espnAbbr = ESPN_MAP[abbr] || abbr.toLowerCase();
        const stats = {};
        (entry.stats || []).forEach(s => { stats[s.name] = s.value; });

        rows.push({
          rank: idx + 1,
          team: team?.displayName || '',
          teamId: team?.id || '',
          wins: stats.wins || 0,
          losses: stats.losses || 0,
          pct: ((stats.wins || 0) / Math.max((stats.wins || 0) + (stats.losses || 0), 1)).toFixed(3).replace('0.', '.'),
          conf: confName,
          logo: `https://a.espncdn.com/i/teamlogos/nba/500/${espnAbbr}.png`,
          abbr,
        });
      });
    }

    // Return in NBA API format the frontend parser expects
    res.json({
      resultSets: [{
        name: 'Standings',
        headers: ['TeamID','TeamCity','TeamName','WINS','LOSSES','WinPCT','Conference','TeamAbbreviation','PlayoffRank'],
        rowSet: rows.map(r => {
          const parts = r.team.split(' ');
          const name = parts.slice(-1)[0];
          const city = parts.slice(0,-1).join(' ');
          return [r.teamId, city, name, r.wins, r.losses, parseFloat(r.pct), r.conf, r.abbr, r.rank];
        }),
      }]
    });
  } catch (e) {
    console.error('standings error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
