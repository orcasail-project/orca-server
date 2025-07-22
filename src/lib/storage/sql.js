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


/**
 * מביא את כל השיוטים הפוטנציאליים בטווח זמן נתון, כולל חישוב התפוסה הנוכחית שלהם,
 * והכל בשאילתה אחת יעילה.
 * @param {object} searchParams - פרמטרי החיפוש.
 * @returns {Promise<Array>} - מערך של שיוטים, כאשר לכל אחד יש נתוני קיבולת ותפוסה.
 */
async function findSailsWithOccupancy(searchParams) {
    try {
        const { date, time, population_type_id, activity_id } = searchParams;

        const timeBefore = new Date(`${date}T${time}:00`).getTime() - 30 * 60000;
        const timeAfter = new Date(`${date}T${time}:00`).getTime() + 30 * 60000;
        const timeBeforeStr = new Date(timeBefore).toTimeString().slice(0, 8);
        const timeAfterStr = new Date(timeAfter).toTimeString().slice(0, 8);

      
        const query = `
            SELECT 
                s.id AS sail_id, 
                s.planned_start_time,
                b.max_passengers AS sail_capacity,
                a.max_people_total AS activity_capacity,
                a.name AS activity_name,
                pt.name AS population_type_name,
                COALESCE(SUM(bk.num_people_activity), 0) AS current_activity_occupancy,
                COALESCE(SUM(bk.num_people_sail), 0) AS current_sail_occupancy
            FROM Sail AS s
            JOIN BoatActivity AS ba ON s.boat_activity_id = ba.id
            JOIN Activity AS a ON ba.activity_id = a.id
            JOIN Boat AS b ON ba.boat_id = b.id
            JOIN PopulationType AS pt ON s.population_type_id = pt.id
            LEFT JOIN Booking AS bk ON s.id = bk.sail_id
            WHERE 
                s.date = ? 
              AND s.population_type_id = ? 
              AND a.id = ? 
              AND s.planned_start_time BETWEEN ? AND ?
            GROUP BY s.id, s.planned_start_time, b.max_passengers, a.max_people_total, a.name, pt.name;
        `;

        const [sails] = await pool.query(query, [date, population_type_id, activity_id, timeBeforeStr, timeAfterStr]);
        return sails;

    } catch (error) {
        console.error("Error in findSailsWithOccupancy:", error);
        throw error;
    }
}




module.exports = {
    initializeDatabasePool,
    getAllBoats,
    getAllActivities,
    getAllPopulationTypes,
    getAllPermissions,
    fetchMetadataFromDB,
    findSailsWithOccupancy
};

