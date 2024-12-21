const User = require('../models/domain/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  // Check if user exists
  const userExists = await User.findByEmail(email);

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user with default role of 'staff'
  const user = await User.create({
    name,
    email,
    password,
    role: 'staff', // Set default role for registration
    status: 'active', // Set default status
    department: null // No department by default for self-registration
  });

  if (user) {
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      department: user.department,
      token: generateToken(user.id)
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findByEmail(email);

  if (user && (await User.validatePassword(user, password))) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id)
    });
  } else {
    res.status(400);
    throw new Error('Invalid credentials');
  }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll();
  res.status(200).json(users);
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.status(200).json(user);
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.update(req.params.id, req.body);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.status(200).json(user);
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.delete(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.status(200).json({ message: 'User deleted successfully' });
});

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, status } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please add all required fields');
  }

  // Check if user exists
  const userExists = await User.findByEmail(email);
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user with role validation
  const validRoles = ['admin', 'staff', 'accountant', 'manager'];
  const validStatuses = ['active', 'inactive'];
  
  const user = await User.create({
    name,
    email,
    password,
    role: validRoles.includes(role) ? role : 'staff',
    status: validStatuses.includes(status) ? status : 'active',
    department: department || null
  });

  if (user) {
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      department: user.department
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

module.exports = {
  registerUser,
  loginUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  createUser
};

// Other controller methods... 