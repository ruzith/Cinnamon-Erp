const Joi = require('joi');

exports.validateProduct = (data) => {
  const schema = Joi.object({
    code: Joi.string().required(),
    name: Joi.string().required(),
    category_id: Joi.number().required(),
    description: Joi.string().allow('', null),
    unit_price: Joi.number().required(),
    stock_quantity: Joi.number().min(0).default(0),
    minimum_quantity: Joi.number().min(0).default(0),
    status: Joi.string().valid('active', 'inactive').default('active')
  });

  return schema.validate(data);
}; 