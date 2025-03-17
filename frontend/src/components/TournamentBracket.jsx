import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert, Divider, Button, Grid } from '@mui/material';
import { tournamentAPI, teamAPI } from '../api';

const TournamentBracket = ({ tournamentId, isAdmin }) => {
  const [bracketRounds, setBracketRounds] = useState([]);
  const [teamMap, setTeamMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debug, setDebug] = useState({
    rawData: null,
    dataStructure: null
  });

  useEffect(() => {
    fetchBracket();
  }, [tournamentId]);

  // Helper function to analyze data structure
  const getDataStructureInfo = (data) => {
    if (!data) return "No data received";
    if (Array.isArray(data)) {
      return `Array with ${data.length} items. First item type: ${data[0] ? typeof data[0] : 'empty array'}`;
    }
    if (typeof data === 'object') {
      return `Object with keys: ${Object.keys(data).join(', ')}`;
    }
    return `Received data of type: ${typeof data}`;
  };

  const refreshBracket = () => {
    setLoading(true);
    fetchBracket();
  };
  
  const fetchBracket = async () => {
    try {
      setLoading(true);
      // Get bracket data
      const data = await tournamentAPI.getTournamentBracket(tournamentId);
      console.log('Raw bracket data:', data);
      
      // Store debug info
      setDebug({
        rawData: JSON.stringify(data, null, 2),
        dataStructure: getDataStructureInfo(data)
      });
      
      if (data && Array.isArray(data) && data.length > 0) {
        setBracketRounds(data);
        
        // Get tournament details to get teams
        const tournamentData = await tournamentAPI.getTournament(tournamentId);
        if (tournamentData && Array.isArray(tournamentData.teams)) {
          const teamsById = {};
          tournamentData.teams.forEach(team => {
            teamsById[team.team_id] = team.team_name;
          });
          setTeamMap(teamsById);
        }
        
        setError(null);
      } else if (data && typeof data === 'object' && !Array.isArray(data)) {
        // Handle case where data is an object but not an array
        if (data.rounds && Array.isArray(data.rounds)) {
          setBracketRounds(data.rounds);
          
          // Get team names if available in the data
          if (data.teams && typeof data.teams === 'object') {
            setTeamMap(data.teams);
          } else {
            // Get tournament details to get teams
            const tournamentData = await tournamentAPI.getTournament(tournamentId);
            if (tournamentData && Array.isArray(tournamentData.teams)) {
              const teamsById = {};
              tournamentData.teams.forEach(team => {
                teamsById[team.team_id] = team.team_name;
              });
              setTeamMap(teamsById);
            }
          }
          
          setError(null);
        } else {
          setError('Bracket data structure is not as expected');
        }
      } else {
        setError('No bracket data available. The tournament bracket may not have been created yet.');
      }
    } catch (err) {
      console.error('Error fetching tournament bracket:', err);
      setError(`Failed to load tournament bracket: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render a visual bracket structure
  const renderBracketVisual = () => {
    if (!bracketRounds || bracketRounds.length === 0) {
      return null;
    }

    // Sort rounds by round number
    const sortedRounds = [...bracketRounds].sort((a, b) => a.round - b.round);
    
    return (
      <Box sx={{ overflowX: 'auto', mt: 3, pb: 2 }}>
        <Grid container spacing={1} sx={{ minWidth: sortedRounds.length * 250 }}>
          {sortedRounds.map((roundData, roundIndex) => (
            <Grid item key={`round-${roundIndex}`} sx={{ width: `${100 / sortedRounds.length}%`, minWidth: 240 }}>
              <Typography variant="subtitle1" gutterBottom align="center" sx={{ 
                fontWeight: 'bold',
                backgroundColor: 'primary.main',
                color: 'white',
                py: 1,
                borderRadius: '4px 4px 0 0'
              }}>
                {roundData.round === 1 ? 'Final' : 
                 roundData.round === 2 ? 'Semi-Finals' : 
                 roundData.round === 3 ? 'Quarter-Finals' : 
                 `Round ${roundData.round}`}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                {roundData.matches && roundData.matches.map((match, matchIndex) => (
                  <Paper 
                    key={`match-${matchIndex}`} 
                    elevation={2}
                    sx={{ 
                      p: 2,
                      bgcolor: match.status === 'completed' ? '#f5f5f5' : 'white',
                      border: '1px solid #e0e0e0',
                      borderLeft: '4px solid',
                      borderLeftColor: 'secondary.main',
                      position: 'relative'
                    }}
                  >
                    <Box sx={{ 
                      position: 'absolute', 
                      top: -10, 
                      right: -10, 
                      bgcolor: 'primary.main',
                      color: 'white',
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      {matchIndex + 1}
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: 1.5
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        borderBottom: '1px solid #eee',
                        pb: 1
                      }}>
                        <Typography variant="body1" sx={{ 
                          fontWeight: match.score_team1 > match.score_team2 ? 'bold' : 'normal',
                          color: match.score_team1 > match.score_team2 ? 'success.main' : 'text.primary',
                          flexGrow: 1
                        }}>
                          {match.team1_id && teamMap[match.team1_id] 
                            ? teamMap[match.team1_id] 
                            : `Team ${match.team1_id ? match.team1_id.substring(0, 4) : 'TBD'}`}
                        </Typography>
                        <Typography variant="body1" sx={{ 
                          fontWeight: 'bold',
                          ml: 2
                        }}>
                          {match.score_team1 || '0'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between'
                      }}>
                        <Typography variant="body1" sx={{ 
                          fontWeight: match.score_team2 > match.score_team1 ? 'bold' : 'normal',
                          color: match.score_team2 > match.score_team1 ? 'success.main' : 'text.primary',
                          flexGrow: 1
                        }}>
                          {match.team2_id && teamMap[match.team2_id] 
                            ? teamMap[match.team2_id] 
                            : `Team ${match.team2_id ? match.team2_id.substring(0, 4) : 'TBD'}`}
                        </Typography>
                        <Typography variant="body1" sx={{ 
                          fontWeight: 'bold',
                          ml: 2
                        }}>
                          {match.score_team2 || '0'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {match.court && (
                      <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #eee' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          Court: {match.court}
                        </Typography>
                      </Box>
                    )}
                    
                    {match.scheduled_time && (
                      <Box sx={{ mt: 1, pt: 1, borderTop: match.court ? 'none' : '1px solid #eee' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          {new Date(parseInt(match.scheduled_time) * 1000).toLocaleString()}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                ))}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  return (
    <Box sx={{ my: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Tournament Bracket</Typography>
        <Button variant="outlined" size="small" onClick={refreshBracket} color="primary">
          Refresh Bracket
        </Button>
      </Box>
      
      {error ? (
        <Alert severity="info" sx={{ my: 2 }}>
          {error}
        </Alert>
      ) : null}
      
      {(!bracketRounds || bracketRounds.length === 0) && !error ? (
        <Alert severity="info" sx={{ my: 2 }}>
          Tournament bracket has not been created yet.
        </Alert>
      ) : null}
      
      {/* List view of matches */}
      {bracketRounds && bracketRounds.length > 0 ? (
        <>
          {/* Visual bracket structure */}
          {renderBracketVisual()}
          
          <Divider sx={{ my: 4 }} />
          
          <Typography variant="subtitle1" sx={{ mb: 2 }}>List View</Typography>
          
          {bracketRounds.map((roundData, roundIndex) => (
            <Box key={`round-${roundIndex}`} sx={{ mb: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Round {roundData.round || roundIndex + 1}
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {roundData.matches && roundData.matches.map((match, matchIndex) => (
                  <Paper 
                    key={`match-${matchIndex}`} 
                    sx={{ 
                      p: 2, 
                      width: { xs: '100%', sm: '45%', md: '30%' },
                      bgcolor: match.status === 'completed' ? '#f5f5f5' : 'white'
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
                      mb: 1
                    }}>
                      <Typography variant="body1">
                        {match.team1_id && teamMap[match.team1_id] 
                          ? teamMap[match.team1_id] 
                          : `Team ${match.team1_id ? match.team1_id.substring(0, 4) : 'TBD'}`}
                      </Typography>
                      <Typography variant="body1">
                        {match.score_team1 || '0'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between'
                    }}>
                      <Typography variant="body1">
                        {match.team2_id && teamMap[match.team2_id] 
                          ? teamMap[match.team2_id] 
                          : `Team ${match.team2_id ? match.team2_id.substring(0, 4) : 'TBD'}`}
                      </Typography>
                      <Typography variant="body1">
                        {match.score_team2 || '0'}
                      </Typography>
                    </Box>
                    
                    {match.court && (
                      <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #eee' }}>
                        <Typography variant="body2" color="text.secondary">
                          Court: {match.court}
                        </Typography>
                      </Box>
                    )}
                    
                    {match.scheduled_time && (
                      <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #eee' }}>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(parseInt(match.scheduled_time) * 1000).toLocaleString()}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                ))}
              </Box>
            </Box>
          ))}
        </>
      ) : null}
      
      {/* Debug section - only visible when in development */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mt: 4, p: 2, border: '1px dashed #ccc' }}>
          <Typography variant="subtitle2">Debug Information</Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2" sx={{ mb: 1 }}>Data Structure: {debug.dataStructure}</Typography>
          <Typography variant="body2">Tournament ID: {tournamentId}</Typography>
          {debug.rawData && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">Raw Data:</Typography>
              <pre style={{ 
                overflow: 'auto',
                fontSize: '0.8rem',
                background: '#f5f5f5',
                padding: '8px',
                borderRadius: '4px',
                maxHeight: '200px'
              }}>
                {debug.rawData}
              </pre>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default TournamentBracket; 