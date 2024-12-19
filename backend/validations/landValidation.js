const Joi = require('joi');

exports.landSchema = Joi.object({
  name: Joi.string().required().trim(),
  parcel_number: Joi.string().required().trim(),
  size: Joi.number().required().positive(),
  category: Joi.string().required().valid('agricultural', 'residential', 'commercial', 'forest', 'other'),
  ownership_status: Joi.string().required().valid('owned', 'rent'),
  location: Joi.string().required(),
  acquisition_date: Joi.date().required(),
  status: Joi.string().valid('active', 'inactive', 'under_maintenance').default('active'),
  description: Joi.string().allow('', null),
  rent_details: Joi.when('ownership_status', {
    is: 'rent',
    then: Joi.object({
      monthly_rent: Joi.number().required().positive(),
      lease_start_date: Joi.date().required(),
      lease_end_date: Joi.date().required(),
      lessor_name: Joi.string().required(),
      lessor_contact: Joi.string().required()
    }),
    otherwise: Joi.allow(null)
  })
}); 