import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  Chip
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { getLands, deleteLand } from '../features/lands/landSlice';
import DataGrid from '../components/common/DataGrid';
import Dialog from '../components/common/Dialog';
import LandForm from '../components/lands/LandForm';

const LandManagement = () => {
  const dispatch = useDispatch();
  const { lands, isLoading, isError, message } = useSelector((state) => state.lands);
  const { user } = useSelector((state) => state.auth);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLand, setSelectedLand] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    dispatch(getLands());
  }, [dispatch, user, navigate]);

  if (isError) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">Error: {message}</Typography>
      </Box>
    );
  }

  const columns = [
    { field: 'parcelNumber', headerName: 'Parcel Number', flex: 1 },
    { field: 'location', headerName: 'Location', flex: 1 },
    { 
      field: 'area', 
      headerName: 'Area', 
      width: 130,
      renderCell: (params) => `${params.value} ${params.row.areaUnit}`
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 150,
      renderCell: (params) => (
        <Chip 
          label={params.value.replace('_', ' ')} 
          color={
            params.value === 'active' ? 'success' :
            params.value === 'inactive' ? 'error' :
            'warning'
          }
          size="small"
        />
      )
    },
    { field: 'forestType', headerName: 'Forest Type', width: 130 },
    { field: 'soilType', headerName: 'Soil Type', width: 130 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Button
            size="small"
            onClick={() => handleEdit(params.row)}
          >
            Edit
          </Button>
          <Button
            size="small"
            color="error"
            onClick={() => handleDelete(params.row._id)}
          >
            Delete
          </Button>
        </Box>
      ),
    },
  ];

  const handleEdit = (land) => {
    setSelectedLand(land);
    setOpenDialog(true);
  };

  const handleDelete = (id) => {
    dispatch(deleteLand(id));
  };

  const handleCloseDialog = () => {
    setSelectedLand(null);
    setOpenDialog(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Land Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add Land
        </Button>
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <DataGrid
          rows={lands}
          columns={columns}
          loading={isLoading}
          getRowId={(row) => row._id}
        />
      </Paper>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        title={selectedLand ? 'Edit Land' : 'Add New Land'}
      >
        <LandForm
          land={selectedLand}
          onClose={handleCloseDialog}
        />
      </Dialog>
    </Box>
  );
};

export default LandManagement; 