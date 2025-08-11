const mysql = require('mysql2/promise');
const config = require('config');
const mysqlConfig = config.get('mysql');
let pool;

/**
 * מאתחל את מאגר החיבורים (Connection Pool) למסד הנתונים
 * תוך שימוש בהגדרות מקובץ הקונפיגורציה.
 */
async function initializeDatabasePool() {
    try {
        if (!pool) {
            pool = mysql.createPool(mysqlConfig);
            await pool.query('SELECT 1');
            console.log(`Successfully created connection pool for database '${mysqlConfig.database}'.`);
        }
        return pool;
    } catch (error) {
        console.error(`Error creating connection pool for database '${mysqlConfig.database}':`, error.message);
        throw error;
    }
}

/**
 * פונקציה גנרית להרצת שאילתות SQL
 */
async function query(sql, params = []) {
    try {
        if (!pool) {
            await initializeDatabasePool();
        }
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Database query error:', error.message);
        throw error;
    }
}



async function getAllActivities() {
    const sql = 'SELECT id, name, ticket_price, min_age, max_people_total FROM Activity';
    const [activities] = await pool.query(sql);
    return activities;
}

async function getAllPopulationTypes() {
    const [populationTypes] = await pool.query('SELECT id, name FROM PopulationType');
    return populationTypes;
}

async function getAllRoles() {
    const sql = 'SELECT role_id, name, notes FROM role';
    const [roles] = await pool.query(sql);
    return roles;
}

async function getAllPermissions() {
    const sql = 'SELECT id, name, can_assign, can_change_status FROM Permission';
    const [permissions] = await pool.query(sql);
    return permissions;
}

async function getAllBoats() {
    const [boats] = await pool.query('SELECT id, name, id , is_active FROM Boat ORDER BY id');
    return boats;
}

async function getAllBoatsToMataData() {
    const [boats] = await pool.query('SELECT id, name, max_passengers FROM Boat');
    return boats;
}

async function getAllBoatActivities() {
    const sql = `
        SELECT
            b.name AS boat_name,
            b.max_passengers AS boat_capacity,
            a.name AS activity_name,
            a.max_people_total AS activity_capacity,
            (a.name IN ('אבובים', 'בננות')) AS requires_escort
        FROM BoatActivity ba
        JOIN Boat b ON ba.boat_id = b.id
        JOIN Activity a ON ba.activity_id = a.id
    `;
    const [links] = await pool.query(sql);
    return links;
}




async function getUserByEmail(email) {
    const sql = 'SELECT * FROM User WHERE email = ?';
    const [rows] = await pool.execute(sql, [email]);
    return rows.length > 0 ? rows[0] : null;
}

async function createUser(userData) {
    const sql = `
        INSERT INTO User (email, password, full_name, phone, role_id)
        VALUES (?, ?, ?, ?, ?)
    `;
    const values = [
        userData.email,
        userData.password,
        userData.fullName,
        userData.phoneNumber,
        userData.roleId
    ];
    const [result] = await pool.execute(sql, values);
    return {
        id: result.insertId,
        email: userData.email,
        full_name: userData.fullName,
        phone: userData.phoneNumber,
        role_id: userData.roleId
    };
}




/**
 * פונקציה מרכזית: מביאה רשימה שטוחה של כל השיוטים וההזמנות שלהם בטווח זמנים נתון.
 */
async function getUpcomingSailsData(startTime, endTime) {
    const sql = `
        SELECT 
          b.id AS boat_id,
          s.id AS sail_id,
          TIMESTAMP(s.date, s.planned_start_time) AS planned_start_time,
          s.actual_start_time,
          s.population_type_id,
          pt.name AS population_type_name,
          s.notes AS sail_notes,
          s.requires_orca_escort,
          s.is_private_group,
          bk.id AS booking_id,
          c.id AS customer_id,
          c.name AS customer_name,
          c.phone_number AS customer_phone_number,
          bk.num_people_sail,
          bk.num_people_activity,
          bk.is_phone_booking
        FROM Boat b
        INNER JOIN BoatActivity ba ON ba.boat_id = b.id
        INNER JOIN Sail s ON s.boat_activity_id = ba.id
        LEFT JOIN Booking bk ON bk.sail_id = s.id
        LEFT JOIN Customer c ON c.id = bk.customer_id
        LEFT JOIN PopulationType pt ON pt.id = s.population_type_id
        WHERE 
          TIMESTAMP(s.date, s.planned_start_time) >= ?
          AND TIMESTAMP(s.date, s.planned_start_time) < ?
         ORDER BY b.id, planned_start_time, bk.id;
    `;
    const [results] = await pool.execute(sql, [startTime, endTime]);
    return results;
}

/**
 * מביא את כל השיוטים הפוטנציאליים בטווח זמן נתון, כולל חישוב התפוסה הנוכחית שלהם.
 * זוהי הפונקציה החדשה שנוספה מהענף השני.
 */
async function findSailsWithOccupancy(searchParams) {
    try {
        const { date, time, population_type_id, activity_id } = searchParams;

        const timeBefore = new Date(`${date}T${time}:00`).getTime() - 30 * 60000;
        const timeAfter = new Date(`${date}T${time}:00`).getTime() + 30 * 60000;
        const timeBeforeStr = new Date(timeBefore).toTimeString().slice(0, 8);
        const timeAfterStr = new Date(timeAfter).toTimeString().slice(0, 8);

      
        const sql = `
            SELECT 
                s.id AS sail_id, 
                s.planned_start_time,
                b.max_passengers AS sail_capacity,
                a.max_people_total AS activity_capacity,
                a.name AS activity_name,
                pt.name AS population_type_name,
                COALESCE(SUM(bk.num_people_activity), 0) AS current_activity_occupancy,
                COALESCE(SUM(bk.num_people_sail), 0) AS current_sail_occupancy
            FROM Sail AS s
            JOIN BoatActivity AS ba ON s.boat_activity_id = ba.id
            JOIN Activity AS a ON ba.activity_id = a.id
            JOIN Boat AS b ON ba.boat_id = b.id
            JOIN PopulationType AS pt ON s.population_type_id = pt.id
            LEFT JOIN Booking AS bk ON s.id = bk.sail_id
            WHERE 
                s.date = ? 
              AND s.population_type_id = ? 
              AND a.id = ? 
              AND s.planned_start_time BETWEEN ? AND ?
            GROUP BY s.id, s.planned_start_time, b.max_passengers, a.max_people_total, a.name, pt.name;
        `;

        const [sails] = await pool.query(sql, [date, population_type_id, activity_id, timeBeforeStr, timeAfterStr]);
        return sails;

    } catch (error) {
        console.error("Error in findSailsWithOccupancy:", error);
        throw error;
    }
}




// const getUserByEmailAndRole = async (email, roleId) => {
//   try {
//     const [rows] = await pool.query(
//       `SELECT * FROM user WHERE email = ? AND role_id = ?`,
//       [email, roleId]
//     );
//     return rows[0];
//   } catch (err) {
//     console.error('Error in getUserByEmailAndRole:', err);
//     throw err;
//   }
// };


module.exports = {
    initializeDatabasePool,
    query,

    // מטא-דאטה
    getAllActivities,
    getAllPopulationTypes,
    getAllPermissions,
    getAllRoles,
    getAllBoats,
    getAllBoatsToMataData,
    getAllBoatActivities,

    // משתמשים
    getUserByEmail,
    createUser,

    // הפלגות
    getUpcomingSailsData,
    findSailsWithOccupancy 
};