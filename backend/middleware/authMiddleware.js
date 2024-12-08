const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token (modified to work with your database)
      const user = await User.findById(decoded.id);
      if (!user) {
        res.status(401);
        return res.json({ message: 'User not found' });
      }

      // Remove password from user object
      delete user.password;
      req.user = user;

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401);
      return res.json({ message: 'Not authorized' });
    }
  }

  if (!token) {
    res.status(401);
    return res.json({ message: 'Not authorized, no token' });
  }
});

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      return res.json({ 
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };