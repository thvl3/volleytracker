import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  Paper,
  Link,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material';
import {
  EmojiEvents as TournamentIcon,
  People as TeamIcon,
  LocationOn as LocationIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import AdminLayout from '../../components/AdminLayout';
import { tournamentAPI } from '../../api';
import { formatDate } from '../../utils/dateUtils';

const AdminDashboard = () => {
  const [recentTournaments, setRecentTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        const tournaments = await tournamentAPI.getAllTournaments();
        // Sort by date descending (most recent first) and take only the latest 5
        const sortedTournaments = tournaments
          .sort((a, b) => b.start_date - a.start_date)
          .slice(0, 5);
        
        setRecentTournaments(sortedTournaments);
        setError(null);
      } catch (err) {
        console.error('Error fetching tournaments:', err);
        setError('Failed to load recent tournaments');
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'primary.main';
      case 'in_progress':
        return 'success.main';
      case 'completed':
        return 'text.secondary';
      default:
        return 'text.primary';
    }
  };

  return (
    <AdminLayout>
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
            Manage tournaments, teams, and more
          </Typography>

          {/* Quick Actions */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  component={RouterLink}
                  to="/admin/tournaments/create"
                  variant="contained"
                  fullWidth
                  startIcon={<TournamentIcon />}
                  sx={{ py: 1.5 }}
                >
                  New Tournament
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  component={RouterLink}
                  to="/admin/tournaments"
                  variant="outlined"
                  fullWidth
                  startIcon={<DashboardIcon />}
                  sx={{ py: 1.5 }}
                >
                  All Tournaments
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  component={RouterLink}
                  to="/admin/locations"
                  variant="outlined"
                  fullWidth
                  startIcon={<LocationIcon />}
                  sx={{ py: 1.5 }}
                >
                  Manage Locations
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Recent Tournaments */}
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Recent Tournaments
                </Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : error ? (
                  <Typography color="error">{error}</Typography>
                ) : recentTournaments.length > 0 ? (
                  <List>
                    {recentTournaments.map((tournament) => (
                      <React.Fragment key={tournament.tournament_id}>
                        <ListItem
                          component={RouterLink}
                          to={`/admin/tournaments/${tournament.tournament_id}`}
                          sx={{
                            borderRadius: 1,
                            textDecoration: 'none',
                            color: 'inherit',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                          }}
                        >
                          <ListItemIcon>
                            <TournamentIcon
                              sx={{ color: getStatusColor(tournament.status) }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={tournament.name}
                            secondary={
                              <Box component="span">
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color={getStatusColor(tournament.status)}
                                  sx={{ textTransform: 'capitalize' }}
                                >
                                  {tournament.status}
                                </Typography>
                                {' • '}
                                {formatDate(tournament.start_date)}
                              </Box>
                            }
                          />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No tournaments found. Create your first tournament to get
                    started.
                  </Typography>
                )}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    component={RouterLink}
                    to="/admin/tournaments"
                    color="primary"
                  >
                    View All Tournaments
                  </Button>
                </Box>
              </Paper>
            </Grid>

            {/* Quick Links */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Links
                  </Typography>
                  <List dense>
                    <ListItem
                      component={RouterLink}
                      to="/admin/tournaments"
                      sx={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      <ListItemIcon>
                        <TournamentIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary="Manage Tournaments" />
                    </ListItem>
                    <ListItem
                      component={RouterLink}
                      to="/admin/locations"
                      sx={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      <ListItemIcon>
                        <LocationIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary="Manage Locations" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </AdminLayout>
  );
};

export default AdminDashboard; 