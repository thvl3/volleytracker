import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button,
  Grid,
  Divider,
  Chip,
  Alert,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { tournamentAPI, teamAPI } from '../api/api';
import Loading from '../components/common/Loading';
import TournamentUpdatesFeed from '../components/TournamentUpdatesFeed';
import moment from 'moment';
import { formatDate, formatTime } from '../utils/dateUtils';

const LiveBracketPage = () => {
  const { tournamentId } = useParams();
  const [tournament, setTournament] = useState(null);
  const [bracket, setBracket] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tournamentResponse, bracketResponse, teamsResponse] = await Promise.all([
          tournamentAPI.getById(tournamentId),
          tournamentAPI.getBracket(tournamentId),
          teamAPI.getByTournament(tournamentId)
        ]);

        if (tournamentResponse) {
          setTournament(tournamentResponse);
        }

        if (bracketResponse) {
          // Sort rounds by round number
          const sortedBracket = bracketResponse.sort((a, b) => parseInt(a.round) - parseInt(b.round));
          setBracket(sortedBracket);
        }

        if (teamsResponse) {
          setTeams(teamsResponse);
        }
      } catch (err) {
        console.error('Error fetching tournament data:', err);
        setError('Failed to load tournament data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [tournamentId]);

  const getTeamName = (teamId) => {
    if (!teamId) return 'TBD';
    const team = teams.find(t => t.team_id === teamId);
    return team ? team.team_name : 'Unknown Team';
  };

  const renderMatch = (match) => (
    <Paper
      key={match.match_id}
      elevation={2}
      sx={{
        p: 2,
        mb: 2,
        backgroundColor: match.status === 'completed' ? 'success.light' : 
                         match.status === 'in_progress' ? 'warning.light' : 'background.paper',
        border: match.status === 'in_progress' ? '2px solid' : 'none',
        borderColor: 'warning.main'
      }}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" color="text.secondary">
              Round {match.round_number}
            </Typography>
            {match.court && (
              <Chip 
                label={`Court ${match.court}`} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            )}
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body1">
              {getTeamName(match.team1_id)}
            </Typography>
            <Typography variant="h6" sx={{ mx: 2 }}>
              {match.score_team1} - {match.score_team2}
            </Typography>
            <Typography variant="body1">
              {getTeamName(match.team2_id)}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {match.scheduled_time ? formatTime(match.scheduled_time) : 'TBD'}
            </Typography>
            <Chip 
              label={match.status === 'completed' ? 'Completed' : 
                     match.status === 'in_progress' ? 'In Progress' : 'Scheduled'} 
              size="small" 
              color={match.status === 'completed' ? 'success' : 
                     match.status === 'in_progress' ? 'warning' : 'default'}
            />
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Typography>Loading tournament bracket...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      </Container>
    );
  }

  if (!tournament) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>Tournament not found</Alert>
      </Container>
    );
  }

  if (!bracket || bracket.length === 0) {
    return (
      <Container>
        <Alert severity="info" sx={{ mt: 2 }}>Tournament bracket hasn't been created yet</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          {tournament.name} - Live Bracket
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
        </Typography>
        <Divider sx={{ my: 3 }} />
        
        <Grid container spacing={3}>
          {bracket.map((round) => (
            <Grid item xs={12} md={3} key={round.round}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Round {round.round}
                </Typography>
                {round.matches.map(renderMatch)}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default LiveBracketPage;
