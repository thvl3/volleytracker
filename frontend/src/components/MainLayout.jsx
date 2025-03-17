import React from 'react';
import { Link as RouterLink, useLocation, Outlet } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Container,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Home as HomeIcon,
  EmojiEvents as TournamentIcon,
  Login as LoginIcon
} from '@mui/icons-material';

const MainLayout = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography 
            variant="h6" 
            component={RouterLink} 
            to="/" 
            sx={{ 
              flexGrow: 1, 
              textDecoration: 'none', 
              color: 'white',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Box component="span" sx={{ 
              mr: 1, 
              display: 'flex', 
              alignItems: 'center' 
            }}>
              <TournamentIcon />
            </Box>
            VolleyTracker
          </Typography>
          
          <Box sx={{ display: 'flex' }}>
            <Button 
              color="inherit" 
              component={RouterLink} 
              to="/"
              sx={{ 
                mx: 1,
                opacity: location.pathname === '/' ? 1 : 0.8,
                '&:hover': { opacity: 1 }
              }}
              startIcon={!isMobile && <HomeIcon />}
            >
              Home
            </Button>
            
            <Button 
              color="inherit" 
              component={RouterLink} 
              to="/tournaments"
              sx={{ 
                mx: 1,
                opacity: location.pathname.includes('/tournaments') ? 1 : 0.8,
                '&:hover': { opacity: 1 }
              }}
              startIcon={!isMobile && <TournamentIcon />}
            >
              Tournaments
            </Button>
            
            <Button 
              color="inherit" 
              component={RouterLink} 
              to="/login"
              sx={{ 
                mx: 1,
                opacity: location.pathname === '/login' ? 1 : 0.8,
                '&:hover': { opacity: 1 }
              }}
              startIcon={!isMobile && <LoginIcon />}
            >
              Admin
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout; 