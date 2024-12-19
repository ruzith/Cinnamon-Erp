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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
                />
              </Grid>
              
              {/* Items Table */}
              <Grid item xs={12}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Grade</TableCell>
                      <TableCell>Total Weight</TableCell>
                      <TableCell>Deduct 1</TableCell>
                      <TableCell>Deduct 2</TableCell>
                      <TableCell>Net Weight</TableCell>
                      <TableCell>Rate</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Actions</TableCell>
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
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.deductWeight1}
                            onChange={(e) => handleItemChange(index, 'deductWeight1', Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.deductWeight2}
                            onChange={(e) => handleItemChange(index, 'deductWeight2', Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>{item.netWeight}</TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>{item.amount}</TableCell>
                        <TableCell>
                          <IconButton onClick={() => {
                            const newItems = formData.items.filter((_, i) => i !== index);
                            setFormData(prev => ({ ...prev, items: newItems }));
                          }}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button startIcon={<AddIcon />} onClick={handleAddItem}>
                  Add Item
                </Button>
              </Grid>

              {/* Totals */}
              <Grid item xs={12}>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>Total Amount</TableCell>
                      <TableCell>{calculateTotals().totalAmount}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Cutting Charges</TableCell>
                      <TableCell>{calculateTotals().cuttingCharges}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Final Amount</TableCell>
                      <TableCell>{calculateTotals().finalAmount}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
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
                />
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Create Invoice
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PurchaseInvoiceForm; 