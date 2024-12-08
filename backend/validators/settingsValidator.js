const Joi = require('joi');

const currencySchema = Joi.object({
  code: Joi.string().required().length(3).uppercase(),
  name: Joi.string().required(),
  symbol: Joi.string().required(),
  rate: Joi.number().required().min(0)
});

const settingsSchema = Joi.object({
  company_name: Joi.string().required(),
  company_address: Joi.string().required(),
  company_phone: Joi.string().required(),
  vat_number: Joi.string().allow(null, ''),
  tax_number: Joi.string().allow(null, ''),
  logo_url: Joi.string().allow(null, ''),
  language: Joi.string().valid('en', 'si').default('en'),
  default_currency: Joi.string().length(3).uppercase().default('USD'),
  currencies: Joi.array().items(currencySchema).default([]),
  email_notifications: Joi.boolean().default(true),
  low_stock_alerts: Joi.boolean().default(true),
  payment_reminders: Joi.boolean().default(true),
  task_deadlines: Joi.boolean().default(true),
  maintenance_alerts: Joi.boolean().default(true),
  loan_due_alerts: Joi.boolean().default(true),
  auto_backup: Joi.boolean().default(true),
  backup_frequency: Joi.string().default('daily'),
  retention_period: Joi.number().default(30),
  backup_location: Joi.string().default('cloud')
});

exports.validateSettings = (data) => settingsSchema.validate(data);
exports.validateCurrency = (data) => currencySchema.validate(data); 