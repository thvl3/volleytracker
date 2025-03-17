import React from 'react';
import { Box, Container } from '@mui/material';

/**
 * Layout wrapper for admin pages
 */
const AdminLayout = ({ children }) => {
  return (
    <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
      {children}
    </Box>
  );
};

export default AdminLayout; 