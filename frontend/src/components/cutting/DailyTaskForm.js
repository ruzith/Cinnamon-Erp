import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import axios from 'axios';

const DailyTaskForm = ({ open, onClose, assignment, onTaskAdded }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    progress: '',
    area_covered: '',
    workers_count: '',
    weather_conditions: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/cutting/tasks', {
        ...formData,
        assignment: assignment.id
      });
      onTaskAdded(response.data);
      onClose();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Daily Progress</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Progress (%)"
              type="number"
              name="progress"
              value={formData.progress}
              onChange={handleInputChange}
              required
              inputProps={{ min: 0, max: 100 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Area Covered (ha)"
              type="number"
              name="area_covered"
              value={formData.area_covered}
              onChange={handleInputChange}
              required
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Workers Count"
              type="number"
              name="workers_count"
              value={formData.workers_count}
              onChange={handleInputChange}
              required
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Weather Conditions</InputLabel>
              <Select
                name="weather_conditions"
                value={formData.weather_conditions}
                label="Weather Conditions"
                onChange={handleInputChange}
                required
              >
                <MenuItem value="sunny">Sunny</MenuItem>
                <MenuItem value="cloudy">Cloudy</MenuItem>
                <MenuItem value="rainy">Rainy</MenuItem>
                <MenuItem value="stormy">Stormy</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Save Progress
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DailyTaskForm; 