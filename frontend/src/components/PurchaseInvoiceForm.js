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
  IconButton,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Divider,
  Box,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { createInvoice } from '../features/purchases/purchaseSlice';
import axios from 'axios';
import { useCurrencyFormatter } from '../utils/currencyUtils';

const PurchaseInvoiceForm = ({ open, onClose, selectedContractor }) => {
  const dispatch = useDispatch();
  const { formatCurrency } = useCurrencyFormatter();
  const [finishedGoods, setFinishedGoods] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contractors, setContractors] = useState([]);
  const [advancePayments, setAdvancePayments] = useState({ payments: [], totalUnusedAdvance: 0 });
  const [formData, setFormData] = useState({
    contractor: '',
    items: [],
    cuttingRate: 250,
    status: 'draft',
    notes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [goodsRes, contractorsRes] = await Promise.all([
          axios.get('/api/inventory/finished-goods'),
          axios.get('/api/manufacturing/contractors')
        ]);
        setFinishedGoods(goodsRes.data);
        setContractors(contractorsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchAdvancePayments = async () => {
      if (formData.contractor) {
        try {
          const response = await axios.get(`/api/manufacturing/contractors/${formData.contractor}/advance-payments?status=unused`);
          setAdvancePayments(response.data);
        } catch (error) {
          console.error('Error fetching advance payments:', error);
        }
      }
    };

    fetchAdvancePayments();
  }, [formData.contractor]);

  useEffect(() => {
    if (selectedContractor) {
      setFormData(prev => ({
        ...prev,
        contractor: selectedContractor.id,
        cuttingRate: selectedContractor.cutting_rate
      }));
    }
  }, [selectedContractor]);

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        grade: '',
        total_weight: 0,
        deduct_weight1: 0,
        deduct_weight2: 0,
        net_weight: 0,
        rate: 0,
        amount: 0,
        default_cal: 3,
        net_total: 0
      }]
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    if (field === 'grade') {
      const selectedGood = finishedGoods.find(g => g.id === value);
      if (selectedGood?.purchase_price) {
        newItems[index].rate = selectedGood.purchase_price;
      }
    }

    const item = newItems[index];
    item.net_weight = parseFloat(item.total_weight || 0) - parseFloat(item.deduct_weight1 || 0) - parseFloat(item.deduct_weight2 || 0);
    item.amount = item.net_weight * parseFloat(item.rate || 0);
    item.net_total = item.amount / 3;

    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const calculateTotals = () => {
    const totalNetWeight = formData.items.reduce((sum, item) => sum + parseFloat(item.net_weight || 0), 0);
    const totalAmount = formData.items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const cuttingCharges = totalNetWeight * parseFloat(formData.cuttingRate || 0);
    const amountAfterCutting = totalAmount - cuttingCharges;
    const finalAmount = amountAfterCutting - advancePayments.totalUnusedAdvance;

    return {
      totalNetWeight: totalNetWeight.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      cuttingCharges: cuttingCharges.toFixed(2),
      amountAfterCutting: amountAfterCutting.toFixed(2),
      finalAmount: finalAmount.toFixed(2)
    };
  };

  const handleSubmit = async () => {
    if (!formData.contractor) {
      alert('Please select a contractor');
      return;
    }

    try {
      await dispatch(createInvoice({
        ...formData,
        ...calculateTotals(),
        advancePayment: advancePayments.totalUnusedAdvance
      })).unwrap();
      onClose();
    } catch (error) {
      console.error('Failed to create invoice:', error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '80vh',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ py: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          New Purchase Invoice
        </Typography>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 2 }}>
        {isLoading ? (
          <Box sx={{ width: '100%', mt: 1 }}>
            <LinearProgress />
          </Box>
        ) : (
          <Grid container spacing={2} sx={{ mt: 0 }}>
            {/* Header Section */}
            <Grid item xs={12}>
              <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={8}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Select Contractor</InputLabel>
                      <Select
                        value={formData.contractor}
                        onChange={(e) => {
                          const contractor = contractors.find(c => c.id === e.target.value);
                          setFormData(prev => ({
                            ...prev,
                            contractor: e.target.value,
                            cuttingRate: contractor?.cutting_rate || 250
                          }));
                        }}
                        label="Select Contractor"
                        required
                      >
                        {contractors.map(contractor => (
                          <MenuItem key={contractor.id} value={contractor.id}>
                            {contractor.name} ({contractor.contractor_id}) - {formatCurrency(contractor.cutting_rate)}/kg
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label={`Cutting Rate (${formatCurrency(0).split(' ')[0]}/kg)`}
                      type="number"
                      value={formData.cuttingRate}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        cuttingRate: Number(e.target.value)
                      }))}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Items Section */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Items
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddItem}
                    size="small"
                  >
                    Add Item
                  </Button>
                </Box>

                <TableContainer sx={{ mb: 0 }}>
                  <Table size="small" sx={{ '& .MuiTableCell-root': { py: 1, px: 1 } }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '20%', bgcolor: 'grey.50' }}>Grade</TableCell>
                        <TableCell sx={{ width: '10%', bgcolor: 'grey.50' }}>Total (kg)</TableCell>
                        <TableCell sx={{ width: '10%', bgcolor: 'grey.50' }}>Deduct 1 (kg)</TableCell>
                        <TableCell sx={{ width: '10%', bgcolor: 'grey.50' }}>Deduct 2 (kg)</TableCell>
                        <TableCell sx={{ width: '10%', bgcolor: 'grey.50' }}>Net (kg)</TableCell>
                        <TableCell sx={{ width: '12%', bgcolor: 'grey.50' }}>Rate ({formatCurrency(0).split(' ')[0]})</TableCell>
                        <TableCell sx={{ width: '10%', bgcolor: 'grey.50' }}>Amount ({formatCurrency(0).split(' ')[0]})</TableCell>
                        <TableCell sx={{ width: '8%', bgcolor: 'grey.50' }}>Cal</TableCell>
                        <TableCell sx={{ width: '10%', bgcolor: 'grey.50' }}>Net ({formatCurrency(0).split(' ')[0]})</TableCell>
                        <TableCell padding="none" sx={{ bgcolor: 'grey.50' }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.items.map((item, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <FormControl fullWidth size="small">
                              <Select
                                value={item.grade}
                                onChange={(e) => handleItemChange(index, 'grade', e.target.value)}
                              >
                                {finishedGoods.map(good => (
                                  <MenuItem key={good.id} value={good.id}>
                                    {good.product_name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              value={item.total_weight}
                              onChange={(e) => handleItemChange(index, 'total_weight', Number(e.target.value))}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              value={item.deduct_weight1}
                              onChange={(e) => handleItemChange(index, 'deduct_weight1', Number(e.target.value))}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              value={item.deduct_weight2}
                              onChange={(e) => handleItemChange(index, 'deduct_weight2', Number(e.target.value))}
                            />
                          </TableCell>
                          <TableCell>{item.net_weight.toFixed(2)}</TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              value={item.rate}
                              onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                            />
                          </TableCell>
                          <TableCell>{formatCurrency(item.amount)}</TableCell>
                          <TableCell>{item.default_cal}</TableCell>
                          <TableCell>{formatCurrency(item.net_total)}</TableCell>
                          <TableCell padding="none">
                            <IconButton
                              size="small"
                              onClick={() => {
                                const newItems = formData.items.filter((_, i) => i !== index);
                                setFormData(prev => ({ ...prev, items: newItems }));
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4} align="right" sx={{ bgcolor: 'grey.50' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>Totals:</Typography>
                        </TableCell>
                        <TableCell sx={{ bgcolor: 'grey.50' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(calculateTotals().totalNetWeight)} kg</Typography>
                        </TableCell>
                        <TableCell sx={{ bgcolor: 'grey.50' }} />
                        <TableCell sx={{ bgcolor: 'grey.50' }} />
                        <TableCell sx={{ bgcolor: 'grey.50' }} />
                        <TableCell sx={{ bgcolor: 'grey.50' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(calculateTotals().totalAmount)}</Typography>
                        </TableCell>
                        <TableCell padding="none" sx={{ bgcolor: 'grey.50' }} />
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Summary and Advance Payments Row */}
              <Grid container spacing={2}>
                {/* Invoice Summary Section */}
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Summary</Typography>
                    <Box>
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        bgcolor: 'grey.50',
                        py: 1.25,
                        px: 1
                      }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Total Amount:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(calculateTotals().totalAmount)}
                        </Typography>
                      </Box>
                      <Divider />
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        py: 1,
                        px: 1
                      }}>
                        <Typography variant="body2">
                          Cutting ({formatCurrency(formData.cuttingRate)}/kg):
                        </Typography>
                        <Typography variant="body2" color="error.main">
                          - {formatCurrency(calculateTotals().cuttingCharges)}
                        </Typography>
                      </Box>
                      <Divider />
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        py: 1,
                        px: 1
                      }}>
                        <Typography variant="body2">
                          Advance ({advancePayments.payments.length}):
                        </Typography>
                        <Typography variant="body2" color="error.main">
                          - {formatCurrency(advancePayments.totalUnusedAdvance)}
                        </Typography>
                      </Box>
                      <Divider />
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        p: 1.5,
                        borderRadius: 1,
                        mt: 2
                      }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Final Amount</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(calculateTotals().finalAmount)}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                {/* Advance Payments Section */}
                {advancePayments.payments.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        Advances
                      </Typography>
                      <TableContainer>
                        <Table size="small" sx={{ '& .MuiTableCell-root': { py: 1, px: 1 } }}>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ bgcolor: 'grey.50' }}>Date</TableCell>
                              <TableCell sx={{ bgcolor: 'grey.50' }}>Amount ({formatCurrency(0).split(' ')[0]})</TableCell>
                              <TableCell sx={{ bgcolor: 'grey.50' }}>Reference</TableCell>
                              <TableCell sx={{ bgcolor: 'grey.50' }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {advancePayments.payments.map((payment, index) => (
                              <TableRow key={index} hover>
                                <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                                <TableCell>{formatCurrency(parseFloat(payment.amount))}</TableCell>
                                <TableCell>{payment.receipt_number}</TableCell>
                                <TableCell>
                                  <Typography variant="body2" color="success.main">
                                    Unused
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          color="inherit"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.contractor || formData.items.length === 0}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PurchaseInvoiceForm;