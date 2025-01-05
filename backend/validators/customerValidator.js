const Joi = require('joi');

const customerSchema = Joi.object({
  name: Joi.string().required().min(2).max(255)
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot be longer than 255 characters'
    }),

  email: Joi.string().email().allow(null, '')
    .messages({
      'string.email': 'Please enter a valid email address'
    }),

  phone: Joi.string().required().pattern(/^[0-9+\-\s()]{10,20}$/)
    .messages({
      'string.empty': 'Phone number is required',
      'string.pattern.base': 'Please enter a valid phone number'
    }),

  address: Joi.string().required().min(5).max(1000)
    .messages({
      'string.empty': 'Address is required',
      'string.min': 'Address must be at least 5 characters long',
      'string.max': 'Address cannot be longer than 1000 characters'
    }),

  credit_limit: Joi.number().min(0).default(0)
    .messages({
      'number.min': 'Credit limit cannot be negative'
    }),

  current_balance: Joi.number().default(0),

  status: Joi.string().valid('active', 'inactive').default('active'),

  created_by: Joi.number().required()
    .messages({
      'number.base': 'Created by must be a number',
      'any.required': 'Created by is required'
    })
});

const validateCustomer = (data) => {
  return customerSchema.validate(data, { abortEarly: false });
};

module.exports = {
  validateCustomer
};