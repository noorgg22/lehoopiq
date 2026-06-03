// Vercel serverless function — NBA news via ESPN (used as proxy health check)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const response = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news?limit=8',
      { signal: AbortSignal.timeout(8000) }
    );
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
