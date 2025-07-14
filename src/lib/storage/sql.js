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


async function fetchMetadataFromDB() {
    try {
       
        const [
            activitiesResult,
            populationTypesResult,
            permissionsResult
        ] = await Promise.all([
            pool.query('SELECT id, name, ticket_price, min_age, max_people_total FROM Activity'),
            pool.query('SELECT id, name FROM PopulationType'),
            pool.query('SELECT id, name, can_assign, can_change_status FROM Permission'),
        ]);

         
        const metadata = {
            activities: activitiesResult[0],
            populationTypes: populationTypesResult[0],
            permissions: permissionsResult[0],
        };

        return metadata;

    } catch (error) {
       
        console.error("Error fetching metadata from DB:", error);
        throw error;
    }
}


module.exports = { 
    connectToDatabase, 
    fetchMetadataFromDB 
};