const Joi = require('joi');

const contractorSchema = Joi.object({
  name: Joi.string().required().trim(),
  contractor_id: Joi.string().required().trim(),
  phone: Joi.string().required().trim(),
  status: Joi.string().valid('active', 'inactive').default('active')
});

const assignmentSchema = Joi.object({
  contractor_id: Joi.number().integer().required(),
  land_id: Joi.number().integer().required(),
  start_date: Joi.date().required(),
  end_date: Joi.date().required(),
  status: Joi.string().valid('active', 'completed', 'cancelled').default('active')
});

exports.validateContractor = (data) => contractorSchema.validate(data);
exports.validateAssignment = (data) => assignmentSchema.validate(data); 