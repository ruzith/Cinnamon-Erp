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
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
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
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Cinnamon ERP
          </Typography>
          
          <IconButton color="inherit" onClick={toggleDarkMode} sx={{ mr: 1 }}>
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          
          <Button color="inherit" onClick={handleLogout}>
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
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { width: 240 },
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
          '& .MuiDrawer-paper': { width: 240, boxSizing: 'border-box' },
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        <Sidebar />
      </Drawer>

      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar /> {/* Spacer for AppBar */}
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 