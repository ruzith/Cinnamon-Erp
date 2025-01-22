import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
} from '@mui/material';
import { createLand, updateLand } from '../../features/lands/landSlice';
import axios from 'axios';
import { useSnackbar } from 'notistack';

const LandForm = ({ land, onClose }) => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: land?.name || '',
    land_number: land?.land_number || '',
    size: land?.size || '',
    category_id: land?.category_id || '',
    ownership_status: land?.ownership_status || 'owned',
    location: land?.location || '',
    acquisition_date: land?.acquisition_date?.split('T')[0] || '',
    status: land?.status || 'active',
    description: land?.description || '',
    rent_details: land?.rent_details || {
      monthly_rent: '',
      lease_start_date: '',
      lease_end_date: '',
      lessor_name: '',
      lessor_contact: ''
    }
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/land-categories/active');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRentDetailsChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      rent_details: {
        ...prev.rent_details,
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const landData = {
      ...formData,
      rent_details: formData.ownership_status === 'rent' ? formData.rent_details : null
    };

    try {
      if (land) {
        await dispatch(updateLand({ id: land.id, landData })).unwrap();
        enqueueSnackbar('Land updated successfully', { variant: 'success' });
      } else {
        await dispatch(createLand(landData)).unwrap();
        enqueueSnackbar('Land created successfully', { variant: 'success' });
      }
      onClose();
    } catch (error) {
      console.error('Error saving land:', error);
      enqueueSnackbar('Error saving land', { variant: 'error' });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Land Number"
            name="land_number"
            value={formData.land_number}
            onChange={handleChange}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Size"
            name="size"
            type="number"
            value={formData.size}
            onChange={handleChange}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Category</InputLabel>
            <Select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              label="Category"
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Ownership Status</InputLabel>
            <Select
              name="ownership_status"
              value={formData.ownership_status}
              onChange={handleChange}
              label="Ownership Status"
            >
              <MenuItem value="owned">Owned</MenuItem>
              <MenuItem value="rent">Rent</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Acquisition Date"
            name="acquisition_date"
            type="date"
            value={formData.acquisition_date}
            onChange={handleChange}
            required
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={formData.status}
              onChange={handleChange}
              label="Status"
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="under_maintenance">Under Maintenance</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={3}
          />
        </Grid>

        {formData.ownership_status === 'rent' && (
          <>
            <Grid item xs={12}>
              <Box sx={{ my: 2 }}>
                <strong>Rent Details</strong>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Monthly Rent"
                name="monthly_rent"
                type="number"
                value={formData.rent_details.monthly_rent}
                onChange={handleRentDetailsChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Lease Start Date"
                name="lease_start_date"
                type="date"
                value={formData.rent_details.lease_start_date}
                onChange={handleRentDetailsChange}
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Lease End Date"
                name="lease_end_date"
                type="date"
                value={formData.rent_details.lease_end_date}
                onChange={handleRentDetailsChange}
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Lessor Name"
                name="lessor_name"
                value={formData.rent_details.lessor_name}
                onChange={handleRentDetailsChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Lessor Contact"
                name="lessor_contact"
                value={formData.rent_details.lessor_contact}
                onChange={handleRentDetailsChange}
                required
              />
            </Grid>
          </>
        )}
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained">
          {land ? 'Update' : 'Create'}
        </Button>
      </Box>
    </form>
  );
};

export default LandForm;