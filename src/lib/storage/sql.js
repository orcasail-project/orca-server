const mysql = require('mysql2/promise');
const config = require('../../../config/default.json');

let pool;

async function initializeDatabasePool() {
    try {
      
        pool = mysql.createPool({
            ...config.mysql,
            waitForConnections: true,
            connectionLimit: 10, // מספר חיבורים מקסימלי ב-Pool, ניתן לכוונון
            queueLimit: 0
        });
        
        // בדיקה קטנה שה-Pool עובד
        await pool.query('SELECT 1');
        console.log(`Successfully created connection pool for database '${config.mysql.database}'.`);
        
    } catch (error) {
        console.error(`Error creating connection pool for database '${config.mysql.database}':`, error.message);
        // זהו שגיאה קריטית, השרת לא יכול לעבוד בלי Pool
        throw error;
    }
}
/**
 * מביא את כל הסירות (פעילות ולא פעילות) ממסד הנתונים.
 * @returns {Promise<Array>} רשימת כל הסירות.
 */
async function getAllBoats() {
    const [boats] = await pool.query('SELECT id, name, is_active FROM Boat ORDER BY name');
    return boats;
}

/**
 * פונקציה מרכזית: מביאה רשימה שטוחה של כל השיוטים וההזמנות שלהם בטווח זמנים נתון.
 * @param {Date} startTime - תאריך ושעת התחלה של הטווח.
 * @param {Date} endTime - תאריך ושעת סיום של הטווח.
 * @returns {Promise<Array>} רשימה שטוחה של נתונים.
 */
async function getUpcomingSailsData(startTime, endTime) {
    const query = `
        SELECT 
          b.id AS boat_id,
          b.name AS boat_name,
          s.id AS sail_id,
          TIMESTAMP(s.date, s.planned_start_time) AS planned_start_time,
          s.actual_start_time,
          s.population_type_id,
          pt.name AS population_type_name,
          s.notes AS sail_notes,
          s.requires_orca_escort,
          s.is_private_group,
          bk.id AS booking_id,
          c.id AS customer_id,
          c.name AS customer_name,
          c.phone_number AS customer_phone_number,
          bk.num_people_sail,
          bk.num_people_activity,
          bk.is_phone_booking
        FROM Boat b
        INNER JOIN BoatActivity ba ON ba.boat_id = b.id
        INNER JOIN Sail s ON s.boat_activity_id = ba.id
        LEFT JOIN Booking bk ON bk.sail_id = s.id
        LEFT JOIN Customer c ON c.id = bk.customer_id
        LEFT JOIN PopulationType pt ON pt.id = s.population_type_id
        WHERE 
          TIMESTAMP(s.date, s.planned_start_time) >= ?
          AND TIMESTAMP(s.date, s.planned_start_time) < ?
        ORDER BY b.name, planned_start_time, bk.id;
    `;

    // שליפת הנתונים מהמסד עם פרמטרים של טווח זמן
    // שימוש ב-pool.execute כדי למנוע SQL Injection
    const [results] = await pool.execute(query, [startTime, endTime]);
    return results;
}

// ייצוא הפונקציות כדי שניתן יהיה להשתמש בהן בקבצים אחרים
module.exports = {
    initializeDatabasePool,
    getAllBoats,
    getUpcomingSailsData,
};