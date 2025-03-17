import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { tournamentAPI, teamAPI } from '../api/api';
import {
  Container, Typography, Box, Paper, CircularProgress,
  Tabs, Tab, Grid, List, ListItem, ListItemText, Button,
  Divider, Chip, Alert
} from '@mui/material';
import TournamentBracket from '../components/TournamentBracket';
import TournamentUpdatesFeed from '../components/TournamentUpdatesFeed';
import PoolList from '../components/PoolList';
import { formatDate } from '../utils/format';

// Tournament status enum for consistency
const TournamentStatus = {
  UPCOMING: 'upcoming',
  POOL_PLAY: 'pool_play',
  BRACKET_PLAY: 'bracket_play',
  COMPLETED: 'completed'
};

const TournamentDetailPage = () => {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    const fetchTournamentDetails = async () => {
      try {
        setLoading(true);
        const tournamentResponse = await tournamentAPI.getById(id);
        setTournament(tournamentResponse.data);
        
        const teamsResponse = await teamAPI.getByTournament(id);
        setTeams(teamsResponse.data);
        
        // Set active tab based on tournament status
        if (tournamentResponse.data.status === TournamentStatus.POOL_PLAY && tournamentResponse.data.has_pool_play) {
          setTabValue(1); // Pool Play tab
        } else if (tournamentResponse.data.status === TournamentStatus.BRACKET_PLAY || 
                  tournamentResponse.data.status === TournamentStatus.COMPLETED) {
          setTabValue(2); // Bracket tab
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching tournament details:', err);
        setError('Failed to load tournament details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTournamentDetails();
  }, [id, refreshCounter]);

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const refreshData = () => {
    setRefreshCounter(prev => prev + 1);
  };

  const getTournamentStatusChip = (status) => {
    let color;
    let label;
    
    switch (status) {
      case TournamentStatus.UPCOMING:
        color = 'default';
        label = 'Upcoming';
        break;
      case TournamentStatus.POOL_PLAY:
        color = 'primary';
        label = 'Pool Play';
        break;
      case TournamentStatus.BRACKET_PLAY:
        color = 'secondary';
        label = 'Bracket Play';
        break;
      case TournamentStatus.COMPLETED:
        color = 'success';
        label = 'Completed';
        break;
      default:
        color = 'default';
        label = status;
    }
    
    return <Chip color={color} label={label} size="small" />;
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
      </Container>
    );
  }

  if (!tournament) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning" sx={{ mt: 4 }}>Tournament not found.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            {tournament.name}
          </Typography>
          {getTournamentStatusChip(tournament.status)}
        </Box>
        
        <Typography variant="subtitle1" color="text.secondary">
          {formatDate(tournament.start_date * 1000)} {tournament.end_date && `- ${formatDate(tournament.end_date * 1000)}`}
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 1 }}>
          Location: {tournament.location}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Tournament Type: {tournament.type.replace('_', ' ')}
          {tournament.has_pool_play && ' with Pool Play'}
        </Typography>
        
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ mb: 4 }}>
          <Tabs value={tabValue} onChange={handleChangeTab} sx={{ mb: 2 }}>
            <Tab label="Overview" id="tournament-tab-0" />
            {tournament.has_pool_play && (
              <Tab label="Pool Play" id="tournament-tab-1" />
            )}
            <Tab label="Bracket" id="tournament-tab-2" />
            <Tab label="Teams" id="tournament-tab-3" />
            <Tab label="Updates" id="tournament-tab-4" />
          </Tabs>
          
          {/* Overview Tab */}
          <div role="tabpanel" hidden={tabValue !== 0}>
            {tabValue === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>Tournament Details</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box>
                      <Typography variant="subtitle1">Format</Typography>
                      <Typography variant="body2" paragraph>
                        {tournament.type.replace('_', ' ')} tournament
                        {tournament.has_pool_play ? ' with initial pool play phase.' : '.'}
                      </Typography>
                      
                      <Typography variant="subtitle1">Teams</Typography>
                      <Typography variant="body2" paragraph>
                        {teams.length} teams registered (min: {tournament.min_teams}, max: {tournament.max_teams})
                      </Typography>
                      
                      {tournament.has_pool_play && (
                        <>
                          <Typography variant="subtitle1">Pool Play</Typography>
                          <Typography variant="body2" paragraph>
                            {tournament.num_pools} pools with {tournament.teams_per_pool} teams per pool.
                            {tournament.pool_play_complete ? ' Pool play is complete.' : ' Pool play is in progress.'}
                          </Typography>
                        </>
                      )}
                      
                      <Typography variant="subtitle1">Bracket</Typography>
                      <Typography variant="body2" paragraph>
                        {tournament.bracket_size ? `${tournament.bracket_size} team bracket.` : 'Bracket not yet created.'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box>
                      <Typography variant="subtitle1">Current Phase</Typography>
                      <Typography variant="body2" paragraph>
                        {tournament.status === TournamentStatus.UPCOMING && 'Tournament has not yet started.'}
                        {tournament.status === TournamentStatus.POOL_PLAY && 'Pool play is in progress.'}
                        {tournament.status === TournamentStatus.BRACKET_PLAY && 'Bracket play is in progress.'}
                        {tournament.status === TournamentStatus.COMPLETED && 'Tournament is complete.'}
                      </Typography>
                      
                      <Typography variant="subtitle1">Key Information</Typography>
                      <Typography variant="body2">
                        {tournament.has_pool_play ? `Pool matches: ${tournament.pool_sets} sets` : ''}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        Bracket matches: Best {tournament.bracket_sets} of {tournament.bracket_sets * 2 - 1} sets
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}
          </div>
          
          {/* Pool Play Tab */}
          <div role="tabpanel" hidden={tabValue !== 1}>
            {tabValue === 1 && tournament.has_pool_play && (
              <PoolList 
                tournamentId={tournament.tournament_id}
                isAdmin={false}
                onRefresh={refreshData}
              />
            )}
          </div>
          
          {/* Bracket Tab */}
          <div role="tabpanel" hidden={tabValue !== 2}>
            {tabValue === 2 && (
              <TournamentBracket 
                tournamentId={tournament.tournament_id} 
                isAdmin={false}
              />
            )}
          </div>
          
          {/* Teams Tab */}
          <div role="tabpanel" hidden={tabValue !== 3}>
            {tabValue === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom>Registered Teams ({teams.length})</Typography>
                {teams.length === 0 ? (
                  <Typography variant="body1">No teams have registered for this tournament yet.</Typography>
                ) : (
                  <Grid container spacing={2}>
                    {teams.map(team => (
                      <Grid item xs={12} sm={6} md={4} key={team.team_id}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle1">{team.team_name}</Typography>
                          {team.players && team.players.length > 0 && (
                            <Box mt={1}>
                              <Typography variant="body2" color="text.secondary">Players:</Typography>
                              <List dense>
                                {team.players.map((player, idx) => (
                                  <ListItem key={idx} sx={{ py: 0 }}>
                                    <ListItemText primary={player} />
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          )}
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}
          </div>
          
          {/* Updates Tab */}
          <div role="tabpanel" hidden={tabValue !== 4}>
            {tabValue === 4 && (
              <TournamentUpdatesFeed tournamentId={tournament.tournament_id} />
            )}
          </div>
        </Box>
        
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button component={RouterLink} to="/tournaments" variant="outlined">
            Back to All Tournaments
          </Button>
          {tournament.status === TournamentStatus.BRACKET_PLAY || tournament.status === TournamentStatus.COMPLETED ? (
            <Button 
              component={RouterLink} 
              to={`/tournaments/${tournament.tournament_id}/live`} 
              variant="contained" 
              sx={{ ml: 2 }}
            >
              View Live Bracket
            </Button>
          ) : null}
        </Box>
      </Paper>
    </Container>
  );
};

export default TournamentDetailPage;
