import React, { useState, useEffect } from 'react';

const PROXY = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001/api';

const C = {
  bg: '#09090b', surface: '#18181b', surfaceHi: '#27272a',
  border: '#27272a', text: '#fafafa', textSub: '#a1a1aa', textMuted: '#52525b',
  orange: '#f97316', amber: '#fbbf24', sky: '#38bdf8', emerald: '#34d399',
};

// ── Team colors & info ────────────────────────────────────────────────────────
const TEAM_DATA: Record<string, {
  primary: string; secondary: string; founded: number;
  titles: number[]; confTitles: number[]; confAppearances: number[];
  bestRecord: string; worstRecord: string;
  retiredNumbers: { number: string; player: string; years: string }[];
  legends: { playerId: string; name: string; position: string; era: string; description: string }[];
}> = {
  '1610612747': { // Lakers
    primary: '#552583', secondary: '#FDB927',
    founded: 1947,
    titles: [1949,1950,1952,1953,1954,1972,1980,1982,1985,1987,1988,2000,2001,2002,2009,2010,2020],
    confTitles: [1959,1962,1963,1965,1966,1968,1969,1970,1972,1973,1980,1982,1983,1984,1985,1987,1988,1989,1991,2000,2001,2002,2003,2004,2008,2009,2010,2023],
    confAppearances: [1959,1962,1963,1965,1966,1968,1969,1970,1972,1973,1980,1982,1983,1984,1985,1987,1988,1989,1991,2000,2001,2002,2003,2004,2008,2009,2010,2023],
    bestRecord: '69-13 (1971-72)', worstRecord: '17-65 (2014-15)',
    retiredNumbers: [
      { number: '13', player: 'Wilt Chamberlain', years: '1968-73' },
      { number: '22', player: 'Elgin Baylor', years: '1958-72' },
      { number: '25', player: 'Gail Goodrich', years: '1965-76' },
      { number: '32', player: 'Magic Johnson', years: '1979-91,96' },
      { number: '33', player: 'Kareem Abdul-Jabbar', years: '1975-89' },
      { number: '34', player: 'Shaquille O\'Neal', years: '1996-2004' },
      { number: '42', player: 'James Worthy', years: '1982-94' },
      { number: '44', player: 'Jerry West', years: '1960-74' },
      { number: '8 & 24', player: 'Kobe Bryant', years: '1996-2016' },
    ],
    legends: [
      { playerId: '893', name: 'Magic Johnson', position: 'PG', era: '1979-1991', description: '5× NBA Champion, 3× Finals MVP, 3× MVP. Led Showtime Lakers dynasty. Greatest passing point guard ever.' },
      { playerId: '76003', name: 'Kareem Abdul-Jabbar', position: 'C', era: '1975-1989', description: '6× NBA Champion, 6× MVP, NBA All-Time Scoring Leader (before LeBron). The skyhook is unstoppable.' },
      { playerId: '977', name: 'Kobe Bryant', position: 'SG', era: '1996-2016', description: '5× NBA Champion, 2× Finals MVP, 1× MVP, 18× All-Star. The Mamba Mentality defined a generation.' },
      { playerId: '77424', name: 'Jerry West', position: 'PG', era: '1960-1974', description: '1× NBA Champion, 14× All-Star. The Logo. One of the greatest clutch players in NBA history.' },
      { playerId: '1050', name: 'Shaquille O\'Neal', position: 'C', era: '1996-2004', description: '3× NBA Champion with Lakers, 3× Finals MVP. The most dominant force in NBA history during his peak.' },
    ],
  },
  '1610612738': { // Celtics
    primary: '#007A33', secondary: '#BA9653',
    founded: 1946,
    titles: [1957,1959,1960,1961,1962,1963,1964,1965,1966,1968,1969,1974,1976,1981,1984,1986,2008,2024],
    confTitles: [1957,1958,1959,1960,1961,1962,1963,1964,1965,1966,1968,1969,1974,1976,1981,1984,1985,1986,1987,1988,2008,2010,2022,2024],
    confAppearances: [1957,1958,1959,1960,1961,1962,1963,1964,1965,1966,1968,1969,1974,1976,1981,1984,1985,1986,1987,1988,2008,2010,2022,2024],
    bestRecord: '67-15 (1985-86)', worstRecord: '15-67 (1996-97)',
    retiredNumbers: [
      { number: '1', player: 'Walter Brown', years: 'Owner' },
      { number: '2', player: 'Red Auerbach', years: 'Coach/GM' },
      { number: '6', player: 'Bill Russell', years: '1956-69' },
      { number: '10', player: 'Jo Jo White', years: '1969-79' },
      { number: '14', player: 'Bob Cousy', years: '1950-63' },
      { number: '15', player: 'Tom Heinsohn', years: '1956-65' },
      { number: '17', player: 'John Havlicek', years: '1962-78' },
      { number: '18', player: 'Dave Cowens', years: '1970-80' },
      { number: '19', player: 'Don Nelson', years: '1965-76' },
      { number: '21', player: 'Bill Sharman', years: '1951-61' },
      { number: '23', player: 'Frank Ramsey', years: '1954-64' },
      { number: '24', player: 'Sam Jones', years: '1957-69' },
      { number: '25', player: 'K.C. Jones', years: '1958-67' },
      { number: '33', player: 'Larry Bird', years: '1979-92' },
      { number: '35', player: 'Reggie Lewis', years: '1987-93' },
    ],
    legends: [
      { playerId: '77427', name: 'Bill Russell', position: 'C', era: '1956-1969', description: '11× NBA Champion — the greatest winner in sports history. 5× MVP, 12× All-Star. Revolutionized team defense.' },
      { playerId: '76561', name: 'Larry Bird', position: 'SF', era: '1979-1992', description: '3× NBA Champion, 3× MVP, 2× Finals MVP. One of the greatest players and trash talkers ever.' },
      { playerId: '76535', name: 'Bob Cousy', position: 'PG', era: '1950-1963', description: '6× NBA Champion. The original magician of the court. Changed how point guards played forever.' },
      { playerId: '77422', name: 'John Havlicek', position: 'SF', era: '1962-1978', description: '8× NBA Champion. One of the greatest all-around players ever. Hondo stole the ball!' },
      { playerId: '1503', name: 'Paul Pierce', position: 'SF', era: '1998-2013', description: '1× NBA Champion (2008), Finals MVP. The Truth. Spent prime years in Boston, one of the great Celtics ever.' },
    ],
  },
  '1610612744': { // Warriors
    primary: '#1D428A', secondary: '#FFC72C',
    founded: 1946,
    titles: [1947,1956,1975,2015,2017,2018,2022],
    confTitles: [1947,1948,1956,1964,1975,2015,2016,2017,2018,2019,2022],
    confAppearances: [1947,1948,1956,1964,1975,2015,2016,2017,2018,2019,2022],
    bestRecord: '73-9 (2015-16)', worstRecord: '17-65 (2011-12)',
    retiredNumbers: [
      { number: '13', player: 'Wilt Chamberlain', years: '1959-65' },
      { number: '14', player: 'Tom Meschery', years: '1961-67' },
      { number: '16', player: 'Al Attles', years: '1960-71' },
      { number: '24', player: 'Rick Barry', years: '1965-67,72-78' },
      { number: '42', player: 'Nate Thurmond', years: '1963-74' },
    ],
    legends: [
      { playerId: '201939', name: 'Stephen Curry', position: 'PG', era: '2009-Present', description: '4× NBA Champion, 2× MVP (1 unanimous), 2022 Finals MVP. Changed basketball forever with his shooting.' },
      { playerId: '2571', name: 'Klay Thompson', position: 'SG', era: '2011-2024', description: '4× NBA Champion. One of the greatest shooters ever. Scored 37 points in a single quarter.' },
      { playerId: '76375', name: 'Wilt Chamberlain', position: 'C', era: '1959-1965', description: 'Scored 100 points in a single game with the Warriors. The most statistically dominant player in NBA history.' },
      { playerId: '2738', name: 'Draymond Green', position: 'PF', era: '2012-Present', description: '4× NBA Champion. The defensive backbone of the dynasty. Defensive Player of the Year 2017.' },
    ],
  },
  '1610612741': { // Bulls
    primary: '#CE1141', secondary: '#000000',
    founded: 1966,
    titles: [1991,1992,1993,1996,1997,1998],
    confTitles: [1991,1992,1993,1996,1997,1998],
    confAppearances: [1991,1992,1993,1996,1997,1998],
    bestRecord: '72-10 (1995-96)', worstRecord: '17-65 (1998-99)',
    retiredNumbers: [
      { number: '10', player: 'Bob Love', years: '1968-77' },
      { number: '23', player: 'Michael Jordan', years: '1984-93,95-98' },
      { number: '33', player: 'Scottie Pippen', years: '1987-98,03-04' },
    ],
    legends: [
      { playerId: '1029', name: 'Michael Jordan', position: 'SG', era: '1984-1998', description: '6× NBA Champion, 6× Finals MVP, 5× MVP, 14× All-Star. The Greatest of All Time. Period.' },
      { playerId: '887', name: 'Scottie Pippen', position: 'SF', era: '1987-1998', description: '6× NBA Champion. One of the greatest two-way players ever. Essential to Jordan\'s dynasty.' },
      { playerId: '76306', name: 'Bob Love', position: 'SF', era: '1968-1977', description: '3× All-Star. Beloved Chicago icon who overcame incredible adversity to become a fan favorite forever.' },
    ],
  },
  '1610612759': { // Spurs
    primary: '#C4CED4', secondary: '#000000',
    founded: 1967,
    titles: [1999,2003,2005,2007,2014],
    confTitles: [1999,2003,2005,2007,2014],
    confAppearances: [1999,2003,2005,2007,2014],
    bestRecord: '67-15 (2015-16)', worstRecord: '20-62 (1996-97)',
    retiredNumbers: [
      { number: '00', player: 'Johnny Moore', years: '1980-90' },
      { number: '13', player: 'James Silas', years: '1972-81' },
      { number: '44', player: 'George Gervin', years: '1974-85' },
      { number: '50', player: 'David Robinson', years: '1989-2003' },
    ],
    legends: [
      { playerId: '1495', name: 'Tim Duncan', position: 'PF', era: '1997-2016', description: '5× NBA Champion, 3× Finals MVP, 2× MVP. The Big Fundamental. Greatest power forward in NBA history.' },
      { playerId: '76748', name: 'David Robinson', position: 'C', era: '1989-2003', description: '2× NBA Champion, 1× MVP, 1× DPOY, 1× Scoring Champ. The Admiral. Hall of Famer and true gentleman.' },
      { playerId: '1056', name: 'Tony Parker', position: 'PG', era: '2001-2018', description: '4× NBA Champion, 2007 Finals MVP. Lightning-fast European guard who won it all with Spurs dynasty.' },
      { playerId: '2548', name: 'Manu Ginobili', position: 'SG', era: '2002-2018', description: '4× NBA Champion. Inventor of the Euro step. One of the greatest sixth men and clutch players ever.' },
    ],
  },
  '1610612748': { // Heat
    primary: '#98002E', secondary: '#F9A01B',
    founded: 1988,
    titles: [2006,2012,2013],
    confTitles: [2006,2011,2012,2013,2014,2020,2023],
    confAppearances: [2006,2011,2012,2013,2014,2020,2023],
    bestRecord: '66-16 (2012-13)', worstRecord: '15-67 (1988-89)',
    retiredNumbers: [
      { number: '10', player: 'Tim Hardaway', years: '1996-2001' },
      { number: '23', player: 'Michael Jordan', years: 'Honorary' },
      { number: '32', player: 'Shaquille O\'Neal', years: '2004-08' },
      { number: '33', player: 'Alonzo Mourning', years: '1995-2008' },
    ],
    legends: [
      { playerId: '2544', name: 'LeBron James', position: 'SF', era: '2010-2014', description: '2× NBA Champion with Heat, 2× Finals MVP. The Big Three era with Wade & Bosh defined modern superteams.' },
      { playerId: '2216', name: 'Dwyane Wade', position: 'SG', era: '2003-2019', description: '3× NBA Champion, 2006 Finals MVP. Flash. The greatest player in Heat history. Icon of Miami.' },
      { playerId: '253', name: 'Alonzo Mourning', position: 'C', era: '1995-2008', description: '1× NBA Champion, 2× DPOY. Zo. One of the most intimidating defenders ever.' },
    ],
  },
  '1610612743': { // Nuggets
    primary: '#0E2240', secondary: '#FEC524',
    founded: 1967,
    titles: [2023],
    confTitles: [2023],
    confAppearances: [2023],
    bestRecord: '54-28 (2012-13)', worstRecord: '11-71 (1997-98)',
    retiredNumbers: [
      { number: '2', player: 'Alex English', years: '1979-90' },
      { number: '33', player: 'David Thompson', years: '1975-82' },
      { number: '40', player: 'Byron Beck', years: '1967-77' },
      { number: '44', player: 'Dan Issel', years: '1975-85' },
    ],
    legends: [
      { playerId: '203999', name: 'Nikola Jokic', position: 'C', era: '2015-Present', description: '3× MVP, 2023 Finals MVP, NBA Champion. The Joker. Redefining the center position in real time.' },
      { playerId: '77182', name: 'Alex English', position: 'SF', era: '1979-1990', description: '8× All-Star, Led NBA in scoring 1983. All-time franchise scoring leader before Jokic era.' },
    ],
  },
  '1610612752': { // Knicks
    primary: '#006BB6', secondary: '#F58426',
    founded: 1946,
    titles: [1970,1973],
    confTitles: [1951,1952,1953,1970,1972,1973,1994,1999],
    confAppearances: [1951,1952,1953,1970,1972,1973,1994,1999],
    bestRecord: '60-22 (1992-93)', worstRecord: '17-65 (2014-15)',
    retiredNumbers: [
      { number: '10', player: 'Walt Frazier', years: '1967-77' },
      { number: '12', player: 'Dick Barnett', years: '1962-73' },
      { number: '15', player: 'Dick McGuire', years: '1949-57' },
      { number: '19', player: 'Willis Reed', years: '1964-74' },
      { number: '22', player: 'Dave DeBusschere', years: '1968-73' },
      { number: '24', player: 'Bill Bradley', years: '1967-77' },
      { number: '33', player: 'Patrick Ewing', years: '1985-2000' },
    ],
    legends: [
      { playerId: '77149', name: 'Patrick Ewing', position: 'C', era: '1985-2000', description: '1985 #1 Pick. 11× All-Star. The face of the Knicks for a generation. Made MSG electric every night.' },
      { playerId: '77146', name: 'Walt Frazier', position: 'PG', era: '1967-1977', description: '2× NBA Champion. Clyde. One of the greatest defensive guards ever. Style icon of New York.' },
      { playerId: '77591', name: 'Willis Reed', position: 'C', era: '1964-1974', description: '2× NBA Champion, 2× Finals MVP. The heroic Game 7 limp-out is the most iconic moment in Knicks history.' },
    ],
  },
  '1610612749': { // Bucks
    primary: '#00471B', secondary: '#EEE1C6',
    founded: 1968,
    titles: [1971,2021],
    confTitles: [1971,1974,2021],
    confAppearances: [1971,1974,2021],
    bestRecord: '60-22 (1980-81)', worstRecord: '15-67 (2013-14)',
    retiredNumbers: [
      { number: '1', player: 'Oscar Robertson', years: '1970-74' },
      { number: '14', player: 'Jon McGlocklin', years: '1968-76' },
      { number: '16', player: 'Bob Boozer', years: '1968-70' },
      { number: '32', player: 'Junior Bridgeman', years: '1975-87' },
      { number: '33', player: 'Kareem Abdul-Jabbar', years: '1969-75' },
    ],
    legends: [
      { playerId: '203507', name: 'Giannis Antetokounmpo', position: 'PF', era: '2013-Present', description: '2× MVP, 2021 Finals MVP, DPOY, NBA Champion. The Greek Freak. Came from nothing to become a superstar.' },
      { playerId: '76003', name: 'Kareem Abdul-Jabbar', position: 'C', era: '1969-1975', description: '1× NBA Champion with Bucks, 1971 MVP. Won his first title here before heading to LA.' },
      { playerId: '77334', name: 'Oscar Robertson', position: 'PG', era: '1970-1974', description: '1× NBA Champion. The Big O. First player to average a triple-double for an entire season.' },
    ],
  },
  '1610612760': { // Thunder
    primary: '#007AC1', secondary: '#EF3B24',
    founded: 1967,
    titles: [1979],
    confTitles: [1979,1994,1996,2012,2025],
    confAppearances: [1979,1994,1996,2012,2025],
    bestRecord: '68-14 (2024-25)', worstRecord: '23-59 (2008-09)',
    retiredNumbers: [
      { number: '34', player: 'Nate Thurmond', years: 'Seattle' },
    ],
    legends: [
      { playerId: '1628983', name: 'Shai Gilgeous-Alexander', position: 'PG', era: '2019-Present', description: 'MVP, Finals MVP, Scoring Champ, 2025 NBA Champion. Broke Wilt\'s consecutive 20-point game record.' },
      { playerId: '201142', name: 'Kevin Durant', position: 'SF', era: '2007-2016', description: '1× MVP, 4× Scoring Champ with OKC. Went to 2012 Finals. One of the most gifted scorers ever.' },
    ],
  },
  '1610612753': { // Magic
    primary: '#0077C0', secondary: '#C4CED4',
    founded: 1989,
    titles: [],
    confTitles: [1995,2009],
    confAppearances: [1995,2009],
    bestRecord: '60-22 (1995-96)', worstRecord: '15-67 (2012-13)',
    retiredNumbers: [
      { number: '32', player: 'Shaquille O\'Neal', years: '1992-96' },
    ],
    legends: [
      { playerId: '1050', name: 'Shaquille O\'Neal', position: 'C', era: '1992-1996', description: 'The young Shaq. Took Orlando to the 1995 Finals at just 23 years old. Most physically dominant player ever.' },
      { playerId: '703', name: 'Penny Hardaway', position: 'PG', era: '1993-1999', description: '4× All-Star. Formed one of the most feared duos in the NBA with Shaq. Could do everything on the court.' },
    ],
  },
  '1610612737': { // Hawks
    primary: '#C8102E', secondary: '#FDB927',
    founded: 1946,
    titles: [1958],
    confTitles: [1957,1958,1960,1961],
    confAppearances: [1957,1958,1960,1961],
    bestRecord: '60-22 (1986-87)', worstRecord: '13-69 (2004-05)',
    retiredNumbers: [
      { number: '9', player: 'Bob Pettit', years: '1954-65' },
      { number: '21', player: 'Dominique Wilkins', years: '1982-94,97' },
      { number: '23', player: 'Lou Hudson', years: '1966-77' },
    ],
    legends: [
      { playerId: '77396', name: 'Bob Pettit', position: 'PF', era: '1954-1965', description: '2× MVP, 1958 NBA Champion, 11× All-Star. The first superstar in Hawks history and one of the greatest power forwards ever.' },
      { playerId: '76750', name: 'Dominique Wilkins', position: 'SF', era: '1982-1994', description: '1× Scoring Champ, 9× All-Star. The Human Highlight Film. One of the most electrifying dunkers in NBA history.' },
      { playerId: '254', name: 'Dikembe Mutombo', position: 'C', era: '1996-2001', description: '4× DPOY, 8× All-Star. One of the most dominant shot-blockers ever. Finger wag was iconic.' },
    ],
  },
  '1610612751': { // Nets
    primary: '#000000', secondary: '#FFFFFF',
    founded: 1967,
    titles: [],
    confTitles: [2002,2003],
    confAppearances: [2002,2003],
    bestRecord: '52-30 (2020-21)', worstRecord: '12-70 (2009-10)',
    retiredNumbers: [
      { number: '3', player: 'Drazen Petrovic', years: '1989-93' },
      { number: '4', player: 'Wendell Ladner', years: '1973-75' },
      { number: '5', player: 'Jason Kidd', years: '2001-08' },
      { number: '23', player: 'John Williamson', years: '1973-80' },
      { number: '25', player: 'Bill Melchionni', years: '1969-76' },
      { number: '32', player: 'Julius Erving', years: '1973-76 (ABA)' },
    ],
    legends: [
      { playerId: '102', name: 'Jason Kidd', position: 'PG', era: '2001-2008', description: '2× Finals appearances with Nets. 10× All-Star, DPOY runner-up multiple times. One of the greatest point guards ever.' },
      { playerId: '76682', name: 'Julius Erving', position: 'SF', era: '1973-1976 (ABA)', description: '2× ABA Champion with Nets, 3× ABA MVP. Dr. J defined above-the-rim basketball before the NBA merger.' },
      { playerId: '78616', name: 'Drazen Petrovic', position: 'SG', era: '1989-1993', description: 'European pioneer who became one of the NBA\'s best scorers before his tragic death in 1993 at age 28.' },
    ],
  },
  '1610612766': { // Hornets
    primary: '#1D1160', secondary: '#00788C',
    founded: 1988,
    titles: [],
    confTitles: [],
    confAppearances: [],
    bestRecord: '54-28 (1995-96)', worstRecord: '7-59 (2011-12)',
    retiredNumbers: [
      { number: '13', player: 'Bobby Phills', years: '1997-2000' },
    ],
    legends: [
      { playerId: '76514', name: 'Muggsy Bogues', position: 'PG', era: '1988-1997', description: 'At 5\'3", the shortest player in NBA history. Defied every expectation and played 14 seasons in the league.' },
      { playerId: '710', name: 'Larry Johnson', position: 'PF', era: '1991-1996', description: '1992 #1 Pick, 2× All-Star. Grandmama. One of the most explosive power forwards of the early 90s.' },
      { playerId: '297', name: 'Baron Davis', position: 'PG', era: '2000-2005', description: '2× All-Star. Electrifying point guard who brought energy and highlight plays to Charlotte every night.' },
    ],
  },
  '1610612739': { // Cavaliers
    primary: '#860038', secondary: '#FDBB30',
    founded: 1970,
    titles: [2016],
    confTitles: [2007,2015,2016,2017,2018],
    confAppearances: [2007,2015,2016,2017,2018],
    bestRecord: '66-16 (2008-09)', worstRecord: '15-67 (1982-83)',
    retiredNumbers: [
      { number: '7', player: 'Bingo Smith', years: '1970-79' },
      { number: '11', player: 'Zydrunas Ilgauskas', years: '1996-2010' },
      { number: '22', player: 'Larry Nance', years: '1988-94' },
      { number: '34', player: 'Austin Carr', years: '1971-80' },
    ],
    legends: [
      { playerId: '2544', name: 'LeBron James', position: 'SF', era: '2003-2010, 2014-2018', description: '1× NBA Champion (2016), 3× Finals appearances. Delivered Cleveland its first major sports title in 52 years with an iconic comeback from 3-1.' },
      { playerId: '202681', name: 'Kyrie Irving', position: 'PG', era: '2011-2017', description: '1× NBA Champion (2016). Hit the iconic Finals Game 7 corner three. 2012 #1 Pick and 6× All-Star.' },
      { playerId: '706', name: 'Mark Price', position: 'PG', era: '1986-1995', description: '4× All-Star. One of the most accurate shooters ever. Led the Cavs to multiple deep playoff runs in the early 90s.' },
    ],
  },
  '1610612742': { // Mavericks
    primary: '#00538C', secondary: '#002F5F',
    founded: 1980,
    titles: [2011],
    confTitles: [2006,2011],
    confAppearances: [2006,2011],
    bestRecord: '67-15 (2006-07)', worstRecord: '11-71 (1992-93)',
    retiredNumbers: [
      { number: '12', player: 'Derek Harper', years: '1983-94,96-99' },
      { number: '15', player: 'Brad Davis', years: '1980-92' },
      { number: '22', player: 'Rolando Blackman', years: '1981-92' },
      { number: '41', player: 'Dirk Nowitzki', years: '1998-2019' },
    ],
    legends: [
      { playerId: '1717', name: 'Dirk Nowitzki', position: 'PF', era: '1998-2019', description: '1× NBA Champion, 1× Finals MVP, 1× MVP, 14× All-Star. Revolutionized the power forward position. One-club legend.' },
      { playerId: '959', name: 'Steve Nash', position: 'PG', era: '1998-2004', description: '2× MVP (2005, 2006) — both won with Phoenix but Nash was a Dallas original who kick-started the running game era.' },
      { playerId: '102', name: 'Jason Kidd', position: 'PG', era: '2008-2012', description: '1× NBA Champion (2011) with Dallas. One of the greatest point guards of all time. Helped orchestrate the 2011 title run.' },
    ],
  },
  '1610612765': { // Pistons
    primary: '#C8102E', secondary: '#006BB6',
    founded: 1941,
    titles: [1989,1990,2004],
    confTitles: [1987,1988,1989,1990,1992,2004,2005],
    confAppearances: [1987,1988,1989,1990,1992,2004,2005],
    bestRecord: '63-19 (1995-96)', worstRecord: '16-66 (1994-95)',
    retiredNumbers: [
      { number: '2', player: 'Chuck Daly', years: 'Coach 1983-92' },
      { number: '3', player: 'Ben Wallace', years: '2000-06,09-12' },
      { number: '4', player: 'Joe Dumars', years: '1985-99' },
      { number: '10', player: 'Dennis Rodman', years: '1986-93' },
      { number: '11', player: 'Isiah Thomas', years: '1981-94' },
      { number: '15', player: 'Vinnie Johnson', years: '1981-91' },
      { number: '16', player: 'Bob Lanier', years: '1970-80' },
      { number: '21', player: 'Dave Bing', years: '1966-75' },
      { number: '40', player: 'Bill Laimbeer', years: '1982-94' },
    ],
    legends: [
      { playerId: '881', name: 'Isiah Thomas', position: 'PG', era: '1981-1994', description: '2× NBA Champion, 1990 Finals MVP, 12× All-Star. Led the Bad Boys dynasty. One of the toughest competitors ever.' },
      { playerId: '766', name: 'Joe Dumars', position: 'SG', era: '1985-1999', description: '2× NBA Champion, 1989 Finals MVP, 6× All-Star. Hall of Famer known for elite defense and quiet leadership.' },
      { playerId: '802', name: 'Bill Laimbeer', position: 'C', era: '1982-1994', description: '2× NBA Champion. The enforcer of the Bad Boys. Revolutionized big man play with his shooting and physicality.' },
      { playerId: '203502', name: 'Ben Wallace', position: 'C', era: '2000-2006', description: '4× DPOY, 1× NBA Champion (2004). Undrafted force of nature who became the anchor of Detroit\'s championship defense.' },
    ],
  },
  '1610612745': { // Rockets
    primary: '#CE1141', secondary: '#C4CED4',
    founded: 1967,
    titles: [1994,1995],
    confTitles: [1981,1986,1994,1995],
    confAppearances: [1981,1986,1994,1995],
    bestRecord: '58-24 (2017-18)', worstRecord: '17-65 (1982-83)',
    retiredNumbers: [
      { number: '23', player: 'Calvin Murphy', years: '1970-83' },
      { number: '24', player: 'Moses Malone', years: '1976-82' },
      { number: '34', player: 'Hakeem Olajuwon', years: '1984-2001' },
      { number: '45', player: 'Rudy Tomjanovich', years: '1970-81' },
    ],
    legends: [
      { playerId: '165', name: 'Hakeem Olajuwon', position: 'C', era: '1984-2001', description: '2× NBA Champion, 2× Finals MVP, 1× MVP, 1× DPOY. The Dream. Greatest center not named Wilt or Russell.' },
      { playerId: '201935', name: 'James Harden', position: 'SG', era: '2012-2021', description: '1× MVP, 3× Scoring Champ with Houston. Led the league in scoring 4 consecutive seasons. Beard era defined the Rockets.' },
      { playerId: '76977', name: 'Clyde Drexler', position: 'SG', era: '1995-1998', description: '1× NBA Champion (1995) with Rockets. 10× All-Star and one of the greatest two-way guards in history.' },
    ],
  },
  '1610612754': { // Pacers
    primary: '#002D62', secondary: '#FDBB30',
    founded: 1967,
    titles: [],
    confTitles: [2000],
    confAppearances: [2000],
    bestRecord: '61-21 (1999-2000)', worstRecord: '17-65 (1982-83)',
    retiredNumbers: [
      { number: '30', player: 'George McGinnis', years: '1971-75,80-82' },
      { number: '31', player: 'Reggie Miller', years: '1987-2005' },
      { number: '34', player: 'Mel Daniels', years: '1968-74' },
      { number: '35', player: 'Roger Brown', years: '1967-74' },
    ],
    legends: [
      { playerId: '670', name: 'Reggie Miller', position: 'SG', era: '1987-2005', description: '5× All-Star, 1992 Olympic gold. The greatest shooter in Pacers history and one of the best clutch players ever. Owned Madison Square Garden.' },
      { playerId: '730', name: 'Rik Smits', position: 'C', era: '1988-2000', description: 'The Dunking Dutchman. 1988 #2 Pick. Spent entire career in Indiana and was one of the best centers of the 90s.' },
      { playerId: '202331', name: 'Paul George', position: 'SF', era: '2010-2017', description: '6× All-Star, 1× DPOY. Homegrown superstar who developed into one of the best two-way players in the league.' },
    ],
  },
  '1610612746': { // Clippers
    primary: '#C8102E', secondary: '#1D428A',
    founded: 1970,
    titles: [],
    confTitles: [],
    confAppearances: [],
    bestRecord: '57-25 (2013-14)', worstRecord: '12-70 (1986-87)',
    retiredNumbers: [
      { number: '15', player: 'Norm Nixon', years: '1983-89' },
    ],
    legends: [
      { playerId: '101108', name: 'Chris Paul', position: 'PG', era: '2011-2017', description: '12× All-Star. Became the face of a franchise resurgence. Led the Clippers to multiple deep playoff runs.' },
      { playerId: '201933', name: 'Blake Griffin', position: 'PF', era: '2010-2018', description: '6× All-Star, 2011 ROY. Lob City era. One of the most explosive and entertaining players of his generation.' },
      { playerId: '202695', name: 'Kawhi Leonard', position: 'SF', era: '2019-Present', description: '2× NBA Champion, 2× Finals MVP. Brought championship pedigree to the Clippers. Elite two-way wing.' },
    ],
  },
  '1610612763': { // Grizzlies
    primary: '#5D76A9', secondary: '#12173F',
    founded: 1995,
    titles: [],
    confTitles: [],
    confAppearances: [],
    bestRecord: '56-26 (2012-13)', worstRecord: '19-63 (2018-19)',
    retiredNumbers: [
      { number: '50', player: 'Zach Randolph', years: '2009-17' },
    ],
    legends: [
      { playerId: '2200', name: 'Pau Gasol', position: 'PF', era: '2001-2008', description: '2001 ROY. The original Grizzlies star. Traded to LA in the blockbuster deal that built the Lakers dynasty.' },
      { playerId: '203200', name: 'Marc Gasol', position: 'C', era: '2008-2019', description: '1× DPOY, 3× All-Star. The anchor of Grit & Grind Memphis. World champion with Spain and later Toronto.' },
      { playerId: '101133', name: 'Zach Randolph', position: 'PF', era: '2009-2017', description: '2× All-Star. The heart of Grit & Grind. Physical, tough, and beloved in Memphis. Z-Bo defined an era.' },
      { playerId: '201150', name: 'Mike Conley', position: 'PG', era: '2007-2019', description: '1× All-Star. Spent 12 seasons in Memphis — one of the most loyal and underrated point guards in NBA history.' },
    ],
  },
  '1610612750': { // Timberwolves
    primary: '#0C2340', secondary: '#236192',
    founded: 1989,
    titles: [],
    confTitles: [],
    confAppearances: [],
    bestRecord: '58-24 (2003-04)', worstRecord: '15-67 (1991-92)',
    retiredNumbers: [
      { number: '2', player: 'Kevin Garnett', years: '1995-2007,2015-16' },
      { number: '13', player: 'Flip Saunders', years: 'Coach 1995-2005,2014-15' },
    ],
    legends: [
      { playerId: '708', name: 'Kevin Garnett', position: 'PF', era: '1995-2007', description: '1× NBA Champion (with Celtics), 1× DPOY, 1× MVP, 15× All-Star. Carried Minnesota to the 2004 WCF almost single-handedly.' },
      { playerId: '201567', name: 'Kevin Love', position: 'PF', era: '2008-2014', description: '5× All-Star. Led league in rebounding twice. Before the Cavs, Love was one of the most dominant players in basketball.' },
      { playerId: '1872', name: 'Stephon Marbury', position: 'PG', era: '1996-1999', description: '2× All-Star. Brooklyn native who showed flashes of elite play before leaving for bigger markets.' },
    ],
  },
  '1610612740': { // Pelicans
    primary: '#0C2340', secondary: '#C8102E',
    founded: 2002,
    titles: [],
    confTitles: [],
    confAppearances: [],
    bestRecord: '56-26 (2007-08)', worstRecord: '20-62 (2012-13)',
    retiredNumbers: [
      { number: '7', player: 'Pete Maravich', years: 'Honors N.O. basketball legacy' },
    ],
    legends: [
      { playerId: '101108', name: 'Chris Paul', position: 'PG', era: '2005-2011', description: '5× All-Star with N.O. 2007-08 MVP runner-up. Rebuilt the franchise after Hurricane Katrina displaced the team.' },
      { playerId: '203076', name: 'Anthony Davis', position: 'PF/C', era: '2012-2019', description: '7× All-Star, 1× DPOY. Dominant two-way big who became the face of the franchise before his trade to LA.' },
    ],
  },
  '1610612755': { // 76ers
    primary: '#006BB6', secondary: '#ED174C',
    founded: 1946,
    titles: [1955,1967,1983],
    confTitles: [1950,1954,1955,1956,1957,1966,1967,1977,1980,1982,1983,2001],
    confAppearances: [1950,1954,1955,1956,1957,1966,1967,1977,1980,1982,1983,2001],
    bestRecord: '68-13 (1966-67)', worstRecord: '9-73 (1972-73)',
    retiredNumbers: [
      { number: '6', player: 'Julius Erving', years: '1976-87' },
      { number: '13', player: 'Wilt Chamberlain', years: '1964-68' },
      { number: '15', player: 'Hal Greer', years: '1958-73' },
      { number: '24', player: 'Bobby Jones', years: '1978-86' },
      { number: '32', player: 'Billy Cunningham', years: '1965-76' },
      { number: '34', player: 'Charles Barkley', years: '1984-92' },
    ],
    legends: [
      { playerId: '76682', name: 'Julius Erving', position: 'SF', era: '1976-1987', description: '1× NBA Champion (1983), 1× MVP. Dr. J. Transformed basketball with artistry and above-the-rim play.' },
      { playerId: '947', name: 'Allen Iverson', position: 'PG', era: '1996-2006', description: '1× MVP, 4× Scoring Champ, 11× All-Star. The Answer. One of the greatest scorers and most culturally impactful players ever.' },
      { playerId: '787', name: 'Charles Barkley', position: 'PF', era: '1984-1992', description: '1× MVP (with Suns), 11× All-Star. The Round Mound of Rebound. Hall of Famer who dominated despite positional disadvantages.' },
      { playerId: '76375', name: 'Wilt Chamberlain', position: 'C', era: '1964-1968', description: '1× NBA Champion (1967), 1× MVP with Philly. Averaged 24.1 ppg & 24.2 rpg for his career. Physically unmatched.' },
    ],
  },
  '1610612756': { // Suns
    primary: '#1D1160', secondary: '#E56020',
    founded: 1968,
    titles: [],
    confTitles: [1976,1993,2021],
    confAppearances: [1976,1993,2021],
    bestRecord: '62-20 (2004-05)', worstRecord: '13-69 (1968-69)',
    retiredNumbers: [
      { number: '5', player: 'Dick Van Arsdale', years: '1968-77' },
      { number: '6', player: 'Walter Davis', years: '1977-88' },
      { number: '7', player: 'Kevin Johnson', years: '1988-98,99-2000' },
      { number: '32', player: 'Charles Barkley', years: '1992-96' },
      { number: '33', player: 'Alvan Adams', years: '1975-88' },
      { number: '42', player: 'Connie Hawkins', years: '1969-73' },
      { number: '44', player: 'Paul Westphal', years: '1975-80,83-84' },
    ],
    legends: [
      { playerId: '959', name: 'Steve Nash', position: 'PG', era: '1996-98,2004-2012', description: '2× MVP (2005, 2006), 8× All-Star. Revolutionized pace-and-space basketball with D\'Antoni. Best Suns player ever.' },
      { playerId: '787', name: 'Charles Barkley', position: 'PF', era: '1992-1996', description: '1× MVP (1993), 11× All-Star. The Round Mound of Rebound. Led Phoenix to the 1993 Finals as the best player in the world.' },
      { playerId: '1628384', name: 'Devin Booker', position: 'SG', era: '2015-Present', description: '3× All-Star. Led Suns to 2021 Finals. Pure scorer who elevated the franchise back to relevance.' },
    ],
  },
  '1610612757': { // Trail Blazers
    primary: '#E03A3E', secondary: '#000000',
    founded: 1970,
    titles: [1977],
    confTitles: [1977,1990,1992],
    confAppearances: [1977,1990,1992],
    bestRecord: '63-19 (1999-2000)', worstRecord: '21-61 (2023-24)',
    retiredNumbers: [
      { number: '1', player: 'Larry Weinberg', years: 'Owner/Honorary' },
      { number: '13', player: 'Dave Twardzik', years: '1976-80' },
      { number: '15', player: 'Larry Steele', years: '1971-80' },
      { number: '20', player: 'Maurice Lucas', years: '1976-80,87-88' },
      { number: '22', player: 'Clyde Drexler', years: '1983-95' },
      { number: '30', player: 'Bob Gross', years: '1975-82' },
      { number: '32', player: 'Bill Walton', years: '1974-79' },
      { number: '36', player: 'Lloyd Neal', years: '1972-79' },
      { number: '45', player: 'Geoff Petrie', years: '1970-76' },
      { number: '77', player: 'Jack Ramsay', years: 'Coach 1976-86' },
    ],
    legends: [
      { playerId: '76977', name: 'Clyde Drexler', position: 'SG', era: '1983-1995', description: '1× NBA Champion (1995 with Rockets), 10× All-Star. Clyde the Glide. One of the all-time great two-way guards, built his name in Portland.' },
      { playerId: '76453', name: 'Bill Walton', position: 'C', era: '1974-1979', description: '1× NBA Champion (1977), 1× Finals MVP, 1× MVP. Led the Blazers to their only title in one of the great single-season peaks.' },
      { playerId: '203081', name: 'Damian Lillard', position: 'PG', era: '2012-2023', description: '7× All-Star. Dame Time. One of the greatest clutch shooters in NBA history. Spent 11 seasons as a one-club Blazer.' },
    ],
  },
  '1610612758': { // Kings
    primary: '#5A2D81', secondary: '#63727A',
    founded: 1945,
    titles: [1951],
    confTitles: [1945,1946,1948,1951],
    confAppearances: [1945,1946,1948,1951],
    bestRecord: '55-27 (2001-02)', worstRecord: '8-74 (2008-09)',
    retiredNumbers: [
      { number: '1', player: 'Nate Archibald', years: '1970-76' },
      { number: '6', player: 'Lester Harrison', years: 'Owner/Founder' },
      { number: '11', player: 'Bob Davies', years: '1945-55' },
      { number: '12', player: 'Maurice Stokes', years: '1955-58' },
      { number: '14', player: 'Oscar Robertson', years: '1960-70 (Cincinnati)' },
      { number: '27', player: 'Jack Twyman', years: '1955-66' },
    ],
    legends: [
      { playerId: '77334', name: 'Oscar Robertson', position: 'PG', era: '1960-1970 (Cincinnati)', description: '1× NBA Champion (with Bucks). The Big O. First player to average a triple-double for a season. One of the greatest ever.' },
      { playerId: '1902', name: 'Chris Webber', position: 'PF', era: '1998-2005', description: '5× All-Star. Led the Kings to the 2002 WCF in one of the NBA\'s most controversial playoff series. Sacramento\'s all-time great.' },
      { playerId: '2397', name: 'Vlade Divac', position: 'C', era: '1999-2005', description: '2× All-Star. The heart of the Webber-era Kings. European pioneer who helped make Sacramento must-watch basketball.' },
    ],
  },
  '1610612761': { // Raptors
    primary: '#CE1141', secondary: '#000000',
    founded: 1995,
    titles: [2019],
    confTitles: [2019],
    confAppearances: [2019],
    bestRecord: '59-23 (2017-18)', worstRecord: '16-66 (1997-98)',
    retiredNumbers: [
      { number: '15', player: 'Vince Carter', years: '1998-2004' },
    ],
    legends: [
      { playerId: '1713', name: 'Vince Carter', position: 'SG', era: '1998-2004', description: '8× All-Star. Vinsanity. Turned Toronto into a basketball city. His 2000 Dunk Contest performance is the greatest ever.' },
      { playerId: '2547', name: 'Chris Bosh', position: 'PF', era: '2003-2010', description: '11× All-Star (6 with Toronto). The cornerstone of the Raptors rebuild before leaving to win titles with Miami.' },
      { playerId: '201942', name: 'DeMar DeRozan', position: 'SG', era: '2009-2018', description: '4× All-Star with Toronto. The most beloved Raptor of the modern era — his trade shocked fans and was pure business.' },
      { playerId: '202695', name: 'Kawhi Leonard', position: 'SF', era: '2018-2019', description: '1× NBA Champion (2019), Finals MVP. The Shot in Game 7 vs Philadelphia is one of the most iconic moments in Finals history.' },
    ],
  },
  '1610612762': { // Jazz
    primary: '#002B5C', secondary: '#00471B',
    founded: 1974,
    titles: [],
    confTitles: [1997,1998],
    confAppearances: [1997,1998],
    bestRecord: '64-18 (1996-97)', worstRecord: '17-65 (1974-75)',
    retiredNumbers: [
      { number: '1', player: 'Frank Layden', years: 'Coach/Exec 1979-88' },
      { number: '7', player: 'Pete Maravich', years: '1974-79 (N.O. Jazz)' },
      { number: '12', player: 'John Stockton', years: '1984-2003' },
      { number: '14', player: 'Jeff Hornacek', years: '1994-2000' },
      { number: '35', player: 'Darrell Griffith', years: '1980-91' },
      { number: '53', player: 'Mark Eaton', years: '1982-93' },
    ],
    legends: [
      { playerId: '776', name: 'Karl Malone', position: 'PF', era: '1985-2003', description: '2× MVP, 14× All-Star. The Mailman. Always delivered. Second all-time scorer at retirement. Utah\'s greatest player.' },
      { playerId: '304', name: 'John Stockton', position: 'PG', era: '1984-2003', description: '10× All-Star. All-time leader in assists and steals. The quiet genius who made the pick-and-roll an art form.' },
      { playerId: '77406', name: 'Pete Maravich', position: 'PG', era: '1974-1979', description: '5× All-Star. Pistol Pete. The most skilled scorer of his era. Led the N.O. Jazz before the franchise moved to Utah.' },
    ],
  },
  '1610612764': { // Wizards
    primary: '#002B5C', secondary: '#E31837',
    founded: 1961,
    titles: [1978],
    confTitles: [1978,1979],
    confAppearances: [1978,1979],
    bestRecord: '60-22 (1978-79)', worstRecord: '15-67 (1987-88)',
    retiredNumbers: [
      { number: '11', player: 'Elvin Hayes', years: '1972-81' },
      { number: '25', player: 'Gus Johnson', years: '1963-72' },
      { number: '41', player: 'Wes Unseld', years: '1968-81' },
      { number: '45', player: 'Bob Dandridge', years: '1977-82' },
    ],
    legends: [
      { playerId: '76994', name: 'Elvin Hayes', position: 'PF/C', era: '1972-1981', description: '1× NBA Champion (1978), 12× All-Star. The Big E. One of the all-time great big men. Third on the all-time scoring list at retirement.' },
      { playerId: '77504', name: 'Wes Unseld', position: 'C', era: '1968-1981', description: '1× NBA Champion (1978), 1× Finals MVP, 1× MVP. Rookie of the Year and MVP in the same season. Physical force and rebounder.' },
      { playerId: '2402', name: 'Gilbert Arenas', position: 'PG', era: '2003-2010', description: '3× All-Star. Agent Zero. One of the most electric scorers of his era. Put Washington basketball on the map.' },
    ],
  },
};

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

interface TeamPageProps {
  teamId: string;
  teamName: string;
  teamAbbr: string;
  onBack: () => void;
  onPlayerClick: (playerId: string, playerName: string, team: string) => void;
}

export default function TeamPage({ teamId, teamName, teamAbbr, onBack, onPlayerClick }: TeamPageProps) {
  const [roster, setRoster] = useState<any[]>([]);
  const [teamInfo, setTeamInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'roster' | 'franchise' | 'legends'>('roster');

  const teamData = TEAM_DATA[teamId];
  const primary = teamData?.primary || '#f97316';
  const secondary = teamData?.secondary || '#fbbf24';

  const logoUrl = `https://cdn.nba.com/logos/nba/${teamId}/global/L/logo.svg`;

  useEffect(() => {
    window.scrollTo(0, 0);
    async function load() {
      setLoading(true);
      try {
        const [rosterRes, infoRes] = await Promise.allSettled([
          fetch(`${PROXY}/team-roster/${teamId}`).then(r => r.json()),
          fetch(`${PROXY}/team-info/${teamId}`).then(r => r.json()),
        ]);
        if (rosterRes.status === 'fulfilled') {
          const { rows } = parseResultSet(rosterRes.value, 'CommonTeamRoster');
          setRoster(rows.slice(0, 20));
        }
        if (infoRes.status === 'fulfilled') {
          const { rows } = parseResultSet(infoRes.value, 'TeamInfoCommon');
          if (rows[0]) setTeamInfo(rows[0]);
        }
      } catch (e) { console.error('Team page error:', e); }
      setLoading(false);
    }
    load();
  }, [teamId]);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}*{box-sizing:border-box;margin:0;padding:0}`}</style>

      {/* TOP BAR */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(9,9,11,0.95)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}`, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onBack} style={{ background: C.surfaceHi, border: 'none', borderRadius: 8, padding: '6px 14px', color: C.textSub, cursor: 'pointer', fontSize: 13 }}>← Back</button>
        <img src="/logo.png" alt="LeHoopIQ" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover' }} />
        <span style={{ fontSize: 16, fontWeight: 700 }}>LeHoopIQ</span>
        <span style={{ color: C.textMuted, fontSize: 13 }}>/ Team /</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{teamName}</span>
      </div>

      {/* HERO HEADER */}
      <div style={{ background: `linear-gradient(135deg, ${primary}cc 0%, ${primary}44 50%, transparent 100%)`, borderBottom: `1px solid ${primary}40`, padding: '40px 24px 32px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 32 }}>
          <img src={logoUrl} alt={teamName}
            style={{ width: 120, height: 120, objectFit: 'contain', filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.5))' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div>
            <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 8 }}>{teamName}</div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {teamData && (
                <>
                  <div>
                    <div style={{ fontSize: 10, color: `${primary}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Founded</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{teamData.founded}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: `${primary}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Championships</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: secondary }}>{teamData.titles.length}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: `${primary}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Conf. Titles</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{teamData.confTitles.length}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: `${primary}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Best Record</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{teamData.bestRecord}</div>
                  </div>
                </>
              )}
              {teamInfo && (
                <>
                  <div>
                    <div style={{ fontSize: 10, color: `${primary}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>W-L This Season</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{teamInfo.W}-{teamInfo.L}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: `${primary}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Arena</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{teamInfo.ARENA_NAME}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', flexDirection: 'column', gap: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${C.border}`, borderTopColor: primary, animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: C.textMuted, fontSize: 14 }}>Loading {teamName}...</p>
        </div>
      ) : (
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 24px', animation: 'fadeIn 0.4s ease' }}>

          {/* TABS */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 24, padding: 4, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, width: 'fit-content' }}>
            {([
              { key: 'roster', label: '👥 Roster' },
              { key: 'franchise', label: '🏆 Franchise History' },
              { key: 'legends', label: '⭐ Legends' },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: activeTab === tab.key ? primary : 'transparent', color: activeTab === tab.key ? '#fff' : C.textMuted, transition: 'all 0.2s ease' }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ROSTER TAB */}
          {activeTab === 'roster' && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textMuted, marginBottom: 16 }}>
                2025-26 Roster · Click a player to view profile
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {roster.map((player, i) => {
                  const playerId = player.PLAYER_ID?.toString();
                  const playerImg = `https://cdn.nba.com/headshots/nba/latest/1040x760/${playerId}.png`;
                  const silhouette = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 72'%3E%3Crect width='72' height='72' fill='%2327272a' rx='12'/%3E%3Ccircle cx='36' cy='26' r='13' fill='%2352525b'/%3E%3Cellipse cx='36' cy='60' rx='22' ry='16' fill='%2352525b'/%3E%3C/svg%3E`;
                  return (
                    <div key={i}
                      onClick={() => onPlayerClick(playerId, player.PLAYER, teamName)}
                      style={{ background: C.surface, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'center', transition: 'all 0.2s ease' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.border = `1px solid ${primary}60`; (e.currentTarget as HTMLDivElement).style.background = C.surfaceHi; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.border = `1px solid ${C.border}`; (e.currentTarget as HTMLDivElement).style.background = C.surface; }}
                    >
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <img src={playerImg} alt={player.PLAYER}
                          style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', objectPosition: 'top', background: C.surfaceHi, border: `2px solid ${primary}40` }}
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            // Try the smaller resolution first, then fall back to silhouette
                            if (!img.dataset.fallback) {
                              img.dataset.fallback = '1';
                              img.src = `https://cdn.nba.com/headshots/nba/latest/260x190/${playerId}.png`;
                            } else {
                              img.onerror = null;
                              img.src = silhouette;
                            }
                          }}
                        />
                        <div style={{ position: 'absolute', top: -6, right: -6, background: primary, borderRadius: 6, padding: '2px 6px', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                          #{player.NUM}
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{player.PLAYER}</div>
                        <div style={{ fontSize: 11, color: primary, fontWeight: 600, marginBottom: 4 }}>{player.POSITION || '—'}</div>
                        <div style={{ display: 'flex', gap: 12 }}>
                          {player.HEIGHT && <span style={{ fontSize: 10, color: C.textMuted }}>{player.HEIGHT}</span>}
                          {player.WEIGHT && <span style={{ fontSize: 10, color: C.textMuted }}>{player.WEIGHT} lbs</span>}
                          {player.EXP !== undefined && <span style={{ fontSize: 10, color: C.textMuted }}>{player.EXP === 'R' ? 'Rookie' : `${player.EXP}yr`}</span>}
                        </div>
                      </div>
                      <div style={{ fontSize: 18, color: C.textMuted }}>›</div>
                    </div>
                  );
                })}
              </div>
              {roster.length === 0 && (
                <div style={{ background: C.surface, borderRadius: 20, padding: 40, textAlign: 'center', color: C.textMuted }}>
                  Roster data unavailable. Make sure the proxy server is running.
                </div>
              )}
            </div>
          )}

          {/* FRANCHISE TAB */}
          {activeTab === 'franchise' && teamData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Championships */}
              {teamData.titles.length > 0 && (
                <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textMuted, marginBottom: 16 }}>
                    🏆 NBA Championships ({teamData.titles.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {teamData.titles.map(year => (
                      <div key={year} style={{ background: `${secondary}20`, border: `1px solid ${secondary}60`, borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 700, color: secondary }}>
                        {year}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conf Titles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textMuted, marginBottom: 16 }}>
                    🏅 Conference Championships ({teamData.confTitles.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {teamData.confTitles.map(year => (
                      <div key={year} style={{ background: `${primary}20`, border: `1px solid ${primary}40`, borderRadius: 6, padding: '4px 10px', fontSize: 11, color: C.textSub }}>
                        {year}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textMuted, marginBottom: 16 }}>
                    📋 Franchise Records
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ background: C.surfaceHi, borderRadius: 10, padding: '12px 16px' }}>
                      <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>BEST REGULAR SEASON</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.emerald }}>{teamData.bestRecord}</div>
                    </div>
                    <div style={{ background: C.surfaceHi, borderRadius: 10, padding: '12px 16px' }}>
                      <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>WORST REGULAR SEASON</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#ef4444' }}>{teamData.worstRecord}</div>
                    </div>
                    <div style={{ background: C.surfaceHi, borderRadius: 10, padding: '12px 16px' }}>
                      <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>FOUNDED</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{teamData.founded}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Retired Numbers */}
              {teamData.retiredNumbers.length > 0 && (
                <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textMuted, marginBottom: 16 }}>
                    🎽 Retired Numbers
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {teamData.retiredNumbers.map((r, i) => (
                      <div key={i} style={{ background: C.surfaceHi, borderRadius: 12, padding: '12px 16px', textAlign: 'center', minWidth: 100, border: `1px solid ${primary}30` }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: primary, fontFamily: 'monospace', lineHeight: 1 }}>#{r.number}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginTop: 4 }}>{r.player}</div>
                        <div style={{ fontSize: 10, color: C.textMuted }}>{r.years}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FRANCHISE TAB — No data */}
          {activeTab === 'franchise' && !teamData && (
            <div style={{ background: C.surface, borderRadius: 20, padding: 40, textAlign: 'center', color: C.textMuted }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏗️</div>
              <p>Franchise history coming soon for this team.</p>
            </div>
          )}

          {/* LEGENDS TAB */}
          {activeTab === 'legends' && (
            <div>
              {teamData?.legends && teamData.legends.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textMuted, marginBottom: 8 }}>
                    ⭐ Franchise Legends · Click to view full profile & career stats
                  </div>
                  {teamData.legends.map((legend, i) => {
                    const legendImg = `https://cdn.nba.com/headshots/nba/latest/1040x760/${legend.playerId}.png`;
                    const legendSilhouette = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 90 90'%3E%3Crect width='90' height='90' fill='%2327272a' rx='14'/%3E%3Ccircle cx='45' cy='32' r='16' fill='%2352525b'/%3E%3Cellipse cx='45' cy='75' rx='27' ry='20' fill='%2352525b'/%3E%3C/svg%3E`;
                    return (
                      <div key={i}
                        onClick={() => onPlayerClick(legend.playerId, legend.name, teamName)}
                        style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}`, cursor: 'pointer', display: 'flex', gap: 20, alignItems: 'center', transition: 'all 0.2s ease' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.border = `1px solid ${primary}60`; (e.currentTarget as HTMLDivElement).style.background = C.surfaceHi; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.border = `1px solid ${C.border}`; (e.currentTarget as HTMLDivElement).style.background = C.surface; }}
                      >
                        <img src={legendImg} alt={legend.name}
                          style={{ width: 90, height: 90, borderRadius: 14, objectFit: 'cover', objectPosition: 'top', background: C.surfaceHi, border: `2px solid ${primary}40`, flexShrink: 0 }}
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            if (!img.dataset.fallback) {
                              img.dataset.fallback = '1';
                              img.src = `https://cdn.nba.com/headshots/nba/latest/260x190/${legend.playerId}.png`;
                            } else {
                              img.onerror = null;
                              img.src = legendSilhouette;
                            }
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{legend.name}</div>
                            <div style={{ fontSize: 11, color: primary, fontWeight: 700, background: `${primary}20`, padding: '2px 8px', borderRadius: 6 }}>{legend.position}</div>
                            <div style={{ fontSize: 11, color: C.textMuted }}>{legend.era}</div>
                          </div>
                          <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6 }}>{legend.description}</div>
                        </div>
                        <div style={{ fontSize: 24, color: C.textMuted }}>›</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ background: C.surface, borderRadius: 20, padding: 40, textAlign: 'center', color: C.textMuted }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
                  <p>Franchise legends coming soon for this team.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}