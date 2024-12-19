import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createLand, updateLand } from '../../features/lands/landSlice';
import Form from '../common/Form';

const LandForm = ({ land, onClose }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    parcel_number: land?.parcel_number || '',
    location: land?.location || '',
    area: land?.area || '',
    area_unit: land?.area_unit || 'hectares',
    status: land?.status || 'active',
    forest_type: land?.forest_type || '',
    soil_type: land?.soil_type || '',
    acquisition_date: land?.acquisition_date?.split('T')[0] || new Date().toISOString().split('T')[0],
    notes: land?.notes || ''
  });

  const fields = [
    {
      name: 'parcel_number',
      label: 'Parcel Number',
      required: true
    },
    {
      name: 'location',
      label: 'Location',
      required: true
    },
    {
      name: 'area',
      label: 'Area',
      type: 'number',
      required: true,
      width: 6
    },
    {
      name: 'area_unit',
      label: 'Unit',
      type: 'select',
      required: true,
      width: 6,
      options: [
        { value: 'hectares', label: 'Hectares' },
        { value: 'acres', label: 'Acres' },
        { value: 'square_meters', label: 'Square Meters' }
      ]
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'under_maintenance', label: 'Under Maintenance' }
      ]
    },
    {
      name: 'forest_type',
      label: 'Forest Type',
      required: true
    },
    {
      name: 'soil_type',
      label: 'Soil Type'
    },
    {
      name: 'acquisition_date',
      label: 'Acquisition Date',
      type: 'date',
      required: true
    },
    {
      name: 'notes',
      label: 'Notes',
      multiline: true,
      rows: 4
    }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const requiredFields = ['parcel_number', 'location', 'area', 'area_unit', 'status', 'forest_type', 'acquisition_date'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return;
    }

    if (land) {
      dispatch(updateLand({ id: land.id, landData: formData }));
    } else {
      dispatch(createLand(formData));
    }
    onClose();
  };

  return (
    <Form
      fields={fields}
      values={formData}
      onChange={handleChange}
      onSubmit={handleSubmit}
      submitLabel={land ? 'Update Land' : 'Add Land'}
    />
  );
};

export default LandForm; 