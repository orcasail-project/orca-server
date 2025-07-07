const express = require('express');
const config = require('config');
const cors = require('cors');
const metadataRouter = require('./src/lib/router/metadataRouter');
const { connectToDatabase } = require('./src/lib/storage/sql');


const app = express();



app.use(cors()); 
app.use(express.json()); 

app.use('/metadata', metadataRouter); 


const port = config.get("port") || 8080;

async function startServer() {
    try {
        await connectToDatabase();
        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Failed to connect to the database. Server is not running.', error.message);
        process.exit(1);
    }
}

startServer();