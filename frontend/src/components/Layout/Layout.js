import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../features/auth/authSlice';
import Sidebar from './Sidebar';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Box,
  Drawer
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const Layout = ({ children, darkMode, toggleDarkMode }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: 'blur(6px)',
          backgroundColor: (theme) => 
            theme.palette.mode === 'light' 
              ? 'rgba(255, 255, 255, 0.8)'
              : 'rgba(0, 0, 0, 0.8)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 600,
              background: 'linear-gradient(45deg, #1976d2, #21CBF3)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Cinnamon ERP
          </Typography>
          
          <IconButton 
            sx={{ 
              mr: 1,
              transition: 'transform 0.2s',
              color: (theme) => theme.palette.mode === 'light' ? 'primary.main' : 'primary.light',
              '&:hover': {
                transform: 'rotate(30deg)',
              },
            }}
            onClick={toggleDarkMode} 
          >
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          
          <Button 
            onClick={handleLogout}
            sx={{
              borderRadius: '20px',
              px: 2,
              color: (theme) => theme.palette.mode === 'light' ? 'primary.main' : 'primary.light',
              '&:hover': {
                backgroundColor: (theme) => 
                  theme.palette.mode === 'light'
                    ? 'rgba(25, 118, 210, 0.08)'
                    : 'rgba(144, 202, 249, 0.08)',
              },
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            width: 240,
            backgroundColor: (theme) => theme.palette.background.default,
            borderRight: '1px solid',
            borderColor: (theme) => theme.palette.divider,
          },
        }}
      >
        <Sidebar />
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': { 
            width: 240,
            boxSizing: 'border-box',
            backgroundColor: (theme) => theme.palette.background.default,
            borderRight: '1px solid',
            borderColor: (theme) => theme.palette.divider,
          },
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        <Sidebar />
      </Drawer>

      {/* Main content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3,
          backgroundColor: (theme) => 
            theme.palette.mode === 'light' 
              ? 'rgba(0, 0, 0, 0.01)'
              : 'rgba(255, 255, 255, 0.01)',
          minHeight: '100vh',
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 