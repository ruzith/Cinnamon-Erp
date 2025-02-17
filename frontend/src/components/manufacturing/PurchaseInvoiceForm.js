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
  Checkbox,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { createInvoice } from '../../features/purchases/purchaseSlice';
import axios from 'axios';
import { useCurrencyFormatter } from '../../utils/currencyUtils';
import { useTheme } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';

const PurchaseInvoiceForm = ({ open, onClose, selectedContractor, onSuccess, cuttingContractors, manufacturingContractors }) => {
  const dispatch = useDispatch();
  const { formatCurrency } = useCurrencyFormatter();
  const { enqueueSnackbar } = useSnackbar();
  const [finishedGoods, setFinishedGoods] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [advancePayments, setAdvancePayments] = useState({
    payments: [],
    totalUnusedAdvance: 0
  });
  const [selectedAdvances, setSelectedAdvances] = useState(new Set());
  const initialFormState = {
    manufacturing_contractor: '',
    cutting_contractor: '',
    items: [],
    cuttingRate: 250,
    status: 'draft',
    notes: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const goodsRes = await axios.get('/api/inventory/finished-goods');
        setFinishedGoods(goodsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        enqueueSnackbar('Error fetching inventory data', { variant: 'error' });
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchManufacturingAdvancePayments = async () => {
      if (formData.manufacturing_contractor) {
        try {
          const response = await axios.get(`/api/manufacturing/contractors/${formData.manufacturing_contractor}/advance-payments`, {
            params: {
              status: 'paid'
            }
          });
          setAdvancePayments(response.data);
          setSelectedAdvances(new Set(response.data.payments
            .filter(p => p.status === 'paid')
            .map(p => p.id)));
        } catch (error) {
          console.error('Error fetching advance payments:', error);
          enqueueSnackbar('Error fetching advance payments', { variant: 'error' });
        }
      }
    };

    fetchManufacturingAdvancePayments();
  }, [formData.manufacturing_contractor]);

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

  const calculateTotalSelectedAdvances = () => {
    return advancePayments.payments
      .filter(payment => selectedAdvances.has(payment.id))
      .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  };

  const calculateTotals = () => {
    const totalNetWeight = formData.items.reduce((sum, item) => sum + parseFloat(item.net_weight || 0), 0);
    const totalAmount = formData.items.reduce((sum, item) => sum + parseFloat(item.net_total || 0), 0);
    const cuttingCharges = totalNetWeight * parseFloat(formData.cuttingRate || 0);
    const amountAfterCutting = totalAmount - cuttingCharges;
    const totalSelectedAdvances = calculateTotalSelectedAdvances();
    const finalAmount = amountAfterCutting - totalSelectedAdvances;

    return {
      totalNetWeight: totalNetWeight.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      cuttingCharges: cuttingCharges.toFixed(2),
      amountAfterCutting: amountAfterCutting.toFixed(2),
      finalAmount: finalAmount.toFixed(2)
    };
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.manufacturing_contractor) {
        enqueueSnackbar('Please select a manufacturing contractor', { variant: 'error' });
        return;
      }

      if (!formData.cutting_contractor) {
        enqueueSnackbar('Please select a cutting contractor', { variant: 'error' });
        return;
      }

      if (formData.items.length === 0) {
        enqueueSnackbar('Please add at least one item', { variant: 'error' });
        return;
      }

      // Validate each item
      const invalidItems = formData.items.filter(item => !item.grade || !item.total_weight || !item.rate);
      if (invalidItems.length > 0) {
        enqueueSnackbar('Please fill in all required fields for each item', { variant: 'error' });
        return;
      }

      const totals = calculateTotals();

      const invoiceData = {
        contractor_id: formData.manufacturing_contractor,
        cutting_contractor_id: formData.cutting_contractor,
        items: formData.items.map(item => ({
          grade: item.grade,
          total_weight: Number(item.total_weight),
          deduct_weight1: Number(item.deduct_weight1 || 0),
          deduct_weight2: Number(item.deduct_weight2 || 0),
          net_weight: Number(item.net_weight),
          rate: Number(item.rate),
          amount: Number(item.amount)
        })),
        cutting_rate: Number(formData.cuttingRate),
        status: formData.status || 'draft',
        notes: formData.notes || '',
        total_net_weight: Number(totals.totalNetWeight),
        subtotal: Number(totals.totalAmount),
        cutting_charges: Number(totals.cuttingCharges),
        final_amount: Number(totals.finalAmount),
        advance_payment_ids: Array.from(selectedAdvances).filter(id => id)
      };

      const response = await axios.post('/api/manufacturing/purchase-invoices', invoiceData);

      if (response.data) {
        enqueueSnackbar('Purchase invoice created successfully', { variant: 'success' });
        onSuccess && onSuccess();
        setFormData(initialFormState);
        setSelectedAdvances(new Set());
        onClose();
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      enqueueSnackbar(error.response?.data?.message || 'Error creating invoice', { variant: 'error' });
    }
  };

  const handleClose = () => {
    setFormData(initialFormState);
    setSelectedAdvances(new Set());
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel required>Select Manufacturing Contractor</InputLabel>
                      <Select
                        value={formData.manufacturing_contractor}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            manufacturing_contractor: e.target.value
                          }));
                        }}
                        label="Select Manufacturing Contractor"
                        required
                      >
                        {manufacturingContractors.map(contractor => (
                          <MenuItem key={contractor.id} value={contractor.id}>
                            {contractor.name} ({contractor.contractor_id})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={8}>
                    <FormControl fullWidth size="small">
                      <InputLabel required>Select Cutting Contractor</InputLabel>
                      <Select
                        value={formData.cutting_contractor}
                        onChange={(e) => {
                          const contractor = cuttingContractors.find(c => c.id === e.target.value);
                          setFormData(prev => ({
                            ...prev,
                            cutting_contractor: e.target.value,
                            cuttingRate: contractor?.latest_manufacturing_contribution || 250.00
                          }));
                        }}
                        label="Select Cutting Contractor"
                        required
                      >
                        {cuttingContractors.map(contractor => (
                          <MenuItem key={contractor.id} value={contractor.id}>
                            {contractor.name} ({contractor.contractor_id})
                            {contractor.latest_manufacturing_contribution ?
                              ` - ${formatCurrency(contractor.latest_manufacturing_contribution)}/kg` :
                              ' - No rate set'
                            }
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
                        <TableCell sx={{ width: '20%', bgcolor: theme.palette.action.hover }}>Grade</TableCell>
                        <TableCell sx={{ width: '10%', bgcolor: theme.palette.action.hover }}>Total (kg)</TableCell>
                        <TableCell sx={{ width: '10%', bgcolor: theme.palette.action.hover }}>Deduct 1 (kg)</TableCell>
                        <TableCell sx={{ width: '10%', bgcolor: theme.palette.action.hover }}>Deduct 2 (kg)</TableCell>
                        <TableCell sx={{ width: '10%', bgcolor: theme.palette.action.hover }}>Net (kg)</TableCell>
                        <TableCell sx={{ width: '12%', bgcolor: theme.palette.action.hover }}>Rate ({formatCurrency(0).split(' ')[0]})</TableCell>
                        <TableCell sx={{ width: '10%', bgcolor: theme.palette.action.hover }}>Amount ({formatCurrency(0).split(' ')[0]})</TableCell>
                        <TableCell sx={{ width: '8%', bgcolor: theme.palette.action.hover }}>Cal</TableCell>
                        <TableCell sx={{ width: '10%', bgcolor: theme.palette.action.hover }}>Net ({formatCurrency(0).split(' ')[0]})</TableCell>
                        <TableCell padding="none" sx={{ bgcolor: theme.palette.action.hover }} />
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
                        <TableCell colSpan={4} align="right" sx={{ bgcolor: theme.palette.action.hover }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>Totals:</Typography>
                        </TableCell>
                        <TableCell sx={{ bgcolor: theme.palette.action.hover }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(calculateTotals().totalNetWeight)} kg</Typography>
                        </TableCell>
                        <TableCell sx={{ bgcolor: theme.palette.action.hover }} />
                        <TableCell sx={{ bgcolor: theme.palette.action.hover }} />
                        <TableCell sx={{ bgcolor: theme.palette.action.hover }} />
                        <TableCell sx={{ bgcolor: theme.palette.action.hover }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(calculateTotals().totalAmount)}</Typography>
                        </TableCell>
                        <TableCell padding="none" sx={{ bgcolor: theme.palette.action.hover }} />
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
                        bgcolor: theme.palette.action.hover,
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
                          Advance ({selectedAdvances.size} selected):
                        </Typography>
                        <Typography variant="body2" color="error.main">
                          - {formatCurrency(calculateTotalSelectedAdvances())}
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
                              <TableCell sx={{ width: '48px', bgcolor: theme.palette.action.hover }}></TableCell>
                              <TableCell sx={{ bgcolor: theme.palette.action.hover }}>Date</TableCell>
                              <TableCell sx={{ bgcolor: theme.palette.action.hover }}>Amount ({formatCurrency(0).split(' ')[0]})</TableCell>
                              <TableCell sx={{ bgcolor: theme.palette.action.hover }}>Reference</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {advancePayments.payments.map((payment) => (
                              <TableRow key={payment.id} hover>
                                <TableCell padding="checkbox">
                                  <Checkbox
                                    checked={selectedAdvances.has(payment.id)}
                                    onChange={(e) => {
                                      const newSelected = new Set(selectedAdvances);
                                      if (e.target.checked) {
                                        newSelected.add(payment.id);
                                      } else {
                                        newSelected.delete(payment.id);
                                      }
                                      setSelectedAdvances(newSelected);
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  {new Date(payment.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>{formatCurrency(parseFloat(payment.amount))}</TableCell>
                                <TableCell>{payment.receipt_number}</TableCell>
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
          onClick={handleClose}
          color="inherit"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.manufacturing_contractor || formData.items.length === 0}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

PurchaseInvoiceForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedContractor: PropTypes.object,
  onSuccess: PropTypes.func,
  cuttingContractors: PropTypes.array.isRequired,
  manufacturingContractors: PropTypes.array.isRequired
};

export default PurchaseInvoiceForm;