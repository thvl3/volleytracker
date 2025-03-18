import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import HomePage from './pages/HomePage';
import AdminLoginPage from './pages/Admin/AdminLoginPage';
import AdminDashboardPage from './pages/Admin/AdminDashboardPage';
import AdminTournamentsPage from './pages/Admin/AdminTournamentsPage';
import AdminTeamsPage from './pages/Admin/AdminTeamsPage';
import AdminLocationsPage from './pages/Admin/AdminLocationsPage';
import AdminPoolsPage from './pages/Admin/AdminPoolsPage';
import AdminPoolScoringPage from './pages/Admin/AdminPoolScoringPage';
import AdminMatchesPage from './pages/Admin/AdminMatchesPage';
import AdminScoringPage from './pages/Admin/AdminScoringPage';
import TournamentListPage from './pages/TournamentListPage';
import TournamentDetailPage from './pages/TournamentDetailPage';
import LiveBracketPage from './pages/LiveBracketPage';
import { authAPI } from './api';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import MainLayout from './components/MainLayout';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }
      
      try {
        await authAPI.validateToken();
        setAuthenticated(true);
      } catch (err) {
        console.error('Token validation failed:', err);
        localStorage.removeItem('token');
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/login" element={<Navigate to="/admin/login" replace />} />
            <Route path="/tournaments" element={<TournamentListPage />} />
            <Route path="/tournaments/:tournamentId" element={<TournamentDetailPage />} />
            <Route path="/tournaments/:tournamentId/bracket" element={<TournamentDetailPage initialTab={2} />} />
            <Route path="/tournaments/:tournamentId/live" element={<LiveBracketPage />} />
          </Route>
          
          {/* Admin Routes - Wrapped in AdminLayout */}
          <Route path="/admin" element={
            <ProtectedRoute authenticated={authenticated}>
              <AdminLayout>
                <AdminDashboardPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/tournaments" element={
            <ProtectedRoute authenticated={authenticated}>
              <AdminLayout>
                <AdminTournamentsPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/tournaments/:tournamentId" element={
            <ProtectedRoute authenticated={authenticated}>
              <AdminLayout>
                <AdminMatchesPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/tournaments/:tournamentId/matches" element={
            <ProtectedRoute authenticated={authenticated}>
              <AdminLayout>
                <AdminMatchesPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/tournaments/:tournamentId/teams" element={
            <ProtectedRoute authenticated={authenticated}>
              <AdminLayout>
                <AdminTeamsPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/tournaments/:tournamentId/pools" element={
            <ProtectedRoute authenticated={authenticated}>
              <AdminLayout>
                <AdminPoolsPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/locations" element={
            <ProtectedRoute authenticated={authenticated}>
              <AdminLayout>
                <AdminLocationsPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/pool-matches/:matchId/score" element={
            <ProtectedRoute authenticated={authenticated}>
              <AdminLayout>
                <AdminPoolScoringPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/matches/:matchId/score" element={
            <ProtectedRoute authenticated={authenticated}>
              <AdminLayout>
                <AdminScoringPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          
          {/* Redirect unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
