import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import moment from 'moment';
import { tournamentAPI, teamAPI, matchAPI } from '../api/api';
import Loading from '../components/common/Loading';

const TournamentDetailPage = () => {
  const { tournamentId } = useParams();
  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [completedMatches, setCompletedMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTournamentData = async () => {
      try {
        // Get tournament details
        const tournamentResponse = await tournamentAPI.getById(tournamentId);
        setTournament(tournamentResponse.data);
        
        // Get teams
        const teamsResponse = await teamAPI.getByTournament(tournamentId);
        setTeams(teamsResponse.data);
        
        // Get matches
        const scheduledMatchesResponse = await matchAPI.getByTournament(tournamentId, 'scheduled');
        const inProgressMatchesResponse = await matchAPI.getByTournament(tournamentId, 'in_progress');
        setUpcomingMatches([...scheduledMatchesResponse.data, ...inProgressMatchesResponse.data]);
        
        const completedMatchesResponse = await matchAPI.getByTournament(tournamentId, 'completed');
        setCompletedMatches(completedMatchesResponse.data);
      } catch (error) {
        console.error('Error fetching tournament data:', error);
        setError('Failed to load tournament data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentData();
  }, [tournamentId]);

  // Helper function to get team name by ID
  const getTeamName = (teamId) => {
    if (!teamId) return 'TBD';
    const team = teams.find(t => t.team_id === teamId);
    return team ? team.team_name : teamId;
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <Container>
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            {error}
          </Typography>
          <Button component={Link} to="/tournaments" variant="contained">
            Back to Tournaments
          </Button>
        </Box>
      </Container>
    );
  }

  if (!tournament) {
    return (
      <Container>
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Tournament not found
          </Typography>
          <Button component={Link} to="/tournaments" variant="contained">
            Back to Tournaments
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            {tournament.name}
          </Typography>
          <Chip 
            label={tournament.status} 
            color={
              tournament.status === 'upcoming' ? 'primary' : 
              tournament.status === 'in_progress' ? 'success' : 'default'
            }
          />
        </Box>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom>Tournament Info</Typography>
              <List>
                <ListItem divider>
                  <ListItemText 
                    primary="Location" 
                    secondary={tournament.location || 'Not specified'} 
                  />
                </ListItem>
                <ListItem divider>
                  <ListItemText 
                    primary="Start Date" 
                    secondary={moment.unix(tournament.start_date).format('MMMM D, YYYY')} 
                  />
                </ListItem>
                {tournament.end_date && (
                  <ListItem divider>
                    <ListItemText 
                      primary="End Date" 
                      secondary={moment.unix(tournament.end_date).format('MMMM D, YYYY')} 
                    />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemText 
                    primary="Tournament Type" 
                    secondary={tournament.type.replace('_', ' ')} 
                  />
                </ListItem>
              </List>
              
              <Box sx={{ mt: 3 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  component={Link} 
                  to={`/tournaments/${tournamentId}/bracket`}
                >
                  View Bracket
                </Button>
              </Box>
            </Paper>
            
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Live Matches
              </Typography>
              
              {upcomingMatches.length > 0 ? (
                <Grid container spacing={2}>
                  {upcomingMatches.filter(match => match.status === 'in_progress').map(match => (
                    <Grid item xs={12} sm={6} key={match.match_id}>
                      <Card>
                        <CardContent>
                          <Box sx={{ mb: 1 }}>
                            <Chip 
                              label={`Round ${match.round_number}`} 
                              size="small" 
                              color="primary"
                              sx={{ mr: 1 }}
                            />
                            <Chip 
                              label={match.status.replace('_', ' ')} 
                              size="small" 
                              color={match.status === 'in_progress' ? 'success' : 'default'} 
                            />
                          </Box>
                          
                          <Typography variant="h6" align="center" gutterBottom>
                            {getTeamName(match.team1_id)} vs {getTeamName(match.team2_id)}
                          </Typography>
                          
                          <Typography variant="h4" align="center" sx={{ my: 1 }}>
                            {match.score_team1} - {match.score_team2}
                          </Typography>
                          
                          {match.court && (
                            <Typography color="textSecondary" align="center">
                              Court: {match.court}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography>No ongoing matches at the moment.</Typography>
              )}
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h5" gutterBottom>
                Upcoming Matches
              </Typography>
              
              {upcomingMatches.filter(match => match.status === 'scheduled').length > 0 ? (
                <List>
                  {upcomingMatches
                    .filter(match => match.status === 'scheduled')
                    .sort((a, b) => a.scheduled_time - b.scheduled_time)
                    .map(match => (
                      <ListItem key={match.match_id} divider>
                        <ListItemText
                          primary={`${getTeamName(match.team1_id)} vs ${getTeamName(match.team2_id)}`}
                          secondary={`Round ${match.round_number}${match.court ? ` | Court ${match.court}` : ''}`}
                        />
                        <Typography color="textSecondary">
                          {match.scheduled_time ? 
                            moment.unix(match.scheduled_time).format('h:mm A') : 
                            'Time TBD'}
                        </Typography>
                      </ListItem>
                    ))
                  }
                </List>
              ) : (
                <Typography>No scheduled matches.</Typography>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                Teams ({teams.length})
              </Typography>
              
              {teams.length > 0 ? (
                <List>
                  {teams.map(team => (
                    <ListItem key={team.team_id} divider>
                      <ListItemText
                        primary={team.team_name}
                        secondary={`${team.players?.length || 0} players`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography>No teams have been added yet.</Typography>
              )}
            </Paper>
            
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Recent Results
              </Typography>
              
              {completedMatches.length > 0 ? (
                <List>
                  {completedMatches
                    .sort((a, b) => b.scheduled_time - a.scheduled_time)
                    .slice(0, 5)
                    .map(match => (
                      <ListItem key={match.match_id} divider>
                        <ListItemText
                          primary={
                            <Typography>
                              {getTeamName(match.team1_id)} <strong>{match.score_team1}</strong> - <strong>{match.score_team2}</strong> {getTeamName(match.team2_id)}
                            </Typography>
                          }
                          secondary={`Round ${match.round_number}`}
                        />
                      </ListItem>
                    ))
                  }
                </List>
              ) : (
                <Typography>No completed matches yet.</Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default TournamentDetailPage;
