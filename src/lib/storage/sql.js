const mysql = require('mysql2/promise');
const config = require('../../../config/default.json');

// Function to connect to a database
async function connectToDatabase(config) {
    try {
        const connection = await mysql.createConnection(config);
        console.log('Connected to MySQL database');
        return connection;
    } catch (error) {
        console.error('Error connecting to MySQL database:', error.message);
        throw error;
    }
}

module.exports = connectToDatabase;