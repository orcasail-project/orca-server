const mysql = require('mysql2/promise');
const config = require('../../../config/default.json');

async function connectToDatabase() {
    try {
        // We only use the application user's credentials
        const connection = await mysql.createConnection(config.mysql);
        console.log(`Successfully connected to database '${config.mysql.database}'.`);
        return connection;
    } catch (error) {
        console.error(`Error connecting to database '${config.mysql.database}':`, error.message);
        // This error is now critical, it means the environment is not set up correctly.
        throw error;
    }
}


/**
 * מביא את כל הסירות (פעילות ולא פעילות) ממסד הנתונים.
 * @param {mysql.Connection} db - חיבור פעיל למסד הנתונים.
 * @returns {Promise<Array>} רשימת כל הסירות.
 */
async function getAllBoats(db) {
    const [boats] = await db.query('SELECT id, name, is_active FROM Boat ORDER BY name');
    return boats;
}

/**
 * פונקציה מרכזית: מביאה רשימה שטוחה של כל השיוטים וההזמנות שלהם בטווח זמנים נתון.
 * השאילתה מותאמת למבנה הטבלאות שסיפקת ומחזירה שורה לכל הזמנה, או שורה אחת לשיוט ללא הזמנות.
 * @param {mysql.Connection} db - חיבור פעיל למסד הנתונים.
 * @param {Date} startTime - תאריך ושעת התחלה של הטווח.
 * @param {Date} endTime - תאריך ושעת סיום של הטווח.
 * @returns {Promise<Array>} רשימה שטוחה של נתונים.
 */
async function getUpcomingSailsData(db, startTime, endTime) {
    const query = `
        SELECT 
          b.id AS boat_id,
          b.name AS boat_name,
          s.id AS sail_id,
          -- TIMESTAMP מחבר תאריך ושעה לשדה אחד תקין לשימוש וסינון
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
        -- JOIN לשיוטים רלוונטיים בטווח הזמן
        INNER JOIN BoatActivity ba ON ba.boat_id = b.id
        INNER JOIN Sail s ON s.boat_activity_id = ba.id
        -- LEFT JOIN כדי לקבל גם שיוטים ללא הזמנות
        LEFT JOIN Booking bk ON bk.sail_id = s.id
        -- LEFT JOIN כדי לקבל פרטי הזמנה אם קיימת
        LEFT JOIN Customer c ON c.id = bk.customer_id
        LEFT JOIN PopulationType pt ON pt.id = s.population_type_id
        WHERE 
          -- סינון לפי טווח הזמן שחושב בקונטרולר
          TIMESTAMP(s.date, s.planned_start_time) >= ?
          AND TIMESTAMP(s.date, s.planned_start_time) < ?
        ORDER BY b.name, planned_start_time, bk.id;
    `;

    const [results] = await db.execute(query, [startTime, endTime]);
    return results;
}

module.exports = {
    connectToDatabase,
    getAllBoats,
    getUpcomingSailsData,
};