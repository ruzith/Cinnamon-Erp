const Joi = require('joi');

const customerSchema = Joi.object({
  name: Joi.string().required().trim(),
  email: Joi.string().allow('', null),
  phone: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  credit_limit: Joi.number().min(0).default(0),
  current_balance: Joi.number().default(0),
  status: Joi.string().valid('active', 'inactive').default('active'),
  created_by: Joi.number().required()
});

exports.validateCustomer = (data) => customerSchema.validate(data, { abortEarly: false });