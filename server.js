const express = require('express');
const config = require('config');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const { initializeDatabasePool } = require('./src/lib/storage/sql');

// ייבוא פונקציות שיוצרות את הראוטרים
const createMainRouter = require('./src/lib/router/router');
const createDashboardRouter = require('./src/lib/router/dashboardRouter');
const createSailsRouter = require('./src/lib/router/sails.js');
const createSkipperRouter = require('./src/lib/router/skipperRouter');

const app = express();
const server = http.createServer(app);

// יצירת שרת Socket.io והצמדתו לשרת ה-HTTP
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080", 
    methods: ["GET", "POST"]
  }
});

// הגדרת Middleware של Express
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(` בקשה התקבלה: ${req.method} לכתובת ${req.originalUrl}`);
    next();
});

//  יצירת הראוטרים והעברת io אליהם
const mainRouter = createMainRouter(io);
const dashboardRouter = createDashboardRouter(io);
const sailsRouter = createSailsRouter(io);
const skipperRouter = createSkipperRouter(io);

app.use("/", mainRouter);
app.use("/api", mainRouter);
app.use('/api/sails', dashboardRouter); 
app.use('/api/sails', sailsRouter); 
app.use('/api/sails', skipperRouter);

// הגדרת לוגיקת החיבור של Socket.io
io.on('connection', (socket) => {
  console.log(`[Socket.io] User connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.io] User disconnected: ${socket.id}`);
  });
});

// הגדרת הפורט והפעלת השרת
const port = config.get("port") || 3000;

async function startServer() {
    try {
        await initializeDatabasePool();
        server.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to initialize the database:', error.message);
        process.exit(1);
    }
}

startServer();

module.exports = { io };