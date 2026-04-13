import React, { useState, useEffect, useRef } from 'react';

const PROXY = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001/api';

const C = {
  bg: '#09090b', surface: '#18181b', surfaceHi: '#27272a',
  border: '#27272a', text: '#fafafa', textSub: '#a1a1aa', textMuted: '#52525b',
  orange: '#f97316', orangeDim: 'rgba(249,115,22,0.12)',
  emerald: '#34d399', amber: '#fbbf24', sky: '#38bdf8',
  violet: '#a78bfa', rose: '#fb7185', green: '#4ade80', pink: '#f472b6',
};

const ATTRIBUTES = [
  { key: 'scoring',    label: 'Scoring',      color: '#f97316' },
  { key: 'playmaking', label: 'Playmaking',   color: '#34d399' },
  { key: 'threePoint', label: '3PT Shooting', color: '#38bdf8' },
  { key: 'rimFinish',  label: 'Rim Finish',   color: '#a78bfa' },
  { key: 'midrange',   label: 'Midrange',     color: '#fbbf24' },
  { key: 'creation',   label: 'Shot Creation',color: '#fb7185' },
  { key: 'defense',    label: 'Defense',      color: '#4ade80' },
  { key: 'rebounding', label: 'Rebounding',   color: '#f472b6' },
  { key: 'intangibles',label: 'Intangibles',  color: '#c084fc' },
];

const STAT_EXPLANATIONS: Record<string, string> = {
  'Off Rating': 'Points scored per 100 possessions. League avg ~115.',
  'Def Rating': 'Points allowed per 100 possessions. Lower is better.',
  'Net Rating': 'Off Rating minus Def Rating. Overall impact per 100 possessions.',
  'USG%': 'Percentage of team plays used by player while on floor.',
  'AST%': 'Percentage of teammate field goals assisted while on floor.',
  'REB%': 'Percentage of available rebounds grabbed while on floor.',
  'STL%': 'Percentage of opponent possessions ending in steal per game.',
  'BLK%': 'Percentage of opponent 2PT attempts blocked while on floor.',
  'BPM': 'Box Plus/Minus. Points above avg per 100 possessions vs replacement.',
  'TS%': 'True Shooting %. Shooting efficiency accounting for 2s, 3s & FTs.',
  'eFG%': 'Effective FG%. Adjusts for 3-pointers being worth more than 2s.',
  'VORP': 'Value Over Replacement Player. Total value above a replacement-level player.',
};

const NOTABLE_STRETCHES: Record<string, {
  title: string; period: string; stats: string; context: string; emoji: string; tier: 'legendary' | 'great' | 'notable';
}[]> = {
  '1629029': [
    { tier: 'legendary', emoji: '🔥', title: '73 Points vs Atlanta', period: 'January 26, 2024', stats: '73 PTS | 10 REB | 7 AST | 25/33 FG | 8/13 3PT', context: '4th highest single-game score in NBA history. Only Wilt Chamberlain & Kobe Bryant scored more.' },
    { tier: 'legendary', emoji: '👑', title: '2023-24 Scoring Title', period: '2023-24 Season', stats: '33.9 PPG | 9.2 REB | 9.8 AST | 5× All-NBA 1st Team', context: '6th highest scoring average in the last 50 years. Won scoring title by wide margin.' },
    { tier: 'legendary', emoji: '🚀', title: 'Historic Lakers Debut', period: 'October 2025', stats: '92 PTS in first 2 games (43+49)', context: 'Most points by a Lakers player in first 2 games ever. Surpassed Michael Jordan on all-time list.' },
    { tier: 'great', emoji: '🏆', title: '2024 WCF Dominance', period: 'May 2024 Playoffs', stats: 'Game-winning 3PT in Game 2 | 36 PTS in closeout Game 5', context: 'Led Dallas to NBA Finals with back-to-back iconic performances vs Minnesota.' },
    { tier: 'great', emoji: '⚡', title: 'Only Player with 25/8/8 Career', period: 'Career', stats: '29.2 PPG | 8.5 REB | 8.2 AST — historic profile', context: 'Only player in NBA history to average at least 25 PTS, 8 REB, 8 AST for entire career.' },
    { tier: 'notable', emoji: '📊', title: '2025-26 Lakers Season', period: '2025-26 Season', stats: '33.5 PPG | 7.7 REB | 8.3 AST | 47.6% FG in 64 games', context: 'Elite production after blockbuster trade. Missed playoffs push due to hamstring injury.' },
  ],
  '201935': [
    { tier: 'legendary', emoji: '🔥', title: '32 Consecutive 30-Point Games', period: 'Dec 13 2018 – Feb 21 2019', stats: '41.1 PPG during streak | 4 games of 50+ | Career-high 61 PTS', context: '2nd longest 30-point streak in NBA history. Only Wilt Chamberlain (65) has more.' },
    { tier: 'legendary', emoji: '🌶️', title: 'January 2019 — Greatest Scoring Month', period: 'January 2019', stats: '43.6 PPG | 8.7 REB | 6.7 AST over 14 games', context: 'Widely considered the greatest single month of scoring in modern NBA history.' },
    { tier: 'legendary', emoji: '👑', title: '2018-19 Scoring Season', period: '2018-19 Season', stats: '36.1 PPG | 9 games of 50+ | Scored 30+ vs all 29 opponents', context: '7th highest scoring average all-time. First player ever to score 30+ vs every team in one season.' },
    { tier: 'great', emoji: '🎯', title: '2021-22 Facilitator Season', period: '2021-22 Season', stats: '22.5 PPG | 10.3 AST | 8.0 REB | Led NBA in assists', context: 'Transformed into elite playmaker. Led NBA in assists while shooting 49% from the field.' },
    { tier: 'notable', emoji: '📊', title: '3× NBA Scoring Champion', period: '2018, 2019, 2020', stats: 'Led NBA in scoring 3 consecutive seasons | 8× All-Star', context: 'Most dominant scoring era by a guard since Michael Jordan in the 1980s-90s.' },
  ],
  '1628983': [
    { tier: 'legendary', emoji: '🌩️', title: 'Broke Wilt\'s 63-Year Record', period: 'Nov 2024 – Mar 2026', stats: '127 consecutive 20+ point games (NBA ALL-TIME RECORD)', context: 'Surpassed Wilt Chamberlain\'s record that stood since 1962. Odds: 1 in 3.2 quintillion.' },
    { tier: 'legendary', emoji: '👑', title: 'MVP + Finals MVP + Scoring Title', period: '2024-25 Season', stats: '32.7 PPG | 51.9% FG | 89.8% FT | Led OKC to championship', context: 'Only the 4th player in NBA history to win MVP, Finals MVP & Scoring Title same season.' },
    { tier: 'legendary', emoji: '🔥', title: '4 × 50-Point Games in 19 Games', period: 'Jan 22 – Mar 3, 2025', stats: '54, 52, 51, 50 PTS in a span of just 19 games', context: 'Unprecedented burst of 50-point performances. Historic efficiency throughout.' },
    { tier: 'great', emoji: '🛡️', title: 'Elite Two-Way Dominance', period: '2022-2025', stats: '2.0+ STL per game for 3 straight seasons | Led league in total steals', context: 'One of the rare players to rank top-5 in scoring AND top-3 in defensive impact simultaneously.' },
    { tier: 'notable', emoji: '📊', title: '2023-24 Runner-Up Season', period: '2023-24 Season', stats: '30.1 PPG | 6.2 AST | 2.0 STL | 53.5% FG | Led OKC to best record in West', context: 'Finished 2nd in MVP voting. Set franchise records and established OKC as a true contender.' },
  ],
  '203954': [
    { tier: 'legendary', emoji: '🔥', title: '70 Points vs San Antonio', period: 'January 22, 2024', stats: '70 PTS | 18/31 FG | 34/36 FT | 18 REB in 37 minutes', context: 'Highest single-game score of 2023-24 season. Most FT makes in a 70+ point game ever.' },
    { tier: 'legendary', emoji: '👑', title: '2022-23 MVP & Scoring Title', period: '2022-23 Season', stats: '33.1 PPG | 10.2 REB | 4.2 AST | 52.5% FG', context: 'Won MVP averaging 33 PPG — first center to win scoring title since Shaq in 1995.' },
    { tier: 'great', emoji: '🎯', title: '2023 Playoff Dominance', period: '2023 Eastern Semifinals', stats: '31.1 PPG | 11.7 REB | 4.2 AST vs Boston Celtics', context: 'Dominant playoff run even in series loss. Showed elite two-way capability at biggest stage.' },
    { tier: 'notable', emoji: '📊', title: 'Back-to-Back 30+ PPG Seasons', period: '2022-2024', stats: '30.6 PPG (2022-23) | 34.7 PPG (2023-24) | 2× All-NBA', context: 'Two consecutive seasons of 30+ scoring. Among the most dominant big man scoring runs in decades.' },
  ],
  '203999': [
    { tier: 'legendary', emoji: '👑', title: '3× NBA MVP (2021, 2022, 2024)', period: '2020-21, 2021-22, 2023-24', stats: '26.4 PPG | 12.4 REB | 9.0 AST across 3 MVP seasons', context: 'Only center to win 3 MVPs in the 3-point era. Completely redefined what a center can be.' },
    { tier: 'legendary', emoji: '🏆', title: '2023 NBA Finals MVP', period: '2023 NBA Finals vs Miami', stats: '30.2 PPG | 14.0 REB | 7.2 AST | 58% FG — Unanimous', context: 'Brought Denver its first NBA championship. Most complete Finals performance by a big man in modern era.' },
    { tier: 'legendary', emoji: '🔥', title: 'First Triple-Double Season Average', period: '2024-25 Season', stats: '29.6 PPG | 13.0 REB | 10.2 AST — Historic first', context: 'Became the first player in NBA history to average a triple-double for an entire season.' },
    { tier: 'great', emoji: '⚡', title: 'Most Efficient Scoring Season for a Big', period: '2021-22 Season', stats: '27.1 PPG | 13.8 REB | 7.9 AST | 58.3% FG', context: 'Most efficient scoring season ever for a player averaging 27+ pts and 13+ rebounds.' },
    { tier: 'notable', emoji: '📊', title: '2023 Playoff Run', period: '2023 Playoffs', stats: '30.0 PPG | 13.5 REB | 9.5 AST | 58% FG across 20 games', context: 'Statistically the most complete playoff performance by any big man in NBA history.' },
  ],
  '2544': [
    { tier: 'legendary', emoji: '👑', title: 'NBA All-Time Scoring Record', period: 'February 7, 2023', stats: '38,652+ career points — BROKEN KAREEM\'S ALL-TIME RECORD', context: 'Passed Kareem Abdul-Jabbar to become the NBA\'s all-time leading scorer at age 38.' },
    { tier: 'legendary', emoji: '🏆', title: '2016 Finals Comeback — 3-1 Down', period: '2016 NBA Finals vs Golden State', stats: '29.7 PPG | 11.3 REB | 8.9 AST | Iconic chase-down block in Game 7', context: 'Greatest Finals comeback in NBA history. Led Cleveland to its first ever championship.' },
    { tier: 'legendary', emoji: '🔥', title: '2012-13 Heat Winning Streak', period: 'February-March 2013', stats: '27 consecutive wins | LeBron 61.3% FG during stretch', context: 'Led Miami Heat on the longest winning streak in 20 years. Historically efficient.' },
    { tier: 'great', emoji: '🎯', title: '2018 Solo Playoff Run', period: '2018 Playoffs', stats: '34.0 PPG | 9.1 REB | 9.0 AST | Carried CLE to Finals alone', context: 'Single-handedly carried a weak Cavaliers roster to the NBA Finals.' },
    { tier: 'great', emoji: '⚡', title: '2013 Finals MVP', period: '2013 NBA Finals vs San Antonio', stats: '25.3 PPG | 10.9 REB | 7.0 AST | Shot 64% in Games 6 & 7', context: 'Clutch performance when it mattered most against the dynasty Spurs.' },
    { tier: 'notable', emoji: '📊', title: 'Age 38 Scoring Season', period: '2022-23 Season', stats: '28.9 PPG | 8.3 REB | 6.8 AST at age 38', context: 'Most points ever scored in a season by a 38-year-old. Defying age completely.' },
  ],
  '203507': [
    { tier: 'legendary', emoji: '👑', title: 'Back-to-Back MVP (2019, 2020)', period: '2018-19 & 2019-20', stats: '27.7 PPG | 13.6 REB | 5.9 AST | 55.3% FG both seasons', context: 'First player since LeBron James to win consecutive MVP awards.' },
    { tier: 'legendary', emoji: '🏆', title: '2021 Finals MVP — 50 Points in Clincher', period: '2021 NBA Finals vs Phoenix', stats: '35.2 PPG | 13.2 REB | 5.0 AST | 50 PTS in Game 6', context: '50-point performance in closeout game. One of the greatest Finals performances ever.' },
    { tier: 'legendary', emoji: '🔥', title: '64 Points vs Indiana Pacers', period: 'December 29, 2020', stats: '64 PTS | 14 REB | 3 BLK | 23/31 FG | 17/19 FT', context: 'Franchise record. Most points ever on fewer than 35 field goal attempts.' },
    { tier: 'great', emoji: '🛡️', title: '2× Defensive Player of the Year', period: '2020 & 2023', stats: 'DPOY 2020 & 2023 | 2× All-Defensive 1st Team', context: 'Elite scorer AND elite rim protector. One of the most complete players in NBA history.' },
    { tier: 'notable', emoji: '📊', title: '2022-23 MVP Runner-Up', period: '2022-23 Season', stats: '31.1 PPG | 11.8 REB | 5.7 AST | 55.3% FG', context: 'Many argued Giannis deserved the MVP over Embiid. Another historically great campaign.' },
  ],
  '201142': [
    { tier: 'legendary', emoji: '🔥', title: '2013-14 MVP Season', period: '2013-14 Season', stats: '32.0 PPG | 7.4 REB | 5.5 AST | 50/40/90 splits', context: 'Won MVP with iconic "You\'re the real MVP" speech. One of the all-time great scoring seasons.' },
    { tier: 'legendary', emoji: '🏆', title: 'Back-to-Back Finals MVP (2017, 2018)', period: '2017 & 2018 NBA Finals', stats: '35.2 PPG | 7.0 REB | 5.4 AST in 2017 | 28.8 PPG in 2018', context: 'Statistically perfect Finals performances. Joined greatest team ever assembled.' },
    { tier: 'great', emoji: '⚡', title: '4× NBA Scoring Champion', period: '2010, 2011, 2012, 2014', stats: 'Led NBA in scoring 4 times | First title at just 21 years old', context: 'Dominated scoring charts during OKC prime years before MVP season.' },
    { tier: 'notable', emoji: '📊', title: 'Age 37 Resurgence', period: '2025-26 Season', stats: '25.9 PPG | 7.4 REB | 5.3 AST at age 37 | Leading HOU', context: 'Still elite in year 18 of his career. Proving longevity rivals his scoring greatness.' },
  ],
  '201939': [
    { tier: 'legendary', emoji: '🔥', title: '402 Three-Pointers in a Season', period: '2015-16 Season', stats: '402 3PM | 45.4% 3PT | 30.1 PPG | Unanimous MVP', context: 'Shattered his own record by 116 three-pointers. Permanently changed how basketball is played.' },
    { tier: 'legendary', emoji: '👑', title: 'First Unanimous MVP in NBA History', period: '2015-16 Season', stats: '30.1 PPG | 6.7 AST | Warriors went 73-9', context: 'Only player ever to win MVP unanimously. Led team to best regular season record ever.' },
    { tier: 'legendary', emoji: '🏆', title: '4× NBA Champion', period: '2015, 2017, 2018, 2022', stats: '4 rings | 2022 Finals MVP | 6× All-Star', context: 'Most decorated player of the Warriors dynasty era.' },
    { tier: 'great', emoji: '⚡', title: '2022 Finals MVP', period: '2022 NBA Finals vs Boston', stats: '31.2 PPG | 6.0 AST | 5.2 REB | 44% from 3PT', context: 'Won Finals MVP 7 years after first championship. Silenced all critics.' },
    { tier: 'notable', emoji: '📊', title: 'All-Time Three-Point Record', period: 'December 14, 2021', stats: 'Broke Ray Allen\'s all-time record | Now 3,700+ career threes', context: 'Passed Ray Allen to become the NBA\'s all-time three-point leader. A record that may never be broken.' },
  ],
  '1629027': [
    { tier: 'great', emoji: '🔥', title: '2021 Playoffs Miracle Run', period: '2021 Playoffs', stats: '29.2 PPG | 9.8 AST | Led Hawks to ECF as 5th seed', context: 'Carried Atlanta to Eastern Conference Finals. Became the villain at Madison Square Garden.' },
    { tier: 'notable', emoji: '📊', title: 'Elite Playmaking Seasons', period: '2019-2024', stats: 'Led NBA in assists multiple seasons | 3× All-Star', context: 'Among the most creative passers of his generation despite small frame.' },
  ],
  '1630162': [
    { tier: 'legendary', emoji: '🔥', title: '55 Points vs San Antonio', period: 'January 18, 2026', stats: '55 PTS | 10/17 2PT | 9/16 3PT | 57.6% FG | Career High', context: 'New career high in 2025-26 season. One of the most explosive individual performances this year.' },
    { tier: 'great', emoji: '🏆', title: '2024 WCF Run', period: '2024 Playoffs', stats: '28.5 PPG | 7.3 REB | 5.0 AST | Led MIN to WCF', context: 'Carried Timberwolves to Western Conference Finals. Announced himself as a true superstar.' },
    { tier: 'great', emoji: '⚡', title: 'All-Star Game MVP 2025', period: 'February 2025', stats: '32 PTS across All-Star weekend | 10 of 14 MVP votes', context: 'Dominated All-Star weekend and won MVP convincingly. The face of the next generation.' },
    { tier: 'notable', emoji: '📊', title: 'Youngest to Score 40+ at 20', period: 'March 18, 2021', stats: '42 PTS at age 19 — 3rd youngest 40-point game in NBA history', context: 'Historic performance as a rookie. Showed elite scoring ceiling immediately.' },
  ],
  '1626164': [
    { tier: 'legendary', emoji: '🔥', title: '70 Points vs Boston Celtics', period: 'March 24, 2017', stats: '70 PTS | 21/40 FG | 24/26 FT | 8 AST at age 20', context: 'Youngest player ever to score 70 points. 6th highest single-game total in NBA history.' },
    { tier: 'great', emoji: '🏆', title: '2021 NBA Finals Run', period: '2021 NBA Finals vs Milwaukee', stats: '31.8 PPG | 5.0 REB | 5.2 AST in Finals', context: 'Led Suns to NBA Finals on a breakout stage. Showed he belongs among the elite.' },
    { tier: 'notable', emoji: '📊', title: '3× All-Star & Scoring Growth', period: '2022-2026', stats: 'Career-best 25.8 PPG in 2025-26 | Elite mid-range scorer', context: 'Consistent improvement season over season. One of the purest scorers in the modern era.' },
  ],
  '1628378': [
    { tier: 'legendary', emoji: '🔥', title: '71 Points in Overtime Playoff Game', period: 'April 16, 2023', stats: '71 PTS | 7/14 3PT | 26/28 FT | vs Indiana Pacers', context: 'Most points ever scored in a playoff game. Historic performance in overtime thriller.' },
    { tier: 'great', emoji: '🏆', title: 'Cleveland Renaissance', period: '2022-2026', stats: '27.8 PPG this season | Led CLE to consistent contention', context: 'Transformed Cleveland into a consistent playoff contender. Averaging career-best numbers.' },
    { tier: 'notable', emoji: '📊', title: 'Utah Playoff Runs', period: '2020-2022', stats: 'Back-to-back 50+ point playoff games in 2020 bubble', context: 'Carried Jazz deep in playoffs multiple years. Established himself as a bonafide star.' },
  ],
  '1628973': [
    { tier: 'legendary', emoji: '🔥', title: '61 Points vs Charlotte Hornets', period: 'December 2024', stats: '61 PTS | Career High | Led NYK comeback win', context: 'Career-high performance in a crucial Knicks win. Cemented himself as NYC\'s superstar.' },
    { tier: 'great', emoji: '🏆', title: '2024 Playoff Heroics', period: '2024 Playoffs', stats: '32.7 PPG in 2024 playoffs | Multiple 40+ games | Led NYK deep', context: 'Carried injury-depleted Knicks deep into 2024 playoffs. One of the great individual playoff runs.' },
    { tier: 'notable', emoji: '📊', title: 'King of New York', period: '2022-2026', stats: '26.0 PPG in 2025-26 | NY\'s most important player since Ewing', context: 'Became the face of a franchise and a city. NYC embraced him as their star completely.' },
  ],
  '1627759': [
    { tier: 'legendary', emoji: '🔥', title: '50 Points vs LA Clippers', period: '2025-26 Season', stats: '50 PTS vs Kawhi Leonard | Career-defining performance', context: 'Career-high performance while being guarded by Kawhi Leonard. Catapulted into MVP conversation.' },
    { tier: 'great', emoji: '🏆', title: '2024 Finals MVP', period: '2024 NBA Finals vs Dallas', stats: '21.0 PPG | 5.5 REB | 5.0 AST | Won Finals MVP', context: 'Won Finals MVP as Celtics won championship. First Finals MVP as a second option in modern era.' },
    { tier: 'notable', emoji: '📊', title: '2025-26 MVP Candidate Season', period: '2025-26 Season', stats: '28.7 PPG | Carrying Celtics without Tatum | All-NBA lock', context: 'Stepped up massively with Tatum injured. Making case for being an elite No. 1 option.' },
  ],
  '1630178': [
    { tier: 'great', emoji: '🔥', title: '2024-25 Breakout Season', period: '2024-25 Season', stats: '26.3 PPG | Elite athleticism | Led PHI without Embiid', context: 'Emerged as true star carrying Philadelphia. Won Most Improved Player award.' },
    { tier: 'notable', emoji: '📊', title: '2025-26 Continued Growth', period: '2025-26 Season', stats: '28.4 PPG | 5.6 AST | 1.9 STL | Elite two-way guard', context: 'Continued elite production. Among the most improved young stars in the league.' },
  ],
  '202695': [
    { tier: 'legendary', emoji: '🏆', title: '2× NBA Finals MVP', period: '2014 & 2019', stats: '2014: 17.8 PPG | 2019: 28.5 PPG | Both series wins', context: 'Won Finals MVP with two different franchises (San Antonio & Toronto). Elite playoff performer.' },
    { tier: 'legendary', emoji: '🔥', title: 'The Shot — 2019 Playoffs', period: 'May 12, 2019', stats: 'Series-winning buzzer beater vs Philly | Bounced 4 times', context: 'The most iconic buzzer beater of the modern era. Bounced off the rim 4 times before going in.' },
    { tier: 'great', emoji: '🛡️', title: '2× Defensive Player of the Year', period: '2015 & 2016', stats: 'Back-to-back DPOY | Best perimeter defender of his era', context: 'Defined the term "two-way superstar." Equal impact on both ends of the floor.' },
    { tier: 'notable', emoji: '📊', title: '2025-26 Resurgence', period: '2025-26 Season', stats: '28.0 PPG | 9.8 REB | 1.9 STL | Elite efficiency', context: 'Healthy Kawhi showing elite form. Reminding everyone why he\'s one of the all-time greats when available.' },
  ],
  '1627750': [
    { tier: 'legendary', emoji: '🔥', title: '2020 Bubble Playoff Run', period: '2020 NBA Playoffs', stats: '26.5 PPG | Multiple 50+ games | Led DEN to WCF', context: 'One of the greatest individual playoff runs ever. Back-to-back 50-point games in same series.' },
    { tier: 'legendary', emoji: '🏆', title: '2023 NBA Champion', period: '2023 NBA Playoffs', stats: '26.1 PPG | 6.2 AST | 4.3 REB | Clutch moments throughout', context: 'Crucial partner to Jokic in Denver\'s championship run. Hit massive shots all playoffs.' },
    { tier: 'notable', emoji: '📊', title: '2025-26 Season', period: '2025-26 Season', stats: '25.4 PPG | 8.8 AST | Running elite 2-man game with Jokic', context: 'Running one of the most lethal two-man games in the NBA alongside Jokic.' },
  ],
  '1641705': [
    { tier: 'legendary', emoji: '🌟', title: 'Most Anticipated Rookie in NBA History', period: '2023-24 Season', stats: '21.4 PPG | 10.6 REB | 3.6 BLK | Won Rookie of the Year', context: 'The most hyped prospect since LeBron James. Lived up to every expectation immediately.' },
    { tier: 'legendary', emoji: '🛡️', title: 'All-Time Blocks Record Pace', period: '2024-2026', stats: '3.1 BLK per game in 2025-26 | Led NBA in blocks both seasons', context: 'Leading the NBA in blocks in consecutive seasons. Generational defensive talent unlike anything seen before.' },
    { tier: 'great', emoji: '🔥', title: 'Historic Two-Way Profile', period: '2024-25 Season', stats: '24.5 PPG | 10.7 REB | 3.7 BLK | Shot 37% from 3PT', context: 'No player his size has ever combined scoring, rebounding, shot-blocking AND three-point shooting like this.' },
    { tier: 'notable', emoji: '📊', title: 'DPOY Favorite 2025-26', period: '2025-26 Season', stats: '24.8 PPG | 11.5 REB | 3.1 BLK | DPOY frontrunner', context: 'Runaway favorite for Defensive Player of the Year. Transforming San Antonio into a defensive force.' },
  ],
  '1630595': [
    { tier: 'great', emoji: '🔥', title: 'Detroit Pistons Revival', period: '2024-26 Seasons', stats: '24.5 PPG | 9.9 AST | Led DET back to relevance', context: 'Single-handedly making Detroit relevant again. Leading the NBA in assists this season.' },
    { tier: 'notable', emoji: '📊', title: '2025-26 Breakout Season', period: '2025-26 Season', stats: '24.5 PPG | 9.9 AST | 8.7 REB | Elite triple-threat', context: 'Posted career-best numbers across the board. Emerging as one of the best point guards in the NBA.' },
  ],
};

function getAwardConfig(description: string) {
  const configs: Record<string, { emoji: string; color: string; shortLabel: string }> = {
    'NBA Most Valuable Player': { emoji: '🏆', color: '#f97316', shortLabel: 'MVP' },
    'NBA Finals Most Valuable Player': { emoji: '🏆', color: '#fbbf24', shortLabel: 'Finals MVP' },
    'Conference Finals Most Valuable Player': { emoji: '🌟', color: '#a78bfa', shortLabel: 'CF MVP' },
    'NBA Defensive Player of the Year': { emoji: '🛡️', color: '#34d399', shortLabel: 'DPOY' },
    'NBA Rookie of the Year': { emoji: '⭐', color: '#38bdf8', shortLabel: 'ROY' },
    'NBA Most Improved Player': { emoji: '📈', color: '#a78bfa', shortLabel: 'MIP' },
    'NBA Sixth Man of the Year': { emoji: '⚡', color: '#fb7185', shortLabel: '6MOY' },
    'NBA Champion': { emoji: '💍', color: '#fbbf24', shortLabel: 'Champion' },
    'NBA Scoring Champion': { emoji: '🎯', color: '#fb7185', shortLabel: 'Scoring Champ' },
  };
  for (const [key, val] of Object.entries(configs)) {
    if (description?.includes(key)) return val;
  }
  return { emoji: '🏅', color: '#a1a1aa', shortLabel: description?.slice(0, 15) || 'Award' };
}

function percentile(value: number, allValues: number[], higherIsBetter = true): number {
  if (!allValues.length || value === null || value === undefined || isNaN(value)) return 0;
  const sorted = [...allValues].filter(v => !isNaN(v) && v !== null).sort((a, b) => a - b);
  const rank = sorted.filter(v => (higherIsBetter ? v <= value : v >= value)).length;
  return Math.round((rank / sorted.length) * 100);
}

function parseResultSet(data: any, setName?: string) {
  const rs = setName
    ? data?.resultSets?.find((r: any) => r.name === setName)
    : data?.resultSet || data?.resultSets?.[0];
  if (!rs) return { headers: [], rows: [] };
  const headers: string[] = rs.headers;
  const rows = rs.rowSet.map((row: any[]) =>
    Object.fromEntries(headers.map((h, i) => [h, row[i]]))
  );
  return { headers, rows };
}

function getTooltipStats(attr: string, player: any): { label: string; value: string }[] {
  const p = player || {};
  const fmt = (v: any) => v != null && !isNaN(+v) ? (+v).toFixed(1) : 'N/A';
  const fmtp = (v: any) => v != null && !isNaN(+v) ? `${(+v * 100).toFixed(1)}%` : 'N/A';
  const maps: Record<string, { label: string; value: string }[]> = {
    scoring: [{ label: 'True Shooting %', value: fmtp(p.TS_PCT) }, { label: 'eFG%', value: fmtp(p.EFG_PCT) }, { label: 'FG%', value: fmtp(p.FG_PCT) }, { label: 'AST/TO', value: fmt(p.AST_TO) }, { label: 'USG%', value: fmtp(p.USG_PCT) }, { label: 'PTS/g', value: fmt(p.PTS) }],
    playmaking: [{ label: 'AST%', value: fmtp(p.AST_PCT) }, { label: 'AST/TO', value: fmt(p.AST_TO) }, { label: 'AST/g', value: fmt(p.AST) }, { label: 'TOV/g', value: fmt(p.TOV) }, { label: 'USG%', value: fmtp(p.USG_PCT) }],
    threePoint: [{ label: '3P%', value: fmtp(p.FG3_PCT) }, { label: '3PA/g', value: fmt(p.FG3A) }, { label: '3P Att Rate', value: fmtp(p.FG3A_RATE) }, { label: 'eFG%', value: fmtp(p.EFG_PCT) }],
    rimFinish: [{ label: 'FG%', value: fmtp(p.FG_PCT) }, { label: 'eFG%', value: fmtp(p.EFG_PCT) }, { label: 'TS%', value: fmtp(p.TS_PCT) }, { label: 'OREB/g', value: fmt(p.OREB) }],
    midrange: [{ label: 'FG%', value: fmtp(p.FG_PCT) }, { label: 'eFG%', value: fmtp(p.EFG_PCT) }, { label: 'USG%', value: fmtp(p.USG_PCT) }, { label: 'AST/TO', value: fmt(p.AST_TO) }],
    creation: [{ label: 'USG%', value: fmtp(p.USG_PCT) }, { label: 'AST%', value: fmtp(p.AST_PCT) }, { label: 'AST/TO', value: fmt(p.AST_TO) }, { label: 'PTS/g', value: fmt(p.PTS) }, { label: 'TOV/g', value: fmt(p.TOV) }],
    defense: [{ label: 'STL%', value: fmtp(p.STL_PCT) }, { label: 'BLK%', value: fmtp(p.BLK_PCT) }, { label: 'STL/g', value: fmt(p.STL) }, { label: 'BLK/g', value: fmt(p.BLK) }, { label: 'DREB%', value: fmtp(p.DREB_PCT) }],
    rebounding: [{ label: 'OREB%', value: fmtp(p.OREB_PCT) }, { label: 'DREB%', value: fmtp(p.DREB_PCT) }, { label: 'REB%', value: fmtp(p.REB_PCT) }, { label: 'OREB/g', value: fmt(p.OREB) }, { label: 'DREB/g', value: fmt(p.DREB) }, { label: 'REB/g', value: fmt(p.REB) }],
    intangibles: [{ label: 'BPM', value: fmt(p.BPM) }, { label: 'VORP', value: fmt(p.VORP) }, { label: 'Win Shares', value: fmt(p.WIN_SHARES) }, { label: 'TS%', value: fmtp(p.TS_PCT) }, { label: 'USG%', value: fmtp(p.USG_PCT) }, { label: 'AST/TO', value: fmt(p.AST_TO) }],
  };
  return maps[attr] || [];
}

function StatCard({ label, value }: { label: string; value: string }) {
  const [showTip, setShowTip] = useState(false);
  const explanation = STAT_EXPLANATIONS[label];
  return (
    <div style={{ background: C.surfaceHi, borderRadius: 8, padding: '8px 12px', position: 'relative', cursor: explanation ? 'help' : 'default' }}
      onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
        <div style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
        {explanation && <div style={{ fontSize: 9, color: C.textMuted, opacity: 0.6 }}>ⓘ</div>}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: 'monospace' }}>{value}</div>
      {showTip && explanation && (
        <div style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', background: '#09090b', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', minWidth: 200, maxWidth: 260, zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.8)', fontSize: 11, color: C.textSub, lineHeight: 1.5, pointerEvents: 'none' }}>
          <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>{label}</div>
          {explanation}
          <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `5px solid ${C.border}` }} />
        </div>
      )}
    </div>
  );
}

function HonorBadge({ label, emoji, color, years }: { label: string; emoji: string; color: string; years: string[] }) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div style={{ position: 'relative', cursor: 'pointer' }}
      onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: `${color}15`, border: `1px solid ${color}40`, borderRadius: 10, padding: '8px 14px', transition: 'all 0.15s ease', boxShadow: showTip ? `0 0 12px ${color}30` : 'none' }}>
        <span style={{ fontSize: 18 }}>{emoji}</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color }}>{label}</div>
          <div style={{ fontSize: 10, color: C.textMuted }}>{years.length}×</div>
        </div>
      </div>
      {showTip && years.length > 0 && (
        <div style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', background: '#09090b', border: `1px solid ${color}40`, borderRadius: 10, padding: '10px 14px', zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.8)', pointerEvents: 'none', minWidth: 140 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {years.sort().map((y, i) => <div key={i} style={{ fontSize: 10, background: `${color}20`, color, padding: '2px 6px', borderRadius: 4 }}>{y}</div>)}
          </div>
          <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `5px solid ${color}40` }} />
        </div>
      )}
    </div>
  );
}

function AttributeDiagram({ scores, playerName, playerImg, playerStats }: { scores: Record<string, number>; playerName: string; playerImg: string; playerStats: any }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [tooltipAttr, setTooltipAttr] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const W = 500, H = 500, CX = W / 2, CY = H / 2;
  const MAX_R = 180, CENTER_R = 52, N = ATTRIBUTES.length;
  const getCoords = (angle: number, r: number) => ({ x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) });
  const segments = ATTRIBUTES.map((attr, i) => {
    const startAngle = (i / N) * 2 * Math.PI - Math.PI / 2;
    const endAngle = ((i + 1) / N) * 2 * Math.PI - Math.PI / 2;
    const midAngle = (startAngle + endAngle) / 2;
    const score = scores[attr.key] ?? 0;
    const r = CENTER_R + (score / 100) * (MAX_R - CENTER_R);
    return { attr, startAngle, endAngle, midAngle, score, r, gapAngle: 0.04 };
  });
  const handleMouseMove = (e: React.MouseEvent, attrKey: string) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTooltipAttr(attrKey); setHovered(attrKey);
  };
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <svg ref={svgRef} width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {[25, 50, 75, 100].map(pct => (<circle key={pct} cx={CX} cy={CY} r={CENTER_R + (pct / 100) * (MAX_R - CENTER_R)} fill="none" stroke="#27272a" strokeWidth={0.5} strokeDasharray="3,3" />))}
        {segments.map(({ attr, startAngle, endAngle, midAngle, score, r, gapAngle }) => {
          const isHov = hovered === attr.key;
          const pts = [getCoords(startAngle + gapAngle, CENTER_R), getCoords(startAngle + gapAngle, r), getCoords(endAngle - gapAngle, r), getCoords(endAngle - gapAngle, CENTER_R)];
          const pathD = `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y} A${r},${r} 0 0,1 ${pts[2].x},${pts[2].y} L${pts[3].x},${pts[3].y} A${CENTER_R},${CENTER_R} 0 0,0 ${pts[0].x},${pts[0].y}`;
          const labelPos = getCoords(midAngle, MAX_R + 28);
          const scorePos = getCoords(midAngle, CENTER_R + (score / 100) * (MAX_R - CENTER_R) + 14);
          return (
            <g key={attr.key} onMouseMove={e => handleMouseMove(e, attr.key)} onMouseLeave={() => { setHovered(null); setTooltipAttr(null); }} style={{ cursor: 'pointer' }}>
              <path d={pathD} fill={attr.color} fillOpacity={isHov ? 0.85 : 0.55} stroke={attr.color} strokeWidth={isHov ? 2 : 0.5} strokeOpacity={0.8} style={{ transition: 'all 0.15s ease' }} />
              {score > 15 && <text x={scorePos.x} y={scorePos.y + 4} textAnchor="middle" fontSize={9} fontWeight="700" fill="#09090b" fillOpacity={0.8}>{score}</text>}
              <text x={labelPos.x} y={labelPos.y - 6} textAnchor="middle" fontSize={9.5} fontWeight={isHov ? '700' : '600'} fill={isHov ? attr.color : '#a1a1aa'} style={{ transition: 'all 0.15s ease' }}>{attr.label}</text>
              <text x={labelPos.x} y={labelPos.y + 9} textAnchor="middle" fontSize={11} fontWeight="700" fill={attr.color} fillOpacity={isHov ? 1 : 0.7}>{score}</text>
            </g>
          );
        })}
        <defs><clipPath id="centerClip"><circle cx={CX} cy={CY} r={CENTER_R - 3} /></clipPath></defs>
        <circle cx={CX} cy={CY} r={CENTER_R} fill="#18181b" stroke="#3f3f46" strokeWidth={2} />
        {playerImg && <image href={playerImg} x={CX - CENTER_R + 3} y={CY - CENTER_R + 3} width={(CENTER_R - 3) * 2} height={(CENTER_R - 3) * 2} clipPath="url(#centerClip)" preserveAspectRatio="xMidYMid slice" />}
      </svg>
      {tooltipAttr && hovered && playerStats && (
        <div style={{ position: 'absolute', left: tooltipPos.x + 12, top: tooltipPos.y - 10, background: '#09090b', border: `1px solid ${ATTRIBUTES.find(a => a.key === tooltipAttr)?.color}40`, borderRadius: 12, padding: '10px 14px', minWidth: 180, zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', pointerEvents: 'none' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: ATTRIBUTES.find(a => a.key === tooltipAttr)?.color, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{ATTRIBUTES.find(a => a.key === tooltipAttr)?.label}</div>
          {getTooltipStats(tooltipAttr, playerStats).map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: '#a1a1aa' }}>{s.label}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#fafafa', fontFamily: 'monospace' }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PercentileBar({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: C.textSub }}>{label}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontFamily: 'monospace', color: C.text }}>{value}</span>
          <span style={{ fontSize: 10, color, fontWeight: 700, width: 32, textAlign: 'right' }}>{pct}th</span>
        </div>
      </div>
      <div style={{ height: 4, background: '#27272a', borderRadius: 99 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

const COL_EXPLANATIONS: Record<string, string> = {
  'Season': 'NBA Season', 'Team': 'Team', 'Age': 'Age', 'GP': 'Games Played',
  'GS': 'Games Started', 'MIN': 'Minutes Per Game', 'FG': 'Field Goals Made',
  'FGA': 'Field Goal Attempts', 'FG%': 'Field Goal Percentage',
  '3P': '3-Pointers Made', '3PA': '3-Point Attempts', '3P%': '3-Point Percentage',
  'FT': 'Free Throws Made', 'FTA': 'Free Throw Attempts', 'FT%': 'Free Throw Percentage',
  'ORB': 'Offensive Rebounds', 'DRB': 'Defensive Rebounds', 'TRB': 'Total Rebounds',
  'AST': 'Assists', 'STL': 'Steals', 'BLK': 'Blocks', 'TOV': 'Turnovers',
  'PF': 'Personal Fouls', 'PTS': 'Points Per Game',
};

const OUTSTANDING_THRESHOLDS: Record<string, { threshold: number; label: string; higherIsBetter: boolean }> = {
  PTS: { threshold: 30, label: '30+ PPG — Elite scoring season', higherIsBetter: true },
  AST: { threshold: 9, label: '9+ APG — Elite playmaking season', higherIsBetter: true },
  REB: { threshold: 12, label: '12+ RPG — Elite rebounding season', higherIsBetter: true },
  STL: { threshold: 2.0, label: '2.0+ SPG — Elite steal season', higherIsBetter: true },
  BLK: { threshold: 2.5, label: '2.5+ BPG — Elite shot-blocking season', higherIsBetter: true },
  FG3M: { threshold: 3.5, label: '3.5+ 3PM — Elite three-point volume', higherIsBetter: true },
  FG_PCT: { threshold: 0.55, label: '55%+ FG% — Historically efficient season', higherIsBetter: true },
  FG3_PCT: { threshold: 0.42, label: '42%+ 3P% — Elite three-point accuracy', higherIsBetter: true },
  FT_PCT: { threshold: 0.90, label: '90%+ FT% — Elite free throw shooter', higherIsBetter: true },
  MIN: { threshold: 37, label: '37+ MPG — Ironman workload', higherIsBetter: true },
};

const colToThreshold: Record<string, string> = {
  PTS: 'PTS', AST: 'AST', REB: 'REB', STL: 'STL', BLK: 'BLK',
  FG3M: 'FG3M', FG_PCT: 'FG_PCT', FG3_PCT: 'FG3_PCT', FT_PCT: 'FT_PCT', MIN: 'MIN',
};

function ColHeader({ label, tip }: { label: string; tip: string }) {
  const [show, setShow] = useState(false);
  return (
    <th style={{ padding: '6px 8px', textAlign: label === 'Season' || label === 'Team' ? 'left' : 'right', color: C.textMuted, fontWeight: 600, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap', position: 'sticky', top: 0, background: C.surface, cursor: 'help' }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {label}
        {show && (
          <div style={{ position: 'absolute', bottom: '130%', left: '50%', transform: 'translateX(-50%)', background: '#09090b', border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 10, color: C.text, fontWeight: 600, whiteSpace: 'nowrap', zIndex: 300, boxShadow: '0 4px 16px rgba(0,0,0,0.8)', pointerEvents: 'none', textTransform: 'none', letterSpacing: 0 }}>
            {tip}
            <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `4px solid ${C.border}` }} />
          </div>
        )}
      </div>
    </th>
  );
}

function CareerTable({ seasons }: { seasons: any[] }) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: string } | null>(null);
  const [hoveredSummary, setHoveredSummary] = useState<{ type: 'avg' | 'high'; col: string } | null>(null);

  const cols = ['SEASON_ID', 'TEAM_ABBREVIATION', 'PLAYER_AGE', 'GP', 'GS', 'MIN', 'FGM', 'FGA', 'FG_PCT', 'FG3M', 'FG3A', 'FG3_PCT', 'FTM', 'FTA', 'FT_PCT', 'OREB', 'DREB', 'REB', 'AST', 'STL', 'BLK', 'TOV', 'PF', 'PTS'];
  const labels = ['Season', 'Team', 'Age', 'GP', 'GS', 'MIN', 'FG', 'FGA', 'FG%', '3P', '3PA', '3P%', 'FT', 'FTA', 'FT%', 'ORB', 'DRB', 'TRB', 'AST', 'STL', 'BLK', 'TOV', 'PF', 'PTS'];

  const fmtPct = (v: any) => v != null && !isNaN(+v) ? `${(+v * 100).toFixed(1)}%` : '—';
  const fmt1 = (v: any) => v != null && !isNaN(+v) ? (+v).toFixed(1) : '—';
  const fmt0 = (v: any) => v != null && !isNaN(+v) ? Math.round(+v).toString() : '—';
  const isText = (i: number) => i < 2;
  const isPct = (col: string) => col.includes('PCT');
  const isInt = (col: string) => ['GP', 'GS', 'PLAYER_AGE'].includes(col);

  // Career highs with season
  const careerHighs: Record<string, { val: number; season: string }> = {};
  cols.forEach((col, ci) => {
    if (isText(ci)) return;
    let best = -Infinity; let bestSeason = '';
    seasons.forEach(row => {
      const v = +row[col];
      if (!isNaN(v) && v > best) { best = v; bestSeason = row.SEASON_ID || ''; }
    });
    if (best > -Infinity) careerHighs[col] = { val: best, season: bestSeason };
  });

  // Career averages weighted by GP
  const careerAvgs: Record<string, number> = {};
  cols.forEach((col, ci) => {
    if (isText(ci)) return;
    if (isPct(col)) {
      const madeCol = col === 'FG_PCT' ? 'FGM' : col === 'FG3_PCT' ? 'FG3M' : col === 'FT_PCT' ? 'FTM' : null;
      const attCol = col === 'FG_PCT' ? 'FGA' : col === 'FG3_PCT' ? 'FG3A' : col === 'FT_PCT' ? 'FTA' : null;
      if (madeCol && attCol) {
        let totalMade = 0, totalAtt = 0;
        seasons.forEach(row => {
          const gp = +row.GP || 0;
          totalMade += (+row[madeCol] || 0) * gp;
          totalAtt += (+row[attCol] || 0) * gp;
        });
        careerAvgs[col] = totalAtt > 0 ? totalMade / totalAtt : 0;
      }
    } else {
      let totalW = 0, totalGP = 0;
      seasons.forEach(row => {
        const gp = +row.GP || 0;
        const v = +row[col];
        if (!isNaN(v)) { totalW += v * gp; totalGP += gp; }
      });
      careerAvgs[col] = totalGP > 0 ? totalW / totalGP : 0;
    }
  });

  const fmtVal = (col: string, ci: number, val: number) => {
    if (isNaN(val) || val === 0) return '—';
    if (isPct(col)) return fmtPct(val);
    if (isInt(col)) return fmt0(val);
    return fmt1(val);
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 8, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <span>💡 Hover column headers for full names</span>
        <span style={{ color: C.amber }}>■ Gold = Career high in that stat</span>
        <span style={{ color: '#ef4444' }}>■ Red = Outstanding / historically elite</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr>{labels.map((l, i) => <ColHeader key={i} label={l} tip={COL_EXPLANATIONS[l] || l} />)}</tr>
        </thead>
        <tbody>
          {seasons.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: `1px solid #1f1f23` }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1f1f23')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              {cols.map((col, ci) => {
                const val = row[col];
                const numVal = +val;
                let display = '—';
                if (isPct(col)) display = fmtPct(val);
                else if (isText(ci)) display = val ?? '—';
                else if (isInt(col)) display = fmt0(val);
                else display = fmt1(val);
                const isCareerHigh = !isText(ci) && !isNaN(numVal) && careerHighs[col] !== undefined && numVal === careerHighs[col].val && numVal > 0;
                const thresh = colToThreshold[col] ? OUTSTANDING_THRESHOLDS[colToThreshold[col]] : null;
                const isOutstanding = thresh && !isNaN(numVal) && (thresh.higherIsBetter ? numVal >= thresh.threshold : numVal <= thresh.threshold);
                const isHovered = hoveredCell?.row === ri && hoveredCell?.col === col;
                return (
                  <td key={ci}
                    style={{ padding: '6px 8px', textAlign: isText(ci) ? 'left' : 'right', color: isText(ci) ? C.textSub : isOutstanding ? '#ef4444' : isCareerHigh ? C.amber : C.text, fontFamily: isText(ci) ? 'inherit' : 'monospace', fontSize: 11, whiteSpace: 'nowrap', fontWeight: isCareerHigh || isOutstanding ? 800 : 400, position: 'relative', cursor: isOutstanding ? 'help' : 'default' }}
                    onMouseEnter={() => isOutstanding && setHoveredCell({ row: ri, col })}
                    onMouseLeave={() => setHoveredCell(null)}>
                    {display}
                    {isOutstanding && isHovered && (
                      <div style={{ position: 'absolute', bottom: '120%', right: 0, background: '#09090b', border: '1px solid #ef4444', borderRadius: 8, padding: '6px 10px', fontSize: 10, color: '#fafafa', whiteSpace: 'nowrap', zIndex: 300, boxShadow: '0 4px 16px rgba(0,0,0,0.8)', pointerEvents: 'none', minWidth: 180, textAlign: 'left' }}>
                        <div style={{ color: '#ef4444', fontWeight: 700, marginBottom: 3 }}>🔥 Outstanding</div>
                        {thresh?.label}
                        <div style={{ position: 'absolute', top: '100%', right: 12, width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid #ef4444' }} />
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Spacer */}
          <tr><td colSpan={cols.length} style={{ height: 8, background: 'transparent' }} /></tr>

          {/* Career Averages Row */}
          <tr style={{ background: 'rgba(249,115,22,0.08)', borderTop: `2px solid ${C.orange}` }}>
            {cols.map((col, ci) => {
              if (ci === 0) return <td key={ci} style={{ padding: '8px 8px', textAlign: 'left', color: C.orange, fontWeight: 800, fontSize: 11, whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>CAREER AVG</td>;
              if (ci === 1) return <td key={ci} style={{ padding: '8px 8px' }} />;
              const val = careerAvgs[col];
              return (
                <td key={ci} style={{ padding: '8px 8px', textAlign: 'right', color: C.orange, fontFamily: 'monospace', fontSize: 11, whiteSpace: 'nowrap', fontWeight: 700 }}>
                  {fmtVal(col, ci, val)}
                </td>
              );
            })}
          </tr>

          {/* Career Highs Row */}
          <tr style={{ background: 'rgba(251,191,36,0.08)', borderTop: `1px solid rgba(251,191,36,0.3)` }}>
            {cols.map((col, ci) => {
              const high = careerHighs[col];
              const isHov = hoveredSummary?.type === 'high' && hoveredSummary?.col === col;
              if (ci === 0) return <td key={ci} style={{ padding: '8px 8px', textAlign: 'left', color: C.amber, fontWeight: 800, fontSize: 11, whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>CAREER HIGH</td>;
              if (ci === 1) return <td key={ci} style={{ padding: '8px 8px' }} />;
              if (!high) return <td key={ci} style={{ padding: '8px 8px', textAlign: 'right', color: C.textMuted, fontFamily: 'monospace', fontSize: 11 }}>—</td>;
              return (
                <td key={ci}
                  style={{ padding: '8px 8px', textAlign: 'right', color: C.amber, fontFamily: 'monospace', fontSize: 11, whiteSpace: 'nowrap', fontWeight: 800, position: 'relative', cursor: 'help' }}
                  onMouseEnter={() => setHoveredSummary({ type: 'high', col })}
                  onMouseLeave={() => setHoveredSummary(null)}>
                  {fmtVal(col, ci, high.val)}
                  {isHov && high.season && (
                    <div style={{ position: 'absolute', bottom: '130%', right: 0, background: '#09090b', border: `1px solid ${C.amber}`, borderRadius: 8, padding: '6px 10px', fontSize: 10, color: C.text, whiteSpace: 'nowrap', zIndex: 300, boxShadow: '0 4px 16px rgba(0,0,0,0.8)', pointerEvents: 'none', textAlign: 'left' }}>
                      <div style={{ color: C.amber, fontWeight: 700, marginBottom: 2 }}>🏆 Career High</div>
                      <div style={{ color: C.textSub }}>Season: <span style={{ color: C.text, fontWeight: 700 }}>{high.season}</span></div>
                      <div style={{ position: 'absolute', top: '100%', right: 12, width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `4px solid ${C.amber}` }} />
                    </div>
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function AccoladesTab({ playerId, awards, stretches }: {
  playerId: string; awards: any[]; stretches: typeof NOTABLE_STRETCHES[string];
}) {
  const honorGroups: Record<string, { emoji: string; color: string; label: string; years: string[] }> = {};
  const addHonor = (key: string, emoji: string, color: string, label: string, season: string) => {
    if (!honorGroups[key]) honorGroups[key] = { emoji, color, label, years: [] };
    if (season && !honorGroups[key].years.includes(season)) honorGroups[key].years.push(season);
  };

  awards.forEach(a => {
    const desc = a.DESCRIPTION || '';
    const season = a.SEASON || '';
    const teamNum = +a.ALL_NBA_TEAM_NUMBER;
    if (desc.includes('NBA Most Valuable Player') && !desc.includes('Finals')) addHonor('mvp', '🏆', '#f97316', 'MVP', season);
    else if (desc.includes('NBA Finals Most Valuable Player')) addHonor('finalsmvp', '🏆', '#fbbf24', 'Finals MVP', season);
    else if (desc.includes('Conference Finals Most Valuable Player')) addHonor('cfmvp', '🌟', '#a78bfa', 'CF MVP', season);
    else if (desc.includes('NBA Defensive Player of the Year')) addHonor('dpoy', '🛡️', '#34d399', 'DPOY', season);
    else if (desc.includes('NBA Rookie of the Year')) addHonor('roy', '⭐', '#38bdf8', 'ROY', season);
    else if (desc.includes('NBA Most Improved Player')) addHonor('mip', '📈', '#a78bfa', 'MIP', season);
    else if (desc.includes('NBA Sixth Man')) addHonor('6moy', '⚡', '#fb7185', '6MOY', season);
    else if (desc.includes('NBA Champion')) addHonor('champ', '💍', '#fbbf24', 'Champion', season);
    else if (desc.includes('NBA Scoring Champion')) addHonor('scoring', '🎯', '#fb7185', 'Scoring Champ', season);
    else if (desc.includes('All-NBA') && !desc.includes('All-Defensive') && teamNum === 1) addHonor('allnba1', '🌟', '#fbbf24', 'All-NBA 1st Team', season);
    else if (desc.includes('All-NBA') && !desc.includes('All-Defensive') && teamNum === 2) addHonor('allnba2', '🌟', '#a1a1aa', 'All-NBA 2nd Team', season);
    else if (desc.includes('All-NBA') && !desc.includes('All-Defensive') && teamNum === 3) addHonor('allnba3', '🌟', '#78716c', 'All-NBA 3rd Team', season);
    else if (desc.includes('All-Defensive') && teamNum === 1) addHonor('alldef1', '🛡️', '#34d399', 'All-Def 1st Team', season);
    else if (desc.includes('All-Defensive') && teamNum === 2) addHonor('alldef2', '🛡️', '#6ee7b7', 'All-Def 2nd Team', season);
    else if (desc.includes('All-Star') && !desc.includes('MVP') && !desc.includes('Defensive')) addHonor('allstar', '⭐', '#38bdf8', 'All-Star', season);
    else if (desc.includes('All-Rookie') && teamNum === 1) addHonor('allrook1', '🌱', '#38bdf8', 'All-Rookie 1st', season);
    else if (desc.includes('All-Rookie') && teamNum === 2) addHonor('allrook2', '🌱', '#7dd3fc', 'All-Rookie 2nd', season);
    else if (desc.includes('Player of the Month') && !desc.includes('Defensive')) addHonor('potm', '📅', '#f97316', 'POTM', season);
    else if (desc.includes('Defensive Player of the Month')) addHonor('dpotm', '🛡️', '#34d399', 'DPOTM', season);
    else if (desc.includes('Player of the Week') && !desc.includes('Defensive')) addHonor('potw', '📆', '#a78bfa', 'POTW', season);
  });

  const tierColors = {
    legendary: { bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.3)', label: '🔥 LEGENDARY', labelColor: '#f97316' },
    great: { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.3)', label: '⭐ GREAT', labelColor: '#fbbf24' },
    notable: { bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.3)', label: '📊 NOTABLE', labelColor: '#38bdf8' },
  };

  const grouped = {
    legendary: stretches.filter(s => s.tier === 'legendary'),
    great: stretches.filter(s => s.tier === 'great'),
    notable: stretches.filter(s => s.tier === 'notable'),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {Object.keys(honorGroups).length > 0 && (
        <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textMuted, marginBottom: 16 }}>🏅 League Honors · Hover any badge for years</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {Object.values(honorGroups).sort((a, b) => b.years.length - a.years.length).map((h, i) => (
              <HonorBadge key={i} label={h.label} emoji={h.emoji} color={h.color} years={h.years} />
            ))}
          </div>
        </div>
      )}
      {stretches.length > 0 && (
        <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textMuted, marginBottom: 20 }}>📈 Career Highlights & Notable Stretches</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {(['legendary', 'great', 'notable'] as const).map(tier => {
              const items = grouped[tier];
              if (items.length === 0) return null;
              const tc = tierColors[tier];
              return (
                <div key={tier}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 800, color: tc.labelColor, letterSpacing: '0.15em', marginBottom: 12, padding: '3px 10px', borderRadius: 6, background: tc.bg, border: `1px solid ${tc.border}` }}>{tc.label}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {items.map((s, i) => (
                      <div key={i} style={{ background: C.surfaceHi, borderRadius: 14, padding: '16px 20px', border: `1px solid ${C.border}`, borderLeft: `3px solid ${tc.labelColor}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ fontSize: 20 }}>{s.emoji}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{s.title}</div>
                            <div style={{ fontSize: 11, color: tc.labelColor, fontWeight: 600 }}>{s.period}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: C.amber, fontFamily: 'monospace', fontWeight: 700, marginBottom: 4 }}>{s.stats}</div>
                        <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.5 }}>{s.context}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {Object.keys(honorGroups).length === 0 && stretches.length === 0 && (
        <div style={{ background: C.surface, borderRadius: 20, padding: 40, border: `1px solid ${C.border}`, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏅</div>
          <p style={{ color: C.textMuted, fontSize: 13 }}>No accolade data available for this player.</p>
        </div>
      )}
    </div>
  );
}

interface PlayerProfileProps {
  playerId: string; playerName: string; team: string; onBack: () => void;
}

export default function PlayerProfile({ playerId, playerName, team, onBack }: PlayerProfileProps) {
  const [bio, setBio] = useState<any>(null);
  const [career, setCareer] = useState<any[]>([]);
  const [currentStats, setCurrentStats] = useState<any>(null);
  const [splitsStats, setSplitsStats] = useState<any>(null);
  const [awards, setAwards] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'career' | 'accolades'>('overview');

  const playerImg = `https://cdn.nba.com/headshots/nba/latest/1040x760/${playerId}.png`;
  const notableStretches = NOTABLE_STRETCHES[playerId] || [];

  useEffect(() => {
    window.scrollTo(0, 0);
    async function load() {
      setLoading(true);
      try {
        const [infoRes, careerRes, tradRes, advRes, hustleRes, drivesRes, catchRes, pullupRes, rebRes, passRes, defRes, splitsRes, awardsRes] = await Promise.allSettled([
          fetch(`${PROXY}/player-info/${playerId}`).then(r => r.json()),
          fetch(`${PROXY}/player-career/${playerId}`).then(r => r.json()),
          fetch(`${PROXY}/all-players-traditional`).then(r => r.json()),
          fetch(`${PROXY}/all-players-advanced`).then(r => r.json()),
          fetch(`${PROXY}/all-players-hustle`).then(r => r.json()),
          fetch(`${PROXY}/all-players-tracking?type=Drives`).then(r => r.json()),
          fetch(`${PROXY}/all-players-catchshoot`).then(r => r.json()),
          fetch(`${PROXY}/all-players-pullup`).then(r => r.json()),
          fetch(`${PROXY}/all-players-rebounding`).then(r => r.json()),
          fetch(`${PROXY}/all-players-passing`).then(r => r.json()),
          fetch(`${PROXY}/all-players-defense`).then(r => r.json()),
          fetch(`${PROXY}/player-splits/${playerId}`).then(r => r.json()),
          fetch(`${PROXY}/player-awards/${playerId}`).then(r => r.json()),
        ]);

        if (infoRes.status === 'fulfilled') {
          const { rows } = parseResultSet(infoRes.value, 'CommonPlayerInfo');
          if (rows[0]) setBio(rows[0]);
        }
        if (careerRes.status === 'fulfilled') {
          const { rows } = parseResultSet(careerRes.value, 'SeasonTotalsRegularSeason');
          setCareer(rows.reverse());
        }
        if (awardsRes.status === 'fulfilled') {
          const { rows } = parseResultSet(awardsRes.value, 'PlayerAwards');
          setAwards(rows);
        }
        if (splitsRes.status === 'fulfilled') {
          const { rows } = parseResultSet(splitsRes.value, 'OverallPlayerDashboard');
          if (rows[0]) setSplitsStats(rows[0]);
        }

        const playerKey = +playerId;
        const merge: any = {};
        function extract(res: PromiseSettledResult<any>) {
          if (res.status !== 'fulfilled') return [];
          const { rows } = parseResultSet(res.value);
          const me = rows.find((r: any) => +r.PLAYER_ID === playerKey || r.PLAYER_NAME === playerName);
          if (me) Object.assign(merge, me);
          return rows;
        }

        const tradRows = extract(tradRes);
        const advRows = extract(advRes);
        const hustleRows = extract(hustleRes);
        const drivesRows = extract(drivesRes);
        extract(catchRes); extract(pullupRes); extract(rebRes); extract(passRes); extract(defRes);

        const qualified = tradRows.filter((r: any) => +r.MIN * +r.GP >= 750);
        const qualifiedIds = new Set(qualified.map((r: any) => +r.PLAYER_ID));
        setCurrentStats(merge);

        const pool = (rows: any[], key: string) => rows.filter((r: any) => qualifiedIds.has(+r.PLAYER_ID)).map((r: any) => +r[key]).filter(v => !isNaN(v));
        const p = (rows: any[], key: string, val: any, higherBetter = true) => percentile(+val, pool(rows, key), higherBetter);

        const scoring = Math.round(p(advRows, 'TS_PCT', merge.TS_PCT) * 0.30 + p(advRows, 'EFG_PCT', merge.EFG_PCT) * 0.20 + p(advRows, 'OFF_RATING', merge.OFF_RATING) * 0.25 + p(advRows, 'PIE', merge.PIE) * 0.25);
        const playmaking = Math.round(p(advRows, 'AST_PCT', merge.AST_PCT) * 0.35 + p(advRows, 'AST_TO', merge.AST_TO) * 0.30 + p(passRes.status === 'fulfilled' ? parseResultSet(passRes.value).rows : [], 'POTENTIAL_AST', merge.POTENTIAL_AST) * 0.20 + p(advRows, 'AST_RATIO', merge.AST_RATIO) * 0.15);
        const threePoint = Math.round(p(tradRows, 'FG3_PCT', merge.FG3_PCT) * 0.40 + p(catchRes.status === 'fulfilled' ? parseResultSet(catchRes.value).rows : [], 'CATCH_SHOOT_PCT', merge.CATCH_SHOOT_PCT) * 0.30 + p(tradRows, 'FG3A', merge.FG3A) * 0.15 + p(advRows, 'FG3A_RATE', merge.FG3A_RATE) * 0.15);
        const rimFinish = Math.round(p(drivesRows, 'DRIVE_FG_PCT', merge.DRIVE_FG_PCT) * 0.35 + p(drivesRows, 'DRIVES', merge.DRIVES) * 0.25 + p(tradRows, 'FG_PCT', merge.FG_PCT) * 0.25 + p(drivesRows, 'PAINT_TOUCHES', merge.PAINT_TOUCHES) * 0.15);
        const midrange = Math.round(p(pullupRes.status === 'fulfilled' ? parseResultSet(pullupRes.value).rows : [], 'PULL_UP_FG_PCT', merge.PULL_UP_FG_PCT) * 0.40 + p(tradRows, 'FG_PCT', merge.FG_PCT) * 0.35 + p(advRows, 'USG_PCT', merge.USG_PCT) * 0.25);
        const creation = Math.round(p(advRows, 'USG_PCT', merge.USG_PCT) * 0.35 + p(advRows, 'AST_PCT', merge.AST_PCT) * 0.25 + p(drivesRows, 'DRIVES', merge.DRIVES) * 0.25 + p(advRows, 'PIE', merge.PIE) * 0.15);
        const defense = Math.round(p(advRows, 'STL_PCT', merge.STL_PCT) * 0.25 + p(advRows, 'BLK_PCT', merge.BLK_PCT) * 0.25 + p(advRows, 'DEF_RATING', merge.DEF_RATING, false) * 0.30 + p(hustleRows, 'DEFLECTIONS', merge.DEFLECTIONS) * 0.10 + p(hustleRows, 'CONTESTED_SHOTS', merge.CONTESTED_SHOTS) * 0.10);
        const rebounding = Math.round(p(advRows, 'OREB_PCT', merge.OREB_PCT) * 0.25 + p(advRows, 'DREB_PCT', merge.DREB_PCT) * 0.30 + p(advRows, 'REB_PCT', merge.REB_PCT) * 0.25 + p(tradRows, 'REB', merge.REB) * 0.20);
        const intangibles = Math.round(p(advRows, 'NET_RATING', merge.NET_RATING) * 0.25 + p(advRows, 'PIE', merge.PIE) * 0.30 + p(tradRows, 'PLUS_MINUS', merge.PLUS_MINUS) * 0.25 + p(advRows, 'USG_PCT', merge.USG_PCT) * 0.20);

        setScores({
          scoring: Math.min(99, Math.max(1, scoring)),
          playmaking: Math.min(99, Math.max(1, playmaking)),
          threePoint: Math.min(99, Math.max(1, threePoint)),
          rimFinish: Math.min(99, Math.max(1, rimFinish)),
          midrange: Math.min(99, Math.max(1, midrange)),
          creation: Math.min(99, Math.max(1, creation)),
          defense: Math.min(99, Math.max(1, defense)),
          rebounding: Math.min(99, Math.max(1, rebounding)),
          intangibles: Math.min(99, Math.max(1, intangibles)),
        });
      } catch (e) { console.error('Profile load error:', e); }
      setLoading(false);
    }
    load();
  }, [playerId]);

  const overall = Object.keys(scores).length > 0 ? Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length) : 0;
  const fmtPct = (v: any) => v != null && !isNaN(+v) ? `${(+v * 100).toFixed(1)}%` : '—';
  const fmt1 = (v: any) => v != null && !isNaN(+v) ? (+v).toFixed(1) : '—';
  const displayStats = { ...currentStats, OFF_RATING: splitsStats?.OFF_RATING ?? currentStats?.OFF_RATING, DEF_RATING: splitsStats?.DEF_RATING ?? currentStats?.DEF_RATING, NET_RATING: splitsStats?.NET_RATING ?? currentStats?.NET_RATING };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}*{box-sizing:border-box;margin:0;padding:0}`}</style>

      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(9,9,11,0.95)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}`, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onBack} style={{ background: C.surfaceHi, border: 'none', borderRadius: 8, padding: '6px 14px', color: C.textSub, cursor: 'pointer', fontSize: 13 }}>← Back</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="LeHoopIQ" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover' }} />
          <span style={{ fontSize: 16, fontWeight: 700 }}>LeHoopIQ</span>
        </div>
        <span style={{ color: C.textMuted, fontSize: 13 }}>/ Player Profile /</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{playerName}</span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${C.border}`, borderTopColor: C.orange, animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: C.textMuted, fontSize: 14 }}>Loading {playerName}'s profile...</p>
        </div>
      ) : (
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 24px', animation: 'fadeIn 0.4s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, marginBottom: 24, background: C.surface, borderRadius: 20, padding: 28, border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img src={playerImg} alt={playerName} style={{ width: 140, height: 140, borderRadius: 16, objectFit: 'cover', objectPosition: 'top', background: C.surfaceHi, border: `2px solid ${C.border}` }}
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://cdn.nba.com/headshots/nba/latest/260x190/${playerId}.png`; }} />
                <div style={{ position: 'absolute', bottom: -12, right: -12, width: 44, height: 44, borderRadius: '50%', background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `3px solid ${C.bg}` }}>
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{overall}</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 4 }}>{playerName}</div>
                <div style={{ fontSize: 15, color: C.orange, fontWeight: 600, marginBottom: 12 }}>{team}</div>
                {bio && (
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Position', value: bio.POSITION },
                      { label: 'Height', value: bio.HEIGHT },
                      { label: 'Weight', value: bio.WEIGHT ? `${bio.WEIGHT} lbs` : null },
                      { label: 'Age', value: bio.BIRTHDATE ? `${new Date().getFullYear() - new Date(bio.BIRTHDATE).getFullYear()}` : null },
                      { label: 'College', value: bio.SCHOOL || 'International' },
                      { label: 'Draft', value: bio.DRAFT_YEAR ? `${bio.DRAFT_YEAR} R${bio.DRAFT_ROUND} #${bio.DRAFT_NUMBER}` : 'Undrafted' },
                      { label: 'Experience', value: bio.SEASON_EXP ? `${bio.SEASON_EXP} years` : null },
                      { label: 'Country', value: bio.COUNTRY },
                    ].filter(i => i.value).map((item, i) => (
                      <div key={i}>
                        <div style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>{item.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {currentStats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, alignContent: 'start' }}>
                {[
                  { label: 'PPG', value: fmt1(currentStats.PTS) },
                  { label: 'RPG', value: fmt1(currentStats.REB) },
                  { label: 'APG', value: fmt1(currentStats.AST) },
                  { label: 'TS%', value: fmtPct(currentStats.TS_PCT) },
                  { label: 'STL', value: fmt1(currentStats.STL) },
                  { label: 'BLK', value: fmt1(currentStats.BLK) },
                  { label: 'FG%', value: fmtPct(currentStats.FG_PCT) },
                  { label: '3P%', value: fmtPct(currentStats.FG3_PCT) },
                ].map((s, i) => (
                  <div key={i} style={{ background: C.surfaceHi, borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.orange, fontFamily: 'monospace' }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 4, marginBottom: 24, padding: 4, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, width: 'fit-content' }}>
            {(['overview', 'career', 'accolades'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: activeTab === tab ? C.orange : 'transparent', color: activeTab === tab ? '#fff' : C.textMuted }}>
                {tab === 'overview' ? 'Attribute Diagram' : tab === 'career' ? 'Career Stats' : '🏆 Accolades'}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '500px 1fr', gap: 24 }}>
              <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textMuted, marginBottom: 16 }}>Player Attributes · 2025–26 Season</div>
                <AttributeDiagram scores={scores} playerName={playerName} playerImg={playerImg} playerStats={currentStats || {}} />
                <p style={{ fontSize: 10, color: C.textMuted, textAlign: 'center', marginTop: 8 }}>Hover over each segment to see individual stats · Based on percentile vs all qualified players (750+ min)</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textMuted, marginBottom: 16 }}>Percentile Rankings</div>
                  {ATTRIBUTES.map(attr => <PercentileBar key={attr.key} label={attr.label} value={`${scores[attr.key] ?? 0}`} pct={scores[attr.key] ?? 0} color={attr.color} />)}
                </div>
                {displayStats && (
                  <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textMuted, marginBottom: 16 }}>Advanced Stats · 2025–26 <span style={{ fontSize: 9, fontWeight: 400 }}>· Hover ⓘ for explanations</span></div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      {[
                        { label: 'Off Rating', value: fmt1(displayStats.OFF_RATING) },
                        { label: 'Def Rating', value: fmt1(displayStats.DEF_RATING) },
                        { label: 'Net Rating', value: fmt1(displayStats.NET_RATING) },
                        { label: 'USG%', value: fmtPct(displayStats.USG_PCT) },
                        { label: 'AST%', value: fmtPct(displayStats.AST_PCT) },
                        { label: 'REB%', value: fmtPct(displayStats.REB_PCT) },
                        { label: 'STL%', value: fmtPct(displayStats.STL_PCT) },
                        { label: 'BLK%', value: fmtPct(displayStats.BLK_PCT) },
                        { label: 'BPM', value: fmt1(displayStats.BPM) },
                        { label: 'TS%', value: fmtPct(displayStats.TS_PCT) },
                        { label: 'eFG%', value: fmtPct(displayStats.EFG_PCT) },
                        { label: 'VORP', value: fmt1(displayStats.VORP) },
                      ].map((s, i) => <StatCard key={i} label={s.label} value={s.value} />)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'career' && (
            <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textMuted, marginBottom: 16 }}>Year-by-Year Stats</div>
              {career.length > 0 ? <CareerTable seasons={career} /> : <p style={{ color: C.textMuted, fontSize: 13 }}>No career data available</p>}
            </div>
          )}

          {activeTab === 'accolades' && (
            <AccoladesTab playerId={playerId} awards={awards} stretches={notableStretches} />
          )}
        </div>
      )}
    </div>
  );
}