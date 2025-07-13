const mysql = require('mysql2/promise');
const config = require('../../../config/default.json');

let connection;

async function connectToDatabase() {
    try {
        if (!connection) {
            connection = await mysql.createConnection(config.mysql);
            console.log(`Successfully connected to database '${config.mysql.database}'.`);
        }
        return connection;
    } catch (error) {
        console.error(`Error connecting to database '${config.mysql.database}':`, error.message);
        throw error;
    }
}

async function query(sql, params = []) {
    try {
        if (!connection) {
            await connectToDatabase();
        }
        const [results] = await connection.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Database query error:', error.message);
        throw error;
    }
}

module.exports = { connectToDatabase, query };