import { setCors, NBA_HEADERS, SEASON } from '../_nba.js';

// NBA team ID → ESPN abbreviation (lowercase)
const NBA_ID_TO_ESPN = {
  '1610612737':'atl','1610612738':'bos','1610612751':'bkn','1610612766':'cha',
  '1610612741':'chi','1610612739':'cle','1610612742':'dal','1610612743':'den',
  '1610612765':'det','1610612744':'gs','1610612745':'hou','1610612754':'ind',
  '1610612746':'lac','1610612747':'lal','1610612763':'mem','1610612748':'mia',
  '1610612749':'mil','1610612750':'min','1610612740':'no','1610612752':'ny',
  '1610612760':'okc','1610612753':'orl','1610612755':'phi','1610612756':'phx',
  '1610612757':'por','1610612758':'sac','1610612759':'sa','1610612761':'tor',
  '1610612762':'utah','1610612764':'wsh',
};

// NBA team ID → abbreviation (standard 3-letter)
const NBA_ID_TO_ABBR = {
  '1610612737':'ATL','1610612738':'BOS','1610612751':'BKN','1610612766':'CHA',
  '1610612741':'CHI','1610612739':'CLE','1610612742':'DAL','1610612743':'DEN',
  '1610612765':'DET','1610612744':'GSW','1610612745':'HOU','1610612754':'IND',
  '1610612746':'LAC','1610612747':'LAL','1610612763':'MEM','1610612748':'MIA',
  '1610612749':'MIL','1610612750':'MIN','1610612740':'NOP','1610612752':'NYK',
  '1610612760':'OKC','1610612753':'ORL','1610612755':'PHI','1610612756':'PHX',
  '1610612757':'POR','1610612758':'SAC','1610612759':'SAS','1610612761':'TOR',
  '1610612762':'UTA','1610612764':'WAS',
};

export default async function handler(req, res) {
  setCors(res);
  const { teamId } = req.query;
  try {
    // 1. Try stats.nba.com with short timeout
    try {
      console.log(`[team-info] Trying stats.nba.com for ${teamId}`);
      const params = new URLSearchParams({
        TeamID: teamId,
        Season: SEASON,
        LeagueID: '00',
        SeasonType: 'Regular Season',
      });
      const url = `https://stats.nba.com/stats/teaminfocommon?${params}`;
      const response = await fetch(url, {
        headers: NBA_HEADERS,
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        const data = await response.json();
        console.log(`[team-info] stats.nba.com succeeded for ${teamId}`);
        return res.json(data);
      }
    } catch (e) {
      console.log(`[team-info] stats.nba.com failed: ${e.message}`);
    }

    // 2. Try ESPN team API
    const espnAbbr = NBA_ID_TO_ESPN[teamId];
    if (espnAbbr) {
      try {
        console.log(`[team-info] Trying ESPN for ${teamId} (${espnAbbr})`);
        const espnRes = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${espnAbbr}`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (espnRes.ok) {
          const espnData = await espnRes.json();
          const team = espnData.team || espnData;
          const record = team.record?.items?.[0];
          const stats = {};
          if (record?.stats) {
            for (const s of record.stats) { stats[s.name] = s.value; }
          }
          const wins = Math.round(stats.wins || 0);
          const losses = Math.round(stats.losses || 0);
          const winPct = stats.winPercent || (wins + losses > 0 ? wins / (wins + losses) : 0);

          // Build response in TeamInfoCommon format
          const nbaAbbr = NBA_ID_TO_ABBR[teamId] || espnAbbr.toUpperCase();
          const nameParts = (team.displayName || team.name || '').split(' ');
          const teamName = nameParts.slice(-1)[0] || '';
          const teamCity = nameParts.slice(0, -1).join(' ') || '';

          const headers = [
            'TEAM_ID','SEASON_YEAR','TEAM_CITY','TEAM_NAME','TEAM_ABBREVIATION',
            'TEAM_CONFERENCE','TEAM_DIVISION','TEAM_CODE','TEAM_SLUG',
            'W','L','PCT','CONF_RANK','DIV_RANK','MIN_YEAR','MAX_YEAR'
          ];
          const row = [
            teamId, SEASON, teamCity, teamName, nbaAbbr,
            '', '', '', '',
            wins, losses, winPct.toFixed(3), '', '',
            '', ''
          ];
          console.log(`[team-info] ESPN succeeded for ${teamId}`);
          return res.json({ resultSets: [{ name: 'TeamInfoCommon', headers, rowSet: [row] }] });
        }
      } catch (e) {
        console.log(`[team-info] ESPN failed: ${e.message}`);
      }
    }

    // 3. Return meaningful empty state
    console.log(`[team-info] All sources failed for ${teamId}, returning empty`);
    const nbaAbbr = NBA_ID_TO_ABBR[teamId] || '';
    const headers = [
      'TEAM_ID','SEASON_YEAR','TEAM_CITY','TEAM_NAME','TEAM_ABBREVIATION',
      'TEAM_CONFERENCE','TEAM_DIVISION','TEAM_CODE','TEAM_SLUG',
      'W','L','PCT','CONF_RANK','DIV_RANK','MIN_YEAR','MAX_YEAR'
    ];
    res.json({ resultSets: [{ name: 'TeamInfoCommon', headers, rowSet: [[
      teamId, SEASON, '', '', nbaAbbr,
      '', '', '', '',
      0, 0, '.000', '', '',
      '', ''
    ]] }] });
  } catch (e) {
    console.error('team-info error:', e.message);
    res.json({ resultSets: [{ name: 'TeamInfoCommon', headers: [], rowSet: [] }] });
  }
}
