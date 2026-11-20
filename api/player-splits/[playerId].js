import { setCors, NBA_HEADERS, SEASON } from '../_nba.js';

export default async function handler(req, res) {
  setCors(res);
  const { playerId } = req.query;
  try {
    // Try stats.nba.com with short timeout (will likely fail from Vercel)
    try {
      console.log(`[player-splits] Trying stats.nba.com for ${playerId}`);
      const params = new URLSearchParams({
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
      const url = `https://stats.nba.com/stats/playerdashboardbygeneralsplits?${params}`;
      const response = await fetch(url, {
        headers: NBA_HEADERS,
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        const data = await response.json();
        console.log(`[player-splits] stats.nba.com succeeded for ${playerId}`);
        return res.json(data);
      }
    } catch (e) {
      console.log(`[player-splits] stats.nba.com failed: ${e.message}`);
    }

    // Return empty splits structure so the page doesn't crash
    console.log(`[player-splits] Returning empty splits for ${playerId}`);
    res.json({
      resultSets: [
        {
          name: 'OverallPlayerDashboard',
          headers: [
            'GROUP_SET','GROUP_VALUE','GP','W','L','W_PCT','MIN','FGM','FGA','FG_PCT',
            'FG3M','FG3A','FG3_PCT','FTM','FTA','FT_PCT','OREB','DREB','REB','AST',
            'TOV','STL','BLK','BLKA','PF','PFD','PTS','PLUS_MINUS',
            'OFF_RATING','DEF_RATING','NET_RATING','AST_PCT','AST_TO','AST_RATIO',
            'OREB_PCT','DREB_PCT','REB_PCT','TM_TOV_PCT','EFG_PCT','TS_PCT','USG_PCT',
            'PACE','PIE','POSS'
          ],
          rowSet: [],
        },
        {
          name: 'LocationPlayerDashboard',
          headers: [
            'GROUP_SET','GROUP_VALUE','GP','W','L','W_PCT','MIN','FGM','FGA','FG_PCT',
            'FG3M','FG3A','FG3_PCT','FTM','FTA','FT_PCT','OREB','DREB','REB','AST',
            'TOV','STL','BLK','BLKA','PF','PFD','PTS','PLUS_MINUS',
            'OFF_RATING','DEF_RATING','NET_RATING','AST_PCT','AST_TO','AST_RATIO',
            'OREB_PCT','DREB_PCT','REB_PCT','TM_TOV_PCT','EFG_PCT','TS_PCT','USG_PCT',
            'PACE','PIE','POSS'
          ],
          rowSet: [],
        },
        {
          name: 'MonthPlayerDashboard',
          headers: [
            'GROUP_SET','GROUP_VALUE','GP','W','L','W_PCT','MIN','FGM','FGA','FG_PCT',
            'FG3M','FG3A','FG3_PCT','FTM','FTA','FT_PCT','OREB','DREB','REB','AST',
            'TOV','STL','BLK','BLKA','PF','PFD','PTS','PLUS_MINUS',
            'OFF_RATING','DEF_RATING','NET_RATING','AST_PCT','AST_TO','AST_RATIO',
            'OREB_PCT','DREB_PCT','REB_PCT','TM_TOV_PCT','EFG_PCT','TS_PCT','USG_PCT',
            'PACE','PIE','POSS'
          ],
          rowSet: [],
        },
      ],
    });
  } catch (e) {
    console.error('player-splits error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
