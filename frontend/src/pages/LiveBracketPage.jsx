import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button,
  Card,
  CardContent,
  Grid,
  Divider,
  Chip,
  Alert
} from '@mui/material';
import { tournamentAPI, teamAPI } from '../api/api';
import Loading from '../components/common/Loading';
import moment from 'moment';

const LiveBracketPage = () => {
  const { tournamentId } = useParams();
  const [tournament, setTournament] = useState(null);
  const [bracket, setBracket] = useState([]);
  const [teams, setTeams] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get tournament info
        const tournamentResponse = await tournamentAPI.getById(tournamentId);
        setTournament(tournamentResponse.data);

        // Get bracket data
        const bracketResponse = await tournamentAPI.getBracket(tournamentId);
        setBracket(bracketResponse.data);

        // Get teams for name lookup
        const teamsResponse = await teamAPI.getByTournament(tournamentId);
        const teamsMap = {};
        teamsResponse.data.forEach(team => {
          teamsMap[team.team_id] = team.team_name;
        });
        setTeams(teamsMap);
      } catch (error) {
        console.error('Error fetching bracket:', error);
        setError('Failed to load bracket data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up polling for live updates
    const intervalId = setInterval(() => {
      fetchData();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(intervalId);
  }, [tournamentId]);

  // Helper to get team name from ID
  const getTeamName = (teamId) => {
    if (!teamId) return 'TBD';
    return teams[teamId] || teamId;
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <Container>
        <Box sx={{ my: 4 }}>
          <Alert severity="error">{error}</Alert>
          <Button 
            component={Link} 
            to={`/tournaments/${tournamentId}`} 
            variant="contained"
            sx={{ mt: 2 }}
          >
            Back to Tournament
          </Button>
        </Box>
      </Container>
    );
  }

  if (!tournament) {
    return (
      <Container>
        <Box sx={{ my: 4 }}>
          <Alert severity="warning">Tournament not found</Alert>
          <Button 
            component={Link} 
            to="/tournaments" 
            variant="contained"
            sx={{ mt: 2 }}
          >
            Back to Tournaments
          </Button>
        </Box>
      </Container>
    );
  }

  if (!bracket || bracket.length === 0) {
    return (
      <Container>
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" gutterBottom>
            {tournament.name} - Bracket
          </Typography>
          <Alert severity="info">
            The bracket for this tournament hasn't been created yet.
          </Alert>
          <Button 
            component={Link} 
            to={`/tournaments/${tournamentId}`} 
            variant="contained"
            sx={{ mt: 2 }}
          >
            Back to Tournament Details
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            {tournament.name} - Bracket
          </Typography>
          <Box>
            <Chip 
              label={tournament.status} 
              color={
                tournament.status === 'upcoming' ? 'primary' : 
                tournament.status === 'in_progress' ? 'success' : 'default'
              }
              sx={{ mr: 1 }}
            />
            <Button 
              component={Link} 
              to={`/tournaments/${tournamentId}`} 
              variant="outlined"
            >
              Tournament Details
            </Button>
          </Box>
        </Box>

        <Paper sx={{ p: 2, overflowX: 'auto' }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            minWidth: bracket.length * 220 + 'px',
            pb: 2 
          }}>
            {bracket.map((round, roundIndex) => (
              <Box 
                key={round.round} 
                sx={{ 
                  flex: 1,
                  minWidth: '220px',
                  maxWidth: '280px',
                  mx: 1
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    textAlign: 'center', 
                    my: 2,
                    fontWeight: 'bold' 
                  }}
                >
                  {round.round === bracket.length ? 'Championship' : `Round ${round.round}`}
                </Typography>
                
                <Box sx={{ px: 1 }}>
                  {round.matches.map((match, matchIndex) => (
                    <Card 
                      key={match.match_id} 
                      sx={{ 
                        mb: 3,
                        border: match.status === 'in_progress' ? '2px solid #4caf50' : 'none'
                      }}
                      elevation={match.status === 'in_progress' ? 4 : 1}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ mb: 1 }}>
                          {match.status === 'in_progress' && (
                            <Chip 
                              label="LIVE" 
                              size="small" 
                              color="success" 
                              sx={{ mb: 1 }}
                            />
                          )}
                        </Box>

                        <Box className="team" sx={{ 
                          p: 1, 
                          borderRadius: 1,
                          backgroundColor: match.team1_id ? '#f5f5f5' : 'transparent'
                        }}>
                          <Typography 
                            sx={{ 
                              fontWeight: match.team1_id ? 'bold' : 'normal',
                              color: match.team1_id ? 'text.primary' : 'text.secondary',
                              fontSize: '0.9rem'
                            }}
                          >
                            {getTeamName(match.team1_id)}
                          </Typography>
                          {(match.score_team1 > 0 || match.score_team2 > 0) && (
                            <Typography 
                              sx={{ 
                                fontWeight: 'bold',
                                fontSize: '1.1rem'
                              }}
                            >
                              {match.score_team1}
                            </Typography>
                          )}
                        </Box>

                        <Box sx={{ 
                          textAlign: 'center', 
                          my: 1, 
                          fontSize: '0.8rem',
                          color: 'text.secondary' 
                        }}>
                          vs
                        </Box>

                        <Box className="team" sx={{ 
                          p: 1, 
                          borderRadius: 1,
                          backgroundColor: match.team2_id ? '#f5f5f5' : 'transparent'
                        }}>
                          <Typography 
                            sx={{ 
                              fontWeight: match.team2_id ? 'bold' : 'normal',
                              color: match.team2_id ? 'text.primary' : 'text.secondary',
                              fontSize: '0.9rem'
                            }}
                          >
                            {getTeamName(match.team2_id)}
                          </Typography>
                          {(match.score_team1 > 0 || match.score_team2 > 0) && (
                            <Typography 
                              sx={{ 
                                fontWeight: 'bold',
                                fontSize: '1.1rem'
                              }}
                            >
                              {match.score_team2}
                            </Typography>
                          )}
                        </Box>

                        {match.court && (
                          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                            Court: {match.court}
                          </Typography>
                        )}

                        {match.status === 'completed' && (
                          <Box sx={{ mt: 1, textAlign: 'center' }}>
                            <Chip 
                              label="Completed" 
                              size="small" 
                              variant="outlined"
                            />
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>

        <Box sx={{ mt: 3 }}>
          <Alert severity="info">
            This bracket updates automatically every 30 seconds. Last updated: {moment().format('h:mm:ss A')}
          </Alert>
        </Box>
      </Box>
    </Container>
  );
};

export default LiveBracketPage;
