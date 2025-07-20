const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { registrationSchema, loginSchema } = require('../schemas/userSchema');
const { getUserByEmail, createUser } = require('../storage/sql');

const register = async (req, res) => {
  const { error, value } = registrationSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { email, password, firstName, lastName, phoneNumber, roleId } = value;

  try {
    // בדיקה אם המשתמש כבר קיים
    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(404).json({ message: 'משתמש כבר קיים' });
    }

    // הצפנת סיסמה
    const hashedPassword = await bcrypt.hash(password, 10);

    // יצירת משתמש
    const newUser = await createUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phoneNumber,
      roleId: roleId || 2 // ברירת מחדל ל־roleId 2 אם לא נשלח
    });

    res.status(201).json({ message: 'נרשמת בהצלחה', user: newUser });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'שגיאה בשרת' });
  }
};


module.exports = { register };
