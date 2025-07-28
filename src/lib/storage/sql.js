const mysql = require('mysql2/promise');
const config = require('config');

let pool;

/**
 * מאתחל את מאגר החיבורים (Connection Pool) למסד הנתונים
 * תוך שימוש בהגדרות מקובץ הקונפיגורציה.
 */
async function initializeDatabasePool() {
    const mysqlConfig = config.get('mysql');

    try {
        pool = mysql.createPool(mysqlConfig);

        await pool.query('SELECT 1');
        console.log(`Successfully created connection pool for database '${mysqlConfig.database}'.`);

    } catch (error) {
        console.error(`Error creating connection pool for database '${mysqlConfig.database}':`, error.message);
        throw error;
    }
}



/**
 * Fetches all activities from the database.
 * @returns {Promise<Array>} An array of activity objects.
 */
async function getAllActivities() {
    const query = 'SELECT id, name, ticket_price, min_age, max_people_total FROM Activity';
    const [activities] = await pool.query(query);
    return activities;
}

/**
 * Fetches all population types from the database.
 * @returns {Promise<Array>} An array of population type objects.
 */
async function getAllPopulationTypes() {
    const [populationTypes] = await pool.query('SELECT id, name FROM PopulationType');
    return populationTypes;
}

/**
 * Fetches all permissions from the database.
 * @returns {Promise<Array>} An array of permission objects.
 */
async function getAllPermissions() {
    const query = 'SELECT id, name, can_assign, can_change_status FROM Permission';
    const [permissions] = await pool.query(query);
    return permissions;
}

/**
 * מביא את כל הסירות (פעילות ולא פעילות) ממסד הנתונים.
 * @returns {Promise<Array>} רשימת כל הסירות.
 */
async function getAllBoats() {
    const [boats] = await pool.query('SELECT id, name,id AS boat_key, is_active FROM Boat ORDER BY id');
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
          b.id AS boat_id, -- הכי חשוב: ה-ID של הסירה
          s.id AS sail_id,
          TIMESTAMP(s.date, s.planned_start_time) AS planned_start_time,
          s.actual_start_time,
          s.population_type_id, -- שלח את ה-ID, הקליינט יתרגם
          pt.name AS population_type_name, -- אפשר לשלוח כשם ברירת מחדל
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
         ORDER BY b.sort_order, planned_start_time, bk.id;
    `;
    const [results] = await pool.execute(query, [startTime, endTime]);
    return results;
}

/**
 * מביא פרטי שיוט בסיסיים לפי מזהה השיוט
 * @param {number} sailId - מזהה השיוט
 * @returns {Promise<Object|null>} נתוני השיוט או null אם לא נמצא
 */
async function getSailById(sailId) {
    const sailQuery = `
        SELECT 
            s.id AS sail_id,
            s.date,
            s.planned_start_time,
            s.actual_start_time,
            s.end_time,
            s.is_private_group,
            s.requires_orca_escort, -- השדה המקורי מהטבלה
            s.notes,
            pt.name AS population_type,
            a.name AS boat_activity,
            b.name AS boat,
            b.max_passengers AS boat_max_capacity -- הוספנו את קיבולת הסירה לחישובים
        FROM Sail s
        LEFT JOIN PopulationType pt ON pt.id = s.population_type_id
        LEFT JOIN BoatActivity ba ON ba.id = s.boat_activity_id
        LEFT JOIN Activity a ON a.id = ba.activity_id
        LEFT JOIN Boat b ON b.id = ba.boat_id
        WHERE s.id = ?
    `;

    const [sailResults] = await pool.execute(sailQuery, [sailId]);
    return sailResults.length > 0 ? sailResults[0] : null;
}

/**
 * מביא את ההזמנות של שיוט ספציפי
 * @param {number} sailId - מזהה השיוט
 * @returns {Promise<Array>} רשימת ההזמנות
 */
async function getBookingsBySailId(sailId) {
    const bookingsQuery = `
        SELECT 
            bk.id AS booking_id,
            c.name,
            c.phone_number AS phone,
            bk.num_people_activity,
            bk.num_people_sail,
            bk.final_price,
            bk.notes AS note,
            bk.up_to_16_year,
            pt_payment.name AS payment_type
        FROM Booking bk
        LEFT JOIN Customer c ON c.id = bk.customer_id
        LEFT JOIN PaymentType pt_payment ON pt_payment.id = bk.payment_type_id
        WHERE bk.sail_id = ?
        ORDER BY bk.id
    `;

    const [bookingsResults] = await pool.execute(bookingsQuery, [sailId]);
    return bookingsResults;
}

/**
 * Fetches all metadata required for application initialization.
 * This function uses smaller fetch functions and runs them in parallel.
 * @returns {Promise<Object>} An object containing arrays of boats, activities, population types, and permissions.
 */
async function fetchMetadataFromDB() {
    try {
        const [ activities, populationTypes, permissions] = await Promise.all([
            // getAllBoats(),
            getAllActivities(),
            getAllPopulationTypes(),
            getAllPermissions(),
        ]);

        return {  activities, populationTypes, permissions };

    } catch (error) {
        console.error("Error fetching metadata from DB:", error);
        throw error;
    }
}

module.exports = {
    initializeDatabasePool,
    getAllBoats,
    getUpcomingSailsData,
    getAllActivities,
    getAllPopulationTypes,
    getAllPermissions,
    fetchMetadataFromDB,
    getSailById,
    getBookingsBySailId,
};