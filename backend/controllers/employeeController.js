const Employee = require('../models/domain/Employee');
const { validateEmployee } = require('../validators/employeeValidator');
const { pool, connectDB } = require('../config/db');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private
const getEmployees = async (req, res) => {
  try {
    const employeeModel = new Employee();
    const employees = await employeeModel.getWithDetails();
    res.status(200).json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Error fetching employees', error: error.message });
  }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
const getEmployee = async (req, res) => {
  try {
    const employeeModel = new Employee();
    const employee = await employeeModel.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(200).json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create employee
// @route   POST /api/employees
// @access  Private/Admin
const createEmployee = async (req, res) => {
  try {
    const { error } = validateEmployee(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const employeeModel = new Employee();
    // Check for duplicate NIC
    const existingEmployee = await employeeModel.findByNIC(req.body.nic);
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee with this NIC already exists' });
    }

    const employee = await employeeModel.create(req.body);
    res.status(201).json(employee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private/Admin
const updateEmployee = async (req, res) => {
  try {
    const { error } = validateEmployee(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const employeeModel = new Employee();
    const employee = await employeeModel.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check for duplicate NIC if it's being changed
    if (req.body.nic && req.body.nic !== employee.nic) {
      const existingEmployee = await employeeModel.findByNIC(req.body.nic);
      if (existingEmployee) {
        return res.status(400).json({ message: 'Employee with this NIC already exists' });
      }
    }

    const updatedEmployee = await employeeModel.update(req.params.id, req.body);
    res.status(200).json(updatedEmployee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private
const deleteEmployee = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const employeeModel = new Employee();
    const employee = await employeeModel.findById(req.params.id);
    if (!employee) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Delete transaction entries first
    await connection.execute(
      'DELETE te FROM transactions_entries te ' +
      'INNER JOIN transactions t ON te.transaction_id = t.id ' +
      'WHERE t.employee_id = ?',
      [req.params.id]
    );

    // Then delete transactions
    await connection.execute(
      'DELETE FROM transactions WHERE employee_id = ?',
      [req.params.id]
    );

    // Delete payroll items
    await connection.execute(
      'DELETE pi FROM employee_payroll_items pi ' +
      'INNER JOIN employee_payrolls p ON pi.payroll_id = p.id ' +
      'WHERE p.employee_id = ?',
      [req.params.id]
    );

    // Delete payroll records
    await connection.execute(
      'DELETE FROM employee_payrolls WHERE employee_id = ?',
      [req.params.id]
    );

    // Delete salary advances
    await connection.execute(
      'DELETE FROM salary_advances WHERE employee_id = ?',
      [req.params.id]
    );

    // Delete work hours records
    await connection.execute(
      'DELETE FROM employee_work_hours WHERE employee_id = ?',
      [req.params.id]
    );

    // Remove employee from groups
    await connection.execute(
      'DELETE FROM employee_group_members WHERE employee_id = ?',
      [req.params.id]
    );

    // Delete tasks assigned to employee
    await connection.execute(
      'DELETE FROM tasks WHERE assigned_to = ?',
      [req.params.id]
    );

    // Finally delete the employee
    await connection.execute(
      'DELETE FROM employees WHERE id = ?',
      [req.params.id]
    );

    await connection.commit();
    connection.release();
    res.status(200).json({ message: 'Employee and all related records deleted successfully' });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error deleting employee:', error);
    res.status(500).json({
      message: 'Error deleting employee and related records.',
      error: error.message
    });
  }
};

// @desc    Get employee task report
// @route   GET /api/employees/:id/task-report
// @access  Private
const getEmployeeTaskReport = async (req, res) => {
  try {
    const employeeId = req.params.id;

    // Get tasks assigned to employee with total hours
    const [tasks] = await pool.execute(`
      SELECT
        t.id,
        t.title,
        t.description,
        t.status,
        t.estimated_hours,
        t.due_date,
        t.created_at,
        t.updated_at
      FROM tasks t
      WHERE t.assigned_to = ?
      ORDER BY t.created_at DESC
    `, [employeeId]);

    // Calculate total working hours - convert string hours to numbers
    const totalHours = tasks.reduce((sum, task) => sum + (parseFloat(task.estimated_hours) || 0), 0);
    const completedHours = tasks
      .filter(task => task.status === 'completed')
      .reduce((sum, task) => sum + (parseFloat(task.estimated_hours) || 0), 0);

    res.json({
      tasks,
      summary: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(task => task.status === 'completed').length,
        pendingTasks: tasks.filter(task => task.status === 'pending').length,
        inProgressTasks: tasks.filter(task => task.status === 'in_progress').length,
        totalHours: parseFloat(totalHours.toFixed(2)),
        completedHours: parseFloat(completedHours.toFixed(2)),
        remainingHours: parseFloat((totalHours - completedHours).toFixed(2))
      }
    });
  } catch (error) {
    console.error('Error getting employee task report:', error);
    res.status(500).json({ message: 'Error getting employee task report' });
  }
};

module.exports = {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeTaskReport
};
