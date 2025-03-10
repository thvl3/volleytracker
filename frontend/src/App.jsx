import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Import components
import Header from './components/common/Header';
import Footer from './components/common/Footer';

// Import pages
import HomePage from './pages/HomePage';
import TournamentListPage from './pages/TournamentListPage';
import TournamentDetailPage from './pages/TournamentDetailPage';
import LiveBracketPage from './pages/LiveBracketPage';
import AdminLoginPage from './pages/Admin/AdminLoginPage';
import AdminDashboardPage from './pages/Admin/AdminDashboardPage';
import AdminTournamentsPage from './pages/Admin/AdminTournamentsPage';
import AdminTeamsPage from './pages/Admin/AdminTeamsPage';
import AdminMatchesPage from './pages/Admin/AdminMatchesPage';
import AdminScoringPage from './pages/Admin/AdminScoringPage';
import NotFoundPage from './pages/NotFoundPage';

// Auth context & utils
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Header />
          <main className="container">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/tournaments" element={<TournamentListPage />} />
              <Route path="/tournaments/:tournamentId" element={<TournamentDetailPage />} />
              <Route path="/tournaments/:tournamentId/bracket" element={<LiveBracketPage />} />
              
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/tournaments" 
                element={
                  <ProtectedRoute>
                    <AdminTournamentsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/tournaments/:tournamentId/teams" 
                element={
                  <ProtectedRoute>
                    <AdminTeamsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/tournaments/:tournamentId/matches" 
                element={
                  <ProtectedRoute>
                    <AdminMatchesPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/tournaments/:tournamentId/scoring" 
                element={
                  <ProtectedRoute>
                    <AdminScoringPage />
                  </ProtectedRoute>
                } 
              />

              {/* 404 and fallback routes */}
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </main>
          <Footer />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
