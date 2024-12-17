const Joi = require('joi');

exports.landSchema = Joi.object({
  name: Joi.string().required().trim(),
  size: Joi.number().required().positive(),
  category: Joi.string().required(),
  status: Joi.string().required().valid('owned', 'rent'),
  location: Joi.string().required(),
  description: Joi.string().allow('', null)
}); 