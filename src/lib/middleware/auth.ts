const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "your-very-secret-key";

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "אין הרשאה (חסר טוקן)" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "טוקן שגוי או שפג תוקפו" });
    req.user = user; // עכשיו אפשר לגשת למידע על המשתמש
    next();
  });
}

module.exports = authenticateToken;
