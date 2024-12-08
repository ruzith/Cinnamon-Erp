const Joi = require('joi');

const inventorySchema = Joi.object({
  product_name: Joi.string().required().trim(),
  category: Joi.string().required().trim(),
  quantity: Joi.number().min(0).default(0),
  unit: Joi.string().required().trim(),
  min_stock_level: Joi.number().required().min(0),
  max_stock_level: Joi.number().required().min(Joi.ref('min_stock_level')),
  location: Joi.string().required().trim(),
  unit_price: Joi.number().required().min(0),
  description: Joi.string().allow(null, '')
});

const transactionSchema = Joi.object({
  item_id: Joi.number().integer().required(),
  type: Joi.string().valid('IN', 'OUT', 'ADJUSTMENT').required(),
  quantity: Joi.number().positive().required(),
  reference: Joi.string().allow(null, ''),
  notes: Joi.string().allow(null, '')
});

exports.validateInventory = (data) => inventorySchema.validate(data);
exports.validateTransaction = (data) => transactionSchema.validate(data); 