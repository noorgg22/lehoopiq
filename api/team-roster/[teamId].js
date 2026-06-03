import { setCors, nbaFetch, SEASON } from '../_nba.js';

export default async function handler(req, res) {
  setCors(res);
  const { teamId } = req.query;
  try {
    const data = await nbaFetch('commonteamroster', {
      TeamID: teamId,
      Season: SEASON,
      LeagueID: '00',
    });
    res.json(data);
  } catch (e) {
    console.error('team-roster error:', e.message);
    // Return empty roster rather than 500 so TeamPage degrades gracefully
    res.json({ resultSets: [{ name: 'CommonTeamRoster', headers: [], rowSet: [] }] });
  }
}
