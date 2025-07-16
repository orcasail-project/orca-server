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



/**
 * מחפש שיוטים זמינים לפי פרמטרים נתונים.
 * @param {object} searchParams - אובייקט המכיל את פרמטרי החיפוש.
 * @returns {Promise<Array>} - מערך של אובייקטים המייצגים שיוטים זמינים.
 */
async function findAvailableSails(searchParams) {
    try {
      
        const requestedTime = new Date(`${searchParams.date}T${searchParams.time}:00`);
        const timeBefore = new Date(requestedTime.getTime() - 30 * 60000).toTimeString().slice(0, 8); // HH:MM:SS
        const timeAfter = new Date(requestedTime.getTime() + 30 * 60000).toTimeString().slice(0, 8); // HH:MM:SS

       
        const potentialSailsQuery = `
      SELECT 
        
    `;

        const [potentialSails] = await pool.query(potentialSailsQuery, [
            searchParams.date,
            searchParams.population_type_id,
            searchParams.activity_id,
            timeBefore,
            timeAfter
        ]);

        if (potentialSails.length === 0) {
            return [];
        }

   
        const availableSails = [];
        for (const sail of potentialSails) {
            const occupancyQuery = `
            SELECT
      `;
            const [occupancyResult] = await pool.query(occupancyQuery, [sail.sail_id]);
            const occupancy = occupancyResult[0];


            const free_places_activity = sail.max_people_total - occupancy.current_activity_occupancy;
            const free_places_sail = sail.max_passengers - occupancy.current_sail_occupancy;

            if (free_places_activity >= searchParams.num_people_activity && free_places_sail >= searchParams.num_people_sail) {


                const sailTime = sail.planned_start_time.slice(0, 5); // חיתוך ל-HH:MM

                let matchType;
                if (sailTime === searchParams.time) {
                    matchType = 'full';
                } else if (sailTime < searchParams.time) {
                    matchType = 'down';
                } else {
                    matchType = 'up';
                }

                availableSails.push({
                    sail_id: sail.sail_id,
                    time: sailTime,
                    match: matchType,
                    num_people_activity: occupancy.current_activity_occupancy,
                    num_people_sail: occupancy.current_sail_occupancy,
                });
            }
        }

        return availableSails;

    } catch (error) {
        console.error("Error in findAvailableSails:", error);
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
    findAvailableSails,
};