const express = require('express');
const config = require('config');
const cors = require('cors');
const createTables = require('./src/lib/storage/createTables');

const { initializeDatabasePool } = require('./src/lib/storage/sql');
const router = require('./src/lib/router/router');
const sailsRoutes = require('./src/lib/router/dashboardRouter');
const skipperRoutes = require('./src/lib/router/skipperRouter');


const app = express();

app.use(cors());
app.use(express.json());

app.use("/", router);
app.use("/api", router);
app.use('/api/sails', sailsRoutes);
app.use('/api/sails', skipperRoutes);

const port = config.get("port") || 3000;

async function startServer() {
    try {

        await initializeDatabasePool();

        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to connect to the database:', error.message);
        console.error('Failed to initialize the database. Server is not starting.', error.message);

        process.exit(1);
    }
}

startServer();