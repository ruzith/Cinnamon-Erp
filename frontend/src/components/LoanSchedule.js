import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import { formatCurrency } from '../utils/formatCurrency';

const LoanSchedule = ({ schedule }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'partial':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Paper sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Period</TableCell>
            <TableCell>Due Date</TableCell>
            <TableCell align="right">Payment Amount</TableCell>
            <TableCell align="right">Principal</TableCell>
            <TableCell align="right">Interest</TableCell>
            <TableCell align="right">Paid Amount</TableCell>
            <TableCell align="right">Balance</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {schedule.map((item) => (
            <TableRow key={item.period_number}>
              <TableCell>{item.period_number}</TableCell>
              <TableCell>{new Date(item.due_date).toLocaleDateString()}</TableCell>
              <TableCell align="right">
                {formatCurrency(Number(item.payment_amount))}
              </TableCell>
              <TableCell align="right">
                {formatCurrency(Number(item.principal_amount))}
              </TableCell>
              <TableCell align="right">
                {formatCurrency(Number(item.interest_amount))}
              </TableCell>
              <TableCell align="right">
                {formatCurrency(Number(item.paid_amount))}
              </TableCell>
              <TableCell align="right">
                {formatCurrency(Number(item.balance))}
              </TableCell>
              <TableCell>
                <Chip
                  label={item.status}
                  color={getStatusColor(item.status)}
                  size="small"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default LoanSchedule; 