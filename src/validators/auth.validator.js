const Joi = require("joi");

const studentRegistrationSchema = Joi.object({
  fullName: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .required()
    .messages({
      "string.empty": "Full name is required",
      "string.min": "Full name must be at least 3 characters",
      "string.max": "Full name cannot exceed 100 characters",
    }),

  phoneNumber: Joi.string()
    .trim()
    .pattern(/^[0-9+\-\s()]{10,20}$/)
    .required()
    .messages({
      "string.empty": "Phone number is required",
      "string.pattern.base": "Please provide a valid phone number",
    }),

  courseId: Joi.string()
    .trim()
    .required()
    .messages({
      "string.empty": "Course is required",
    }),

  password: Joi.string()
    .min(8)
    .max(100)
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 8 characters",
      "string.max": "Password cannot exceed 100 characters",
    }),
});

const studentLoginSchema = Joi.object({
  registrationNumber: Joi.string()
    .trim()
    .required()
    .messages({
      "string.empty": "Registration number is required",
    }),

  password: Joi.string()
    .required()
    .messages({
      "string.empty": "Password is required",
    }),
});
const adminLoginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .email()
    .required()
    .messages({
      "string.email": "Please provide a valid email",
      "string.empty": "Email is required",
    }),

  password: Joi.string()
    .required()
    .messages({
      "string.empty": "Password is required",
    }),
});

module.exports = {
  studentRegistrationSchema,
  studentLoginSchema,
  adminLoginSchema
};