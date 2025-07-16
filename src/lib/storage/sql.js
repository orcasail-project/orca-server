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
 * מביא את כל הסירות (פעילות ולא פעילות) ממסד הנתונים.
 * @returns {Promise<Array>} רשימת כל הסירות.
 */
async function getAllBoats() {
    const [boats] = await pool.query('SELECT id, name, is_active FROM Boat ORDER BY name');
    return boats;
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

    const [results] = await pool.execute(query, [startTime, endTime]);
    return results;
}

/**
 * Fetches all metadata required for application initialization.
 * This function uses smaller fetch functions and runs them in parallel.
 * @returns {Promise<Object>} An object containing arrays of boats, activities, population types, and permissions.
 */
async function fetchMetadataFromDB() {
    try {
        const [boats, activities, populationTypes, permissions] = await Promise.all([
            getAllBoats(),
            getAllActivities(),
            getAllPopulationTypes(),
            getAllPermissions(),
        ]);

        return { boats, activities, populationTypes, permissions };

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
};