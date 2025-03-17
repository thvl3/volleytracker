import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip
} from '@mui/material';
import {
  People as PeopleIcon,
  LocationOn as LocationIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import { poolAPI } from '../api';
import PoolStandings from './PoolStandings';
import PoolMatchList from './PoolMatchList';

const PoolList = ({ tournamentId, isAdmin }) => {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPool, setSelectedPool] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchPools = async () => {
      if (!tournamentId) return;
      
      try {
        setLoading(true);
        const poolsData = await poolAPI.getPoolsByTournament(tournamentId);
        setPools(poolsData);
        
        if (poolsData.length > 0) {
          setSelectedPool(poolsData[0]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching pools:', err);
        setError(err.message || 'Failed to load pools');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPools();
  }, [tournamentId]);
  
  const handlePoolSelect = (pool) => {
    setSelectedPool(pool);
    setTabValue(0); // Reset to standings tab
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleGoToAdmin = () => {
    navigate(`/admin/tournaments/${tournamentId}/pools`);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error">{error}</Alert>
    );
  }
  
  if (pools.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography align="center" color="textSecondary" sx={{ mb: 2 }}>
          No pools have been created for this tournament yet.
        </Typography>
        
        {isAdmin && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="contained"
              color="primary"
              onClick={handleGoToAdmin}
            >
              Manage Pools
            </Button>
          </Box>
        )}
      </Paper>
    );
  }
  
  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pools
              </Typography>
              
              <List>
                {pools.map((pool) => (
                  <ListItem 
                    key={pool.pool_id}
                    button
                    selected={selectedPool && pool.pool_id === selectedPool.pool_id}
                    onClick={() => handlePoolSelect(pool)}
                    sx={{ 
                      borderRadius: 1,
                      mb: 0.5,
                      bgcolor: selectedPool && pool.pool_id === selectedPool.pool_id ? 'action.selected' : 'transparent'
                    }}
                  >
                    <ListItemIcon>
                      <PeopleIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={pool.name} 
                      secondary={`${pool.teams?.length || 0} Teams`}
                    />
                  </ListItem>
                ))}
              </List>
              
              {isAdmin && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleGoToAdmin}
                  >
                    Manage Pools
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={9}>
          {selectedPool ? (
            <Card>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="pool tabs">
                  <Tab label="Standings" />
                  <Tab label="Schedule" />
                  <Tab label="Details" />
                </Tabs>
              </Box>
              
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h5">{selectedPool.name}</Typography>
                </Box>
                
                {/* Tab Panels */}
                {tabValue === 0 && (
                  <PoolStandings poolId={selectedPool.pool_id} />
                )}
                
                {tabValue === 1 && (
                  <PoolMatchList poolId={selectedPool.pool_id} isAdmin={isAdmin} />
                )}
                
                {tabValue === 2 && (
                  <Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            <LocationIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                            Location
                          </Typography>
                          
                          <Typography variant="body1">
                            {selectedPool.location_name || 'Not assigned'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Court {selectedPool.court_number || '1'}
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            <PeopleIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                            Teams
                          </Typography>
                          
                          {selectedPool.teams && selectedPool.teams.length > 0 ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selectedPool.teams.map((team, index) => (
                                <Chip 
                                  key={team.team_id || index}
                                  label={team.team_name || `Team ${index + 1}`}
                                  size="small"
                                />
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No teams assigned
                            </Typography>
                          )}
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>
          ) : (
            <Alert severity="info">
              Select a pool to view details
            </Alert>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default PoolList; 