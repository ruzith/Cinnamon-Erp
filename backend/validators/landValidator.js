const Joi = require('joi');

const landSchema = Joi.object({
  parcel_number: Joi.string().required().trim(),
  location: Joi.string().required().trim(),
  area: Joi.number().required().positive(),
  area_unit: Joi.string().valid('hectares', 'acres', 'square_meters').required(),
  acquisition_date: Joi.date().required(),
  status: Joi.string().valid('active', 'inactive', 'under_maintenance').default('active'),
  forest_type: Joi.string().required().trim(),
  soil_type: Joi.string().allow(null, ''),
  last_harvest_date: Joi.date().allow(null),
  next_harvest_date: Joi.date().allow(null),
  notes: Joi.string().allow(null, '')
});

exports.validateLand = (data) => landSchema.validate(data); 