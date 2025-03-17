import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { tournamentAPI } from '../api/api';

const TournamentBracket = ({ tournamentId, isAdmin }) => {
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBracket = async () => {
      try {
        setLoading(true);
        const response = await tournamentAPI.getBracket(tournamentId);
        setBracket(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching tournament bracket:', err);
        setError('Failed to load tournament bracket. It may not have been created yet.');
      } finally {
        setLoading(false);
      }
    };

    if (tournamentId) {
      fetchBracket();
    }
  }, [tournamentId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!bracket || !bracket.rounds || bracket.rounds.length === 0) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        Tournament bracket has not been created yet.
      </Alert>
    );
  }

  // Simple bracket rendering - in a real app, this would be more sophisticated
  return (
    <Box sx={{ my: 3 }}>
      <Typography variant="h6" gutterBottom>Tournament Bracket</Typography>
      
      {bracket.rounds.map((round, roundIndex) => (
        <Box key={`round-${roundIndex}`} sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            {round.name || `Round ${roundIndex + 1}`}
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {round.matches.map((match, matchIndex) => (
              <Paper 
                key={`match-${matchIndex}`} 
                sx={{ 
                  p: 2, 
                  width: { xs: '100%', sm: '45%', md: '30%' },
                  bgcolor: match.winner_id ? '#f5f5f5' : 'white'
                }}
              >
                <Box sx={{ borderBottom: '1px solid #eee', pb: 1, mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Match {matchIndex + 1}
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  mb: 1,
                  fontWeight: match.winner_id === match.team1_id ? 'bold' : 'normal',
                  color: match.winner_id === match.team1_id ? 'success.main' : 'text.primary'
                }}>
                  <Typography variant="body1">
                    {match.team1_name || 'TBD'}
                  </Typography>
                  <Typography variant="body1">
                    {match.score_team1 || '0'}
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontWeight: match.winner_id === match.team2_id ? 'bold' : 'normal',
                  color: match.winner_id === match.team2_id ? 'success.main' : 'text.primary'
                }}>
                  <Typography variant="body1">
                    {match.team2_name || 'TBD'}
                  </Typography>
                  <Typography variant="body1">
                    {match.score_team2 || '0'}
                  </Typography>
                </Box>
                
                {match.scheduled_time && (
                  <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #eee' }}>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(match.scheduled_time * 1000).toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </Paper>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default TournamentBracket; 