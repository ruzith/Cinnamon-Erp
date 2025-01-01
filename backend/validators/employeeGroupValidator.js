const Joi = require('joi');

const employeeGroupSchema = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().allow(null, '').trim()
});

const groupMembersSchema = Joi.object({
  employeeIds: Joi.array().items(Joi.number().integer().required()).required()
});

exports.validateEmployeeGroup = (data) => employeeGroupSchema.validate(data);
exports.validateGroupMembers = (data) => groupMembersSchema.validate(data);