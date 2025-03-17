import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import AdminLayout from '../../components/AdminLayout';
import PoolMatchScoring from '../../components/PoolMatchScoring';
import { poolMatchAPI, poolAPI } from '../../api';

const AdminPoolScoringPage = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchMatch = async () => {
      try {
        setLoading(true);
        const matchData = await poolMatchAPI.getPoolMatch(matchId);
        setMatch(matchData);
        setError(null);
      } catch (err) {
        console.error('Error fetching match:', err);
        setError(err.message || 'Failed to load match');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatch();
  }, [matchId]);
  
  const handleScoreUpdate = (updatedMatch) => {
    setMatch(updatedMatch);
  };
  
  const handleBack = () => {
    if (match && match.pool_id) {
      navigate(`/admin/pools/${match.pool_id}`);
    } else {
      navigate(-1);
    }
  };
  
  return (
    <AdminLayout>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link color="inherit" href="/admin/tournaments">
              Tournaments
            </Link>
            {match && (
              <>
                <Link color="inherit" href={`/admin/tournaments/${match.tournament_id}`}>
                  Tournament
                </Link>
                <Link color="inherit" href={`/admin/pools/${match.pool_id}`}>
                  {match.pool_name || 'Pool'}
                </Link>
              </>
            )}
            <Typography color="textPrimary">Match Scoring</Typography>
          </Breadcrumbs>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4">Pool Match Scoring</Typography>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
            >
              Back to Pool
            </Button>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          ) : (
            <PoolMatchScoring 
              match={match} 
              onScoreUpdate={handleScoreUpdate} 
            />
          )}
        </Box>
      </Container>
    </AdminLayout>
  );
};

export default AdminPoolScoringPage; 