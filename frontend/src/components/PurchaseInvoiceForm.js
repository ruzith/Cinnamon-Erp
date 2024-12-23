import React, { useState, useEffect } from 'react';
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
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  LinearProgress,
  TableContainer,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { createInvoice, updateInvoice, getGrades } from '../features/purchases/purchaseSlice';

const PurchaseInvoiceForm = ({ open, onClose, selectedContractor }) => {
  const dispatch = useDispatch();
  const { grades, isLoading } = useSelector(state => state.purchase || { grades: [] });
  const [formData, setFormData] = useState({
    contractor: '',
    items: [],
    cuttingRate: 250,
    status: 'draft',
    notes: ''
  });

  useEffect(() => {
    dispatch(getGrades());
  }, [dispatch]);

  useEffect(() => {
    if (selectedContractor) {
      setFormData(prev => ({
        ...prev,
        contractor: selectedContractor._id
      }));
    }
  }, [selectedContractor]);

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        grade: '',
        totalWeight: 0,
        deductWeight1: 0,
        deductWeight2: 0,
        netWeight: 0,
        rate: 0,
        amount: 0
      }]
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    // Calculate net weight and amount
    const item = newItems[index];
    item.netWeight = item.totalWeight - item.deductWeight1 - item.deductWeight2;
    item.amount = item.netWeight * item.rate;

    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
  };

  const calculateTotals = () => {
    const totalNetWeight = formData.items.reduce((sum, item) => sum + item.netWeight, 0);
    const totalAmount = formData.items.reduce((sum, item) => sum + item.amount, 0);
    const cuttingCharges = totalNetWeight * formData.cuttingRate;
    const finalAmount = totalAmount - cuttingCharges;

    return { totalNetWeight, totalAmount, cuttingCharges, finalAmount };
  };

  const handleSubmit = async () => {
    const totals = calculateTotals();
    const submitData = {
      ...formData,
      ...totals
    };

    try {
      await dispatch(createInvoice(submitData)).unwrap();
      onClose();
    } catch (error) {
      console.error('Failed to create invoice:', error);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          backgroundImage: 'none' // Prevent gradient interference
        }
      }}
    >
      <DialogTitle>Create Purchase Invoice</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {isLoading ? (
            <Grid item xs={12}>
              <LinearProgress />
            </Grid>
          ) : (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cutting Rate"
                  type="number"
                  value={formData.cuttingRate}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    cuttingRate: Number(e.target.value)
                  }))}
                  sx={{
                    '& .MuiInputBase-input': {
                      color: 'text.primary'
                    },
                    '& .MuiInputLabel-root': {
                      color: 'text.secondary'
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'divider'
                    }
                  }}
                />
              </Grid>
              
              {/* Items Table */}
              <Grid item xs={12}>
                <TableContainer 
                  sx={{ 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 2
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: 'text.primary' }}>Grade</TableCell>
                        <TableCell sx={{ color: 'text.primary' }}>Total Weight</TableCell>
                        <TableCell sx={{ color: 'text.primary' }}>Deduct 1</TableCell>
                        <TableCell sx={{ color: 'text.primary' }}>Deduct 2</TableCell>
                        <TableCell sx={{ color: 'text.primary' }}>Net Weight</TableCell>
                        <TableCell sx={{ color: 'text.primary' }}>Rate</TableCell>
                        <TableCell sx={{ color: 'text.primary' }}>Amount</TableCell>
                        <TableCell sx={{ color: 'text.primary' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <FormControl fullWidth>
                              <Select
                                value={item.grade}
                                onChange={(e) => handleItemChange(index, 'grade', e.target.value)}
                                sx={{
                                  color: 'text.primary',
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'divider'
                                  }
                                }}
                              >
                                {grades.map(grade => (
                                  <MenuItem key={grade._id} value={grade._id}>
                                    {grade.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={item.totalWeight}
                              onChange={(e) => handleItemChange(index, 'totalWeight', Number(e.target.value))}
                              sx={{
                                '& .MuiInputBase-input': {
                                  color: 'text.primary'
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'divider'
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={item.deductWeight1}
                              onChange={(e) => handleItemChange(index, 'deductWeight1', Number(e.target.value))}
                              sx={{
                                '& .MuiInputBase-input': {
                                  color: 'text.primary'
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'divider'
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={item.deductWeight2}
                              onChange={(e) => handleItemChange(index, 'deductWeight2', Number(e.target.value))}
                              sx={{
                                '& .MuiInputBase-input': {
                                  color: 'text.primary'
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'divider'
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: 'text.primary' }}>{item.netWeight}</TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={item.rate}
                              onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                              sx={{
                                '& .MuiInputBase-input': {
                                  color: 'text.primary'
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'divider'
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: 'text.primary' }}>{item.amount}</TableCell>
                          <TableCell>
                            <IconButton 
                              onClick={() => {
                                const newItems = formData.items.filter((_, i) => i !== index);
                                setFormData(prev => ({ ...prev, items: newItems }));
                              }}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Button 
                  startIcon={<AddIcon />} 
                  onClick={handleAddItem}
                  sx={{
                    color: 'primary.main',
                    borderColor: 'primary.main',
                    '&:hover': {
                      borderColor: 'primary.dark',
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  Add Item
                </Button>
              </Grid>

              {/* Totals */}
              <Grid item xs={12}>
                <TableContainer 
                  sx={{ 
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}
                >
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ color: 'text.secondary' }}>Total Amount</TableCell>
                        <TableCell sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                          {calculateTotals().totalAmount}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: 'text.secondary' }}>Cutting Charges</TableCell>
                        <TableCell sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                          {calculateTotals().cuttingCharges}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: 'text.secondary' }}>Final Amount</TableCell>
                        <TableCell sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                          {calculateTotals().finalAmount}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  sx={{
                    '& .MuiInputBase-input': {
                      color: 'text.primary'
                    },
                    '& .MuiInputLabel-root': {
                      color: 'text.secondary'
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'divider'
                    }
                  }}
                />
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': {
              bgcolor: 'primary.dark'
            }
          }}
        >
          Create Invoice
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PurchaseInvoiceForm; 