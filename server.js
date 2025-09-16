const { serverConfig } = require('./config');

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const { initializeDatabasePool } = require('./src/lib/storage/sql');

const createMainRouter = require('./src/lib/router/router');
const createDashboardRouter = require('./src/lib/router/dashboardRouter');
const createSailsRouter = require('./src/lib/router/sails.js');
const createSkipperRouter = require('./src/lib/router/skipperRouter');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(` בקשה התקבלה: ${req.method} לכתובת ${req.originalUrl}`);
    next();
});

const mainRouter = createMainRouter(io);
const dashboardRouter = createDashboardRouter(io);
const sailsRouter = createSailsRouter(io);
const skipperRouter = createSkipperRouter(io);

app.use("/", mainRouter);
app.use("/api", mainRouter);
app.use('/api/sails', dashboardRouter);
app.use('/api/sails', sailsRouter);
app.use('/api/sails', skipperRouter);

io.on('connection', (socket) => {
  console.log(`[Socket.io] User connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.io] User disconnected: ${socket.id}`);
  });
});

// קריאת הפורט מהקובץ המרכזי
const port = serverConfig.port || 3000;

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