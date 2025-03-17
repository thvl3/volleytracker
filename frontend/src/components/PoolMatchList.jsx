import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
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
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  SportsTennis as VolleyballIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { poolAPI, poolMatchAPI } from '../api';
import { formatDateTime, formatTime } from '../utils/dateUtils';

const PoolMatchList = ({ poolId, isAdmin }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const matchesData = await poolMatchAPI.getPoolMatches(poolId);
        
        // Sort matches by scheduled time
        const sortedMatches = [...matchesData].sort((a, b) => 
          a.scheduled_time - b.scheduled_time
        );
        
        setMatches(sortedMatches);
        setError(null);
      } catch (err) {
        console.error('Error fetching pool matches:', err);
        setError(err.message || 'Failed to load matches');
      } finally {
        setLoading(false);
      }
    };
    
    if (poolId) {
      fetchMatches();
    }
  }, [poolId]);
  
  const handleScoreClick = (matchId) => {
    if (isAdmin) {
      navigate(`/admin/pool-matches/${matchId}/score`);
    } else {
      navigate(`/pool-matches/${matchId}`);
    }
  };
  
  const getStatusChip = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return (
          <Chip 
            label="Completed" 
            color="success" 
            size="small" 
            icon={<CheckCircleIcon />} 
          />
        );
      case 'in_progress':
        return (
          <Chip 
            label="In Progress" 
            color="primary" 
            size="small" 
            icon={<VolleyballIcon />} 
          />
        );
      case 'scheduled':
      default:
        return (
          <Chip 
            label="Scheduled" 
            color="default" 
            size="small" 
            icon={<ScheduleIcon />} 
          />
        );
    }
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
  
  if (matches.length === 0) {
    return (
      <Alert severity="info">
        No matches scheduled for this pool yet.
      </Alert>
    );
  }
  
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Pool Matches
        </Typography>
        
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Teams</TableCell>
                <TableCell align="center">Sets</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Score</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {matches.map((match) => (
                <TableRow key={match.match_id}>
                  <TableCell>
                    {formatTime(match.scheduled_time)}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {match.team1_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        vs
                      </Typography>
                      <Typography variant="body2">
                        {match.team2_name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {match.num_sets}
                  </TableCell>
                  <TableCell align="center">
                    {getStatusChip(match.status)}
                  </TableCell>
                  <TableCell align="center">
                    {match.scores_team1 && match.scores_team2 ? (
                      <Box>
                        {match.scores_team1.map((score, index) => (
                          score || match.scores_team2[index] ? (
                            <Typography key={`score-${index}`} variant="body2">
                              {score || 0} - {match.scores_team2[index] || 0}
                            </Typography>
                          ) : null
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not played
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Score Match">
                      <IconButton
                        color="primary"
                        onClick={() => handleScoreClick(match.match_id)}
                        disabled={match.status === 'completed' && !isAdmin}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
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

export default PoolMatchList; 