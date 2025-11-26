# 🚤 Orca Server Project

A robust Node.js server built with the Express framework, designed to manage boat sailing schedules and dashboard operations. This project provides a structured API architecture with organized controllers, routing, and database integration.

---

## 📋 Table of Contents

- [Installation & Setup](#-installation--setup)
- [Project Structure](#-project-structure)
- [Configuration](#️-configuration)
- [API Documentation](#-api-documentation)
- [Architecture & Logic](#-architecture--logic)

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** (v14+)
- **npm** or **yarn**
- **Database**: Ensure your SQL database is running and credentials are set.

### Steps

1. **Clone and Install:**

```bash
git clone <repository-url>
cd orca-server
npm install
```

2. **Run the Server:**

```bash
# Run in development mode
npm start
```

The server will start at: `http://localhost:3000`

3. **Health Check:**

Open `http://localhost:3000/` in your browser.

**Expected response:** `"hi"`

---

## 📁 Project Structure

```
project/
│
├── config/                # Configuration files (DB credentials, ports)
│   └── default.json
│
├── src/
│   └── lib/
│       ├── controllers/   # Business logic (e.g., dashboardController.js)
│       ├── router/        # Route definitions (e.g., dashboardRouter.js)
│       └── storage/       # Database connection & queries (sql.js)
│
├── server.js              # Entry point
├── package.json           # Dependencies
└── README.md              # Documentation
```

---

## ⚙️ Configuration

Configuration is managed via the `config/` folder.

Ensure `config/default.json` contains your environment settings:

```json
{
    "port": 3000,
    "database": {
        "host": "localhost",
        "port": 5432,
        "name": "myapp_db"
        // Add user/password if required
    },
    "api": {
        "version": "v1",
        "baseUrl": "/api"
    }
}
```

---

## 📡 API Documentation

### 🚤 Sails Dashboard Feature

**Endpoint:** `GET /api/sails/dashboard`

This centralized endpoint returns real-time data for the operational dashboard, displaying upcoming sails for all boats.

#### Response Overview

The API returns a JSON object containing sail data for every active boat for the next 5 time intervals (30-minute increments).

#### ✅ Success Response (200 OK)

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
        "total_people_on_sail": 5,
        "bookings": [
          {
            "booking_id": 201,
            "customer_name": "Israel Israeli",
            "num_people_sail": 5
          }
        ]
      },
      "14:30": null,
      "15:00": null
    },
    "Shark (Inactive)": "Inactive boat"
  }
}
```

#### ❌ Error Response (500)

Returns `500 Internal Server Error` if database communication fails.

---

## 🧠 Architecture & Logic

The Dashboard logic (`dashboardController.js`) follows a highly optimized flow:

### 1. **Dynamic Time Calculation:**
- Calculates a generic time range of 2.5 hours ahead (5 columns × 30 mins).
- Starts from the current or previous half-hour to ensure relevant data.

### 2. **Efficient Data Fetching:**
- Uses `Promise.all` to execute parallel operations:
  - Fetch all boats (defines the rows).
  - Fetch all sails and bookings within the time window (single optimized SQL JOIN).

### 3. **Data Processing:**
- Raw DB rows are grouped into structured Sail Objects.
- Bookings are nested under their respective sails.
- Final JSON is constructed by mapping boats to time slots.

### Key Files

| File Path | Role |
|-----------|------|
| `src/lib/router/dashboardRouter.js` | Route definition. |
| `src/lib/controllers/dashboardController.js` | Core logic & data processing. |
| `src/lib/storage/sql.js` | DAL (Data Access Layer) & SQL queries. |

---
