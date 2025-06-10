# Orca Practicum - Server Architecture & Setup

## Overview
This project establishes a basic server infrastructure using Express.js, providing initial control over routing, configuration, and future connectivity to Front-end and Database interfaces.

## Project Structure

```
│── README.md              # Project documentation
│
│── .vscode/               # VS Code editor configurations (**not required at this stage**)
│   └── launch.json        # Run and debug settings (**not required at this stage**)
│
├── node_modules/          # Third-party libraries (auto-generated, **do not commit to git**)
│
├── logs/                  # Log files directory (**not required yet**)
│   ├── combined.log       # General application log (**not required yet**)
│   └── error.log          # Error log (**not required yet**)
│
├── src/                   # Main source code
│   ├── lib/               # Core logic and modules
│   │   ├── utils/             # Helper functions (**not required yet**)
│   │   │   └── logger.js      # Log management (**not required yet**)
│   │   ├── errorHandler.js    # General error handling (**not required yet**)
│   │   ├── appError.js        # Unified error format function (**not required yet**)
│   │   ├── response.js        # Unified response format function (**not required yet**)
│   │   ├── router.js          # Main server routing ✅ (required in task)
│   │   ├── user.js            # User-related routes (**not required yet**)
│   │   ├── storage/           # Database connection files (**not yet**)
│   │   │   └── mongosql.js    # MongoDB SQL database connection (**not yet**)
│   │   │   └── schema.sql     # Database schema (**not yet**)
│   │   ├── schemas/           # Database models/schemas (**not yet**)
│
├── config/                # Configuration files ✅ (required - port, dotenv)
│   └── default.json       # Default configuration file
│
│── server.js              # Server entry point ✅ (required in task)
│
│── package.json           # Dependency management ✅
│── package-lock.json      # Library version lock file (**auto-generated - don't touch**)
│── jsconfig.json          # JavaScript configuration file (**not required yet**)
│── .gitignore             # Files to exclude from git ✅
```

## Required Files for This Stage ✅

The following files and directories are mandatory for the first stage:

- `README.md` - Basic project documentation
- `src/lib/router.js` - Basic routing file with GET /hi route example
- `config/default.json` - Configuration file (port, etc.)
- `server.js` - Main file that connects router and port
- `package.json` - npm settings file
- `.gitignore` - Excludes node_modules, .env, etc.

## Installation

1. Initialize a new project:
```bash
npm init -y
```

2. Install required dependencies:
```bash
npm install express cors dotenv config
```

## Dependencies

### Core Libraries
- **express** - Fast, unopinionated, minimalist web framework for Node.js
- **cors** - Enables Cross-Origin Resource Sharing (CORS)
- **dotenv** - Loads environment variables from .env file
- **config** - Organizes hierarchical configurations for app deployments

## Configuration

The server uses a configuration file located at `config/default.json`:

```json
{
  "port": 3000
}
```

## Usage

1. Start the server:
```bash
node server.js
```

2. The server will run on the port specified in the configuration file (default: 3000)

3. Test the basic route:
   - Method: GET
   - URL: `http://localhost:3000/`
   - Expected response: "hi"

## API Endpoints

### GET /
- **Description**: Basic health check endpoint
- **Response**: "hi"
- **Status Code**: 200

## Testing

Use Postman or any HTTP client to test:
1. Send a GET request to `http://localhost:3000/`
2. Verify the response is "hi"
3. Confirm the server reads the port from the config file

## Acceptance Criteria ✅

- [x] Clean Node.js project setup
- [x] Proper package.json and installed libraries
- [x] Port and routes managed through config
- [x] GET route at / returns "hi" and tested successfully in Postman
- [x] Code separated into files: server.js, router.js, config/default.json
- [x] README with hierarchy and explanation
- [x] .gitignore file excluding node_modules, package-lock.json, etc.

## Git Configuration

The `.gitignore` file excludes:
- `node_modules/`
- `package-lock.json`
- `.env`
- `logs/`
- `.vscode/` (if created)

## Future Development

This basic setup provides the foundation for:
- Database integration (MongoDB/SQL)
- User authentication and management
- Error handling middleware
- Logging system
- API documentation
- Testing framework integration

## Contributing

This project follows the Orca Practicum guidelines for server architecture and Express.js best practices.