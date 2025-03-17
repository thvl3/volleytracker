import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { poolMatchAPI } from '../api/api';
import {
  Box, Button, Typography, TextField, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Snackbar, Paper, Grid
} from '@mui/material';
import { formatDateTime, formatTeamName } from '../utils/format';

/**
 * Component for scoring pool matches
 */
const PoolMatchScoring = ({ matchId, onMatchComplete }) => {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scoreInputs, setScoreInputs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  // Fetch match details
  useEffect(() => {
    const fetchMatch = async () => {
      try {
        setLoading(true);
        const response = await poolMatchAPI.getById(matchId);
        const matchData = response.data;
        setMatch(matchData);
        
        // Initialize score inputs based on number of sets
        initializeScoreInputs(matchData);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching match:', err);
        setError('Failed to load match. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatch();
  }, [matchId]);

  // Initialize score input fields based on match data
  const initializeScoreInputs = (matchData) => {
    const numSets = parseInt(matchData.num_sets) || 2;
    const currentScores = {
      team1: [...(matchData.scores_team1 || [])],
      team2: [...(matchData.scores_team2 || [])]
    };
    
    // Ensure arrays are padded to num_sets length
    while (currentScores.team1.length < numSets) currentScores.team1.push('');
    while (currentScores.team2.length < numSets) currentScores.team2.push('');
    
    setScoreInputs(
      Array.from({ length: numSets }, (_, index) => ({
        setNumber: index + 1,
        team1Score: currentScores.team1[index] || '',
        team2Score: currentScores.team2[index] || '',
        complete: currentScores.team1[index] !== '' && currentScores.team2[index] !== '',
      }))
    );
  };

  // Handle score input changes
  const handleScoreChange = (setIndex, team, value) => {
    const newInputs = [...scoreInputs];
    
    // Only allow numeric input
    if (value === '' || /^\d+$/.test(value)) {
      newInputs[setIndex][`${team}Score`] = value;
      setScoreInputs(newInputs);
    }
  };

  // Save score for a specific set
  const saveSetScore = async (setIndex) => {
    const input = scoreInputs[setIndex];
    const setNumber = input.setNumber;
    const team1Score = parseInt(input.team1Score);
    const team2Score = parseInt(input.team2Score);
    
    // Validate inputs
    if (isNaN(team1Score) || isNaN(team2Score)) {
      setNotification({
        open: true,
        message: 'Please enter valid scores for both teams.',
        severity: 'error'
      });
      return;
    }
    
    try {
      setSaving(true);
      await poolMatchAPI.updateScore(matchId, setNumber, team1Score, team2Score);
      
      // Mark this set as complete
      const newInputs = [...scoreInputs];
      newInputs[setIndex].complete = true;
      setScoreInputs(newInputs);
      
      // Refresh match data
      const response = await poolMatchAPI.getById(matchId);
      setMatch(response.data);
      
      setNotification({
        open: true,
        message: `Set ${setNumber} score saved successfully.`,
        severity: 'success'
      });
      
      // If all sets are complete, notify parent component
      if (response.data.status === 'completed' && onMatchComplete) {
        onMatchComplete(response.data);
      }
      
    } catch (err) {
      console.error('Error saving score:', err);
      setNotification({
        open: true,
        message: 'Failed to save score. Please try again.',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle notification close
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!match) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Match not found.
      </Alert>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Pool Match Scoring
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">
              {formatTeamName(match.team1_name)} vs {formatTeamName(match.team2_name)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {match.pool_name || 'Pool Play'} • {formatDateTime(match.scheduled_time * 1000)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Status: {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Set-by-set scoring */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Set</TableCell>
              <TableCell>{formatTeamName(match.team1_name)}</TableCell>
              <TableCell>{formatTeamName(match.team2_name)}</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scoreInputs.map((input, index) => (
              <TableRow key={`set-${index + 1}`}>
                <TableCell>Set {index + 1}</TableCell>
                <TableCell>
                  <TextField
                    type="text"
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                    size="small"
                    value={input.team1Score}
                    onChange={(e) => handleScoreChange(index, 'team1', e.target.value)}
                    disabled={input.complete || saving}
                    sx={{ width: '5rem' }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="text"
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                    size="small"
                    value={input.team2Score}
                    onChange={(e) => handleScoreChange(index, 'team2', e.target.value)}
                    disabled={input.complete || saving}
                    sx={{ width: '5rem' }}
                  />
                </TableCell>
                <TableCell>
                  {!input.complete ? (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => saveSetScore(index)}
                      disabled={
                        saving || 
                        input.team1Score === '' || 
                        input.team2Score === '' ||
                        (index > 0 && !scoreInputs[index - 1].complete)
                      }
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  ) : (
                    <Typography variant="body2" color="success.main">
                      Complete
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Back
        </Button>
        
        {match.status === 'completed' && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              if (onMatchComplete) onMatchComplete(match);
              else navigate(-1);
            }}
          >
            Match Complete
          </Button>
        )}
      </Box>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PoolMatchScoring; 