import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText,
  Divider,
  Chip,
  CircularProgress
} from '@mui/material';
import { tournamentAPI } from '../api/api';
import moment from 'moment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SportsVolleyballIcon from '@mui/icons-material/SportsVolleyball';

const TournamentUpdatesFeed = ({ tournamentId }) => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        setLoading(true);
        const response = await tournamentAPI.getUpdates(tournamentId);
        setUpdates(response.data);
        
        // Save timestamp of most recent update if any
        if (response.data.length > 0) {
          setLastUpdate(Math.max(...response.data.map(u => u.timestamp)));
        }
      } catch (error) {
        console.error('Error fetching updates:', error);
        setError('Failed to load updates');
      } finally {
        setLoading(false);
      }
    };

    fetchUpdates();

    // Refresh updates every 30 seconds
    const intervalId = setInterval(() => {
      // Only fetch newer updates than what we already have
      const fetchNewerUpdates = async () => {
        if (lastUpdate) {
          try {
            const response = await tournamentAPI.getUpdates(tournamentId, lastUpdate);
            if (response.data.length > 0) {
              // Add new updates and update the last timestamp
              setUpdates(prevUpdates => [...response.data, ...prevUpdates]);
              setLastUpdate(Math.max(...response.data.map(u => u.timestamp)));
            }
          } catch (error) {
            console.error('Error fetching updates:', error);
          }
        }
      };
      
      fetchNewerUpdates();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [tournamentId, lastUpdate]);

  // Format timestamp to human-readable time
  const formatTime = (timestamp) => {
    return moment(timestamp * 1000).format('h:mm A');
  };

  // Render update message based on type
  const renderUpdateMessage = (update) => {
    const { update_type, team1_name, team2_name, score_team1, score_team2 } = update;
    
    if (update_type === 'score_update') {
      return (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <SportsVolleyballIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="subtitle2" color="primary">Score Update</Typography>
          </Box>
          <Typography variant="body1">
            <strong>{team1_name}</strong> vs <strong>{team2_name}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Score is now <Chip size="small" label={score_team1} /> - <Chip size="small" label={score_team2} />
          </Typography>
        </>
      );
    }
    
    if (update_type === 'match_complete') {
      const winner = score_team1 > score_team2 ? team1_name : team2_name;
      const loser = score_team1 > score_team2 ? team2_name : team1_name;
      return (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <EmojiEventsIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
            <Typography variant="subtitle2" color="success.main">Match Complete</Typography>
          </Box>
          <Typography variant="body1">
            <strong>{winner}</strong> defeated <strong>{loser}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Final score: <Chip size="small" label={score_team1} /> - <Chip size="small" label={score_team2} />
          </Typography>
        </>
      );
    }
    
    return <Typography>Unknown update type</Typography>;
  };

  if (loading && updates.length === 0) {
    return (
      <Paper sx={{ p: 2, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (error && updates.length === 0) {
    return (
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        Live Updates
      </Typography>
      
      {updates.length === 0 ? (
        <Typography sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}>
          No updates yet. Stay tuned for live match updates!
        </Typography>
      ) : (
        <List>
          {updates.map((update, index) => (
            <React.Fragment key={update.update_id}>
              <ListItem alignItems="flex-start" sx={{ 
                py: 2,
                backgroundColor: index === 0 ? 'rgba(0, 0, 0, 0.02)' : 'transparent' 
              }}>
                <ListItemText
                  primary={renderUpdateMessage(update)}
                  secondary={
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ display: 'block', mt: 1 }}
                    >
                      {formatTime(update.timestamp)}
                    </Typography>
                  }
                />
              </ListItem>
              {index < updates.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default TournamentUpdatesFeed; 