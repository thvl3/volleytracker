import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Typography, 
  Box,
  Container, 
  Card, 
  CardContent, 
  CardActions,
  Button,
  Grid,
  Chip
} from '@mui/material';
import Loading from '../components/common/Loading';
import { tournamentAPI } from '../api';
import moment from 'moment';

const statusColors = {
  upcoming: 'primary',
  in_progress: 'success',
  completed: 'default'
};

const TournamentListPage = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const tournaments = await tournamentAPI.getAllTournaments();
        setTournaments(tournaments);
      } catch (error) {
        console.error('Failed to fetch tournaments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Volleyball Tournaments
        </Typography>
      </Box>

      {tournaments.length > 0 ? (
        <Grid container spacing={3}>
          {tournaments.map((tournament) => (
            <Grid item xs={12} md={6} key={tournament.tournament_id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h5" component="h2">
                      {tournament.name}
                    </Typography>
                    <Chip 
                      label={tournament.status} 
                      color={statusColors[tournament.status] || 'default'} 
                      size="small"
                    />
                  </Box>
                  
                  <Typography color="textSecondary" gutterBottom>
                    Location: {tournament.location || 'TBA'}
                  </Typography>
                  
                  <Typography variant="body2" component="p">
                    Start Date: {moment.unix(tournament.start_date).format('MMMM D, YYYY')}
                  </Typography>
                  
                  {tournament.end_date && (
                    <Typography variant="body2" component="p">
                      End Date: {moment.unix(tournament.end_date).format('MMMM D, YYYY')}
                    </Typography>
                  )}
                  
                  <Typography variant="body2" component="p" mt={1}>
                    Type: {tournament.type.replace('_', ' ')}
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
                    View Bracket
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="h6">No tournaments found.</Typography>
      )}
    </Container>
  );
};

export default TournamentListPage;
