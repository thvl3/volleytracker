import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { poolAPI } from '../api';

const PoolStandings = ({ poolId }) => {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchStandings = async () => {
    if (!poolId) return;
    
    try {
      setLoading(true);
      const data = await poolAPI.getPoolRankings(poolId);
      
      // Sort by rank
      const sortedStandings = [...data].sort((a, b) => {
        if (a.rank === null) return 1;
        if (b.rank === null) return -1;
        return a.rank - b.rank;
      });
      
      setStandings(sortedStandings);
      setError(null);
    } catch (err) {
      console.error('Error fetching pool standings:', err);
      setError(err.message || 'Failed to load standings');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchStandings();
  }, [poolId]);
  
  const handleRefresh = () => {
    fetchStandings();
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
      <Alert severity="error">{error}</Alert>
    );
  }
  
  if (standings.length === 0) {
    return (
      <Alert severity="info">
        No standings available for this pool yet.
      </Alert>
    );
  }
  
  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Pool Standings
          </Typography>
          <Tooltip title="Refresh Standings">
            <IconButton onClick={handleRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>Team</TableCell>
                <TableCell align="center">Win-Loss</TableCell>
                <TableCell align="center">Win %</TableCell>
                <TableCell align="center">Sets Won</TableCell>
                <TableCell align="center">Sets Lost</TableCell>
                <TableCell align="center">Point Diff</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {standings.map((standing) => (
                <TableRow key={standing.standing_id}>
                  <TableCell>
                    {standing.rank || '-'}
                  </TableCell>
                  <TableCell>
                    {standing.team_name}
                  </TableCell>
                  <TableCell align="center">
                    {standing.wins}-{standing.losses}
                    {standing.ties > 0 ? `-${standing.ties}` : ''}
                  </TableCell>
                  <TableCell align="center">
                    {standing.wins + standing.losses + standing.ties > 0
                      ? ((standing.wins / (standing.wins + standing.losses + standing.ties)) * 100).toFixed(1) + '%'
                      : '-'
                    }
                  </TableCell>
                  <TableCell align="center">
                    {standing.sets_won}
                  </TableCell>
                  <TableCell align="center">
                    {standing.sets_lost}
                  </TableCell>
                  <TableCell align="center">
                    {standing.points_scored - standing.points_allowed > 0 ? '+' : ''}
                    {standing.points_scored - standing.points_allowed}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default PoolStandings; 