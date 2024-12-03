import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import {
  People,
  Terrain,
  Assignment,
  AccountBalance
} from '@mui/icons-material';

const DashboardCard = ({ title, value, icon, color }) => (
  <Paper sx={{ p: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
      {icon}
      <Typography variant="h6" sx={{ ml: 1 }}>
        {title}
      </Typography>
    </Box>
    <Typography variant="h4">{value}</Typography>
  </Paper>
);

const Dashboard = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Total Lands"
            value="12"
            icon={<Terrain color="primary" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Employees"
            value="45"
            icon={<People color="success" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Active Tasks"
            value="8"
            icon={<Assignment color="warning" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Revenue"
            value="$24,500"
            icon={<AccountBalance color="info" />}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 