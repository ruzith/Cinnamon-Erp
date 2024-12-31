import React, { memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  Drawer,
  Avatar,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import CinnamonLogo from '../common/CinnamonLogo';

const styles = {
  appBar: {
    zIndex: (theme) => theme.zIndex.drawer + 1,
    backdropFilter: 'blur(20px)',
    backgroundColor: (theme) =>
      theme.palette.mode === 'light'
        ? 'rgba(255, 255, 255, 0.85)'
        : 'rgba(18, 18, 18, 0.85)',
    borderBottom: '1px solid',
    borderColor: 'divider',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',
  },
  logo: {
    fontSize: '2.5rem',
    mr: 1.5,
    color: '#8B4513',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    filter: 'drop-shadow(0 0 8px rgba(139, 69, 19, 0.2))',
    '&:hover': {
      transform: 'scale(1.08) rotate(5deg)',
      filter: 'drop-shadow(0 0 12px rgba(139, 69, 19, 0.3))',
    },
  },
  brandText: {
    fontWeight: 700,
    background: 'linear-gradient(45deg, #8B4513 30%, #D2691E 90%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '0.8px',
    fontSize: '1.6rem',
    fontFamily: '"Playfair Display", "Segoe UI", serif',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'scale(1.03)',
      letterSpacing: '1.2px',
      textShadow: '0 0 20px rgba(139, 69, 19, 0.4)',
      background: 'linear-gradient(45deg, #D2691E 30%, #8B4513 90%)',
      WebkitBackgroundClip: 'text',
    },
  },
  userBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    px: 2.5,
    py: 1,
    borderRadius: 3,
    bgcolor: (theme) => theme.palette.mode === 'light'
      ? 'rgba(139, 69, 19, 0.03)'
      : 'rgba(210, 105, 30, 0.03)',
    border: '1px solid',
    borderColor: (theme) => theme.palette.mode === 'light'
      ? 'rgba(139, 69, 19, 0.12)'
      : 'rgba(210, 105, 30, 0.12)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      bgcolor: (theme) => theme.palette.mode === 'light'
        ? 'rgba(139, 69, 19, 0.06)'
        : 'rgba(210, 105, 30, 0.06)',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(139, 69, 19, 0.15)',
      borderColor: (theme) => theme.palette.mode === 'light'
        ? 'rgba(139, 69, 19, 0.2)'
        : 'rgba(210, 105, 30, 0.2)',
    },
  },
  darkModeButton: {
    mr: 1,
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    borderRadius: '16px',
    p: 1.2,
    color: '#8B4513',
    '&:hover': {
      transform: 'rotate(45deg) scale(1.15)',
      backgroundColor: (theme) =>
        theme.palette.mode === 'light'
          ? 'rgba(139, 69, 19, 0.12)'
          : 'rgba(210, 105, 30, 0.12)',
      boxShadow: '0 0 12px rgba(139, 69, 19, 0.2)',
    },
  },
  logoutButton: {
    borderRadius: '16px',
    px: 2.5,
    py: 1.2,
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    color: '#8B4513',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      backgroundColor: (theme) =>
        theme.palette.mode === 'light'
          ? 'rgba(139, 69, 19, 0.1)'
          : 'rgba(210, 105, 30, 0.1)',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(139, 69, 19, 0.15)',
    },
  },
  mainContent: {
    flexGrow: 1,
    p: 3,
    backgroundColor: (theme) =>
      theme.palette.mode === 'light'
        ? 'rgba(139, 69, 19, 0.01)'
        : 'rgba(210, 105, 30, 0.01)',
    minHeight: '100vh',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundImage: (theme) =>
      theme.palette.mode === 'light'
        ? 'radial-gradient(circle at 50% 50%, rgba(139, 69, 19, 0.03) 0%, rgba(139, 69, 19, 0) 50%)'
        : 'radial-gradient(circle at 50% 50%, rgba(210, 105, 30, 0.03) 0%, rgba(210, 105, 30, 0) 50%)',
  },
};

const MobileDrawer = memo(({ mobileOpen, handleDrawerToggle }) => (
  <Drawer
    variant="temporary"
    open={mobileOpen}
    onClose={handleDrawerToggle}
    ModalProps={{ keepMounted: true }}
    sx={{
      display: { xs: 'block', sm: 'none' },
      '& .MuiDrawer-paper': {
        width: 240,
        backgroundColor: (theme) => theme.palette.background.default,
        borderRight: '1px solid',
        borderColor: (theme) => theme.palette.divider,
        boxShadow: '4px 0 12px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      },
    }}
  >
    <Sidebar />
  </Drawer>
));

const DesktopDrawer = memo(() => (
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
        boxShadow: '4px 0 12px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      },
    }}
  >
    <Toolbar />
    <Sidebar />
  </Drawer>
));

const Layout = memo(({ children, darkMode, toggleDarkMode }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleDrawerToggle = React.useCallback(() => {
    setMobileOpen(prev => !prev);
  }, []);

  const handleLogout = React.useCallback(() => {
    dispatch(logout());
    navigate('/login');
  }, [dispatch, navigate]);

  const userInitials = React.useMemo(() => {
    if (!user?.name) return 'U';
    return user.name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [user?.name]);

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" elevation={0} sx={styles.appBar}>
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
            <CinnamonLogo sx={styles.logo} />
            <Typography variant="h6" noWrap component="div" sx={styles.brandText}>
              Cinnamon ERP
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 'auto' }}>
            <Box sx={styles.userBox}>
              <Avatar
                sx={{
                  bgcolor: '#8B4513',
                  width: 32,
                  height: 32,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    bgcolor: '#D2691E',
                  },
                }}
              >
                {userInitials}
              </Avatar>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: '#8B4513',
                  fontSize: '0.9rem',
                }}
              >
                {user?.name || 'User'}
              </Typography>
            </Box>

            <IconButton
              sx={styles.darkModeButton}
              onClick={toggleDarkMode}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>

            <Button
              onClick={handleLogout}
              sx={styles.logoutButton}
              title="Logout"
            >
              <LogoutIcon sx={{ fontSize: '1.2rem' }} />
              <Typography
                variant="button"
                sx={{
                  fontWeight: 500,
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                Logout
              </Typography>
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <MobileDrawer mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
      <DesktopDrawer />

      <Box component="main" sx={styles.mainContent}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
});

Layout.displayName = 'Layout';
MobileDrawer.displayName = 'MobileDrawer';
DesktopDrawer.displayName = 'DesktopDrawer';

export default Layout;