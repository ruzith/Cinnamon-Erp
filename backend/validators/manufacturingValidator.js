const Joi = require('joi');

const contractorSchema = Joi.object({
  name: Joi.string().required().trim(),
  contractor_id: Joi.string().required().trim(),
  phone: Joi.string().required().trim(),
  address: Joi.string().required().trim(),
  status: Joi.string().valid('active', 'inactive').default('active')
});

const assignmentSchema = Joi.object({
  contractor_id: Joi.number().integer().required(),
  quantity: Joi.number().positive().required(),
  unit_price: Joi.number().positive().required(),
  start_date: Joi.date().required(),
  end_date: Joi.date().allow(null),
  status: Joi.string().valid('active', 'completed', 'cancelled').default('active'),
  notes: Joi.string().allow(null, '')
});

exports.validateContractor = (data) => contractorSchema.validate(data);
exports.validateAssignment = (data) => assignmentSchema.validate(data); 