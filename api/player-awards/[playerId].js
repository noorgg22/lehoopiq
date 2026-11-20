import { setCors, NBA_HEADERS } from '../_nba.js';

// Award builder helpers — matches server.cjs format
const A = (D,S,T) => ({ D, S, ALL_NBA_TEAM_NUMBER: T||'' });
const as = S => A('All-Star',S);
const an1 = S => A('All-NBA',S,1), an2 = S => A('All-NBA',S,2), an3 = S => A('All-NBA',S,3);
const ad1 = S => A('All-Defensive',S,1), ad2 = S => A('All-Defensive',S,2);
const ar1 = S => A('All-Rookie',S,1), ar2 = S => A('All-Rookie',S,2);
const mvp = S => A('NBA Most Valuable Player',S);
const fmvp = S => A('NBA Finals Most Valuable Player',S);
const dpoy = S => A('NBA Defensive Player of the Year',S);
const roy = S => A('NBA Rookie of the Year',S);
const mip = S => A('NBA Most Improved Player',S);
const sm = S => A('NBA Sixth Man of the Year',S);
const chm = S => A('NBA Champion',S);
const sc = S => A('NBA Scoring Champion',S);

const HARDCODED_AWARDS = {
  '2544': [ // LeBron James
    as('2004-05'),as('2005-06'),as('2006-07'),as('2007-08'),as('2008-09'),as('2009-10'),as('2010-11'),as('2011-12'),as('2012-13'),as('2013-14'),as('2014-15'),as('2015-16'),as('2016-17'),as('2017-18'),as('2018-19'),as('2019-20'),as('2020-21'),as('2021-22'),as('2022-23'),as('2023-24'),as('2024-25'),
    an1('2005-06'),an1('2006-07'),an1('2007-08'),an1('2008-09'),an1('2009-10'),an1('2010-11'),an1('2011-12'),an1('2012-13'),an1('2013-14'),an1('2015-16'),an1('2016-17'),an1('2017-18'),an1('2018-19'),an1('2019-20'),
    an2('2014-15'),an2('2020-21'),an2('2021-22'),an2('2022-23'),
    ad1('2008-09'),ad1('2009-10'),ad1('2010-11'),ad1('2011-12'),ad1('2012-13'),ad2('2013-14'),ad2('2014-15'),ad2('2015-16'),
    mvp('2008-09'),mvp('2009-10'),mvp('2011-12'),mvp('2012-13'),
    fmvp('2011-12'),fmvp('2015-16'),fmvp('2019-20'),fmvp('2022-23'),
    chm('2011-12'),chm('2015-16'),chm('2019-20'),chm('2022-23'),
    ar1('2003-04'),
  ],
  '1629029': [ // Luka Dončić
    as('2020-21'),as('2021-22'),as('2022-23'),as('2023-24'),as('2024-25'),as('2025-26'),
    an1('2019-20'),an1('2020-21'),an1('2021-22'),an1('2022-23'),an1('2023-24'),an1('2024-25'),an1('2025-26'),
    sc('2023-24'),sc('2024-25'),sc('2025-26'),
    ar1('2018-19'),
  ],
  '1628983': [ // Shai Gilgeous-Alexander
    as('2022-23'),as('2023-24'),as('2024-25'),as('2025-26'),
    an1('2022-23'),an1('2023-24'),an1('2024-25'),an1('2025-26'),
    ad1('2024-25'),ad1('2025-26'),
    mvp('2024-25'),fmvp('2024-25'),chm('2024-25'),sc('2024-25'),sc('2025-26'),
  ],
  '203999': [ // Nikola Jokić
    as('2018-19'),as('2019-20'),as('2020-21'),as('2021-22'),as('2022-23'),as('2023-24'),as('2024-25'),as('2025-26'),
    an1('2020-21'),an1('2021-22'),an1('2022-23'),an1('2023-24'),an1('2024-25'),an1('2025-26'),
    an2('2018-19'),an2('2019-20'),
    mvp('2020-21'),mvp('2021-22'),mvp('2023-24'),
    fmvp('2022-23'),chm('2022-23'),
  ],
  '203507': [ // Giannis Antetokounmpo
    as('2016-17'),as('2017-18'),as('2018-19'),as('2019-20'),as('2020-21'),as('2021-22'),as('2022-23'),as('2023-24'),as('2024-25'),
    an1('2018-19'),an1('2019-20'),an1('2020-21'),an1('2021-22'),an1('2023-24'),an1('2024-25'),
    an2('2017-18'),an2('2022-23'),
    ad1('2019-20'),ad1('2020-21'),ad2('2018-19'),
    mvp('2018-19'),mvp('2019-20'),
    fmvp('2020-21'),chm('2020-21'),
    dpoy('2019-20'),dpoy('2022-23'),
    mip('2016-17'),
  ],
  '203954': [ // Joel Embiid
    as('2017-18'),as('2018-19'),as('2021-22'),as('2022-23'),as('2023-24'),as('2024-25'),
    an1('2022-23'),an1('2023-24'),an2('2024-25'),an3('2021-22'),
    ad2('2022-23'),ad2('2023-24'),
    mvp('2022-23'),sc('2022-23'),sc('2023-24'),
  ],
  '201939': [ // Stephen Curry
    as('2013-14'),as('2014-15'),as('2015-16'),as('2016-17'),as('2017-18'),as('2018-19'),as('2020-21'),as('2021-22'),as('2022-23'),as('2023-24'),as('2024-25'),as('2025-26'),
    an1('2014-15'),an1('2015-16'),an1('2018-19'),an1('2020-21'),an1('2021-22'),
    an2('2013-14'),an2('2016-17'),an2('2023-24'),
    an3('2024-25'),
    mvp('2014-15'),mvp('2015-16'),
    fmvp('2021-22'),
    chm('2014-15'),chm('2015-16'),chm('2017-18'),chm('2018-19'),chm('2021-22'),
  ],
  '201142': [ // Kevin Durant
    as('2009-10'),as('2010-11'),as('2011-12'),as('2012-13'),as('2013-14'),as('2015-16'),as('2016-17'),as('2017-18'),as('2018-19'),as('2020-21'),as('2021-22'),as('2022-23'),as('2023-24'),
    an1('2009-10'),an1('2010-11'),an1('2011-12'),an1('2012-13'),an1('2013-14'),an1('2017-18'),an1('2018-19'),an1('2020-21'),an1('2021-22'),
    an2('2015-16'),an2('2022-23'),
    ad2('2011-12'),
    mvp('2013-14'),sc('2009-10'),sc('2011-12'),sc('2012-13'),sc('2013-14'),
    fmvp('2016-17'),fmvp('2017-18'),chm('2016-17'),chm('2017-18'),
    roy('2007-08'),
  ],
  '201935': [ // James Harden
    as('2012-13'),as('2013-14'),as('2014-15'),as('2015-16'),as('2016-17'),as('2017-18'),as('2018-19'),as('2019-20'),as('2020-21'),as('2021-22'),
    an1('2017-18'),an1('2018-19'),an1('2019-20'),
    an2('2012-13'),an2('2013-14'),an2('2014-15'),an2('2020-21'),
    an3('2015-16'),an3('2016-17'),
    mvp('2017-18'),sc('2017-18'),sc('2018-19'),sc('2019-20'),
    sm('2011-12'),
  ],
  '202695': [ // Kawhi Leonard
    as('2015-16'),as('2016-17'),as('2018-19'),as('2019-20'),as('2020-21'),as('2021-22'),
    an1('2015-16'),an1('2016-17'),an2('2019-20'),an3('2020-21'),
    ad1('2014-15'),ad1('2015-16'),ad1('2016-17'),ad1('2017-18'),ad1('2018-19'),ad2('2021-22'),
    dpoy('2014-15'),dpoy('2015-16'),
    fmvp('2013-14'),fmvp('2018-19'),
    chm('2013-14'),chm('2018-19'),
  ],
  '203081': [ // Damian Lillard
    as('2013-14'),as('2014-15'),as('2015-16'),as('2017-18'),as('2018-19'),as('2019-20'),as('2020-21'),as('2021-22'),as('2022-23'),as('2023-24'),
    an1('2022-23'),an2('2020-21'),an3('2017-18'),an3('2018-19'),an3('2019-20'),
    sc('2022-23'),
    roy('2012-13'),
  ],
  '202681': [ // Kyrie Irving
    as('2013-14'),as('2014-15'),as('2015-16'),as('2016-17'),as('2017-18'),as('2018-19'),as('2021-22'),as('2022-23'),as('2023-24'),
    an1('2021-22'),an2('2015-16'),an3('2018-19'),
    fmvp('2015-16'),chm('2015-16'),
    roy('2011-12'),
  ],
  '1630162': [ // Anthony Edwards
    as('2023-24'),as('2024-25'),as('2025-26'),
    an2('2024-25'),an3('2023-24'),an3('2025-26'),
    roy('2020-21'),
  ],
  '1641705': [ // Victor Wembanyama
    as('2024-25'),as('2025-26'),
    an1('2024-25'),an1('2025-26'),
    ad1('2023-24'),ad1('2024-25'),ad1('2025-26'),
    dpoy('2025-26'),
    roy('2023-24'),
  ],
  '1629027': [ // Trae Young
    as('2021-22'),as('2022-23'),as('2023-24'),as('2024-25'),as('2025-26'),
    an2('2021-22'),an3('2022-23'),an3('2024-25'),
  ],
  '1630595': [ // Cade Cunningham
    as('2024-25'),as('2025-26'),
    an2('2025-26'),an3('2024-25'),
    mip('2022-23'),
  ],
  '1629630': [ // Ja Morant
    as('2021-22'),as('2022-23'),as('2023-24'),as('2024-25'),as('2025-26'),
    an2('2021-22'),an3('2022-23'),an3('2025-26'),
    mip('2021-22'),roy('2019-20'),
  ],
  '1628374': [ // Lauri Markkanen
    as('2022-23'),as('2024-25'),as('2025-26'),
    an3('2022-23'),
    mip('2022-23'),
  ],
  '1627759': [ // Jaylen Brown
    as('2023-24'),as('2024-25'),as('2025-26'),
    an2('2023-24'),an1('2024-25'),an3('2025-26'),
    fmvp('2023-24'),chm('2023-24'),ad2('2023-24'),
  ],
  '1630178': [ // Tyrese Maxey
    as('2023-24'),as('2024-25'),as('2025-26'),
    an3('2023-24'),an2('2024-25'),an2('2025-26'),
    mip('2023-24'),
  ],
  '1628378': [ // Donovan Mitchell
    as('2021-22'),as('2022-23'),as('2023-24'),as('2024-25'),as('2025-26'),
    an2('2022-23'),an2('2023-24'),an3('2024-25'),an3('2025-26'),
  ],
  '203497': [ // Rudy Gobert
    as('2020-21'),as('2021-22'),as('2022-23'),as('2024-25'),
    an3('2020-21'),an3('2021-22'),
    ad1('2017-18'),ad1('2018-19'),ad1('2020-21'),ad1('2021-22'),ad1('2022-23'),
    dpoy('2017-18'),dpoy('2018-19'),dpoy('2020-21'),dpoy('2022-23'),
  ],
  '1626157': [ // Karl-Anthony Towns
    as('2017-18'),as('2021-22'),as('2023-24'),as('2024-25'),as('2025-26'),
    an3('2023-24'),an2('2024-25'),an2('2025-26'),
    roy('2015-16'),
  ],
  '1627734': [ // Domantas Sabonis
    as('2022-23'),as('2023-24'),as('2024-25'),as('2025-26'),
    an3('2022-23'),an2('2023-24'),an2('2024-25'),an3('2025-26'),
    sm('2019-20'),sm('2020-21'),
  ],
  '1628386': [ // Jalen Brunson
    as('2023-24'),as('2024-25'),as('2025-26'),
    an2('2023-24'),an2('2024-25'),an3('2025-26'),
  ],
  '1626164': [ // Devin Booker
    as('2021-22'),as('2022-23'),as('2023-24'),as('2024-25'),as('2025-26'),
    an1('2021-22'),an1('2022-23'),an2('2023-24'),an2('2024-25'),an3('2025-26'),
  ],
  '202331': [ // Paul George
    as('2012-13'),as('2013-14'),as('2014-15'),as('2015-16'),as('2016-17'),as('2018-19'),as('2019-20'),as('2020-21'),as('2021-22'),as('2022-23'),as('2023-24'),
    an1('2018-19'),an2('2013-14'),an2('2019-20'),an3('2016-17'),an3('2020-21'),
    ad1('2013-14'),ad1('2014-15'),ad1('2015-16'),ad1('2016-17'),ad1('2018-19'),ad1('2019-20'),ad2('2020-21'),ad2('2021-22'),
    dpoy('2018-19'),
  ],
  '1628383': [ // Jayson Tatum
    as('2020-21'),as('2021-22'),as('2022-23'),as('2023-24'),as('2024-25'),as('2025-26'),
    an1('2022-23'),an1('2023-24'),an1('2024-25'),an2('2021-22'),an2('2025-26'),
    fmvp('2023-24'),chm('2023-24'),
  ],
  '1630169': [ // Tyrese Haliburton
    as('2023-24'),as('2024-25'),as('2025-26'),
    an3('2023-24'),an3('2024-25'),
  ],
  '1628472': [ // OG Anunoby
    as('2023-24'),
    ad1('2022-23'),ad1('2023-24'),ad2('2024-25'),
    chm('2023-24'),
  ],
  '1630581': [ // Josh Giddey
    as('2025-26'),
    an3('2025-26'),
  ],
  '1631094': [ // Paolo Banchero
    as('2024-25'),as('2025-26'),
    an3('2024-25'),an3('2025-26'),
    roy('2022-23'),
  ],
  '1627783': [ // Pascal Siakam
    as('2022-23'),as('2023-24'),as('2024-25'),
    an2('2022-23'),an3('2023-24'),
    chm('2018-19'),mip('2018-19'),
  ],
  '1629028': [ // Deandre Ayton
    as('2023-24'),
    ar1('2018-19'),
  ],
  '203114': [ // Khris Middleton
    as('2018-19'),as('2019-20'),as('2021-22'),
    chm('2020-21'),
  ],
  '203107': [ // Bradley Beal
    as('2018-19'),as('2020-21'),as('2021-22'),
    an3('2020-21'),sc('2020-21'),
  ],
  '1628978': [ // Mikal Bridges
    as('2023-24'),
    ad1('2022-23'),ad2('2023-24'),
    chm('2020-21'),
  ],
  '1628384': [ // Dejounte Murray
    as('2021-22'),as('2022-23'),as('2024-25'),
    ad2('2021-22'),
  ],
  '1629636': [ // Darius Garland
    as('2021-22'),as('2024-25'),
    an3('2024-25'),
  ],
  '1630596': [ // Evan Mobley
    as('2024-25'),as('2025-26'),
    an3('2023-24'),an2('2024-25'),an2('2025-26'),
    dpoy('2024-25'),ad1('2024-25'),ad1('2025-26'),
    roy('2021-22'),
  ],
  '1628389': [ // Bam Adebayo
    as('2019-20'),as('2020-21'),as('2023-24'),as('2024-25'),
    an3('2019-20'),an3('2023-24'),
    ad1('2022-23'),ad1('2023-24'),
  ],
  '203944': [ // Julius Randle
    as('2020-21'),as('2022-23'),as('2023-24'),
    an2('2020-21'),
    mip('2020-21'),
  ],
  '1630163': [ // LaMelo Ball
    as('2022-23'),as('2024-25'),as('2025-26'),
    an3('2022-23'),an2('2024-25'),an3('2025-26'),
    roy('2020-21'),
  ],
  '1630591': [ // Jalen Suggs
    as('2025-26'),
    ad2('2025-26'),
  ],
  '1641709': [ // Ausar Thompson
    as('2025-26'),
    ad1('2025-26'),
  ],
  '1630700': [ // Dyson Daniels
    as('2024-25'),as('2025-26'),
    ad1('2024-25'),ad1('2025-26'),
  ],
  '1631105': [ // Jalen Duren
    as('2025-26'),
    ar1('2022-23'),
  ],
  '1630552': [ // Jalen Johnson
    as('2025-26'),
    an3('2025-26'),
    mip('2025-26'),
  ],
  '1628991': [ // Jaren Jackson Jr.
    as('2023-24'),as('2024-25'),as('2025-26'),
    an3('2024-25'),
    dpoy('2022-23'),ad1('2022-23'),ad1('2023-24'),
  ],
  '203496': [ // Andre Drummond
    as('2015-16'),as('2019-20'),
  ],
  '1630532': [ // Franz Wagner
    as('2024-25'),as('2025-26'),
    an3('2024-25'),an2('2025-26'),
  ],
  '1629625': [ // Tyler Herro
    as('2023-24'),
    sm('2021-22'),
  ],
  '1630559': [ // Austin Reaves
    as('2025-26'),
    chm('2024-25'),
  ],
  '203992': [ // Bogdan Bogdanović
    chm('2024-25'),
  ],
  '1629014': [ // Anfernee Simons
    as('2023-24'),
  ],
};

function buildAwardsResponse(awards) {
  const headers = ['PLAYER_ID','SEASON','DESCRIPTION','TYPE','SUBTYPE1','SUBTYPE2','SUBTYPE3','ALL_NBA_TEAM_NUMBER'];
  const rowSet = awards.map(a => [a.PLAYER_ID||'', a.S||a.SEASON||'', a.D||a.DESCRIPTION||'', '', '', '', '', a.ALL_NBA_TEAM_NUMBER||'']);
  return { resultSets: [{ name: 'PlayerAwards', headers, rowSet }] };
}

const EMPTY_AWARDS = {
  resultSets: [{
    name: 'PlayerAwards',
    headers: ['PLAYER_ID','SEASON','DESCRIPTION','TYPE','SUBTYPE1','SUBTYPE2','SUBTYPE3','ALL_NBA_TEAM_NUMBER'],
    rowSet: [],
  }],
};

export default async function handler(req, res) {
  setCors(res);
  const { playerId } = req.query;
  try {
    // 1. Try stats.nba.com with short timeout
    try {
      console.log(`[player-awards] Trying stats.nba.com for ${playerId}`);
      const url = `https://stats.nba.com/stats/playerawards?${new URLSearchParams({ PlayerID: playerId })}`;
      const response = await fetch(url, {
        headers: NBA_HEADERS,
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        const data = await response.json();
        console.log(`[player-awards] stats.nba.com succeeded for ${playerId}`);
        return res.json(data);
      }
    } catch (e) {
      console.log(`[player-awards] stats.nba.com failed: ${e.message}`);
    }

    // 2. Fall back to hardcoded awards
    const hardcoded = HARDCODED_AWARDS[playerId];
    if (hardcoded) {
      console.log(`[player-awards] Using hardcoded awards for ${playerId}`);
      return res.json(buildAwardsResponse(hardcoded));
    }

    // 3. No awards data — return empty (non-critical, degrade gracefully)
    console.log(`[player-awards] No awards data for ${playerId}, returning empty`);
    res.json(EMPTY_AWARDS);
  } catch (e) {
    console.error('player-awards error:', e.message);
    // Always return empty awards rather than 500 — non-critical data
    res.json(EMPTY_AWARDS);
  }
}
