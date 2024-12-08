import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Grid, Paper, Typography, Box, Card, CardContent, LinearProgress } from '@mui/material';
import {
  People,
  Terrain,
  Assignment,
  AccountBalance,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const StatCard = ({ title, value, icon, color, trend, trendValue }) => {
  const theme = useTheme();
  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3,
        height: '100%',
        background: 
          theme.palette.mode === 'dark' 
            ? `linear-gradient(45deg, ${theme.palette.background.paper} 0%, rgba(${color}, 0.1) 100%)`
            : `linear-gradient(45deg, ${theme.palette.background.paper} 0%, rgba(${color}, 0.05) 100%)`,
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
        <Box 
          sx={{ 
            p: 1, 
            borderRadius: 2,
            bgcolor: `rgba(${color}, 0.1)`,
            color: `rgb(${color})`
          }}
        >
          {icon}
        </Box>
      </Box>
      {trend && (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {trendValue > 0 ? (
            <TrendingUp sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
          ) : (
            <TrendingDown sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
          )}
          <Typography 
            variant="body2" 
            color={trendValue > 0 ? 'success.main' : 'error.main'}
          >
            {Math.abs(trendValue)}% from last month
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

const ProgressCard = ({ title, value, target, color }) => {
  const theme = useTheme();
  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3,
        border: '1px solid',
        borderColor: theme.palette.divider,
      }}
    >
      <Typography variant="body2" color="textSecondary" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ ml: 1, mb: 0.5 }}>
          / {target}
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={(value / target) * 100} 
        sx={{ 
          height: 8, 
          borderRadius: 4,
          bgcolor: `rgba(${color}, 0.1)`,
          '& .MuiLinearProgress-bar': {
            bgcolor: `rgb(${color})`,
          }
        }} 
      />
    </Paper>
  );
};

const Dashboard = () => {
  const theme = useTheme();
  const [revenueData] = useState([
    { month: 'Jan', revenue: 18500 },
    { month: 'Feb', revenue: 21300 },
    { month: 'Mar', revenue: 19800 },
    { month: 'Apr', revenue: 24500 },
    { month: 'May', revenue: 28600 },
    { month: 'Jun', revenue: 26400 }
  ]);

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Dashboard
        </Typography>
      </Box>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Lands"
            value="12"
            icon={<Terrain />}
            color="2, 136, 209"
            trend
            trendValue={8.5}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Employees"
            value="45"
            icon={<People />}
            color="46, 125, 50"
            trend
            trendValue={12.3}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Tasks"
            value="8"
            icon={<Assignment />}
            color="251, 140, 0"
            trend
            trendValue={-5.2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Revenue"
            value="$24,500"
            icon={<AccountBalance />}
            color="156, 39, 176"
            trend
            trendValue={15.8}
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              height: '400px',
              border: '1px solid',
              borderColor: (theme) => theme.palette.divider,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Revenue Overview
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis 
                  dataKey="month" 
                  stroke={theme.palette.text.secondary}
                  tick={{ fill: theme.palette.text.secondary }}
                />
                <YAxis 
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  stroke={theme.palette.text.secondary}
                  tick={{ fill: theme.palette.text.secondary }}
                />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: '8px',
                    boxShadow: theme.shadows[3],
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={theme.palette.primary.main}
                  strokeWidth={3}
                  dot={{ 
                    r: 4, 
                    fill: theme.palette.background.paper,
                    strokeWidth: 2,
                  }}
                  activeDot={{ 
                    r: 6,
                    strokeWidth: 0,
                    fill: theme.palette.primary.main,
                  }}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <ProgressCard
                title="Monthly Target"
                value={24500}
                target={30000}
                color="25, 118, 210"
              />
            </Grid>
            <Grid item xs={12}>
              <ProgressCard
                title="Task Completion"
                value={85}
                target={100}
                color="46, 125, 50"
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 