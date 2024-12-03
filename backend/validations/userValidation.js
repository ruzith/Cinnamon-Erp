const Joi = require('joi');

exports.createUserSchema = Joi.object({
  username: Joi.string().required().min(3),
  email: Joi.string().required().email(),
  password: Joi.string().required().min(6),
  role: Joi.string().valid('admin', 'accountant', 'staff')
});

exports.loginSchema = Joi.object({
  email: Joi.string().required().email(),
  password: Joi.string().required()
}); 