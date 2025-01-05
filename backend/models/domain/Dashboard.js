const BaseModel = require('../base/BaseModel');

class Dashboard extends BaseModel {
  constructor() {
    super('dashboard');
  }

  async getLandsCount() {
    const [rows] = await this.pool.execute(`
      SELECT COUNT(*) as count
      FROM lands
      WHERE status = 'active'
    `);
    return rows[0].count;
  }

  async getOwnedLandsCount() {
    const [rows] = await this.pool.execute(`
      SELECT COUNT(*) as count
      FROM lands
      WHERE status = 'active' AND ownership_status = 'owned'
    `);
    return rows[0].count;
  }

  async getRentedLandsCount() {
    const [rows] = await this.pool.execute(`
      SELECT COUNT(*) as count
      FROM lands
      WHERE status = 'active' AND ownership_status = 'rent'
    `);
    return rows[0].count;
  }

  async getTotalLandArea() {
    const [rows] = await this.pool.execute(`
      SELECT COALESCE(SUM(size), 0) as total_area
      FROM lands
      WHERE status = 'active'
    `);
    return rows[0].total_area;
  }

  async getTotalUsers() {
    const [rows] = await this.pool.execute(`
      SELECT COUNT(*) as count
      FROM users
    `);
    return rows[0].count;
  }

  async getActiveUsers() {
    const [rows] = await this.pool.execute(`
      SELECT COUNT(*) as count
      FROM users
      WHERE status = 'active'
    `);
    return rows[0].count;
  }

  async getManagerUsers() {
    const [rows] = await this.pool.execute(`
      SELECT COUNT(*) as count
      FROM users
      WHERE role = 'manager'
    `);
    return rows[0].count;
  }

  async getAdminUsers() {
    const [rows] = await this.pool.execute(`
      SELECT COUNT(*) as count
      FROM users
      WHERE role = 'admin'
    `);
    return rows[0].count;
  }

  async getActiveEmployeesCount() {
    const [rows] = await this.pool.execute(`
      SELECT COUNT(*) as count
      FROM employees
      WHERE status = 'active'
    `);
    return rows[0].count;
  }

  async getPendingTasksCount() {
    const [rows] = await this.pool.execute(`
      SELECT COUNT(*) as count
      FROM tasks
      WHERE status = 'pending'
    `);
    return rows[0].count;
  }

  async getMonthlyRevenue() {
    const [rows] = await this.pool.execute(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE status = 'posted'
        AND type = 'revenue'
        AND MONTH(date) = MONTH(CURRENT_DATE())
        AND YEAR(date) = YEAR(CURRENT_DATE())
    `);
    return rows[0].total;
  }

  async getRevenueData() {
    const [rows] = await this.pool.execute(`
      SELECT
        DATE_FORMAT(MIN(date), '%b') as month,
        COALESCE(SUM(amount), 0) as revenue,
        MIN(date) as full_date
      FROM transactions
      WHERE status = 'posted'
        AND type = 'revenue'
        AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
      GROUP BY YEAR(date), MONTH(date)
      ORDER BY full_date DESC
      LIMIT 6
    `);
    return rows;
  }

  async getMonthlyTarget() {
    const [rows] = await this.pool.execute(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'revenue' THEN amount ELSE 0 END), 0) as achieved,
        COALESCE(
          (SELECT mt.target_amount * (c.rate / dc.rate)
           FROM monthly_targets mt
           CROSS JOIN settings s
           JOIN currencies c ON s.default_currency = c.id
           JOIN currencies dc ON dc.id = 1  -- Base currency (LKR)
           WHERE MONTH(mt.period) = MONTH(CURRENT_DATE())
           AND YEAR(mt.period) = YEAR(CURRENT_DATE())
          ), 30000
        ) as target
      FROM transactions
      WHERE status = 'posted'
        AND MONTH(date) = MONTH(CURRENT_DATE())
        AND YEAR(date) = YEAR(CURRENT_DATE())
    `);

    // If no data exists, return default values adjusted by current currency rate
    if (!rows || !rows[0]) {
      const [currencyRate] = await this.pool.execute(`
        SELECT c.rate / dc.rate as conversion_rate
        FROM settings s
        JOIN currencies c ON s.default_currency = c.id
        JOIN currencies dc ON dc.id = 1  -- Base currency (LKR)
        LIMIT 1
      `);

      const rate = currencyRate[0]?.conversion_rate || 1;
      return {
        achieved: 0,
        target: 30000 * rate
      };
    }

    return {
      achieved: Number(rows[0].achieved) || 0,
      target: Number(rows[0].target) || 30000
    };
  }

  async getTaskCompletionRate() {
    const [rows] = await this.pool.execute(`
      SELECT
        COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as completion_rate
      FROM tasks
      WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
    `);
    return Math.round(rows[0].completion_rate || 0);
  }

  async updateMonthlyTarget(period, targetAmount, userId) {
    // Convert target amount to base currency (LKR) before storing
    const [currencyRate] = await this.pool.execute(`
      SELECT dc.rate / c.rate as conversion_rate
      FROM settings s
      JOIN currencies c ON s.default_currency = c.id
      JOIN currencies dc ON dc.id = 1  -- Base currency (LKR)
      LIMIT 1
    `);

    const rate = currencyRate[0]?.conversion_rate || 1;
    const baseAmount = targetAmount * rate;

    const [existing] = await this.pool.execute(
      'SELECT id FROM monthly_targets WHERE period = ?',
      [period]
    );

    if (existing.length > 0) {
      await this.pool.execute(
        `UPDATE monthly_targets
         SET target_amount = ?,
             updated_at = CURRENT_TIMESTAMP,
             created_by = ?
         WHERE period = ?`,
        [baseAmount, userId, period]
      );
    } else {
      await this.pool.execute(
        `INSERT INTO monthly_targets (period, target_amount, created_by)
         VALUES (?, ?, ?)`,
        [period, baseAmount, userId]
      );
    }
  }

  async getTotalEmployees() {
    const [rows] = await this.pool.execute(`
      SELECT COUNT(*) as count
      FROM employees
    `);
    return rows[0].count;
  }

  async getMonthlySalaryCost() {
    const [rows] = await this.pool.execute(`
      SELECT
        SUM(CASE
          WHEN salary_type = 'daily' THEN basic_salary * 22
          WHEN salary_type = 'weekly' THEN basic_salary * 4
          ELSE basic_salary
        END) as total_cost
      FROM employees
      WHERE status = 'active'
    `);
    return rows[0].total_cost || 0;
  }

  async getDepartmentsCount() {
    const [rows] = await this.pool.execute(`
      SELECT COUNT(DISTINCT department) as count
      FROM designations
    `);
    return rows[0].count;
  }

  async getCompletedTasksCount() {
    const [rows] = await this.pool.execute(`
      SELECT COUNT(*) as count
      FROM tasks
      WHERE status = 'completed'
    `);
    return rows[0].count;
  }

  async getInProgressTasksCount() {
    const [rows] = await this.pool.execute(`
      SELECT COUNT(*) as count
      FROM tasks
      WHERE status = 'in_progress'
    `);
    return rows[0].count;
  }

  async getTotalAdvances() {
    const [rows] = await this.pool.execute(`
      SELECT COUNT(*) as count
      FROM salary_advances
    `);
    return rows[0].count;
  }

  async getApprovedAdvances() {
    const [rows] = await this.pool.execute(`
      SELECT COUNT(*) as count
      FROM salary_advances
      WHERE approval_status = 'approved'
    `);
    return rows[0].count;
  }

  async getPendingAdvances() {
    const [rows] = await this.pool.execute(`
      SELECT COUNT(*) as count
      FROM salary_advances
      WHERE approval_status = 'pending'
    `);
    return rows[0].count;
  }

  async getTotalPayrolls() {
    const [rows] = await this.pool.execute(`
      SELECT COUNT(*) as count
      FROM payrolls
    `);
    return rows[0].count;
  }

  async getActiveContractors() {
    const [rows] = await this.pool.execute(`
      SELECT COUNT(*) as count
      FROM cutting_contractors
      WHERE status = 'active'
    `);
    return rows[0].count;
  }

  async getActiveOperations() {
    const [rows] = await this.pool.execute(`
      SELECT COUNT(DISTINCT ct.id) as count
      FROM cutting_tasks ct
      INNER JOIN land_assignments la ON ct.assignment_id = la.id
      WHERE la.status = 'active'
    `);
    return rows[0].count;
  }

  async getTotalOperations() {
    const [rows] = await this.pool.execute(`
      SELECT COUNT(*) as count
      FROM cutting_tasks
    `);
    return rows[0].count;
  }

  async getTotalContractors() {
    const [rows] = await this.pool.execute(`
      SELECT COUNT(*) as count
      FROM cutting_contractors
    `);
    return rows[0].count;
  }

  async getTotalSales() {
    const [rows] = await this.pool.execute(`
      SELECT COUNT(*) as count
      FROM sales_invoices
      WHERE status != 'draft'
    `);
    return rows[0].count;
  }

  async getTotalRevenue() {
    const [rows] = await this.pool.execute(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM sales_invoices
      WHERE status = 'confirmed'
    `);
    return rows[0].total;
  }

  async getTotalCustomers() {
    const [rows] = await this.pool.execute(`
      SELECT COUNT(*) as count
      FROM customers
      WHERE status = 'active'
    `);
    return rows[0].count;
  }

  async getPendingSales() {
    const [rows] = await this.pool.execute(`
      SELECT COUNT(*) as count
      FROM sales_invoices
      WHERE payment_status = 'pending'
    `);
    return rows[0].count;
  }

  async getActiveAssets() {
    const [rows] = await this.pool.execute(`
      SELECT COUNT(*) as count
      FROM assets
      WHERE status = 'active'
    `);
    return rows[0].count;
  }

  async getTotalAssetValue() {
    const [rows] = await this.pool.execute(`
      SELECT COALESCE(SUM(current_value), 0) as total
      FROM assets
      WHERE status = 'active'
    `);
    return rows[0].total;
  }

  async getPendingMaintenance() {
    const [rows] = await this.pool.execute(`
      SELECT COUNT(*) as count
      FROM asset_maintenance
      WHERE status = 'scheduled'
    `);
    return rows[0].count;
  }

  async getAvgMaintenanceCost() {
    const [rows] = await this.pool.execute(`
      SELECT COALESCE(AVG(cost), 0) as average
      FROM asset_maintenance
      WHERE status = 'completed'
    `);
    return rows[0].average;
  }

  async getManufacturingStats() {
    const [orders] = await this.pool.execute(`
      SELECT
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_orders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
        AVG(CASE WHEN status = 'completed' THEN efficiency ELSE NULL END) as avg_efficiency,
        AVG(CASE WHEN status = 'completed' THEN defect_rate ELSE NULL END) as avg_defect_rate,
        SUM(CASE WHEN status = 'completed' THEN downtime_hours ELSE 0 END) as total_downtime
      FROM manufacturing_orders
    `);

    const [assignments] = await this.pool.execute(`
      SELECT
        COUNT(*) as active_assignments,
        COALESCE(SUM(quantity), 0) as total_quantity
      FROM cinnamon_assignments
      WHERE status = 'active'
    `);

    return {
      totalOrders: orders[0].total_orders,
      inProgressOrders: orders[0].in_progress_orders,
      completedOrders: orders[0].completed_orders,
      avgProductionEfficiency: orders[0].avg_efficiency || 0,
      avgDefectRate: orders[0].avg_defect_rate || 0,
      totalDowntime: orders[0].total_downtime || 0,
      activeAssignments: assignments[0].active_assignments,
      totalAssignedQuantity: assignments[0].total_quantity
    };
  }

  async getInventoryStats() {
    const [items] = await this.pool.execute(`
      SELECT
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_items,
        COUNT(CASE WHEN quantity <= min_stock_level THEN 1 END) as low_stock_items,
        COUNT(*) as inventory_orders,
        COALESCE(SUM(CASE
          WHEN product_type = 'finished_good'
          THEN quantity * purchase_price
          ELSE 0
        END), 0) as total_value
      FROM inventory
    `);

    return {
      activeItems: items[0].active_items || 0,
      lowStockItems: items[0].low_stock_items || 0,
      inventoryOrders: items[0].inventory_orders || 0,
      totalInventoryValue: items[0].total_value || 0
    };
  }

  async getAccountingSummary() {
    const [rows] = await this.pool.execute(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'revenue' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
        COALESCE(SUM(CASE
          WHEN type = 'revenue' THEN amount
          WHEN type = 'expense' THEN -amount
          ELSE 0
        END), 0) as net_income,
        (SELECT COALESCE(SUM(balance), 0)
         FROM accounts
         WHERE type = 'asset' AND category = 'current') as cash_balance
      FROM transactions
      WHERE status = 'posted'
        AND YEAR(date) = YEAR(CURRENT_DATE())
    `);

    return {
      totalIncome: rows[0].total_income || 0,
      totalExpenses: rows[0].total_expenses || 0,
      netIncome: rows[0].net_income || 0,
      cashBalance: rows[0].cash_balance || 0
    };
  }

  async getLoanSummary() {
    const [rows] = await this.pool.execute(`
      SELECT
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_loans,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_loans,
        COALESCE(SUM(amount), 0) as total_loaned,
        COALESCE(SUM(amount - remaining_balance), 0) as total_repaid,
        COALESCE(SUM(remaining_balance), 0) as outstanding_amount
      FROM loans
    `);

    return {
      activeLoans: rows[0].active_loans || 0,
      overdueLoans: rows[0].overdue_loans || 0,
      totalLoaned: rows[0].total_loaned || 0,
      totalRepaid: rows[0].total_repaid || 0,
      outstandingAmount: rows[0].outstanding_amount || 0
    };
  }
}

module.exports = new Dashboard();
