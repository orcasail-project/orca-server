const mysql = require('mysql2/promise');
const config = require('../../../config/default.json');
const fs = require('fs');
const path = require('path'); 

async function createTables() {
  const sqlFilePath = path.join(__dirname, '../storage/schema.sql');
  const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
  console.log("SQL Script Loaded:\n", sqlScript);

  const connection = await mysql.createConnection(config.mysql);

  try {
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      await connection.query(stmt);
    }

    console.log('Tables created successfully.');
  } catch (error) {
    console.error('Error creating tables:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}
module.exports = createTables;

