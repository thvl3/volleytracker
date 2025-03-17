import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, ListItemIcon, Divider, CircularProgress } from '@mui/material';
import { tournamentAPI } from '../api/api';
import { SportsTennis, EmojiEvents, AccessTime } from '@mui/icons-material';
import { formatDateTime } from '../utils/format';

const TournamentUpdatesFeed = ({ tournamentId }) => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let interval;
    const fetchUpdates = async () => {
      try {
        setLoading(true);
        const response = await tournamentAPI.getUpdates(tournamentId);
        setUpdates(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching tournament updates:', err);
        setError('Failed to load tournament updates.');
      } finally {
        setLoading(false);
      }
    };

    fetchUpdates();
    
    // Refresh updates every 30 seconds
    interval = setInterval(fetchUpdates, 30000);
    
    return () => clearInterval(interval);
  }, [tournamentId]);

  const getUpdateIcon = (type) => {
    switch (type) {
      case 'match_update':
        return <SportsTennis />;
      case 'tournament_update':
        return <EmojiEvents />;
      default:
        return <AccessTime />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ my: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!updates || updates.length === 0) {
    return (
      <Box sx={{ my: 2 }}>
        <Typography>No updates available for this tournament.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ my: 3 }}>
      <Typography variant="h6" gutterBottom>Tournament Updates</Typography>
      <Paper sx={{ p: 2 }}>
        <List>
          {updates.map((update, index) => (
            <React.Fragment key={update.id || index}>
              <ListItem alignItems="flex-start">
                <ListItemIcon>
                  {getUpdateIcon(update.type)}
                </ListItemIcon>
                <ListItemText
                  primary={update.title}
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {update.message}
                      </Typography>
                      {' — '}{formatDateTime(update.timestamp * 1000)}
                    </>
                  }
                />
              </ListItem>
              {index < updates.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default TournamentUpdatesFeed; 