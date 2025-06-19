Express Server Project
A basic Node.js server project built on Express framework, providing an initial infrastructure for developing organized and professional APIs.
📋 Table of Contents

Installation and Setup
Project Structure
Routing Architecture
Configuration Management
Developing New APIs
Future Extensions

🚀 Installation and Setup
Prerequisites

Node.js (version 14 and above)
npm or yarn

Installation Steps
bash# Install dependencies
npm install

# Run the server in development mode
npm start
The server will run at: http://localhost:3000
Health Check
After running the server, verify the following:

Navigate to http://localhost:3000/ - should return "hi"
Test with Postman: GET request to http://localhost:3000/

📁 Project Structure
project/
│
├── README.md              # Project documentation
├── server.js              # Main entry point
├── package.json           # Dependency management
├── .gitignore            # Files not to be committed to git
│
├── config/               # Configuration files
│   └── default.json      # Default settings
│
├── src/                  # Source code
│   └── lib/
│       └── router.js     # Main router
│
└── [Future - not yet implemented]
    ├── logs/             # Log files
    ├── src/lib/utils/    # Utility functions
    ├── src/lib/storage/  # Database connections
    └── src/lib/schemas/  # Database models
🛣️ Routing Architecture
What is Routing?
Routing is the process by which the server decides how to respond to client requests to different paths (URLs).
How does it work in our project?
1. Main Server (server.js)
javascriptconst express = require('express');
const config = require('config');
const router = require('./src/lib/router');

const app = express();
const port = config.get("port") || 3000;

// Connect the main router
app.use("/", router);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
2. Main Router (src/lib/router.js)
javascriptconst express = require('express');
const router = express.Router();

// Basic route
router.route("/").get((req, res) => {
    res.send("hi");
});

module.exports = router;
Request Handling Process

Request Receipt: The server receives an HTTP request (GET, POST, PUT, DELETE)
Routing: The server checks which path is requested and forwards to the appropriate router
Processing: The router processes the request (business logic, database queries)
Response: Returns a response to the client

⚙️ Configuration Management
Why use configuration?

Separation: Separates code from settings
Environments: Different settings for development/production
Security: Prevents exposure of sensitive data in code

Configuration File Structure (config/default.json)
json{
    "port": 3000,
    "database": {
        "host": "localhost",
        "port": 5432,
        "name": "myapp_db"
    },
    "api": {
        "version": "v1",
        "baseUrl": "/api"
    }
}
Using Configuration
javascriptconst config = require('config');

// Get port
const port = config.get("port");

// Get database settings
const dbConfig = config.get("database");


Scenario: Developing API for User Management
Step 1: Planning

What functionality is needed? (CRUD - Create, Read, Update, Delete)
Which routes are required?

GET /api/users - get all users
GET /api/users/:id - get specific user
POST /api/users - create new user
PUT /api/users/:id - update user
DELETE /api/users/:id - delete user



Step 2: Creating New Router
javascript// src/lib/routes/users.js
const express = require('express');
const router = express.Router();

// Get all users
router.get('/', (req, res) => {
    // Logic to get users from database
    res.json({ message: "All users" });
});

// Get specific user
router.get('/:id', (req, res) => {
    const userId = req.params.id;
    // Logic to get specific user
    res.json({ message: `User ${userId}` });
});

// Create new user
router.post('/', (req, res) => {
    // Logic to create new user
    res.json({ message: "User created" });
});

module.exports = router;
Step 3: Connecting to Main Router
javascript// src/lib/router.js
const express = require('express');
const usersRouter = require('./routes/users');

const router = express.Router();

// Basic route
router.route("/").get((req, res) => {
    res.send("hi");
});

// Connect users router
router.use("/api/users", usersRouter);

module.exports = router;
Organization by Modules
src/lib/routes/
├── users.js      # User management
├── products.js   # Product management
├── orders.js     # Order management
└── auth.js       # Authentication
Example of More Professional Structure
javascript// src/lib/router.js
const express = require('express');
const usersRouter = require('./routes/users');
const productsRouter = require('./routes/products');
const authRouter = require('./routes/auth');

const router = express.Router();

// API version prefix
const API_PREFIX = '/api/v1';

// Connect all routers
router.use(`${API_PREFIX}/users`, usersRouter);
router.use(`${API_PREFIX}/products`, productsRouter);
router.use(`${API_PREFIX}/auth`, authRouter);

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;
🔄 Recommended Workflow
1. API Planning

Define required endpoints
Plan data structure
Write documentation

2. Create New Router

Create new file in src/lib/routes/
Define all required routes
Add basic validation

3. Connect to Server

Import new router to router.js
Set appropriate prefix
Test with Postman

4. Testing

Test each endpoint
Handle errors
Validate data

🚀 Future Extensions
Database
javascript// src/lib/storage/sql.js
const mysql = require('mysql2');
const config = require('config');

const connection = mysql.createConnection(config.get('database'));
Middleware
javascript// src/lib/middleware/auth.js
const authenticateToken = (req, res, next) => {
    // Authentication logic
    next();
};
Error Handling
javascript// src/lib/errorHandler.js
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
};
Logging
javascript// src/lib/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

