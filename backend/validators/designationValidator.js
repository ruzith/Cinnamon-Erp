const Joi = require('joi');

const designationSchema = Joi.object({
  title: Joi.string().required().trim(),
  description: Joi.string().allow(null, ''),
  department: Joi.string().required().trim()
});

exports.validateDesignation = (data) => designationSchema.validate(data); 