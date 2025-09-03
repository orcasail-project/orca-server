const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const config = require("config");
const { registrationSchema, loginSchema } = require("../schemas/userSchema");
const { getUserByEmail, createUser, updateUserPassword, updateUserDetails } = require("../storage/sql");
const emailService = require("../services/emailService");

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
    console.log('Login attempt for:', email);
    console.log('Password from DB (hashed):', user.password);
    console.log('Password provided (plain):', password);
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Password validation result:', validPassword);
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

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "כתובת מייל נדרשת" });
  }

  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "כתובת המייל לא נמצאה במערכת" });
    }

    const temporaryPassword = emailService.generateTemporaryPassword();
    const hashedTempPassword = await bcrypt.hash(temporaryPassword, 10);

    const updateSuccess = await updateUserPassword(email, hashedTempPassword);
    if (!updateSuccess) {
      return res.status(500).json({ message: "שגיאה בעדכון הסיסמה" });
    }

    const emailResult = await emailService.sendPasswordResetEmail(
      email, 
      user.full_name, 
      temporaryPassword
    );

    if (!emailResult.success) {
      return res.status(500).json({ message: "שגיאה בשליחת המייל" });
    }

    res.json({ 
      message: "סיסמה זמנית נשלחה למייל שלך",
      success: true 
    });

  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "שגיאה בשרת" });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userEmail = req.user.email;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "סיסמה נוכחית וחדשה נדרשות" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "הסיסמה החדשה קצרה מדי" });
  }

  try {
    const user = await getUserByEmail(userEmail);
    if (!user) {
      return res.status(404).json({ message: "משתמש לא נמצא" });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "הסיסמה הנוכחית שגויה" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    console.log('changePassword: About to update password for:', userEmail);
    console.log('New password (plain):', newPassword);
    console.log('New password (hashed):', hashedNewPassword);
    
    const updateSuccess = await updateUserPassword(userEmail, hashedNewPassword);
    
    if (!updateSuccess) {
      console.error('Password update failed for user:', userEmail);
      return res.status(500).json({ message: "שגיאה בעדכון הסיסמה" });
    }

    res.json({ 
      message: "הסיסמה עודכנה בהצלחה",
      success: true 
    });

  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "שגיאה בשרת" });
  }
};

const updateUser = async (req, res) => {
  const { fullName, phone } = req.body;
  const userEmail = req.user.email;

  if (!fullName || !phone) {
    return res.status(400).json({ message: "שם מלא וטלפון נדרשים" });
  }

  // Basic phone number validation
  const phoneRegex = /^[0-9+\-\s()]+$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ message: "מספר טלפון לא תקין" });
  }

  try {
    const updateSuccess = await updateUserDetails(userEmail, {
      fullName: fullName.trim(),
      phone: phone.trim()
    });
    
    if (!updateSuccess) {
      return res.status(500).json({ message: "שגיאה בעדכון הפרטים" });
    }

    // Get updated user data
    const updatedUser = await getUserByEmail(userEmail);
    if (!updatedUser) {
      return res.status(404).json({ message: "משתמש לא נמצא" });
    }

    const userResponse = {
      userId: updatedUser.id,
      name: updatedUser.full_name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      type: updatedUser.role_id,
    };

    res.json({ 
      message: "פרטי המשתמש עודכנו בהצלחה",
      user: userResponse,
      success: true 
    });

  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ message: "שגיאה בשרת" });
  }
};

module.exports = { register, login, forgotPassword, changePassword, updateUser };
