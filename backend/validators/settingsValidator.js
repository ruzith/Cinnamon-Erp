const Joi = require('joi');

const settingsSchema = Joi.object({
  company_name: Joi.string().required(),
  company_address: Joi.string().required(),
  company_phone: Joi.string().required(),
  vat_number: Joi.string().allow(null, ''),
  tax_number: Joi.string().allow(null, ''),
  logo_url: Joi.string().allow(null, ''),
  language: Joi.string().valid('en', 'si').default('en'),
  time_zone: Joi.string().valid(
    'Asia/Colombo',
    'Asia/Kolkata',
    'Asia/Dubai',
    'Asia/Singapore',
    'Europe/London',
    'America/New_York',
    'Pacific/Auckland'
  ).default('Asia/Colombo'),
  default_currency: Joi.number().integer().positive(),
  email_notifications: Joi.boolean().default(true),
  low_stock_alerts: Joi.boolean().default(true),
  payment_reminders: Joi.boolean().default(true),
  task_deadlines: Joi.boolean().default(true),
  maintenance_alerts: Joi.boolean().default(true),
  loan_due_alerts: Joi.boolean().default(true),
  auto_backup: Joi.boolean().default(true),
  backup_frequency: Joi.string().valid('daily', 'weekly', 'monthly').default('daily'),
  retention_period: Joi.number().integer().min(1).default(30),
  backup_location: Joi.string().valid('local', 'cloud').default('cloud')
}).unknown(false);

exports.validateSettings = (data) => settingsSchema.validate(data); 