import { setCors, nbaFetch } from '../_nba.js';

export default async function handler(req, res) {
  setCors(res);
  const { playerId } = req.query;
  try {
    const data = await nbaFetch('playerawards', { PlayerID: playerId });
    res.json(data);
  } catch (e) {
    console.error('player-awards error:', e.message);
    // Return empty awards — non-critical, degrade gracefully
    res.json({
      resultSets: [{
        name: 'PlayerAwards',
        headers: ['PLAYER_ID','SEASON','DESCRIPTION','TYPE','SUBTYPE1','SUBTYPE2','SUBTYPE3','ALL_NBA_TEAM_NUMBER'],
        rowSet: [],
      }],
    });
  }
}
