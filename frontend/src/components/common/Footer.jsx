import React from 'react';
import { Box, Typography, Link } from '@mui/material';

const Footer = () => {
  return (
    <Box component="footer" className="footer">
      <Typography variant="body2" color="textSecondary" align="center">
        {'© '}
        <Link color="inherit" href="/">
          VolleyTracker
        </Link>{' '}
        {new Date().getFullYear()}
      </Typography>
    </Box>
  );
};

export default Footer;
