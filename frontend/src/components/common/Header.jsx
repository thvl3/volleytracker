import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { AuthContext } from '../../contexts/AuthContext';

function Header() {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <AppBar position="static" className="header">
      <Toolbar className="header-content">
        <Typography variant="h6" component={Link} to="/" style={{ color: 'white', textDecoration: 'none' }}>
          VolleyTracker
        </Typography>
        <Box>
          <Button color="inherit" component={Link} to="/tournaments">
            Tournaments
          </Button>
          {isAuthenticated ? (
            <>
              <Button color="inherit" component={Link} to="/admin">
                Admin Dashboard
              </Button>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Button color="inherit" component={Link} to="/admin/login">
              Admin Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
