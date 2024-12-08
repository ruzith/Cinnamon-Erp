const Joi = require('joi');

const employeeSchema = Joi.object({
  name: Joi.string().required().trim(),
  nic: Joi.string().required().trim(),
  phone: Joi.string().required().trim(),
  address: Joi.string().required().trim(),
  birthday: Joi.date().required(),
  designation_id: Joi.number().integer().required(),
  employment_type: Joi.string().valid('permanent', 'temporary').required(),
  status: Joi.string().valid('active', 'inactive').default('active'),
  salary_structure_id: Joi.number().integer().required(),
  bank_name: Joi.string().allow(null, ''),
  account_number: Joi.string().allow(null, ''),
  account_name: Joi.string().allow(null, '')
});

exports.validateEmployee = (data) => employeeSchema.validate(data); 