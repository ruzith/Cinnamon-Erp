import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Card,
  CardContent,
  Chip,
  IconButton,
  Divider,
  LinearProgress,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Terrain,
  Forest,
  Agriculture,
  LocationOn,
  Home,
  Assignment,
} from '@mui/icons-material';
import { getLands, deleteLand } from '../features/lands/landSlice';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import LandForm from '../components/lands/LandForm';

const LandManagement = () => {
  const dispatch = useDispatch();
  const { lands, isLoading } = useSelector((state) => state.lands);
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

  const handleEdit = (land) => {
    setSelectedLand(land);
    setOpenDialog(true);
  };

  const handleDelete = async (landId) => {
    if (window.confirm('Are you sure you want to delete this land?')) {
      try {
        await dispatch(deleteLand(landId)).unwrap();
      } catch (error) {
        console.error('Error deleting land:', error);
      }
    }
  };

  // Calculate summary statistics
  const summaryStats = {
    totalLands: lands.length,
    ownedLands: lands.filter(land => land.ownership_status === 'owned').length,
    rentedLands: lands.filter(land => land.ownership_status === 'rent').length,
    totalArea: lands.reduce((sum, land) => sum + Number(land.size), 0),
    categoryCounts: lands.reduce((acc, land) => {
      acc[land.category] = (acc[land.category] || 0) + 1;
      return acc;
    }, {})
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      default:
        return 'warning';
    }
  };

  if (isLoading) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Land Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          New Land
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Terrain sx={{ color: 'primary.main', mr: 1 }} />
              <Typography color="textSecondary">Total Lands</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.totalLands}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Home sx={{ color: 'success.main', mr: 1 }} />
              <Typography color="textSecondary">Owned Lands</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.ownedLands}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Assignment sx={{ color: 'warning.main', mr: 1 }} />
              <Typography color="textSecondary">Rented Lands</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.rentedLands}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LocationOn sx={{ color: 'info.main', mr: 1 }} />
              <Typography color="textSecondary">Total Area</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.totalArea.toFixed(2)} ha</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Lands Table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Parcel Number</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Ownership</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lands.map((land) => (
              <TableRow key={land.id} hover>
                <TableCell>{land.name}</TableCell>
                <TableCell>{land.parcel_number}</TableCell>
                <TableCell>{land.size} ha</TableCell>
                <TableCell>
                  <Chip
                    label={land.category}
                    color={
                      land.category === 'agricultural' ? 'success' :
                      land.category === 'residential' ? 'primary' :
                      land.category === 'commercial' ? 'warning' :
                      land.category === 'forest' ? 'success' : 'default'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={land.ownership_status}
                    color={land.ownership_status === 'owned' ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{land.location}</TableCell>
                <TableCell>
                  <Chip
                    label={land.status}
                    color={getStatusColor(land.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton 
                    size="small" 
                    onClick={() => handleEdit(land)}
                    sx={{ color: 'primary.main' }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => handleDelete(land.id)}
                    sx={{ color: 'error.main', ml: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Land Form Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{selectedLand ? 'Edit Land' : 'New Land'}</DialogTitle>
        <DialogContent>
          <LandForm 
            land={selectedLand} 
            onClose={() => setOpenDialog(false)} 
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default LandManagement; 