// Shared NBA API helper — not exposed as an endpoint (underscore prefix)

export const SEASON = '2025-26';

export const NBA_HEADERS = {
  'Host': 'stats.nba.com',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'x-nba-stats-origin': 'stats',
  'x-nba-stats-token': 'true',
  'Referer': 'https://www.nba.com/',
  'Origin': 'https://www.nba.com',
  'Connection': 'keep-alive',
};

export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
}

export async function nbaFetch(endpoint, params) {
  const url = `https://stats.nba.com/stats/${endpoint}?${new URLSearchParams(params)}`;
  const response = await fetch(url, {
    headers: NBA_HEADERS,
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`NBA API ${response.status} for ${endpoint}`);
  return response.json();
}
