const mysql = require('mysql2/promise');
const config = require('../../../config/default.json');
const fs = require('fs');
const path = require('path');

async function createDatabaseAndUser() {
  const rootConfig = config.get('mysqlRoot');
  const sqlFilePath = path.join(__dirname, '../db/init_orca_db.sql');
  const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

  const rootConnection = await mysql.createConnection(rootConfig);

  try {
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      await rootConnection.query(stmt);
    }

    console.log('Database and user created successfully from SQL script.');
  } catch (error) {
    console.error('Error executing SQL script:', error.message);
    throw error;
  } finally {
    await rootConnection.end();
  }
}

module.exports = createDatabaseAndUser;
