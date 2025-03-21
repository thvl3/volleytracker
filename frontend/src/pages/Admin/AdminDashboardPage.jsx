import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Container,
  Typography, 
  Box, 
  Card, 
  CardContent, 
  CardActions,
  Button,
  Grid,
  Chip,
  Divider,
  Paper
} from '@mui/material';
import Loading from '../../components/common/Loading';
import { tournamentAPI, matchAPI } from '../../api/api';
import moment from 'moment';

const AdminDashboardPage = () => {
  const [tournaments, setTournaments] = useState([]);
  const [activeMatches, setActiveMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get all tournaments
        const tournamentsResponse = await tournamentAPI.getAll();
        setTournaments(tournamentsResponse.data);
        
        // Get active matches from in-progress tournaments
        const activeTournaments = tournamentsResponse.data.filter(t => t.status === 'in_progress');
        if (activeTournaments.length > 0) {
          const activeId = activeTournaments[0].tournament_id;
          const matchesResponse = await matchAPI.getByTournament(activeId, 'in_progress');
          setActiveMatches(matchesResponse.data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Tournaments
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                component={Link} 
                to="/admin/tournaments"
                sx={{ mr: 2 }}
              >
                Manage Tournaments
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                component={Link} 
                to="/admin/tournaments"
                state={{ createNew: true }}
              >
                Create New Tournament
              </Button>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Recent Tournaments
            </Typography>
            
            {tournaments.length > 0 ? (
              <Box>
                {tournaments.slice(0, 3).map(tournament => (
                  <Card key={tournament.tournament_id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">
                          {tournament.name}
                        </Typography>
                        <Chip 
                          label={tournament.status} 
                          color={
                            tournament.status === 'upcoming' ? 'primary' : 
                            tournament.status === 'in_progress' ? 'success' : 'default'
                          }
                          size="small"
                        />
                      </Box>
                      <Typography color="textSecondary" variant="body2">
                        {tournament.location || 'No location set'} | 
                        {moment.unix(tournament.start_date).format(' MMM D, YYYY')}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        color="primary" 
                        component={Link} 
                        to={`/admin/tournaments/${tournament.tournament_id}/teams`}
                      >
                        Teams
                      </Button>
                      <Button 
                        size="small" 
                        color="primary" 
                        component={Link} 
                        to={`/admin/tournaments/${tournament.tournament_id}/matches`}
                      >
                        Matches
                      </Button>
                      {tournament.status === 'in_progress' && (
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="secondary" 
                          component={Link} 
                          to={`/admin/tournaments/${tournament.tournament_id}/scoring`}
                        >
                          Score
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                ))}
              </Box>
            ) : (
              <Typography>No tournaments found. Create one to get started!</Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Active Matches
            </Typography>
            
            {activeMatches.length > 0 ? (
              <Box>
                {activeMatches.map(match => (
                  <Card key={match.match_id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {match.team1_id ? match.team1_id : 'TBD'} vs {match.team2_id ? match.team2_id : 'TBD'}
                      </Typography>
                      <Typography variant="h4" align="center" sx={{ my: 1 }}>
                        {match.score_team1} - {match.score_team2}
                      </Typography>
                      <Typography color="textSecondary" variant="body2">
                        {match.court ? `Court: ${match.court}` : 'No court assigned'} |
                        Round: {match.round_number || 'N/A'}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        variant="contained" 
                        color="primary" 
                        component={Link} 
                        to={`/admin/tournaments/${match.tournament_id}/scoring`}
                        state={{ matchId: match.match_id }}
                      >
                        Update Score
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </Box>
            ) : (
              <Typography>No active matches at this time.</Typography>
            )}
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Quick Links
            </Typography>
            <Button 
              fullWidth 
              variant="outlined" 
              sx={{ mb: 1 }} 
              component={Link} 
              to="/"
            >
              View Public Site
            </Button>
            <Button 
              fullWidth 
              variant="outlined" 
              component={Link}
              to="/tournaments"
            >
              View All Tournaments
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboardPage;
