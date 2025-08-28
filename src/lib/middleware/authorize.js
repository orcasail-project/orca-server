const authorize = (allowedRoles) => {
  return (req, res, next) => {
    // בדיקה שהמשתמש מאומת (צריך להריץ את authenticateToken קודם)
    if (!req.user) {
      return res.status(401).json({ message: "לא מאומת - חסר מידע משתמש" });
    }

    // בדיקת הרשאות לפי תפקיד
    const userRole = req.user.type || req.user.userType;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: "אין הרשאה - התפקיד שלך אינו מורשה לגשת למשאב זה",
        requiredRoles: allowedRoles,
        userRole: userRole
      });
    }

    next();
  };
};

// פונקציות עזר לתפקידים נפוצים
const authorizeManager = () => authorize([1]);
const authorizeSkipper = () => authorize([2]);
const authorizeManagerOrSkipper = () => authorize([1, 2]);

module.exports = {
  authorize,
  authorizeManager,
  authorizeSkipper,
  authorizeManagerOrSkipper
};