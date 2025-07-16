const mysql = require('mysql2/promise');
const config = require('config');


const pool = mysql.createPool(config.get('mysql'));

async function connectToDatabase() {
    try {
        const connection = await pool.getConnection();
        console.log(`Successfully connected to database '${connection.config.database}'.`);
        connection.release();
    } catch (error) {
        console.error('Initial connection to DB failed!', error);
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
 * Fetches all metadata required for application initialization.
 * This function uses smaller fetch functions and runs them in parallel.
 * @returns {Promise<Object>} An object containing arrays of activities, population types, and permissions.
 */
async function fetchMetadataFromDB() {
    try {

        const [activities, populationTypes, permissions] = await Promise.all([
            getAllActivities(),
            getAllPopulationTypes(),
            getAllPermissions(),
        ]);

        return { activities, populationTypes, permissions };

    } catch (error) {
        console.error("Error fetching metadata from DB:", error);
        throw error;
    }
}
module.exports = {
    connectToDatabase,
    fetchMetadataFromDB
};