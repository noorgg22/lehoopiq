import { setCors, nbaFetch } from '../_nba.js';

export default async function handler(req, res) {
  setCors(res);
  const { playerId } = req.query;
  try {
    const data = await nbaFetch('playercareerstats', {
      PlayerID: playerId,
      PerMode: 'PerGame',
    });
    res.json(data);
  } catch (e) {
    console.error('player-career error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
