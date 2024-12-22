const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Loan = require('../models/domain/Loan');
const LoanPayment = require('../models/domain/LoanPayment');

// Get all loans
router.get('/', protect, async (req, res) => {
  try {
    const [rows] = await Loan.pool.execute(`
      SELECT l.*,
             b.name as borrower_name,
             u.name as created_by_name
      FROM loans l
      LEFT JOIN customers b ON l.borrower_id = b.id
      LEFT JOIN users u ON l.created_by = u.id
      ORDER BY l.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new loan
router.post('/', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const loanData = {
      ...req.body,
      created_by: req.user.id,
      remaining_balance: req.body.amount, // Set initial remaining balance
      status: 'active'
    };
    
    const loan = await Loan.createWithSchedule(loanData);
    res.status(201).json(loan);
  } catch (error) {
    console.error('Error creating loan:', error);
    res.status(400).json({ 
      message: error.message || 'Error creating loan',
      error: error.toString()
    });
  }
});

// Record loan payment
router.post('/:id/payments', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const [loan] = await Loan.pool.execute(
      'SELECT * FROM loans WHERE id = ?',
      [req.params.id]
    );

    if (!loan[0]) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const { amount } = req.body;
    const paymentData = {
      loan_id: loan[0].id,
      amount,
      payment_date: new Date(),
      created_by: req.user.id,
      ...req.body
    };

    // Begin transaction
    await Loan.pool.beginTransaction();
    try {
      // Create payment record
      const [result] = await Loan.pool.execute(
        'INSERT INTO loan_payments SET ?',
        [paymentData]
      );

      // Update loan remaining balance
      await Loan.pool.execute(
        'UPDATE loans SET remaining_balance = remaining_balance - ?, status = IF(remaining_balance - ? <= 0, "completed", status) WHERE id = ?',
        [amount, amount, loan[0].id]
      );

      await Loan.pool.commit();

      const payment = await LoanPayment.getWithDetails(result.insertId);
      res.status(201).json(payment);
    } catch (error) {
      await Loan.pool.rollback();
      throw error;
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all loan payments
router.get('/payments', protect, async (req, res) => {
  try {
    const [rows] = await LoanPayment.pool.execute(`
      SELECT lp.*,
             l.loan_number,
             c.name as borrower_name,
             u.name as created_by_name,
             ls.period_number,
             ls.payment_amount as scheduled_amount
      FROM loan_payments lp
      JOIN loans l ON lp.loan_id = l.id
      JOIN customers c ON l.borrower_id = c.id
      LEFT JOIN users u ON lp.created_by = u.id
      LEFT JOIN loan_schedule ls ON lp.schedule_item_id = ls.id
      ORDER BY lp.payment_date DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get loan summary statistics
router.get('/summary', protect, async (req, res) => {
  try {
    const [loans] = await Loan.pool.execute(`
      SELECT 
        COALESCE(SUM(amount), 0) as total_loaned,
        COALESCE(SUM(remaining_balance), 0) as total_outstanding,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_loans,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_loans
      FROM loans
      WHERE status != 'completed'
    `);

    const [payments] = await Loan.pool.execute(`
      SELECT COALESCE(SUM(amount), 0) as total_repaid 
      FROM loan_payments
      WHERE status = 'completed'
    `);

    const summary = {
      totalLoaned: Number(loans[0].total_loaned) || 0,
      totalRepaid: Number(payments[0].total_repaid) || 0,
      outstandingAmount: Number(loans[0].total_outstanding) || 0,
      activeLoans: Number(loans[0].active_loans) || 0,
      overdueLoans: Number(loans[0].overdue_loans) || 0
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get loan details with payment history
router.get('/:id', protect, async (req, res) => {
  try {
    const loan = await Loan.getWithDetails(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }
    res.json(loan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update loan status
router.patch('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const [result] = await Loan.pool.execute(
      'UPDATE loans SET status = ? WHERE id = ?',
      [req.body.status, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const loan = await Loan.getWithDetails(req.params.id);
    res.json(loan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get borrowers list
router.get('/borrowers', protect, async (req, res) => {
  try {
    const { type } = req.query;
    let borrowers = [];
    
    if (type === 'employee') {
      const [rows] = await pool.execute('SELECT id, name FROM employees WHERE status = "active"');
      borrowers = rows;
    } else if (type === 'contractor') {
      const [rows] = await pool.execute(`
        SELECT id, name FROM manufacturing_contractors 
        UNION 
        SELECT id, name FROM cutting_contractors
      `);
      borrowers = rows;
    }
    
    res.json(borrowers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get loan schedule
router.get('/:id/schedule', protect, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT * FROM loan_schedule 
      WHERE loan_id = ?
      ORDER BY period_number ASC
    `, [req.params.id]);
    
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 