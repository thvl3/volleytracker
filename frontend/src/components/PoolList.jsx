import React, { useState, useEffect } from 'react';
import { tournamentAPI, poolAPI } from '../api/api';
import { 
  Accordion, AccordionSummary, AccordionDetails, 
  Typography, Box, Button, Table, 
  TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { formatDateTime } from '../utils/format';

const PoolList = ({ tournamentId, isAdmin, onRefresh }) => {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPool, setExpandedPool] = useState(null);

  useEffect(() => {
    fetchPools();
  }, [tournamentId, onRefresh]);

  const fetchPools = async () => {
    try {
      setLoading(true);
      const response = await tournamentAPI.getPools(tournamentId);
      setPools(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching pools:', err);
      setError('Failed to load pools. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handlePoolClick = async (poolId) => {
    if (expandedPool === poolId) {
      setExpandedPool(null);
      return;
    }

    setExpandedPool(poolId);
    
    // Get detailed pool info if not already loaded
    const pool = pools.find(p => p.pool_id === poolId);
    if (!pool.teams || !pool.standings) {
      try {
        const response = await poolAPI.getById(poolId);
        // Update the pool with detailed info
        setPools(prevPools => prevPools.map(p => 
          p.pool_id === poolId ? { ...p, ...response.data } : p
        ));
      } catch (err) {
        console.error('Error fetching pool details:', err);
      }
    }
  };

  const generateSchedule = async (poolId) => {
    try {
      await poolAPI.generateSchedule(poolId);
      // Refresh the pool data
      const response = await poolAPI.getById(poolId);
      setPools(prevPools => prevPools.map(p => 
        p.pool_id === poolId ? { ...p, ...response.data } : p
      ));
    } catch (err) {
      console.error('Error generating schedule:', err);
    }
  };

  const initializeStandings = async (poolId) => {
    try {
      await poolAPI.initializeStandings(poolId);
      // Refresh the pool data
      const response = await poolAPI.getById(poolId);
      setPools(prevPools => prevPools.map(p => 
        p.pool_id === poolId ? { ...p, ...response.data } : p
      ));
    } catch (err) {
      console.error('Error initializing standings:', err);
    }
  };

  if (loading) return <Typography>Loading pools...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (pools.length === 0) return <Typography>No pools found for this tournament.</Typography>;

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Pool Play
      </Typography>
      
      {pools.map(pool => (
        <Accordion 
          key={pool.pool_id} 
          expanded={expandedPool === pool.pool_id}
          onChange={() => handlePoolClick(pool.pool_id)}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">{pool.name}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              {isAdmin && (
                <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      generateSchedule(pool.pool_id);
                    }}
                  >
                    Generate Schedule
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      initializeStandings(pool.pool_id);
                    }}
                  >
                    Initialize Standings
                  </Button>
                </Box>
              )}
              
              {/* Teams section */}
              <Typography variant="subtitle1" gutterBottom>Teams</Typography>
              {pool.teams ? (
                <Box sx={{ mb: 3 }}>
                  {pool.teams.map(team => (
                    <Chip 
                      key={team.team_id} 
                      label={team.team_name} 
                      sx={{ m: 0.5 }} 
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2">No teams assigned yet.</Typography>
              )}
              
              {/* Standings section */}
              <Typography variant="subtitle1" gutterBottom>Standings</Typography>
              {pool.standings && pool.standings.length > 0 ? (
                <TableContainer component={Paper} sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Rank</TableCell>
                        <TableCell>Team</TableCell>
                        <TableCell align="center">W</TableCell>
                        <TableCell align="center">L</TableCell>
                        <TableCell align="center">T</TableCell>
                        <TableCell align="center">Sets Won</TableCell>
                        <TableCell align="center">Sets Lost</TableCell>
                        <TableCell align="center">Points +/-</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pool.standings.sort((a, b) => (a.rank || 999) - (b.rank || 999)).map(standing => {
                        const team = pool.teams?.find(t => t.team_id === standing.team_id);
                        return (
                          <TableRow key={standing.standing_id}>
                            <TableCell>{standing.rank || '-'}</TableCell>
                            <TableCell>{team?.team_name || 'Unknown Team'}</TableCell>
                            <TableCell align="center">{standing.wins}</TableCell>
                            <TableCell align="center">{standing.losses}</TableCell>
                            <TableCell align="center">{standing.ties}</TableCell>
                            <TableCell align="center">{standing.sets_won}</TableCell>
                            <TableCell align="center">{standing.sets_lost}</TableCell>
                            <TableCell align="center">
                              {standing.points_scored - standing.points_allowed}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" sx={{ mb: 3 }}>No standings available.</Typography>
              )}
              
              {/* Matches section - lazy load when expanded */}
              <PoolMatchList poolId={pool.pool_id} isAdmin={isAdmin} />
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

// Sub-component for pool matches
const PoolMatchList = ({ poolId, isAdmin }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, [poolId]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await poolAPI.getMatches(poolId);
      setMatches(response.data);
    } catch (err) {
      console.error('Error fetching pool matches:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Typography>Loading matches...</Typography>;
  if (matches.length === 0) return <Typography>No matches scheduled for this pool.</Typography>;

  // Group matches by status
  const scheduledMatches = matches.filter(m => m.status === 'scheduled');
  const inProgressMatches = matches.filter(m => m.status === 'in_progress');
  const completedMatches = matches.filter(m => m.status === 'completed');

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Matches</Typography>
      
      {inProgressMatches.length > 0 && (
        <>
          <Typography variant="subtitle2" gutterBottom>In Progress</Typography>
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Teams</TableCell>
                  <TableCell align="center">Score</TableCell>
                  <TableCell>Time</TableCell>
                  {isAdmin && <TableCell>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {inProgressMatches.map(match => (
                  <TableRow key={match.match_id}>
                    <TableCell>
                      {match.team1_name || 'Team 1'} vs {match.team2_name || 'Team 2'}
                    </TableCell>
                    <TableCell align="center">
                      {match.scores_team1?.join(' - ') || '0'} : {match.scores_team2?.join(' - ') || '0'}
                    </TableCell>
                    <TableCell>{formatDateTime(match.scheduled_time * 1000)}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Button 
                          size="small" 
                          variant="outlined"
                          onClick={() => {/* Add navigation to scoring page */}}
                        >
                          Update
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
      
      {scheduledMatches.length > 0 && (
        <>
          <Typography variant="subtitle2" gutterBottom>Scheduled</Typography>
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Teams</TableCell>
                  <TableCell>Time</TableCell>
                  {isAdmin && <TableCell>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {scheduledMatches.map(match => (
                  <TableRow key={match.match_id}>
                    <TableCell>
                      {match.team1_name || 'Team 1'} vs {match.team2_name || 'Team 2'}
                    </TableCell>
                    <TableCell>{formatDateTime(match.scheduled_time * 1000)}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Button 
                          size="small" 
                          variant="outlined"
                          onClick={() => {/* Add navigation to scoring page */}}
                        >
                          Start
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
      
      {completedMatches.length > 0 && (
        <>
          <Typography variant="subtitle2" gutterBottom>Completed</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Teams</TableCell>
                  <TableCell align="center">Score</TableCell>
                  <TableCell>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {completedMatches.map(match => (
                  <TableRow key={match.match_id}>
                    <TableCell>
                      {match.team1_name || 'Team 1'} vs {match.team2_name || 'Team 2'}
                    </TableCell>
                    <TableCell align="center">
                      {match.scores_team1?.join(' - ') || '0'} : {match.scores_team2?.join(' - ') || '0'}
                    </TableCell>
                    <TableCell>{formatDateTime(match.scheduled_time * 1000)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default PoolList; 