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
├── server.js              # Main server entry point and initialization
├── package.json           # Project dependencies and scripts
├── .gitignore             # Files ignored by Git
│
├── config/                # Configuration files
│   └── default.json       # Default settings (DB credentials, port, etc.)
│
└── src/                   # Main source code directory
    └── lib/
        ├── controllers/   # Contains application business logic
        │   └── dashboardController.js
        │
        ├── router/        # Defines API routes and endpoints
        │   ├── dashboardRouter.js
        │   └── router.js      # Main router (aggregates other route modules)
        │
        └── storage/       # Data Access Layer (DAL)
            └── sql.js         # Manages database connection and queries

[Future Architecture Extensions]
│
├── logs/                  # For storing log files (e.g., error.log)
└── src/
    └── lib/
        ├── middleware/    # Custom Express middleware (e.g., auth, validation)
        ├── utils/         # Shared utility functions (e.g., logger)
        └── schemas/       # Data validation schemas (e.g., for Joi or Zod)












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


# 🚤 API: Sails Dashboard

This feature provides a **centralized endpoint** for building an operational dashboard displaying upcoming sails.
The data is fetched and processed in real-time to provide an up-to-date overview of expected activities for each boat.

---

## 🔗 Endpoint

GET /api/sails/dashboard


### Description:

This endpoint returns a structured JSON object containing sail data for every **active boat**,
covering the **next 5 time intervals** (in 30-minute increments, starting from the upcoming half-hour).
**Inactive boats** will be clearly marked.

---

## ✅ Success Response (200 OK)

Response structure:

```json
{
  "sails_data": {
    "Dolphin": {
      "14:00": {
        "sail_id": 101,
        "planned_start_time": "2023-10-27T11:00:00.000Z",
        "actual_start_time": null,
        "population_type_name": "Regular",
        "sail_notes": "Standard morning sail.",
        "require_orca_escort": false,
        "is_private_group": false,
        "total_people_on_sail": 5,
        "total_people_on_activity": 2,
        "bookings": [
          {
            "booking_id": 201,
            "customer_id": 301,
            "customer_name": "Israel Israeli",
            "customer_phone_number": "050-1234567",
            "num_people_sail": 5,
            "num_people_activity": 2,
            "is_phone_booking": true
          }
        ]
      },
      "14:30": null,
      "15:00": null,
      "15:30": null,
      "16:00": null
    },
    "Whale": {
      "14:00": null,
      "14:30": null,
      "15:00": null,
      "15:30": null,
      "16:00": null
    },
    "Shark (Inactive)": "Inactive boat"
  }
}
```

---

## ❌ Error Response (500)

If there’s a failure in communication with the database or any unexpected error,
a status will be returned:

```
500 Internal Server Error
```

Along with an appropriate error message.

---

## 🧠 Architecture & Logic Flow

### 1. Dynamic Time Range Calculation

* Performed in `dashboardController.js`
* Calculates a time range of **2.5 hours ahead**, starting from the current or previous half-hour.
* This defines the **columns** of the dashboard (each 30-minute block = one column).

---

### 2. Efficient Data Fetching

* Uses parallel fetching via `Promise.all`:

  * List of all boats (for determining which **rows** to display).
  * All sails and bookings in the time window via a **single SQL query** using `JOIN`.
* This avoids multiple queries and ensures better performance.

---

### 3. Data Grouping & Processing

* The "flat" data from the DB is processed:

  * Each row is grouped into a **sail object**.
  * All bookings are collected under their respective sail.

---

### 4. Final Response Structure Creation

* A JSON object is initialized with all boat-time cells set to `null`.
* Each processed sail is inserted into its appropriate location according to:

  * Boat name
  * Planned start time

---

## 📁 Key Files

| File Path                                    | Description                                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------------ |
| `src/lib/router/dashboardRouter.js`          | Defines the `/dashboard` route and links to the controller function            |
| `src/lib/controllers/dashboardController.js` | Core logic: time calculation, data fetching, processing, and response creation |
| `src/lib/storage/sql.js`                     | Handles DB access: complex SQL queries and connection management               |

---

Let me know if you’d like this also as a downloadable file or integrated into your frontend docs!
