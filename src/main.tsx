import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './tokens.css';
import './index.css';
import Layout from './Layout';
import TodayPage from './pages/TodayPage';
import StandingsPage from './pages/StandingsPage';
import LeadersPage from './pages/LeadersPage';
import TeamsPage from './pages/TeamsPage';
import TeamPage from './TeamPage';
import PlayerProfile from './PlayerProfile';
import ShamelessMeter from './ShamelessMeter';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<TodayPage />} />
          <Route path="standings" element={<StandingsPage />} />
          <Route path="leaders" element={<LeadersPage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="teams/:abbr" element={<TeamPage />} />
          <Route path="players" element={<Navigate to="/leaders" replace />} />
          <Route path="players/:slug" element={<PlayerProfile />} />
          <Route path="shameless-meter" element={<ShamelessMeter />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
