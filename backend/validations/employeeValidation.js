const Joi = require('joi');

exports.employeeSchema = Joi.object({
  name: Joi.string().required().trim(),
  nic: Joi.string().required(),
  phone: Joi.string().required(),
  address: Joi.string().required(),
  birthday: Joi.date().required(),
  designation: Joi.string().required(),
  group: Joi.string().required().valid('permanent', 'temporary')
}); 