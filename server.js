const express = require('express');
const config = require('config');
const cors = require('cors');

const { initializeDatabasePool } = require('./src/lib/storage/sql'); 
const sailsRoutes = require('./src/lib/router/dashboardRouter');
const router = require('./src/lib/router/router');

const app = express();

app.use(cors());
app.use("/", router);
app.use('/api/sails', sailsRoutes);

const port = config.get("port") || 3000;

async function startServer() {
    try {
        // שינוי: קוראים לפונקציית האתחול של ה-Pool פעם אחת
        await initializeDatabasePool(); 
        
        // אם האתחול הצליח, השרת יכול להתחיל לעבוד
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to initialize the database pool:', error.message);
        process.exit(1); // יציאה מהתהליך כי אי אפשר לעבוד בלי מסד נתונים
    }
}

startServer();