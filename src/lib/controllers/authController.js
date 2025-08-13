const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const config = require("config");
const { registrationSchema, loginSchema } = require("../schemas/userSchema");
const { getUserByEmail, createUser } = require("../storage/sql");

const JWT_SECRET = process.env.JWT_SECRET || "OrcaSailSecretKey03082025$!";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";


//create a new user - register function (url: /auth/register)
const register = async (req, res) => {
  const { error, value } = registrationSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { email, password, fullName, phoneNumber, roleId } = value;

  try {
    // בדיקה אם המשתמש כבר קיים
    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(404).json({ message: "מייל לא ייחודי" });
    }

    // הצפנת סיסמה
    const hashedPassword = await bcrypt.hash(password, 10);

    // יצירת משתמש
    const newUser = await createUser({
      email,
      password: hashedPassword,
      fullName,
      phoneNumber,
      roleId: roleId || 2, // ברירת מחדל ל־roleId 2 אם לא נשלח
    });

    res.status(201).json({ message: "נרשמת בהצלחה", user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "שגיאה בשרת" });
  }
};

//exists user - login function (url: /auth/login)
const login = async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { email, password, userType } = value;

  try {
    // בדיקה אם המשתמש קיים עם סוג המשתמש הנכון
    const user = await getUserByEmail(email, userType);
    if (!user) {
      return res.status(401).json({ message: "מייל לא קיים" });
    }

    // בדיקת הסיסמה
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "הסיסמא שגויה" });
    }
    // בדיקה אם סוג המשתמש תואם
    if (user.role_id !== userType) {
      return res.status(401).json({ message: "סוג המשתמש לא תואם" });
    }

    // החזרת פרטי המשתמש
    const userResponse = {
      userId: user.id,
      name: user.full_name,
      email: user.email,
      type: user.role_id,
    };

    const token = jwt.sign(userResponse, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.json({
      message: "התחברת בהצלחה",
      user: userResponse,
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "שגיאה בשרת" });
  }
};

module.exports = { register, login };
