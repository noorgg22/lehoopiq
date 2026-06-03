import { setCors, nbaFetch } from '../_nba.js';

export default async function handler(req, res) {
  setCors(res);
  const { playerId } = req.query;
  try {
    const data = await nbaFetch('commonplayerinfo', { PlayerID: playerId });
    res.json(data);
  } catch (e) {
    console.error('player-info error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
