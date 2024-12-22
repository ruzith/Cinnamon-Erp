import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { Grid, Paper, Typography, Box, Card, CardContent, LinearProgress, IconButton, TextField, Button } from '@mui/material';
import axios from 'axios';
import {
  People,
  Terrain,
  Assignment,
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Edit
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
import { useCurrencyFormatter } from '../utils/currencyUtils';

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

const ProgressCard = ({ title, value, target, color, period, isMonetary }) => {
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [newTarget, setNewTarget] = useState(target);
  const [loading, setLoading] = useState(false);
  const { formatCurrency } = useCurrencyFormatter();

  useEffect(() => {
    setNewTarget(target);
  }, [target]);

  const handleUpdateTarget = async () => {
    try {
      setLoading(true);
      await axios.put(`/api/dashboard/monthly-target/${period}`, {
        target_amount: newTarget
      });
      window.location.reload();
    } catch (error) {
      console.error('Error updating target:', error);
      alert('Failed to update target');
    } finally {
      setLoading(false);
      setIsEditing(false);
    }
  };

  const formatValue = (val) => {
    if (isMonetary) {
      return formatCurrency(val);
    }
    return val;
  };

  const progress = Math.min((value / target) * 100, 100);
  
  return (
    <Paper elevation={0} sx={{ p: 3, height: '100%', position: 'relative' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" color="textSecondary">
          {title}
        </Typography>
        {title === 'Monthly Target' && (
          <IconButton 
            size="small" 
            onClick={() => setIsEditing(true)}
            sx={{ opacity: 0.7 }}
          >
            <Edit fontSize="small" />
          </IconButton>
        )}
      </Box>
      
      {isEditing ? (
        <Box sx={{ mb: 2 }}>
          <TextField
            size="small"
            type="number"
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            sx={{ width: '100%', mb: 1 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="contained" 
              size="small"
              onClick={handleUpdateTarget}
              disabled={loading}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setIsEditing(false);
                setNewTarget(target);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      ) : (
        <>
          <Typography variant="h4" sx={{ mb: 2 }}>
            {formatValue(value)}
            <Typography 
              component="span" 
              variant="body2" 
              color="textSecondary"
              sx={{ ml: 1 }}
            >
              / {formatValue(target)}
            </Typography>
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: `rgba(${color}, 0.1)`,
              '& .MuiLinearProgress-bar': {
                bgcolor: `rgba(${color}, 1)`,
                borderRadius: 4,
              },
            }}
          />
        </>
      )}
    </Paper>
  );
};

const Dashboard = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    summary: {
      totalLands: 0,
      activeEmployees: 0,
      pendingTasks: 0,
    },
    revenueData: [],
    monthlyTarget: {
      achieved: 0,
      target: 30000
    },
    taskCompletion: {
      value: 0,
      target: 100
    }
  });
  const { formatCurrency } = useCurrencyFormatter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Dashboard
        </Typography>
      </Box>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Lands"
            value={dashboardData.summary.totalLands.toString()}
            icon={<Terrain />}
            color="2, 136, 209"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Active Employees"
            value={dashboardData.summary.activeEmployees.toString()}
            icon={<People />}
            color="46, 125, 50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Pending Tasks"
            value={dashboardData.summary.pendingTasks.toString()}
            icon={<Assignment />}
            color="251, 140, 0"
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              height: '400px',
              border: '1px solid',
              borderColor: theme.palette.divider,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Revenue Overview
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart 
                data={dashboardData.revenueData}
                margin={{ left: 20 , top: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis 
                  dataKey="month" 
                  stroke={theme.palette.text.secondary}
                  tick={{ fill: theme.palette.text.secondary }}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                  stroke={theme.palette.text.secondary}
                  tick={{ fill: theme.palette.text.secondary }}
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
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
                value={dashboardData.monthlyTarget.achieved}
                target={dashboardData.monthlyTarget.target}
                color="25, 118, 210"
                period={new Date().toISOString().split('T')[0].substring(0, 7) + '-01'}
                isMonetary={true}
              />
            </Grid>
            <Grid item xs={12}>
              <ProgressCard
                title="Task Completion"
                value={dashboardData.taskCompletion.value}
                target={dashboardData.taskCompletion.target}
                color="46, 125, 50"
                isMonetary={false}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 