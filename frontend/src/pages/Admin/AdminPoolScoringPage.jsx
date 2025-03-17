import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Container, Breadcrumbs, Link } from '@mui/material';
import PoolMatchScoring from '../../components/PoolMatchScoring';
import { poolMatchAPI, tournamentAPI } from '../../api/api';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const AdminPoolScoringPage = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tournamentName, setTournamentName] = useState('');

  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        setLoading(true);
        const response = await poolMatchAPI.getById(matchId);
        const matchData = response.data;
        setMatch(matchData);
        
        // Fetch tournament name
        if (matchData.tournament_id) {
          const tournamentResponse = await tournamentAPI.getById(matchData.tournament_id);
          setTournamentName(tournamentResponse.data.name);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching match details:', err);
        setError('Failed to load match details.');
      } finally {
        setLoading(false);
      }
    };
    
    if (matchId) {
      fetchMatchDetails();
    }
  }, [matchId]);

  const handleMatchComplete = () => {
    // Navigate back to the matches page
    navigate(`/admin/tournaments/${match.tournament_id}/matches`);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 3, mb: 4 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
          <Link underline="hover" color="inherit" href="/admin">
            Dashboard
          </Link>
          <Link underline="hover" color="inherit" href="/admin/tournaments">
            Tournaments
          </Link>
          {match && match.tournament_id && (
            <Link 
              underline="hover" 
              color="inherit" 
              href={`/admin/tournaments/${match.tournament_id}`}
            >
              {tournamentName || 'Tournament Details'}
            </Link>
          )}
          <Typography color="text.primary">Pool Match Scoring</Typography>
        </Breadcrumbs>
      </Box>

      <Paper sx={{ p: 3 }}>
        {loading ? (
          <Typography>Loading match details...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <PoolMatchScoring 
            matchId={matchId}
            onMatchComplete={handleMatchComplete}
          />
        )}
      </Paper>
    </Container>
  );
};

export default AdminPoolScoringPage; 