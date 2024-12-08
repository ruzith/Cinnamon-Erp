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
import CinnamonLogo from '../common/CinnamonLogo';

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
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: 'blur(8px)',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.8)'
              : 'rgba(26, 26, 26, 0.8)',
          borderBottom: '1px solid',
          borderColor: 'divider',
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

          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <CinnamonLogo 
              sx={{ 
                fontSize: '2.5rem', 
                mr: 1.5,
                color: '#8B4513',
              }} 
            />
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #8B4513, #D2691E)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.8px',
                fontSize: '1.6rem',
                fontFamily: '"Playfair Display", "Segoe UI", serif',
                '&:hover': {
                  transform: 'scale(1.02)',
                  transition: 'all 0.3s ease-in-out',
                  textShadow: '0 0 15px rgba(139, 69, 19, 0.3)',
                },
              }}
            >
              Cinnamon ERP
            </Typography>
          </Box>

          <IconButton
            sx={{
              mr: 1,
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'rotate(30deg) scale(1.1)',
                backgroundColor: (theme) =>
                  theme.palette.mode === 'light'
                    ? 'rgba(37, 99, 235, 0.1)'
                    : 'rgba(96, 165, 250, 0.1)',
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