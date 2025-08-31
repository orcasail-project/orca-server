const Joi = require('joi');

const registrationSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'האימייל אינו תקין',
      'string.empty': 'שדה האימייל הוא חובה',
      'any.required': 'שדה האימייל הוא חובה'
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'הסיסמה חייבת להיות לפחות 6 תווים',
      'string.empty': 'שדה הסיסמה הוא חובה',
      'any.required': 'שדה הסיסמה הוא חובה'
    }),

  fullName: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'השם הפרטי חייב להכיל לפחות 2 תווים',
      'string.max': 'השם לא יכול להיות ארוך מ-50 תווים',
      'string.empty': 'שדה השם הוא חובה',
      'any.required': 'שדה השם הוא חובה'
    }),

  phoneNumber: Joi.string()
    .pattern(/^(?:\+972|0)(?:[23489]|5[0-9]|7[2-9])[0-9]{7}$/)
    .required()
    .messages({
      'string.pattern.base': 'מספר הטלפון אינו תקין',
      'string.empty': 'שדה מספר הטלפון הוא חובה',
      'any.required': 'שדה מספר הטלפון הוא חובה'
    }),
    roleId: Joi.number().integer().valid(1, 2, 3).default(2).messages({
    'any.only': 'roleId חייב להיות מספר תקני',
    'number.base': 'roleId חייב להיות מספר תקני'
  })
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'האימייל אינו תקין',
      'string.empty': 'שדה האימייל הוא חובה',
      'any.required': 'שדה האימייל הוא חובה'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'סיסמה חייבת להכיל לפחות 6 תווים',
      'any.required': 'סיסמה היא שדה חובה'
    }),
  userType: Joi.number()
    .required()
    .messages({
      'any.required': 'סוג משתמש הוא שדה חובה'
    })
});

module.exports = { registrationSchema, loginSchema };
