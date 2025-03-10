import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const Loading = ({ message = 'Loading...' }) => {
  return (
    <Box 
      display="flex" 
      flexDirection="column"
      justifyContent="center" 
      alignItems="center" 
      minHeight="200px"
    >
      <CircularProgress size={60} />
      <Typography variant="h6" style={{ marginTop: 16 }}>
        {message}
      </Typography>
    </Box>
  );
};

export default Loading;
