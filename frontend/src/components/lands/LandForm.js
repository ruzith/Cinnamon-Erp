import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { createLand, updateLand } from '../../features/lands/landSlice';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Button
} from '@mui/material';

const LandForm = ({ land, onClose }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: land?.name || '',
    parcel_number: land?.parcel_number || '',
    size: land?.size || '',
    category: land?.category || '',
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const landData = {
      ...formData,
      rent_details: formData.ownership_status === 'rent' ? formData.rent_details : null
    };

    if (land) {
      dispatch(updateLand({ id: land.id, landData }));
    } else {
      dispatch(createLand(landData));
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Land Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Parcel Number"
            name="parcel_number"
            value={formData.parcel_number}
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
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              <MenuItem value="agricultural">Agricultural</MenuItem>
              <MenuItem value="residential">Residential</MenuItem>
              <MenuItem value="commercial">Commercial</MenuItem>
              <MenuItem value="forest">Forest</MenuItem>
              <MenuItem value="other">Other</MenuItem>
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
            >
              <MenuItem value="owned">Owned</MenuItem>
              <MenuItem value="rent">Rent</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {formData.ownership_status === 'rent' && (
          <>
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
                InputLabelProps={{ shrink: true }}
                value={formData.rent_details.lease_start_date}
                onChange={handleRentDetailsChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Lease End Date"
                name="lease_end_date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.rent_details.lease_end_date}
                onChange={handleRentDetailsChange}
                required
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

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            multiline
            rows={3}
            value={formData.description}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Acquisition Date"
            name="acquisition_date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formData.acquisition_date}
            onChange={handleChange}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <Button type="submit" variant="contained" color="primary">
            {land ? 'Update Land' : 'Add Land'}
          </Button>
          <Button onClick={onClose} variant="outlined" sx={{ ml: 1 }}>
            Cancel
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};

export default LandForm; 