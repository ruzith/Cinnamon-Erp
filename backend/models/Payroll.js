const BaseModel = require('./BaseModel');

class Payroll extends BaseModel {
  constructor() {
    super('payrolls');
  }

  async create(data) {
    try {
      // Begin transaction
      await this.pool.beginTransaction();

      // Generate payroll ID
      const date = new Date();
      const year = date.getFullYear().toString().substr(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const [countResult] = await this.pool.execute('SELECT COUNT(*) as count FROM payrolls');
      const count = countResult[0].count + 1;
      const payrollId = `PAY${year}${month}${count.toString().padStart(4, '0')}`;

      // Insert main payroll record
      const [result] = await this.pool.execute(
        'INSERT INTO payrolls SET ?',
        {
          payroll_id: payrollId,
          month: data.month,
          year: data.year,
          from_date: data.fromDate,
          to_date: data.toDate,
          status: 'draft',
          created_by: data.createdBy,
          created_at: new Date()
        }
      );

      // Insert payroll items
      let totalBasic = 0;
      let totalGross = 0;
      let totalDeductions = 0;
      let totalNet = 0;

      for (const item of data.items) {
        const [itemResult] = await this.pool.execute(
          'INSERT INTO payroll_items SET ?',
          {
            payroll_id: result.insertId,
            employee_id: item.employee,
            basic_salary: item.basicSalary,
            gross_salary: item.grossSalary,
            net_salary: item.netSalary,
            status: 'pending',
            payment_method: item.paymentDetails.method
          }
        );

        // Insert earnings and deductions
        for (const earning of item.earnings) {
          await this.pool.execute(
            'INSERT INTO payroll_components SET ?',
            {
              payroll_item_id: itemResult.insertId,
              type: 'earning',
              name: earning.name,
              amount: earning.amount
            }
          );
        }

        for (const deduction of item.deductions) {
          await this.pool.execute(
            'INSERT INTO payroll_components SET ?',
            {
              payroll_item_id: itemResult.insertId,
              type: 'deduction',
              name: deduction.name,
              amount: deduction.amount
            }
          );
        }

        totalBasic += item.basicSalary;
        totalGross += item.grossSalary;
        totalDeductions += item.deductions.reduce((sum, d) => sum + d.amount, 0);
        totalNet += item.netSalary;
      }

      // Update payroll totals
      await this.pool.execute(
        `UPDATE payrolls SET 
          total_basic_salary = ?,
          total_gross_salary = ?,
          total_deductions = ?,
          total_net_salary = ?
        WHERE id = ?`,
        [totalBasic, totalGross, totalDeductions, totalNet, result.insertId]
      );

      await this.pool.commit();
      return this.getWithDetails(result.insertId);
    } catch (error) {
      await this.pool.rollback();
      throw error;
    }
  }

  async getWithDetails(id) {
    const [payroll] = await this.pool.execute(`
      SELECT p.*, 
             u1.name as created_by_name,
             u2.name as approved_by_name
      FROM payrolls p
      LEFT JOIN users u1 ON p.created_by = u1.id
      LEFT JOIN users u2 ON p.approved_by = u2.id
      WHERE p.id = ?
    `, [id]);

    if (!payroll[0]) return null;

    const [items] = await this.pool.execute(`
      SELECT pi.*,
             e.name as employee_name,
             e.employee_id as employee_code
      FROM payroll_items pi
      JOIN employees e ON pi.employee_id = e.id
      WHERE pi.payroll_id = ?
    `, [id]);

    for (const item of items) {
      const [components] = await this.pool.execute(`
        SELECT * FROM payroll_components
        WHERE payroll_item_id = ?
        ORDER BY type, name
      `, [item.id]);

      item.earnings = components.filter(c => c.type === 'earning');
      item.deductions = components.filter(c => c.type === 'deduction');
    }

    payroll[0].items = items;
    return payroll[0];
  }
}

module.exports = new Payroll(); 