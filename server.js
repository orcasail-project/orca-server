const express = require('express');
const config = require('config');
const router = require('./src/lib/router/router');
const cors = require('cors');
const {connectToDatabase} = require('./src/lib/storage/sql');
const sailsRoutes = require('./src/lib/router/dashboardRouter');
const { getDbConnection } = require('./src/lib/storage/sql');
const app = express();
app.use(cors());
app.use("/", router);
app.use('/api/sails', sailsRoutes);


const port = config.get("port") || 3000;

async function startServer() {
    try {
        await connectToDatabase();
        // If the connection is successful, start listening on the server
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        // In case of a connection failure, print an error message
        console.error('Failed to connect to the database:', error.message);
        process.exit(1); // Exit the process due to lack of database connection
    }
}

startServer();