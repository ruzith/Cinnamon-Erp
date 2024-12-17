const BaseModel = require('./BaseModel');

class Loan extends BaseModel {
  constructor() {
    super('loans');
  }

  async generateLoanNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const [result] = await this.pool.execute(
      'SELECT COUNT(*) as count FROM loans WHERE YEAR(created_at) = YEAR(CURRENT_DATE)'
    );
    const count = result[0].count + 1;
    return `LN${year}${count.toString().padStart(4, '0')}`;
  }

  async getWithDetails(id) {
    const [loan] = await this.pool.execute(`
      SELECT l.*,
             u.name as created_by_name
      FROM loans l
      LEFT JOIN users u ON l.created_by = u.id
      WHERE l.id = ?
    `, [id]);

    if (!loan[0]) return null;

    const [payments] = await this.pool.execute(`
      SELECT lp.*,
             u.name as created_by_name
      FROM loan_payments lp
      LEFT JOIN users u ON lp.created_by = u.id
      WHERE lp.loan_id = ?
      ORDER BY lp.payment_date DESC
    `, [id]);

    const [schedule] = await this.pool.execute(`
      SELECT * FROM loan_schedule
      WHERE loan_id = ?
      ORDER BY due_date ASC
    `, [id]);

    return {
      ...loan[0],
      payments,
      schedule
    };
  }

  async createWithSchedule(loanData) {
    await this.pool.beginTransaction();
    try {
      // Generate loan number if not provided
      if (!loanData.loan_number) {
        loanData.loan_number = await this.generateLoanNumber();
      }

      // Calculate payment schedule
      const schedule = this.calculatePaymentSchedule(loanData);
      
      // Create loan record
      const [result] = await this.pool.execute(
        'INSERT INTO loans SET ?',
        loanData
      );
      const loanId = result.insertId;

      // Create schedule records
      for (const item of schedule) {
        await this.pool.execute(
          'INSERT INTO loan_schedule SET ?',
          { ...item, loan_id: loanId }
        );
      }

      await this.pool.commit();
      return this.getWithDetails(loanId);
    } catch (error) {
      await this.pool.rollback();
      throw error;
    }
  }

  calculatePaymentSchedule(loan) {
    const {
      amount,
      interest_rate,
      term,
      payment_frequency,
      start_date
    } = loan;

    const periodsPerYear = {
      weekly: 52,
      monthly: 12,
      quarterly: 4,
      annually: 1
    }[payment_frequency];

    const totalPeriods = term * periodsPerYear;
    const periodicRate = interest_rate / 100 / periodsPerYear;
    const paymentAmount = (amount * periodicRate * Math.pow(1 + periodicRate, totalPeriods)) / 
                         (Math.pow(1 + periodicRate, totalPeriods) - 1);

    const schedule = [];
    let remainingBalance = amount;
    let dueDate = new Date(start_date);

    for (let i = 1; i <= totalPeriods; i++) {
      const interest = remainingBalance * periodicRate;
      const principal = paymentAmount - interest;
      remainingBalance -= principal;

      schedule.push({
        period_number: i,
        due_date: dueDate,
        payment_amount: paymentAmount,
        principal_amount: principal,
        interest_amount: interest,
        balance: Math.max(0, remainingBalance),
        status: 'pending'
      });

      // Calculate next due date based on frequency
      switch (payment_frequency) {
        case 'weekly':
          dueDate = new Date(dueDate.setDate(dueDate.getDate() + 7));
          break;
        case 'monthly':
          dueDate = new Date(dueDate.setMonth(dueDate.getMonth() + 1));
          break;
        case 'quarterly':
          dueDate = new Date(dueDate.setMonth(dueDate.getMonth() + 3));
          break;
        case 'annually':
          dueDate = new Date(dueDate.setFullYear(dueDate.getFullYear() + 1));
          break;
      }
    }

    return schedule;
  }
}

module.exports = new Loan(); 