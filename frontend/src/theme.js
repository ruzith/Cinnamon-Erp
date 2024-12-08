import { createTheme } from '@mui/material/styles';

const getTheme = (darkMode) => createTheme({
  palette: {
    mode: darkMode ? 'dark' : 'light',
    primary: {
      main: '#8B4513',
      light: '#A0522D',
      dark: '#6B3E26',
      gradient: 'linear-gradient(45deg, #8B4513 30%, #A0522D 90%)',
    },
    secondary: {
      main: '#2E7D32',
      light: '#4CAF50',
      dark: '#1B5E20',
      gradient: 'linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)',
    },
    background: {
      default: darkMode ? '#1a1a1a' : '#FBF7F4',
      paper: darkMode ? '#242424' : '#ffffff',
      gradient: darkMode 
        ? 'linear-gradient(145deg, #1a1a1a 0%, #242424 100%)'
        : 'linear-gradient(145deg, #FBF7F4 0%, #ffffff 100%)',
    },
    text: {
      primary: darkMode ? '#f1f5f9' : '#2C1810',
      secondary: darkMode ? '#94a3b8' : '#5D4037',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h6: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          padding: '8px 20px',
          fontWeight: 600,
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 8px 16px -4px rgb(139 69 19 / 0.2)',
            transform: 'translateY(-2px)',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
            background: 'rgba(139, 69, 19, 0.04)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          borderRadius: '16px',
          boxShadow: darkMode
            ? '0 4px 6px -1px rgb(0 0 0 / 0.3)'
            : '0 4px 6px -1px rgb(0 0 0 / 0.05)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          ...(!['permanent', 'AppBar'].includes(ownerState.variant) && {
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: darkMode
                ? '0 20px 25px -5px rgb(0 0 0 / 0.4)'
                : '0 20px 25px -5px rgb(0 0 0 / 0.1)',
            },
          }),
        }),
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          borderRight: '1px solid',
          borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
          transform: 'none !important',
          transition: 'none !important',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          backdropFilter: 'blur(8px)',
          backgroundColor: darkMode
            ? 'rgba(26, 26, 26, 0.8)'
            : 'rgba(251, 247, 244, 0.8)',
          transform: 'none !important',
          transition: 'none !important',
          boxShadow: darkMode 
            ? '0 1px 3px 0 rgb(0 0 0 / 0.3)'
            : '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          '&:hover': {
            boxShadow: darkMode 
              ? '0 2px 4px 0 rgb(0 0 0 / 0.3)'
              : '0 2px 4px 0 rgb(0 0 0 / 0.1)',
          }
        },
      },
    },
  },
  shape: {
    borderRadius: 12,
  },
});

export default getTheme; 