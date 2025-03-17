import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  CardActions,
  Button,
  Grid,
  Container,
  Paper,
  CardMedia,
  Divider,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery,
  Stack
} from '@mui/material';
import { 
  SportsTennis as VolleyballIcon, 
  EmojiEvents as TrophyIcon,
  LocationOn as LocationIcon,
  Group as TeamIcon,
  CalendarToday as CalendarIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';
import Loading from '../components/common/Loading';
import { tournamentAPI, matchAPI } from '../api';

const HomePage = () => {
  const [activeTournaments, setActiveTournaments] = useState([]);
  const [upcomingTournaments, setUpcomingTournaments] = useState([]);
  const [featuredMatches, setFeaturedMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get all tournaments
        const tournaments = await tournamentAPI.getAllTournaments();
        
        // Filter active and upcoming tournaments
        const active = tournaments.filter(t => t.status === 'in_progress');
        const upcoming = tournaments.filter(t => t.status === 'upcoming');
        
        setActiveTournaments(active);
        setUpcomingTournaments(upcoming.slice(0, 3)); // Show only 3 upcoming tournaments

        // Get featured matches from active tournaments
        if (active.length > 0) {
          const activeId = active[0].tournament_id;
          const matches = await matchAPI.getMatchesByTournament(activeId);
          setFeaturedMatches(matches.slice(0, 3)); // Get first 3 matches
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <Box sx={{ 
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
    }}>
      {/* Hero Section */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        color: 'white',
        py: isMobile ? 6 : 10,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Container maxWidth="lg">
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Grid container justifyContent="center" alignItems="center" spacing={4}>
              <Grid item xs={12} md={7} sx={{ textAlign: isMobile ? 'center' : 'left' }}>
                <Typography 
                  variant="h2" 
                  component="h1" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 700,
                    fontSize: isMobile ? '2.5rem' : '3.5rem',
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                  }}
                >
                  VolleyTracker
                </Typography>
                <Typography 
                  variant="h5" 
                  component="h2" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 400,
                    mb: 4,
                    opacity: 0.9
                  }}
                >
                  Real-time volleyball tournament scoring and brackets
                </Typography>
                <Stack 
                  direction={isMobile ? "column" : "row"} 
                  spacing={2}
                  justifyContent={isMobile ? "center" : "flex-start"}
                >
                  <Button
                    variant="contained"
                    size="large"
                    component={Link}
                    to="/tournaments"
                    sx={{ 
                      py: 1.5, 
                      px: 4, 
                      fontSize: '1.1rem',
                      backgroundColor: 'white',
                      color: '#1976d2',
                      '&:hover': {
                        backgroundColor: '#f5f5f5'
                      }
                    }}
                    endIcon={<ArrowIcon />}
                  >
                    View Tournaments
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    component={Link}
                    to="/login"
                    sx={{ 
                      py: 1.5, 
                      px: 4, 
                      fontSize: '1.1rem',
                      borderColor: 'white',
                      color: 'white',
                      '&:hover': {
                        borderColor: '#f5f5f5',
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    Admin Login
                  </Button>
                </Stack>
              </Grid>
              <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
                <Box sx={{ 
                  display: 'flex',
                  justifyContent: 'center',
                }}>
                  <TrophyIcon sx={{ fontSize: 250, opacity: 0.8 }} />
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Active Tournaments Section */}
        <Box sx={{ mt: 8, mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <VolleyballIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="h4" component="h2" fontWeight={600}>
              Active Tournaments
            </Typography>
          </Box>
          
          {activeTournaments.length > 0 ? (
            <Grid container spacing={3}>
              {activeTournaments.map((tournament) => (
                <Grid item xs={12} md={6} lg={4} key={tournament.tournament_id}>
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                    }
                  }}>
                    <Box sx={{ 
                      height: 140, 
                      backgroundColor: theme.palette.primary.main,
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <TrophyIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.2)' }} />
                      <Box sx={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0,
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                      }}>
                        <Typography variant="h5" component="h3" sx={{ 
                          color: 'white',
                          fontWeight: 500,
                          textShadow: '0 1px 3px rgba(0,0,0,0.3)'
                        }}>
                          {tournament.name}
                        </Typography>
                        <Chip 
                          label="In Progress" 
                          size="small" 
                          sx={{ 
                            mt: 1, 
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            alignSelf: 'flex-start'
                          }} 
                        />
                      </Box>
                    </Box>
                    <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            {tournament.location || 'No location specified'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(tournament.start_date)}
                            {tournament.end_date && ` - ${formatDate(tournament.end_date)}`}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TeamIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            Teams: {tournament.teams ? tournament.teams.length : 0}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button 
                        size="small" 
                        color="primary"
                        component={Link}
                        to={`/tournaments/${tournament.tournament_id}`}
                        sx={{ mr: 1 }}
                      >
                        View Details
                      </Button>
                      <Button 
                        size="small" 
                        variant="contained"
                        color="primary"
                        component={Link}
                        to={`/tournaments/${tournament.tournament_id}/bracket`}
                      >
                        Live Bracket
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
              <TrophyIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No active tournaments at the moment.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Check back later or view upcoming tournaments below.
              </Typography>
            </Paper>
          )}
        </Box>

        {/* Live Matches Section */}
        {featuredMatches.length > 0 && (
          <Box sx={{ mt: 8, mb: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <TrophyIcon sx={{ mr: 1, color: theme.palette.secondary.main }} />
              <Typography variant="h4" component="h2" fontWeight={600}>
                Live Matches
              </Typography>
            </Box>
            <Grid container spacing={3}>
              {featuredMatches.map((match) => (
                <Grid item xs={12} md={4} key={match.match_id}>
                  <Card sx={{ 
                    height: '100%',
                    borderRadius: 2, 
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)'
                    }
                  }}>
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                        {match.bracket ? `${match.bracket} Bracket` : 'Match'}
                      </Typography>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        my: 2
                      }}>
                        <Box sx={{ textAlign: 'center', flex: 1 }}>
                          <Avatar sx={{ 
                            width: 60, 
                            height: 60, 
                            bgcolor: theme.palette.primary.main,
                            margin: '0 auto',
                            mb: 1
                          }}>
                            {match.team1_name ? match.team1_name.charAt(0) : 'T1'}
                          </Avatar>
                          <Typography variant="subtitle1" noWrap>
                            {match.team1_name || 'Team 1'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ 
                          mx: 2, 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center'
                        }}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            mb: 1
                          }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold', mx: 1 }}>
                              {match.score_team1 || '0'}
                            </Typography>
                            <Typography variant="body1" sx={{ mx: 1 }}>
                              -
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 'bold', mx: 1 }}>
                              {match.score_team2 || '0'}
                            </Typography>
                          </Box>
                          <Chip 
                            label="LIVE" 
                            color="error" 
                            size="small" 
                            sx={{ 
                              '& .MuiChip-label': { px: 1 },
                              animation: 'pulse 2s infinite'
                            }} 
                          />
                        </Box>
                        
                        <Box sx={{ textAlign: 'center', flex: 1 }}>
                          <Avatar sx={{ 
                            width: 60, 
                            height: 60, 
                            bgcolor: theme.palette.secondary.main,
                            margin: '0 auto',
                            mb: 1
                          }}>
                            {match.team2_name ? match.team2_name.charAt(0) : 'T2'}
                          </Avatar>
                          <Typography variant="subtitle1" noWrap>
                            {match.team2_name || 'Team 2'}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {match.court && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Court: {match.court}
                        </Typography>
                      )}
                    </Box>
                    <Divider />
                    <CardActions sx={{ p: 2, justifyContent: 'center' }}>
                      <Button 
                        size="small" 
                        color="primary"
                        component={Link}
                        to={`/tournaments/${match.tournament_id}/bracket`}
                        endIcon={<ArrowIcon />}
                      >
                        View Bracket
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Upcoming Tournaments Section */}
        {upcomingTournaments.length > 0 && (
          <Box sx={{ mt: 8, mb: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <CalendarIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
              <Typography variant="h4" component="h2" fontWeight={600}>
                Upcoming Tournaments
              </Typography>
            </Box>
            <Grid container spacing={3}>
              {upcomingTournaments.map((tournament) => (
                <Grid item xs={12} md={4} key={tournament.tournament_id}>
                  <Card sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                    }
                  }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h5" component="h3" sx={{ mb: 1, fontWeight: 500 }}>
                        {tournament.name}
                      </Typography>
                      <Stack spacing={2} sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            {tournament.location || 'No location specified'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            Starting: {formatDate(tournament.start_date)}
                          </Typography>
                        </Box>
                      </Stack>
                      <Chip 
                        label="Upcoming" 
                        size="small" 
                        color="primary"
                        variant="outlined"
                        sx={{ mt: 2 }} 
                      />
                    </CardContent>
                    <CardActions sx={{ p: 2 }}>
                      <Button 
                        fullWidth
                        variant="contained"
                        color="primary"
                        component={Link}
                        to={`/tournaments/${tournament.tournament_id}`}
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* About Section */}
        <Box sx={{ my: 8, py: 4 }}>
          <Paper sx={{ p: 4, borderRadius: 2 }}>
            <Typography variant="h4" component="h2" gutterBottom fontWeight={600}>
              About VolleyTracker
            </Typography>
            <Typography paragraph sx={{ maxWidth: '800px', fontSize: '1.1rem', lineHeight: 1.6 }}>
              VolleyTracker is a comprehensive volleyball tournament tracking system that provides 
              real-time updates on matches, scores, and brackets. Whether you're a player, coach, 
              or spectator, stay informed about all the action happening across the courts.
            </Typography>
            <Grid container spacing={4} sx={{ mt: 2 }}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Box sx={{ 
                    backgroundColor: 'rgba(25, 118, 210, 0.1)', 
                    borderRadius: '50%',
                    width: 80,
                    height: 80,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    mb: 2
                  }}>
                    <TrophyIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                  </Box>
                  <Typography variant="h6" gutterBottom>Live Tournaments</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Follow tournaments in real-time with live scoring updates and bracket progression.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Box sx={{ 
                    backgroundColor: 'rgba(25, 118, 210, 0.1)', 
                    borderRadius: '50%',
                    width: 80,
                    height: 80,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    mb: 2
                  }}>
                    <TeamIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                  </Box>
                  <Typography variant="h6" gutterBottom>Team Management</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Easily manage team registrations, player rosters, and tournament assignments.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Box sx={{ 
                    backgroundColor: 'rgba(25, 118, 210, 0.1)', 
                    borderRadius: '50%',
                    width: 80,
                    height: 80,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    mb: 2
                  }}>
                    <VolleyballIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                  </Box>
                  <Typography variant="h6" gutterBottom>Pool Play & Brackets</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Support for various tournament formats, including pool play and elimination brackets.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </Container>

      {/* Footer Section */}
      <Box sx={{ 
        backgroundColor: theme.palette.primary.dark,
        color: 'white',
        py: 4,
        mt: 6
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                VolleyTracker
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                The ultimate tournament management platform for volleyball events.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6} sx={{ 
              display: 'flex',
              justifyContent: { xs: 'flex-start', md: 'flex-end' },
              alignItems: 'center'
            }}>
              <Button 
                component={Link} 
                to="/tournaments" 
                color="inherit" 
                sx={{ mr: 2, opacity: 0.7, '&:hover': { opacity: 1 } }}
              >
                Tournaments
              </Button>
              <Button 
                component={Link} 
                to="/login" 
                color="inherit" 
                sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
              >
                Admin
              </Button>
            </Grid>
          </Grid>
          <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
          <Typography variant="body2" sx={{ opacity: 0.5, textAlign: 'center' }}>
            © {new Date().getFullYear()} VolleyTracker. All rights reserved.
          </Typography>
        </Container>
      </Box>

      {/* Add some CSS for animations */}
      <style jsx global>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }
      `}</style>
    </Box>
  );
};

export default HomePage;
