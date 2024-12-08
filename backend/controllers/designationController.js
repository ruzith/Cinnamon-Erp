const Designation = require('../models/Designation');
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

// @desc    Delete designation
// @route   DELETE /api/designations/:id
// @access  Private/Admin
exports.deleteDesignation = async (req, res) => {
  try {
    const designation = await Designation.findById(req.params.id);
    if (!designation) {
      return res.status(404).json({ message: 'Designation not found' });
    }

    // Check if any employees are using this designation
    const [rows] = await designation.pool.execute(
      'SELECT COUNT(*) as count FROM employees WHERE designation_id = ?',
      [req.params.id]
    );

    if (rows[0].count > 0) {
      return res.status(400).json({
        message: 'Cannot delete designation that is assigned to employees'
      });
    }

    await Designation.delete(req.params.id);
    res.status(200).json({ message: 'Designation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 