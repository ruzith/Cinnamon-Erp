const Employee = require('../models/domain/Employee');
const { validateEmployee } = require('../validators/employeeValidator');
const { pool, connectDB } = require('../config/db');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private
exports.getEmployees = async (req, res) => {
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
exports.getEmployee = async (req, res) => {
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
exports.createEmployee = async (req, res) => {
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
exports.updateEmployee = async (req, res) => {
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
// @access  Private/Admin
exports.deleteEmployee = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Instead of DELETE, update the status to inactive
    const [result] = await pool.execute(
      'UPDATE employees SET status = ? WHERE id = ?',
      ['inactive', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json({ message: 'Employee deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating employee:', error);
    res.status(500).json({ message: 'Error deactivating employee', error: error.message });
  }
};
