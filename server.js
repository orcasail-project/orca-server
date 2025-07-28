const express = require('express');
const config = require('config');
const cors = require('cors');

const { initializeDatabasePool } = require('./src/lib/storage/sql');
const router = require('./src/lib/router/router');
const sailsRoutes = require('./src/lib/router/dashboardRouter');


const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(` בקשה התקבלה: ${req.method} לכתובת ${req.originalUrl}`);
    next(); // חשוב מאוד - ממשיך לבקשה הבאה
});

app.use("/", router);

console.log('2. [שרת ראשי]: עומד לטעון את הראוטר הראשי על נתיב /api');
app.use("/api", router);
console.log('3. [שרת ראשי]: הראוטר הראשי נטען בהצלחה על /api.');

app.use('/api/sails', sailsRoutes); 

const port = config.get("port") || 3000;

async function startServer() {
    try {
        await initializeDatabasePool();

        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to initialize the database. Server is not starting.', error.message);
        process.exit(1);
    }
}

startServer();
