// Vercel serverless function — proxies NBA stats.nba.com leaders endpoint
// Bypasses CORS since this runs server-side on Vercel's edge

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const stat = req.query.stat || 'PTS';
  const seasonType = req.query.seasonType || 'Regular Season';
  const season = '2025-26';

  const NBA_HEADERS = {
    'Host': 'stats.nba.com',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'x-nba-stats-origin': 'stats',
    'x-nba-stats-token': 'true',
    'Referer': 'https://www.nba.com/',
    'Origin': 'https://www.nba.com',
  };

  try {
    const params = new URLSearchParams({
      LeagueID: '00',
      PerMode: 'PerGame',
      Scope: 'S',
      Season: season,
      SeasonType: seasonType,
      StatCategory: stat,
    });

    const response = await fetch(
      `https://stats.nba.com/stats/leagueleaders?${params}`,
      { headers: NBA_HEADERS, signal: AbortSignal.timeout(8000) }
    );

    if (!response.ok) throw new Error(`NBA API ${response.status}`);
    const data = await response.json();

    // Reshape to match what the frontend expects
    const rs = data?.resultSet;
    if (!rs) return res.status(502).json({ error: 'No resultSet' });

    res.json({ resultSets: [rs] });
  } catch (e) {
    console.error('leaders error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
