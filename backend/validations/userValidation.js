const Joi = require('joi');

exports.createUserSchema = Joi.object({
  name: Joi.string().required().min(3),
  email: Joi.string().required().email(),
  password: Joi.string().required().min(6),
  role: Joi.string().valid('admin', 'staff', 'accountant', 'manager').default('staff')
});

exports.loginSchema = Joi.object({
  email: Joi.string().required().email(),
  password: Joi.string().required()
}); 