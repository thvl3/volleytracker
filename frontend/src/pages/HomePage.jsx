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
  Container
} from '@mui/material';
import Loading from '../components/common/Loading';
import { tournamentAPI, matchAPI } from '../api/api';

const HomePage = () => {
  const [activeTournaments, setActiveTournaments] = useState([]);
  const [featuredMatches, setFeaturedMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get all tournaments
        const tournamentsResponse = await tournamentAPI.getAll();
        const tournaments = tournamentsResponse.data;
        
        // Filter active tournaments
        const active = tournaments.filter(t => t.status === 'in_progress');
        setActiveTournaments(active);

        // Get featured matches from active tournaments
        if (active.length > 0) {
          const activeId = active[0].tournament_id;
          const matchesResponse = await matchAPI.getByTournament(activeId, 'in_progress');
          setFeaturedMatches(matchesResponse.data.slice(0, 3)); // Get first 3 matches
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Welcome to VolleyTracker
        </Typography>
        <Typography variant="h5" component="h2" color="textSecondary" gutterBottom>
          Live volleyball tournament scoring and brackets
        </Typography>
      </Box>

      {activeTournaments.length > 0 ? (
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            Active Tournaments
          </Typography>
          <Grid container spacing={3}>
            {activeTournaments.map((tournament) => (
              <Grid item xs={12} md={6} key={tournament.tournament_id}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" component="h2">
                      {tournament.name}
                    </Typography>
                    <Typography color="textSecondary">
                      {tournament.location}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      color="primary"
                      component={Link}
                      to={`/tournaments/${tournament.tournament_id}`}
                    >
                      View Details
                    </Button>
                    <Button 
                      size="small" 
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
        </Box>
      ) : (
        <Box sx={{ my: 4 }}>
          <Typography variant="h5">
            No active tournaments currently.
          </Typography>
        </Box>
      )}

      {featuredMatches.length > 0 && (
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            Live Matches
          </Typography>
          <Grid container spacing={3}>
            {featuredMatches.map((match) => (
              <Grid item xs={12} md={4} key={match.match_id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="h3">
                      {match.team1_id ? match.team1_id : 'TBD'} vs {match.team2_id ? match.team2_id : 'TBD'}
                    </Typography>
                    <Typography variant="h4" align="center" sx={{ my: 2 }}>
                      {match.score_team1} - {match.score_team2}
                    </Typography>
                    {match.court && (
                      <Typography color="textSecondary">
                        Court: {match.court}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      color="primary"
                      component={Link}
                      to={`/tournaments/${match.tournament_id}/bracket`}
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

      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          About VolleyTracker
        </Typography>
        <Typography paragraph>
          VolleyTracker is a comprehensive volleyball tournament tracking system that provides 
          real-time updates on matches, scores, and brackets. Whether you're a player, coach, 
          or spectator, stay informed about all the action happening across the courts.
        </Typography>
      </Box>
    </Container>
  );
};

export default HomePage;
