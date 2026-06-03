import { setCors, nbaFetch, SEASON } from '../_nba.js';

export default async function handler(req, res) {
  setCors(res);
  const { teamId } = req.query;
  try {
    const data = await nbaFetch('teaminfocommon', {
      TeamID: teamId,
      Season: SEASON,
      LeagueID: '00',
      SeasonType: 'Regular Season',
    });
    res.json(data);
  } catch (e) {
    console.error('team-info error:', e.message);
    res.json({ resultSets: [{ name: 'TeamInfoCommon', headers: [], rowSet: [] }] });
  }
}
