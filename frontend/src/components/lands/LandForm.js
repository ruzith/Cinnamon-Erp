import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createLand, updateLand } from '../../features/lands/landSlice';
import Form from '../common/Form';

const LandForm = ({ land, onClose }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    parcelNumber: land?.parcelNumber || '',
    location: land?.location || '',
    area: land?.area || '',
    areaUnit: land?.areaUnit || 'hectares',
    status: land?.status || 'active',
    forestType: land?.forestType || '',
    soilType: land?.soilType || '',
    acquisitionDate: land?.acquisitionDate?.split('T')[0] || '',
    notes: land?.notes || ''
  });

  const fields = [
    {
      name: 'parcelNumber',
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
      name: 'areaUnit',
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
      name: 'forestType',
      label: 'Forest Type',
      required: true
    },
    {
      name: 'soilType',
      label: 'Soil Type'
    },
    {
      name: 'acquisitionDate',
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
    
    // Validate required fields
    const requiredFields = ['parcelNumber', 'location', 'area', 'areaUnit', 'status', 'forestType', 'acquisitionDate'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      // You might want to add error handling/display here
      console.error('Missing required fields:', missingFields);
      return;
    }

    if (land) {
      dispatch(updateLand({ id: land._id, landData: formData }));
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