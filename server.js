const express = require('express');
const config = require('config');
const router = require('./src/lib/router/router');
const cors = require('cors');
const { connectToDatabase } = require('./src/lib/storage/sql');

const app = express();
app.use(cors());
app.use("/", router);

const port = config.get("port") || 3000;

async function startServer() {
    try {
        await connectToDatabase();
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to connect to the database:', error.message);
        process.exit(1);
    }
}

startServer();