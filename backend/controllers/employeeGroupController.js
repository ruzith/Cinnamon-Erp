const EmployeeGroup = require('../models/domain/EmployeeGroup');
const { validateEmployeeGroup, validateGroupMembers } = require('../validators/employeeGroupValidator');

// @desc    Get all employee groups with member count
// @route   GET /api/employee-groups
// @access  Private
exports.getEmployeeGroups = async (req, res) => {
  try {
    const groups = await EmployeeGroup.getWithMembers();
    res.status(200).json(groups);
  } catch (error) {
    console.error('Error fetching employee groups:', error);
    res.status(500).json({ message: 'Error fetching employee groups', error: error.message });
  }
};

// @desc    Get single employee group with members
// @route   GET /api/employee-groups/:id
// @access  Private
exports.getEmployeeGroup = async (req, res) => {
  try {
    const group = await EmployeeGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Employee group not found' });
    }

    const members = await EmployeeGroup.getGroupMembers(req.params.id);
    group.members = members;

    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create employee group
// @route   POST /api/employee-groups
// @access  Private/Admin
exports.createEmployeeGroup = async (req, res) => {
  try {
    const { error } = validateEmployeeGroup(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const group = await EmployeeGroup.create(req.body);
    res.status(201).json(group);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update employee group
// @route   PUT /api/employee-groups/:id
// @access  Private/Admin
exports.updateEmployeeGroup = async (req, res) => {
  try {
    const { error } = validateEmployeeGroup(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const group = await EmployeeGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Employee group not found' });
    }

    const updatedGroup = await EmployeeGroup.update(req.params.id, req.body);
    res.status(200).json(updatedGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete employee group
// @route   DELETE /api/employee-groups/:id
// @access  Private/Admin
exports.deleteEmployeeGroup = async (req, res) => {
  try {
    const group = await EmployeeGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Employee group not found' });
    }

    await EmployeeGroup.delete(req.params.id);
    res.status(200).json({ message: 'Employee group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add members to employee group
// @route   POST /api/employee-groups/:id/members
// @access  Private/Admin
exports.addGroupMembers = async (req, res) => {
  try {
    const { error } = validateGroupMembers(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const group = await EmployeeGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Employee group not found' });
    }

    await EmployeeGroup.addMembers(req.params.id, req.body.employeeIds);
    res.status(200).json({ message: 'Members added successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Remove members from employee group
// @route   DELETE /api/employee-groups/:id/members
// @access  Private/Admin
exports.removeGroupMembers = async (req, res) => {
  try {
    const { error } = validateGroupMembers(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const group = await EmployeeGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Employee group not found' });
    }

    await EmployeeGroup.removeMembers(req.params.id, req.body.employeeIds);
    res.status(200).json({ message: 'Members removed successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};