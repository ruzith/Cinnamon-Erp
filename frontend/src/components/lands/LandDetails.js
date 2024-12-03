import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip
} from '@mui/material';

const LandDetails = ({ land }) => {
  return (
    <Paper sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6">{land.name}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="textSecondary">Size</Typography>
          <Typography>{`${land.size} ${land.unit}`}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="textSecondary">Category</Typography>
          <Chip 
            label={land.category}
            color={
              land.category === 'agricultural' ? 'success' :
              land.category === 'residential' ? 'primary' :
              land.category === 'commercial' ? 'warning' : 'default'
            }
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="textSecondary">Ownership</Typography>
          <Chip 
            label={land.ownership}
            color={land.ownership === 'owned' ? 'success' : 'warning'}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="textSecondary">Location</Typography>
          <Typography>{land.location}</Typography>
        </Grid>
        {land.description && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary">Description</Typography>
            <Typography>{land.description}</Typography>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default LandDetails; 