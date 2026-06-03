import { setCors, nbaFetch, SEASON } from '../_nba.js';

export default async function handler(req, res) {
  setCors(res);
  const { playerId } = req.query;
  try {
    const data = await nbaFetch('playerdashboardbygeneralsplits', {
      PlayerID: playerId,
      Season: SEASON,
      SeasonType: 'Regular Season',
      PerMode: 'PerGame',
      MeasureType: 'Advanced',
      PaceAdjust: 'N',
      PlusMinus: 'N',
      Rank: 'N',
      LeagueID: '00',
    });
    res.json(data);
  } catch (e) {
    console.error('player-splits error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
