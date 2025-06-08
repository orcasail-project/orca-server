const express = require('express');
const connectToDatabase = require('./src/lib/storage/sql'); // Import the function to connect to the database
const config = require('./config/default.json');

const app = express();
const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        //Trying to connect to the database
        const dbConnection = await connectToDatabase(config.mysql);
        
        // If the connection is successful, start listening on the server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });


    } catch (error) {
        // In case of a connection failure, print a  error message        
        console.error('Failed to connect to the database:', error.message);
        process.exit(1); // Exit the process due to lack of database connection
    }
}

startServer();
