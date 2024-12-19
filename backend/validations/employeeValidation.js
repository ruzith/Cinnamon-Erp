const Joi = require('joi');

exports.employeeSchema = Joi.object({
  name: Joi.string().required().trim(),
  nic: Joi.string().required(),
  phone: Joi.string().required(),
  address: Joi.string().required(),
  birthday: Joi.date().required(),
  designation_id: Joi.number().required(),
  employment_type: Joi.string().required().valid('permanent', 'temporary'),
  status: Joi.string().required().valid('active', 'inactive', 'on_leave'),
  salary_structure_id: Joi.number().allow(null, ''),
  bank_name: Joi.string().allow(''),
  account_number: Joi.string().allow(''),
  account_name: Joi.string().allow('')
}); 