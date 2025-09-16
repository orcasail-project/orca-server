// src/config/index.js
const config = require('config');

// קרא את כל ההגדרות פעם אחת ושמור אותן במשתנים
// זה מבטיח שהקריאה ל-config.get נעשית רק כאן.
const serverConfig = config.get('server');
const mysqlConfig = config.get('mysql');
const emailConfig = config.get('email');

// ייצא את ההגדרות כאובייקט אחד
module.exports = {
  serverConfig,
  mysqlConfig,
  emailConfig,
};