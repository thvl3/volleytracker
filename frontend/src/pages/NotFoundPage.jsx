import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Button,
  Paper
} from '@mui/material';

const NotFoundPage = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h1" component="h1" gutterBottom>
            404
          </Typography>
          <Typography variant="h4" component="h2" gutterBottom>
            Page Not Found
          </Typography>
          <Typography variant="body1" paragraph>
            The page you're looking for doesn't exist or has been moved.
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Button 
              variant="contained"
              color="primary"
              component={Link}
              to="/"
              size="large"
            >
              Return to Home
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
