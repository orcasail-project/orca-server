const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
const config = require('config');
const { registrationSchema, loginSchema } = require('../schemas/userSchema');
const { getUserByEmail, createUser, getUserByNameAndRole } = require('../storage/sql');

const register = async (req, res) => {
  const { error, value } = registrationSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { email, password, fullName, phoneNumber, roleId } = value;

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
      fullName,
      phoneNumber,
      roleId: roleId || 2 // ברירת מחדל ל־roleId 2 אם לא נשלח
    });

    res.status(201).json({ message: 'נרשמת בהצלחה', user: newUser });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'שגיאה בשרת' });
  }
};

const login = async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { username, password, userType } = value;

  try {
    // בדיקה אם המשתמש קיים עם סוג המשתמש הנכון
    const user = await getUserByNameAndRole(username, userType);
    if (!user) {
      return res.status(401).json({ message: 'שם משתמש או סיסמה שגויים' });
    }

    // בדיקת הסיסמה
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'שם משתמש או סיסמה שגויים' });
    }

    // החזרת פרטי המשתמש
    const userResponse = {
      userId: user.id,
      name: user.full_name,
      email: user.email,
      type: user.role_id
    };

    res.json({ 
      message: 'התחברת בהצלחה',
      user: userResponse
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'שגיאה בשרת' });
  }
};

module.exports = { register, login };
