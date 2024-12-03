const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Loan = require('../models/Loan');
const LoanPayment = require('../models/LoanPayment');

// Get all loans
router.get('/', protect, async (req, res) => {
  try {
    const loans = await Loan.find()
      .populate('borrower')
      .populate('createdBy', 'name')
      .sort('-createdAt');
    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new loan
router.post('/', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const loan = new Loan({
      ...req.body,
      createdBy: req.user.id
    });

    // Calculate payment schedule
    loan.calculatePaymentSchedule();
    await loan.save();

    res.status(201).json(
      await loan
        .populate('borrower')
        .populate('createdBy', 'name')
    );
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Record loan payment
router.post('/:id/payments', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const { scheduleItemId, amount } = req.body;
    const scheduleItem = loan.paymentSchedule.id(scheduleItemId);
    if (!scheduleItem) {
      return res.status(404).json({ message: 'Payment schedule item not found' });
    }

    // Create payment record
    const payment = await LoanPayment.create({
      ...req.body,
      loan: loan._id,
      scheduleItem: scheduleItemId,
      createdBy: req.user.id
    });

    // Update schedule item
    scheduleItem.paidAmount += amount;
    scheduleItem.status = scheduleItem.paidAmount >= scheduleItem.amount ? 'paid' : 'pending';
    scheduleItem.paidDate = scheduleItem.status === 'paid' ? new Date() : undefined;

    // Update loan remaining balance
    loan.remainingBalance -= amount;
    if (loan.remainingBalance <= 0) {
      loan.status = 'completed';
    }

    await loan.save();
    res.status(201).json(await payment.populate(['loan', 'createdBy']));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all loan payments
router.get('/payments', protect, async (req, res) => {
  try {
    const payments = await LoanPayment.find()
      .populate('loan')
      .populate('createdBy', 'name')
      .sort('-paymentDate');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get loan summary statistics
router.get('/summary', protect, async (req, res) => {
  try {
    const loans = await Loan.find();
    const payments = await LoanPayment.find();
    
    const summary = {
      totalLoaned: loans.reduce((sum, loan) => sum + loan.amount, 0),
      totalRepaid: payments.reduce((sum, payment) => sum + payment.amount, 0),
      outstandingAmount: 0,
      activeLoans: loans.filter(loan => loan.status === 'active').length,
      overdueLoans: loans.filter(loan => loan.status === 'overdue').length
    };
    
    // Calculate outstanding amount
    summary.outstandingAmount = summary.totalLoaned - summary.totalRepaid;
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get loan details with payment history
router.get('/:id', protect, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('borrower')
      .populate('createdBy', 'name');
    
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const payments = await LoanPayment.find({ loan: loan._id })
      .populate('createdBy', 'name')
      .sort('-paymentDate');

    res.json({ loan, payments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update loan status
router.patch('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    loan.status = req.body.status;
    await loan.save();

    res.json(loan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get overdue loans report
router.get('/reports/overdue', protect, async (req, res) => {
  try {
    const loans = await Loan.find({
      status: 'active',
      'paymentSchedule.status': 'pending',
      'paymentSchedule.dueDate': { $lt: new Date() }
    }).populate('borrower');

    const report = loans.map(loan => ({
      loanNumber: loan.loanNumber,
      borrower: loan.borrower,
      overduePayments: loan.paymentSchedule.filter(
        item => item.status === 'pending' && item.dueDate < new Date()
      ),
      totalOverdue: loan.paymentSchedule.reduce((sum, item) => 
        item.status === 'pending' && item.dueDate < new Date() ? 
        sum + (item.amount - item.paidAmount) : sum, 0
      )
    }));

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 