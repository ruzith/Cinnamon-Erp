import React from 'react';
import { Paper, Box, Typography } from '@mui/material';

const SummaryCard = ({ icon: Icon, title, value, color, trend, trendValue }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      height: '100%',
      background: (theme) => 
        `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${color}08 100%)`,
      border: '1px solid',
      borderColor: 'divider',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `linear-gradient(135deg, ${color}05 0%, transparent 100%)`,
        opacity: 0,
        transition: 'opacity 0.3s ease-in-out',
      },
      '&:hover::before': {
        opacity: 1,
      },
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: (theme) => 
          theme.palette.mode === 'dark'
            ? '0 20px 25px -5px rgb(0 0 0 / 0.4)'
            : '0 20px 25px -5px rgb(0 0 0 / 0.1)',
      },
    }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
      <Box>
        <Typography color="textSecondary" variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
          {title}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
          {value}
        </Typography>
      </Box>
      <Box 
        sx={{ 
          p: 1.5,
          borderRadius: 2,
          bgcolor: `${color}15`,
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'scale(1.1)',
            bgcolor: `${color}25`,
          }
        }}
      >
        <Icon sx={{ fontSize: 24 }} />
      </Box>
    </Box>
    {trend && (
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
        <Typography 
          variant="body2" 
          sx={{ 
            color: trend === 'up' ? 'success.main' : 'error.main',
            fontWeight: 500,
          }}
        >
          {trendValue}
        </Typography>
      </Box>
    )}
  </Paper>
);

export default SummaryCard; 