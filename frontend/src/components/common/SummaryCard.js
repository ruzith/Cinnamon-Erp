import React from 'react';
import { Paper, Box, Typography, useTheme } from '@mui/material';

const SummaryCard = ({
  icon: Icon,
  title,
  value,
  iconColor = 'primary.main',
  gradientColor = 'primary'
}) => {
  const theme = useTheme();

  const getColorValues = (color) => {
    const colorMap = {
      primary: '25, 118, 210',
      secondary: '156, 39, 176',
      success: '46, 125, 50',
      warning: '251, 140, 0',
      error: '211, 47, 47',
      info: '2, 136, 209'
    };
    return colorMap[color] || colorMap.primary;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: '100%',
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(45deg, ${theme.palette.background.paper} 0%, rgba(${getColorValues(gradientColor)}, 0.1) 100%)`
          : `linear-gradient(45deg, ${theme.palette.background.paper} 0%, rgba(${getColorValues(gradientColor)}, 0.05) 100%)`,
        border: '1px solid',
        borderColor: theme.palette.divider,
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            {value}
          </Typography>
        </Box>
        {Icon && (
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: `rgba(${getColorValues(gradientColor)}, 0.1)`,
              color: iconColor
            }}
          >
            <Icon />
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default SummaryCard;