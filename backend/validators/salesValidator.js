const Joi = require('joi');

const salesItemSchema = Joi.object({
  product_id: Joi.number().integer().required(),
  quantity: Joi.number().positive().required(),
  unit_price: Joi.number().positive().required(),
  discount: Joi.number().min(0).default(0),
  sub_total: Joi.number().positive().required()
});

const salesInvoiceSchema = Joi.object({
  date: Joi.date().required(),
  customer_name: Joi.string().required().trim(),
  customer_address: Joi.string().allow(null, ''),
  customer_phone: Joi.string().allow(null, ''),
  customer_email: Joi.string().email().allow(null, ''),
  items: Joi.array().items(salesItemSchema).min(1).required(),
  sub_total: Joi.number().positive().required(),
  discount: Joi.number().min(0).max(Joi.ref('sub_total')).default(0),
  tax: Joi.number().min(0).max(100).default(0),
  total: Joi.number().positive().required(),
  payment_method: Joi.string().valid('cash', 'card', 'bank-transfer', 'other').required(),
  payment_status: Joi.string().valid('pending', 'partial', 'paid').default('pending'),
  notes: Joi.string().allow(null, ''),
  status: Joi.string().valid('draft', 'confirmed', 'cancelled').default('draft')
});

exports.validateSalesInvoice = (data) => salesInvoiceSchema.validate(data); 