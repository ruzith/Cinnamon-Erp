const Joi = require('joi');

const landSchema = Joi.object({
  name: Joi.string().required().trim(),
  land_number: Joi.string().required().trim(),
  size: Joi.number().required().positive(),
  category_id: Joi.number().integer().required(),
  ownership_status: Joi.string().valid('owned', 'rent').required(),
  location: Joi.string().required().trim(),
  acquisition_date: Joi.date().required(),
  status: Joi.string().valid('active', 'inactive', 'under_maintenance').default('active'),
  description: Joi.string().allow(null, ''),
  rent_details: Joi.object({
    monthly_rent: Joi.number().when('ownership_status', {
      is: 'rent',
      then: Joi.required()
    }),
    lease_start_date: Joi.date().when('ownership_status', {
      is: 'rent',
      then: Joi.required()
    }),
    lease_end_date: Joi.date().when('ownership_status', {
      is: 'rent',
      then: Joi.required()
    }),
    lessor_name: Joi.string().when('ownership_status', {
      is: 'rent',
      then: Joi.required()
    }),
    lessor_contact: Joi.string().when('ownership_status', {
      is: 'rent',
      then: Joi.required()
    })
  }).allow(null)
});

exports.validateLand = (data) => landSchema.validate(data);