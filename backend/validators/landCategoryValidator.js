const Joi = require('joi');

const landCategorySchema = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().allow(null, ''),
  status: Joi.string().valid('active', 'inactive').default('active')
});

exports.validateLandCategory = (data) => landCategorySchema.validate(data);