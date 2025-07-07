// src/lib/storage/sql.js

const mysql = require('mysql2/promise');
const config = require('config'); // שימוש בחבילת config, לא בייבוא ישיר של JSON

// ====================================================================
// יצירת ה-Pool וייצוא שלו באופן מיידי.
// ה-Pool הוא "מנהל חיבורים" חכם. הוא יפתח מספר חיבורים וישתמש בהם מחדש.
// זה יקרה פעם אחת בלבד כשהשרת עולה.
// ====================================================================
const pool = mysql.createPool(config.get('mysql'));

// ====================================================================
// פונקציית בדיקה שתרוץ פעם אחת כשהשרת עולה, כדי לוודא שהחיבור תקין.
// היא משתמשת ב-pool שכבר נוצר.
// ====================================================================
async function connectToDatabase() {
    try {
        // "שאל" חיבור מה-pool רק כדי לבדוק תקינות
        const connection = await pool.getConnection();
        console.log(`Successfully connected to database '${connection.config.database}'.`);
        // "החזר" את החיבור ל-pool מיד אחרי הבדיקה
        connection.release();
    } catch (error) {
        console.error('Initial connection to DB failed!', error);
        throw error; // זרוק שגיאה כדי לעצור את עליית השרת
    }
}

// ====================================================================
// ייצוא גם של הפונקציה (לבדיקה בעליית השרת) וגם של ה-pool (לשימוש בקונטרולרים).
// ====================================================================
module.exports = { connectToDatabase, pool };