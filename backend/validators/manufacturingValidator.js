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
  duration: Joi.number().integer().positive().required(),
  duration_type: Joi.string().valid('day', 'week', 'month').required(),
  start_date: Joi.date().required(),
  raw_material_id: Joi.number().integer().required(),
  raw_material_quantity: Joi.number().positive().required(),
  notes: Joi.string().allow('', null)
});

const orderSchema = Joi.object({
  product_id: Joi.number().integer().required(),
  quantity: Joi.number().integer().positive().required(),
  assigned_to: Joi.number().integer().allow(null),
  status: Joi.string().valid('planned', 'in_progress', 'completed', 'cancelled').default('planned'),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
  start_date: Joi.date().required(),
  end_date: Joi.date().allow(null, ''),
  notes: Joi.string().allow(null, ''),
  order_number: Joi.string()
});

const advancePaymentSchema = Joi.object({
  contractor_id: Joi.number().integer().required(),
  amount: Joi.number().positive().required(),
  payment_date: Joi.date().required(),
  notes: Joi.string().allow(null, '')
});

exports.validateContractor = (data) => contractorSchema.validate(data);
exports.validateAssignment = (data) => assignmentSchema.validate(data);
exports.validateOrder = (data) => orderSchema.validate(data);
exports.validateAdvancePayment = (data) => advancePaymentSchema.validate(data);