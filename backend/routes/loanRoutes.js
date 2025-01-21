const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Loan = require('../models/domain/Loan');
const LoanPayment = require('../models/domain/LoanPayment');
const { pool } = require('../config/db');

// Get all loans
router.get('/', protect, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
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
    const { loan, createAccountingEntry, accountingData } = req.body;

    // Validate required fields
    const requiredFields = ['borrower_type', 'borrower_id', 'amount', 'interest_rate',
                           'term_months', 'payment_frequency', 'start_date', 'end_date'];

    const missingFields = requiredFields.filter(field => !loan[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // First, get the account IDs
      const [accounts] = await connection.execute(
        'SELECT id, code FROM accounts WHERE code IN (?, ?)',
        ['1001', '1002'] // Cash and Accounts Receivable
      );

      const cashAccount = accounts.find(a => a.code === '1001');
      const receivablesAccount = accounts.find(a => a.code === '1002');

      if (!cashAccount || !receivablesAccount) {
        throw new Error('Required accounts not found. Please check account configuration.');
      }

      // Create loan using existing logic
      const loanModel = new Loan();
      const createdLoan = await loanModel.createWithSchedule({
        ...loan,
        created_by: req.user.id
      });

      // Handle accounting transaction if requested
      if (createAccountingEntry && accountingData) {
        // Create transaction record
        const [result] = await connection.execute(`
          INSERT INTO transactions (
            date, reference, description, type, category,
            amount, status, payment_method, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          new Date(),
          accountingData.reference,
          accountingData.description,
          'credit_payment',
          'loan_disbursement',
          loan.amount,
          'posted',
          accountingData.paymentMethod || 'cash',
          req.user.id
        ]);

        const transactionId = result.insertId;

        // Create transaction entries (double-entry)
        // Debit Loans Receivable account
        await connection.execute(`
          INSERT INTO transactions_entries (
            transaction_id, account_id, description, debit, credit
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          transactionId,
          receivablesAccount.id, // Use the actual account ID
          `Loan disbursement to ${loan.borrower_type} ${loan.borrower_id}`,
          loan.amount,
          0
        ]);

        // Credit Cash account
        await connection.execute(`
          INSERT INTO transactions_entries (
            transaction_id, account_id, description, debit, credit
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          transactionId,
          cashAccount.id, // Use the actual account ID
          `Loan disbursement to ${loan.borrower_type} ${loan.borrower_id}`,
          0,
          loan.amount
        ]);

        // Update account balances
        await connection.execute(
          'UPDATE accounts SET balance = balance + ? WHERE id = ?',
          [loan.amount, receivablesAccount.id] // Increase Accounts Receivable
        );

        await connection.execute(
          'UPDATE accounts SET balance = balance - ? WHERE id = ?',
          [loan.amount, cashAccount.id] // Decrease Cash
        );
      }

      await connection.commit();
      res.status(201).json(createdLoan);

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating loan:', error);
    res.status(400).json({
      message: 'Error creating loan',
      error: error.message
    });
  }
});

// Record loan payment
router.post('/payments', protect, authorize('admin', 'accountant'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { loan_id, amount, payment_date, reference, status, notes, createAccountingEntry, accountingData } = req.body;

    await connection.beginTransaction();

    // First, get the account IDs
    const [accounts] = await connection.execute(
      'SELECT id, code FROM accounts WHERE code IN (?, ?)',
      ['1001', '1002'] // Cash and Accounts Receivable
    );

    const cashAccount = accounts.find(a => a.code === '1001');
    const receivablesAccount = accounts.find(a => a.code === '1002');

    if (!cashAccount || !receivablesAccount) {
      throw new Error('Required accounts not found. Please check account configuration.');
    }

    // Map payment method to standardized value
    const paymentMethodMap = {
      'cash': 'cash',
      'bank_transfer': 'bank',
      'check': 'check',
      'card': 'card'
    };

    const paymentMethod = paymentMethodMap[accountingData?.paymentMethod] || 'cash';

    // Create payment record
    const [paymentResult] = await connection.execute(`
      INSERT INTO loan_payments (
        loan_id, amount, payment_date, reference,
        payment_method, status, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      loan_id,
      amount,
      payment_date,
      reference,
      paymentMethod, // Use mapped payment method
      status || 'completed',
      notes || null,
      req.user.id
    ]);

    // Handle accounting entry if requested
    if (createAccountingEntry && accountingData) {
      // Create transaction record
      const [result] = await connection.execute(`
        INSERT INTO transactions (
          date, reference, description, type, category,
          amount, status, payment_method, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        payment_date,
        reference,
        accountingData.description,
        'revenue',
        'loan_repayment',
        amount,
        'posted',
        paymentMethod, // Use mapped payment method
        req.user.id
      ]);

      const transactionId = result.insertId;

      // Create transaction entries
      // Debit Cash account
      await connection.execute(`
        INSERT INTO transactions_entries (
          transaction_id, account_id, description, debit, credit
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        transactionId,
        cashAccount.id,
        `Loan repayment received`,
        amount,
        0
      ]);

      // Credit Loans Receivable account
      await connection.execute(`
        INSERT INTO transactions_entries (
          transaction_id, account_id, description, debit, credit
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        transactionId,
        receivablesAccount.id,
        `Loan repayment received`,
        0,
        amount
      ]);

      // Update account balances
      await connection.execute(
        'UPDATE accounts SET balance = balance + ? WHERE id = ?',
        [amount, cashAccount.id]
      );

      await connection.execute(
        'UPDATE accounts SET balance = balance - ? WHERE id = ?',
        [amount, receivablesAccount.id]
      );
    }

    await connection.commit();
    res.status(201).json(paymentResult);

  } catch (error) {
    await connection.rollback();
    console.error('Error recording payment:', error);
    res.status(400).json({ message: error.message });
  } finally {
    connection.release();
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

// Create loan payment
router.post('/payments', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const { loan_id, amount, payment_date, reference, status, notes, createAccountingEntry, accountingData } = req.body;

    // Validate required fields
    if (!loan_id || !amount || !payment_date) {
      return res.status(400).json({
        message: 'Missing required fields: loan_id, amount, payment_date'
      });
    }

    // Get loan details
    const [loan] = await pool.execute(
      'SELECT * FROM loans WHERE id = ?',
      [loan_id]
    );

    if (!loan[0]) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const paymentData = {
      loan_id,
      amount,
      payment_date,
      reference,
      status: status || 'completed',
      notes,
      created_by: req.user.id
    };

    // Create payment using LoanPayment model
    const payment = await LoanPayment.create(paymentData);

    // Handle accounting entry if requested
    if (createAccountingEntry && accountingData) {
      // Create accounting entry logic here
      // This would typically involve creating a transaction record
    }

    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(400).json({
      message: 'Error creating payment',
      error: error.message
    });
  }
});

// Get loan summary statistics
router.get('/summary', protect, async (req, res) => {
  try {
    const [loans] = await pool.execute(`
      SELECT
        COALESCE(SUM(amount), 0) as total_loaned,
        COALESCE(SUM(remaining_balance), 0) as total_outstanding,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_loans,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_loans
      FROM loans
      WHERE status != 'completed'
    `);

    const [payments] = await pool.execute(`
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
    console.error('Error fetching loan summary:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get loan details with payment history
router.get('/:id', protect, async (req, res) => {
  try {
    const loanModel = new Loan();
    const loan = await loanModel.getWithDetails(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }
    res.json(loan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update loan details
router.put('/:id', protect, authorize('admin', 'accountant'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const loanId = req.params.id;
    const updateData = req.body;

    // Validate required fields
    const requiredFields = ['borrower_type', 'borrower_id', 'amount', 'interest_rate',
                           'term_months', 'payment_frequency', 'start_date', 'end_date'];

    const missingFields = requiredFields.filter(field => !updateData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    await connection.beginTransaction();

    try {
      // Update loan record
      const [result] = await connection.execute(`
        UPDATE loans
        SET borrower_type = ?,
            borrower_id = ?,
            amount = ?,
            interest_rate = ?,
            term_months = ?,
            payment_frequency = ?,
            start_date = ?,
            end_date = ?,
            purpose = ?,
            collateral = ?,
            status = ?,
            notes = ?
        WHERE id = ?`,
        [
          updateData.borrower_type,
          updateData.borrower_id,
          updateData.amount,
          updateData.interest_rate,
          updateData.term_months,
          updateData.payment_frequency,
          updateData.start_date,
          updateData.end_date,
          updateData.purpose || null,
          updateData.collateral || null,
          updateData.status || 'active',
          updateData.notes || null,
          loanId
        ]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ message: 'Loan not found' });
      }

      // Delete existing schedule
      await connection.execute('DELETE FROM loan_schedule WHERE loan_id = ?', [loanId]);

      // Calculate and insert new schedule
      const loan = new Loan();
      const schedule = loan.calculatePaymentSchedule({
        amount: updateData.amount,
        interest_rate: updateData.interest_rate,
        term: updateData.term_months,
        payment_frequency: updateData.payment_frequency,
        start_date: updateData.start_date
      });

      // Insert new schedule records
      for (const item of schedule) {
        await connection.execute(`
          INSERT INTO loan_schedule (
            loan_id, period_number, due_date, payment_amount,
            principal_amount, interest_amount, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            loanId,
            item.period_number,
            item.due_date,
            item.payment_amount,
            item.principal_amount,
            item.interest_amount,
            'pending'
          ]
        );
      }

      await connection.commit();
      connection.release();

      // Get updated loan details
      const [updatedLoan] = await pool.execute(`
        SELECT l.*,
               CASE
                 WHEN l.borrower_type = 'employee' THEN e.name
                 WHEN l.borrower_type = 'contractor' THEN COALESCE(mc.name, cc.name)
               END as borrower_name,
               u.name as created_by_name
        FROM loans l
        LEFT JOIN employees e ON l.borrower_type = 'employee' AND l.borrower_id = e.id
        LEFT JOIN manufacturing_contractors mc ON l.borrower_type = 'contractor' AND l.borrower_id = mc.id
        LEFT JOIN cutting_contractors cc ON l.borrower_type = 'contractor' AND l.borrower_id = cc.id
        LEFT JOIN users u ON l.created_by = u.id
        WHERE l.id = ?
      `, [loanId]);

      // Get loan schedule
      const [schedule_items] = await pool.execute(`
        SELECT * FROM loan_schedule
        WHERE loan_id = ?
        ORDER BY period_number ASC
      `, [loanId]);

      // Get loan payments
      const [payments] = await pool.execute(`
        SELECT lp.*,
               u.name as created_by_name
        FROM loan_payments lp
        LEFT JOIN users u ON lp.created_by = u.id
        WHERE lp.loan_id = ?
        ORDER BY lp.payment_date DESC
      `, [loanId]);

      const loanWithDetails = {
        ...updatedLoan[0],
        schedule: schedule_items,
        payments: payments
      };

      res.json(loanWithDetails);
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    if (connection) {
      connection.release();
    }
    console.error('Error updating loan:', error);
    res.status(400).json({
      message: 'Error updating loan',
      error: error.message
    });
  }
});

// Update loan status
router.patch('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const [result] = await pool.execute(
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

// Delete loan
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const loanId = req.params.id;

    // Check if loan exists and get its status
    const [loan] = await connection.execute(
      'SELECT status, remaining_balance FROM loans WHERE id = ?',
      [loanId]
    );

    if (!loan[0]) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Check if loan has payments and is not voided
    if (loan[0].remaining_balance < loan[0].amount && loan[0].status !== 'voided') {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        message: 'Cannot delete loan with existing payments. Please void the loan first.'
      });
    }

    // Delete in correct order to maintain referential integrity:

    // 1. First delete loan payments (they reference both loan and schedule)
    await connection.execute(
      'DELETE FROM loan_payments WHERE loan_id = ?',
      [loanId]
    );

    // 2. Then delete loan schedule
    await connection.execute(
      'DELETE FROM loan_schedule WHERE loan_id = ?',
      [loanId]
    );

    // 3. Finally delete the loan
    await connection.execute(
      'DELETE FROM loans WHERE id = ?',
      [loanId]
    );

    await connection.commit();
    connection.release();

    res.json({ message: 'Loan deleted successfully' });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error deleting loan:', error);
    res.status(500).json({
      message: 'Error deleting loan',
      error: error.message
    });
  }
});

// Fix the void loan route
router.patch('/:id/void', protect, authorize('admin'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const loanId = req.params.id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        message: 'A reason is required to void a loan'
      });
    }

    // Update loan status to voided
    await connection.execute(
      'UPDATE loans SET status = ?, notes = CONCAT(COALESCE(notes, ""), "\nVoid reason: ", ?) WHERE id = ?',
      ['voided', reason, loanId]
    );

    // Mark all unpaid schedule items as voided
    await connection.execute(
      'UPDATE loan_schedule SET status = ? WHERE loan_id = ? AND status IN ("pending", "partial")',
      ['voided', loanId]
    );

    await connection.commit();

    // Get updated loan details using instance method
    const loanModel = new Loan();
    const updatedLoan = await loanModel.getWithDetails(loanId);

    connection.release();
    res.json(updatedLoan);

  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error voiding loan:', error);
    res.status(500).json({
      message: 'Error voiding loan',
      error: error.message
    });
  }
});

module.exports = router;