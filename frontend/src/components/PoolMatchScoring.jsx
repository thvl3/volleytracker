import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { poolMatchAPI } from '../api/api';
import {
  Box, Button, Typography, TextField, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Snackbar, Paper, Grid, CardHeader, Divider, Chip
} from '@mui/material';
import { formatDateTime, formatTeamName } from '../utils/format';
import { 
  Save as SaveIcon, 
  SportsTennis as VolleyballIcon,
  Timer as TimerIcon 
} from '@mui/icons-material';

/**
 * Component for scoring pool matches
 */
const PoolMatchScoring = ({ match, onScoreUpdate }) => {
  const [scores, setScores] = useState({
    team1: Array(match?.num_sets || 2).fill(''),
    team2: Array(match?.num_sets || 2).fill('')
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Initialize scores from match data if available
  useEffect(() => {
    if (match && match.scores_team1 && match.scores_team2) {
      setScores({
        team1: [...match.scores_team1],
        team2: [...match.scores_team2]
      });
    }
  }, [match]);
  
  const handleScoreChange = (team, setIndex, value) => {
    // Only allow numbers
    if (value !== '' && !/^\d+$/.test(value)) {
      return;
    }
    
    // Create a deep copy of the scores object
    const newScores = {
      ...scores,
      [team]: [...scores[team]]
    };
    
    // Update the score for the specific set
    newScores[team][setIndex] = value;
    
    setScores(newScores);
  };
  
  const handleSubmitScore = async (setNumber) => {
    // Validate scores for this set
    const team1Score = parseInt(scores.team1[setNumber - 1], 10);
    const team2Score = parseInt(scores.team2[setNumber - 1], 10);
    
    if (isNaN(team1Score) || isNaN(team2Score)) {
      setError('Please enter valid scores for both teams');
      return;
    }
    
    // In volleyball, winning team should have at least 25 points (or 15 in the third set)
    // and be ahead by at least 2 points
    const minWinningScore = setNumber === 3 ? 15 : 25;
    const maxScore = Math.max(team1Score, team2Score);
    const minScore = Math.min(team1Score, team2Score);
    
    if (maxScore < minWinningScore) {
      setError(`Winning team must have at least ${minWinningScore} points`);
      return;
    }
    
    if (maxScore - minScore < 2) {
      setError('Winning team must be ahead by at least 2 points');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Send score update to the server
      const data = {
        set_number: setNumber,
        team1_score: team1Score,
        team2_score: team2Score
      };
      
      const updatedMatch = await poolMatchAPI.updatePoolMatchScore(match.match_id, data);
      
      // Show success message
      setSuccess(true);
      
      // Call the parent callback with the updated match
      if (onScoreUpdate) {
        onScoreUpdate(updatedMatch);
      }
    } catch (err) {
      console.error('Error updating score:', err);
      setError(err.message || 'Failed to update score');
    } finally {
      setLoading(false);
    }
  };
  
  const getSetStatus = (setIndex) => {
    if (!match || !match.scores_team1 || !match.scores_team2) {
      return 'not_played';
    }
    
    const team1Score = match.scores_team1[setIndex];
    const team2Score = match.scores_team2[setIndex];
    
    if (team1Score === 0 && team2Score === 0) {
      return 'not_played';
    }
    
    if (team1Score > 0 || team2Score > 0) {
      return 'completed';
    }
    
    return 'not_played';
  };
  
  const isMatchComplete = () => {
    if (!match) return false;
    return match.status === 'completed';
  };
  
  if (!match) {
    return (
      <Alert severity="info">No match data available</Alert>
    );
  }
  
  return (
    <Card>
      <CardHeader 
        title={
          <Typography variant="h5">
            Match Scoring
            <Chip 
              label={match.status.toUpperCase()}
              color={match.status === 'completed' ? 'success' : 'primary'}
              size="small" 
              sx={{ ml: 2 }}
            />
          </Typography>
        }
        subheader={
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle1" color="text.secondary">
              <strong>Pool:</strong> {match.pool_name}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              <TimerIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              {formatDateTime(match.scheduled_time)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Location:</strong> {match.location_name || 'Not specified'}, Court {match.court_number || 'N/A'}
            </Typography>
          </Box>
        }
      />
      
      <Divider />
      
      <CardContent>
        <Grid container spacing={3}>
          {/* Teams Header */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
              <Grid container alignItems="center">
                <Grid item xs={5}>
                  <Typography variant="h6" align="center">
                    {match.team1_name}
                  </Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant="h6" align="center">vs</Typography>
                </Grid>
                <Grid item xs={5}>
                  <Typography variant="h6" align="center">
                    {match.team2_name}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Match Sets */}
          {Array.from({ length: match.num_sets }).map((_, index) => {
            const setNumber = index + 1;
            const setStatus = getSetStatus(index);
            const isComplete = setStatus === 'completed';
            
            return (
              <Grid item xs={12} key={`set-${setNumber}`}>
                <Card variant="outlined">
                  <CardHeader
                    title={`Set ${setNumber}`}
                    subheader={isComplete ? 'Completed' : 'Not Played'}
                  />
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={5}>
                        <TextField
                          fullWidth
                          label={`${match.team1_name} Score`}
                          variant="outlined"
                          value={scores.team1[index]}
                          onChange={(e) => handleScoreChange('team1', index, e.target.value)}
                          type="number"
                          InputProps={{ inputProps: { min: 0 } }}
                          disabled={isMatchComplete()}
                        />
                      </Grid>
                      <Grid item xs={2}>
                        <Typography variant="h4" align="center">-</Typography>
                      </Grid>
                      <Grid item xs={5}>
                        <TextField
                          fullWidth
                          label={`${match.team2_name} Score`}
                          variant="outlined"
                          value={scores.team2[index]}
                          onChange={(e) => handleScoreChange('team2', index, e.target.value)}
                          type="number"
                          InputProps={{ inputProps: { min: 0 } }}
                          disabled={isMatchComplete()}
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<SaveIcon />}
                            onClick={() => handleSubmitScore(setNumber)}
                            disabled={loading || isMatchComplete()}
                          >
                            Save Set {setNumber} Score
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
          
          {/* Match Summary */}
          {match.scores_team1 && match.scores_team1.some(score => score > 0) && (
            <Grid item xs={12}>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Team</TableCell>
                      {Array.from({ length: match.num_sets }).map((_, index) => (
                        <TableCell key={`set-header-${index + 1}`} align="center">
                          Set {index + 1}
                        </TableCell>
                      ))}
                      <TableCell align="center">Sets Won</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>{match.team1_name}</TableCell>
                      {match.scores_team1.map((score, index) => (
                        <TableCell key={`team1-set-${index + 1}`} align="center">
                          {score || '-'}
                        </TableCell>
                      ))}
                      <TableCell align="center">
                        {match.sets_won_team1 || 0}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>{match.team2_name}</TableCell>
                      {match.scores_team2.map((score, index) => (
                        <TableCell key={`team2-set-${index + 1}`} align="center">
                          {score || '-'}
                        </TableCell>
                      ))}
                      <TableCell align="center">
                        {match.sets_won_team2 || 0}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}
        </Grid>
      </CardContent>
      
      {/* Error and Success Messages */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(false)} severity="success">
          Score updated successfully
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default PoolMatchScoring; 