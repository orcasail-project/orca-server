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

module.exports = connectToDatabase;