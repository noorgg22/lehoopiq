# LeHoopIQ Codebase Audit

**Date:** Nov 20, 2026
**Branch:** phase1-fix-stale-data

## Infrastructure

- **Frontend:** React + TypeScript + Vite, deployed on Vercel as static build
- **Backend:** Express server (`server.cjs`) + Vercel serverless functions (`/api/`)
- **Proxy:** `VITE_PROXY_URL` env var, falls back to `/api` on Vercel (serverless functions)
- **Page title:** `nbastatssite` (wrong, should be LeHoopIQ)
- **Favicon:** `public/favicon.svg` exists

## Sections & Data Sources

| Section | Source | Season Hard-coded? | Status |
|---------|--------|-------------------|--------|
| Today's Games | ESPN scoreboard (client) | No | Works |
| NBA News | ESPN news (client) | No | Works |
| Standings | ESPN standings (client) | `season=2026` in App.tsx:789 | Stale (shows 2025-26) |
| League Leaders | Proxy -> nbaapi.com | `season=2026` in 4 places | Works but stale season |
| Betting Odds | Hard-coded in App.tsx:55-68 | Spurs vs Knicks Finals | Completely stale |
| Player Profile | Proxy -> stats.nba.com + fallbacks | `SEASON='2025-26'` | Works but wrong season |
| Team Roster | Proxy -> stats.nba.com | `SEASON='2025-26'` | Works but wrong season label |
| Franchise History | Hard-coded TEAM_DATA in TeamPage.tsx | Static | Missing teams show "coming soon" |
| Franchise Legends | Hard-coded TEAM_DATA in TeamPage.tsx | Static | Missing teams show "coming soon" |
| Shameless Meter | Hard-coded player list in ShamelessMeter.tsx | Static | 14/15 players show "Video coming soon" |
| Player Notable Stretches | Hard-coded in PlayerProfile.tsx | 2025-26 references | Will go stale |
| Player Awards | Proxy + hard-coded fallback in server.cjs | Through 2025-26 | Won't auto-update |

## Hard-coded Season Strings (10+ locations)

- `server.cjs:32` — `SEASON = '2025-26'`
- `server.cjs:156,158` — `season=2026` in nbaapi.com URLs
- `api/_nba.js:3` — `SEASON = '2025-26'`
- `api/_pool.js:22-23` — `season=2026`
- `api/leaders.js:53` — `season=2026`
- `api/team-roster/[teamId].js:49` — `'2025-26'`
- `App.tsx:789` — `season=2026` in ESPN standings URL
- `App.tsx:987` — label "Standings · 2025-26"
- `TeamPage.tsx:764` — label "2025-26 Roster"

## Stale Literals

- Betting odds: "2026 NBA Finals", Spurs vs Knicks, odds values, date "June 2, 2026"
- Playoff bracket: "View 2026 Playoff Bracket" linking to nba.com/playoffs
- Notable Stretches: 2025-26 stat lines for ~20 players
- ShamelessMeter: player teams may be stale after trades

## Placeholder Text Shown to Users

- "Franchise history coming soon for this team."
- "Franchise legends coming soon for this team."
- "Video coming soon..." (14 of 15 Shameless Meter players)
- "Connect to the proxy to load live stats" + `npm run dev` instruction
- "No data available" in various places
