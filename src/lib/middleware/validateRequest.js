// ה-Middleware מקבל סכמה ומאמת את גוף הבקשה לפיה
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);   
    next();
  } catch (error) {
  
    return res.status(400).json({
      errors: error.errors.map(err => err.message)
    });
  }
};

module.exports = validate;