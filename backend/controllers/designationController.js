const Designation = require('../models/domain/Designation');
const { validateDesignation } = require('../validators/designationValidator');

// @desc    Get all designations
// @route   GET /api/designations
// @access  Private
exports.getDesignations = async (req, res) => {
  try {
    const designations = await Designation.getWithEmployeeCount();
    res.status(200).json(designations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single designation
// @route   GET /api/designations/:id
// @access  Private
exports.getDesignation = async (req, res) => {
  try {
    const designation = await Designation.findById(req.params.id);
    if (!designation) {
      return res.status(404).json({ message: 'Designation not found' });
    }
    res.status(200).json(designation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create designation
// @route   POST /api/designations
// @access  Private/Admin
exports.createDesignation = async (req, res) => {
  try {
    const { error } = validateDesignation(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Check for duplicate title
    const existingDesignation = await Designation.findByTitle(req.body.title);
    if (existingDesignation) {
      return res.status(400).json({ message: 'Designation already exists' });
    }

    const designation = await Designation.create(req.body);
    res.status(201).json(designation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update designation
// @route   PUT /api/designations/:id
// @access  Private/Admin
exports.updateDesignation = async (req, res) => {
  try {
    const { error } = validateDesignation(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const designation = await Designation.findById(req.params.id);
    if (!designation) {
      return res.status(404).json({ message: 'Designation not found' });
    }

    // Check for duplicate title if it's being changed
    if (req.body.title && req.body.title !== designation.title) {
      const existingDesignation = await Designation.findByTitle(req.body.title);
      if (existingDesignation) {
        return res.status(400).json({ message: 'Designation title already exists' });
      }
    }

    const updatedDesignation = await Designation.update(req.params.id, req.body);
    res.status(200).json(updatedDesignation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Reassign employees to new designation
// @route   PUT /api/designations/:id/reassign
// @access  Private/Admin
exports.reassignEmployees = async (req, res) => {
  try {
    const { newDesignationId } = req.body;
    const oldDesignationId = req.params.id;

    // Validate input
    if (!newDesignationId) {
      return res.status(400).json({ message: 'New designation ID is required' });
    }

    // Check if old designation exists
    const oldDesignation = await Designation.findById(oldDesignationId);
    if (!oldDesignation) {
      return res.status(404).json({ message: 'Current designation not found' });
    }

    // Check if new designation exists
    const newDesignation = await Designation.findById(newDesignationId);
    if (!newDesignation) {
      return res.status(404).json({ message: 'New designation not found' });
    }

    // Get employees using the old designation
    const [employees] = await Designation.pool.execute(
      'SELECT id, name FROM employees WHERE designation_id = ?',
      [oldDesignationId]
    );

    if (employees.length === 0) {
      return res.status(400).json({ message: 'No employees found with this designation' });
    }

    // Update all employees to new designation
    await Designation.pool.execute(
      'UPDATE employees SET designation_id = ? WHERE designation_id = ?',
      [newDesignationId, oldDesignationId]
    );

    res.status(200).json({
      message: `Successfully reassigned ${employees.length} employees to ${newDesignation.title}`,
      reassignedEmployees: employees,
      newDesignation: newDesignation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete designation
// @route   DELETE /api/designations/:id
// @access  Private/Admin
exports.deleteDesignation = async (req, res) => {
  try {
    const { forceDelete, newDesignationId } = req.query;
    const designation = await Designation.findById(req.params.id);
    
    if (!designation) {
      return res.status(404).json({ message: 'Designation not found' });
    }

    // Get employees using this designation
    const [employees] = await Designation.pool.execute(
      'SELECT id, name FROM employees WHERE designation_id = ?',
      [req.params.id]
    );

    if (employees.length > 0) {
      // If forceDelete is true and newDesignationId is provided, reassign employees first
      if (forceDelete === 'true' && newDesignationId) {
        // Check if new designation exists
        const newDesignation = await Designation.findById(newDesignationId);
        if (!newDesignation) {
          return res.status(404).json({ message: 'New designation not found' });
        }

        // Reassign employees
        await Designation.pool.execute(
          'UPDATE employees SET designation_id = ? WHERE designation_id = ?',
          [newDesignationId, req.params.id]
        );
      } else {
        return res.status(400).json({
          message: 'Cannot delete designation that is assigned to employees',
          employees: employees,
          employeeCount: employees.length
        });
      }
    }

    await Designation.delete(req.params.id);
    res.status(200).json({ 
      message: 'Designation deleted successfully',
      reassignedEmployees: employees.length > 0 ? employees : undefined
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 