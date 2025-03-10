import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Divider,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import Loading from '../../components/common/Loading';
import { tournamentAPI, teamAPI, matchAPI } from '../../api/api';

const AdminScoringPage = () => {
  const { tournamentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState({});
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Match scoring state
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  
  // Confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  
  // Court assignment dialog
  const [courtDialogOpen, setCourtDialogOpen] = useState(false);
  const [courtValue, setCourtValue] = useState('');

  useEffect(() => {
    fetchData();
  }, [tournamentId]);

  useEffect(() => {
    // Handle direct navigation to a match
    if (location.state?.matchId && matches.length > 0) {
      const match = matches.find(m => m.match_id === location.state.matchId);
      if (match) {
        handleSelectMatch(match);
      }
    }
  }, [location.state, matches]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get tournament details
      const tournamentResponse = await tournamentAPI.getById(tournamentId);
      setTournament(tournamentResponse.data);
      
      // Get active matches
      const inProgressResponse = await matchAPI.getByTournament(tournamentId, 'in_progress');
      const scheduledResponse = await matchAPI.getByTournament(tournamentId, 'scheduled');
      const activeMatches = [...inProgressResponse.data, ...scheduledResponse.data];
      setMatches(activeMatches);
      
      // Get teams for name lookup
      const teamsResponse = await teamAPI.getByTournament(tournamentId);
      const teamsMap = {};
      teamsResponse.data.forEach(team => {
        teamsMap[team.team_id] = team.team_name;
      });
      setTeams(teamsMap);
      
      setError('');
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load tournament data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMatch = (match) => {
    setSelectedMatch(match);
    setScore1(match.score_team1);
    setScore2(match.score_team2);
  };

  const handleScoreChange = async (team, increment) => {
    if (!selectedMatch) return;
    
    let newScore1 = score1;
    let newScore2 = score2;
    
    if (team === 1) {
      newScore1 = Math.max(0, score1 + increment);
      setScore1(newScore1);
    } else {
      newScore2 = Math.max(0, score2 + increment);
      setScore2(newScore2);
    }
    
    try {
      // Update score in the database
      await matchAPI.updateScore(selectedMatch.match_id, newScore1, newScore2);
      
      // Update match in local state
      setMatches(matches.map(match => {
        if (match.match_id === selectedMatch.match_id) {
          return {
            ...match,
            score_team1: newScore1,
            score_team2: newScore2,
            status: 'in_progress'
          };
        }
        return match;
      }));
      
      setSelectedMatch({
        ...selectedMatch,
        score_team1: newScore1,
        score_team2: newScore2,
        status: 'in_progress'
      });
    } catch (error) {
      console.error('Failed to update score:', error);
      setError('Failed to update score. Please try again.');
    }
  };

  const handleCompleteMatch = () => {
    setConfirmAction('complete');
    setConfirmDialogOpen(true);
  };

  const handleConfirmComplete = async () => {
    if (!selectedMatch) return;
    
    try {
      setLoading(true);
      
      // Complete the match
      await matchAPI.updateScore(selectedMatch.match_id, score1, score2, true);
      
      // Refresh data
      await fetchData();
      
      // Clear selection
      setSelectedMatch(null);
      setScore1(0);
      setScore2(0);
      
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error('Failed to complete match:', error);
      setError('Failed to complete match. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCourt = () => {
    if (!selectedMatch) return;
    setCourtValue(selectedMatch.court || '');
    setCourtDialogOpen(true);
  };

  const handleConfirmCourtAssignment = async () => {
    if (!selectedMatch) return;
    
    try {
      setLoading(true);
      
      // Update court
      await matchAPI.updateCourt(selectedMatch.match_id, courtValue);
      
      // Update match in local state
      setMatches(matches.map(match => {
        if (match.match_id === selectedMatch.match_id) {
          return {
            ...match,
            court: courtValue
          };
        }
        return match;
      }));
      
      setSelectedMatch({
        ...selectedMatch,
        court: courtValue
      });
      
      setCourtDialogOpen(false);
    } catch (error) {
      console.error('Failed to update court:', error);
      setError('Failed to update court. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get team name from ID
  const getTeamName = (teamId) => {
    if (!teamId) return 'TBD';
    return teams[teamId] || teamId;
  };

  if (loading) {
    return <Loading />;
  }

  if (!tournament) {
    return (
      <Container>
        <Box sx={{ my: 4 }}>
          <Alert severity="error">Tournament not found</Alert>
          <Button 
            component={Link} 
            to="/admin/tournaments" 
            variant="contained"
            sx={{ mt: 2 }}
          >
            Back to Tournaments
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <div>
            <Typography variant="h4" component="h1">
              {tournament.name} - Scoring
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              {tournament.status}
            </Typography>
          </div>
          <Stack direction="row" spacing={2}>
            <Button 
              variant="outlined" 
              color="primary"
              component={Link}
              to={`/admin/tournaments/${tournamentId}/matches`}
            >
              Manage Matches
            </Button>
            <Button 
              component={Link} 
              to={`/tournaments/${tournamentId}/bracket`}
              variant="contained" 
              color="primary"
            >
              View Bracket
            </Button>
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Active Matches
              </Typography>
              <List>
                {matches.length > 0 ? (
                  matches.sort((a, b) => {
                    // Sort in_progress first, then by round
                    if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
                    if (a.status !== 'in_progress' && b.status === 'in_progress') return 1;
                    return a.round_number - b.round_number;
                  }).map(match => (
                    <ListItem 
                      key={match.match_id} 
                      disablePadding
                      secondaryAction={
                        match.status === 'in_progress' && 
                        <Chip 
                          label="LIVE" 
                          color="success" 
                          size="small" 
                          sx={{ mr: 1 }}
                        />
                      }
                    >
                      <ListItemButton 
                        selected={selectedMatch?.match_id === match.match_id}
                        onClick={() => handleSelectMatch(match)}
                      >
                        <ListItemText
                          primary={`${getTeamName(match.team1_id)} vs ${getTeamName(match.team2_id)}`}
                          secondary={`Round ${match.round_number}${match.court ? ` | Court ${match.court}` : ''}`}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No active matches" />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            {selectedMatch ? (
              <Paper sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h5" gutterBottom>
                    Match Scoring
                  </Typography>
                  <Typography variant="subtitle1">
                    Round {selectedMatch.round_number}
                    {selectedMatch.court && ` | Court ${selectedMatch.court}`}
                  </Typography>
                </Box>

                <Grid container spacing={4}>
                  <Grid item xs={6}>
                    <Card 
                      sx={{ 
                        backgroundColor: '#f5f5f5',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" align="center" gutterBottom>
                          {getTeamName(selectedMatch.team1_id)}
                        </Typography>
                        <Typography variant="h2" align="center" sx={{ my: 3 }}>
                          {score1}
                        </Typography>
                      </CardContent>
                      <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                        <IconButton 
                          color="error" 
                          onClick={() => handleScoreChange(1, -1)}
                          disabled={score1 <= 0}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <IconButton 
                          color="primary" 
                          onClick={() => handleScoreChange(1, 1)}
                          size="large"
                        >
                          <AddIcon />
                        </IconButton>
                      </CardActions>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Card 
                      sx={{ 
                        backgroundColor: '#f5f5f5',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" align="center" gutterBottom>
                          {getTeamName(selectedMatch.team2_id)}
                        </Typography>
                        <Typography variant="h2" align="center" sx={{ my: 3 }}>
                          {score2}
                        </Typography>
                      </CardContent>
                      <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                        <IconButton 
                          color="error" 
                          onClick={() => handleScoreChange(2, -1)}
                          disabled={score2 <= 0}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <IconButton 
                          color="primary" 
                          onClick={() => handleScoreChange(2, 1)}
                          size="large"
                        >
                          <AddIcon />
                        </IconButton>
                      </CardActions>
                    </Card>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <Button 
                    variant="outlined"
                    onClick={handleAssignCourt}
                  >
                    {selectedMatch.court ? 'Change Court' : 'Assign Court'}
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleCompleteMatch}
                  >
                    Complete Match
                  </Button>
                </Box>
              </Paper>
            ) : (
              <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography variant="h6" color="textSecondary">
                  Select a match to score
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Complete Match Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen && confirmAction === 'complete'}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Complete Match</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to mark this match as complete? 
            <br /><br />
            <strong>Final Score:</strong> {getTeamName(selectedMatch?.team1_id)} {score1} - {score2} {getTeamName(selectedMatch?.team2_id)}
            <br /><br />
            This will advance the winner to the next round.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmComplete} color="primary" variant="contained">
            Complete Match
          </Button>
        </DialogActions>
      </Dialog>

      {/* Court Assignment Dialog */}
      <Dialog
        open={courtDialogOpen}
        onClose={() => setCourtDialogOpen(false)}
      >
        <DialogTitle>Assign Court</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="court"
            label="Court Number or Name"
            type="text"
            fullWidth
            variant="outlined"
            value={courtValue}
            onChange={(e) => setCourtValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCourtDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmCourtAssignment} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminScoringPage;
