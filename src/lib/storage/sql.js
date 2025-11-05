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
 * פונקציה גנרית להרצת שאילתות SQL, עם תמיכה בטרנזקציות.
 */
async function query(sql, params = [], connection) {
    // קובע מול איזה אובייקט לעבוד: ה-connection הספציפי או ה-pool הכללי
    const db = connection || pool;
    try {
        // בדיקה זו נשארת למקרה שקוראים לפונקציה מחוץ לטרנזקציה וה-pool עוד לא אותחל
        if (!pool) {
            await initializeDatabasePool();
        }
        // בצע את השאילתה באמצעות db (שהוא או connection או pool)
        const [results] = await db.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Database query error:', error.message);
        throw error;
    }
}


// --- פונקציות מטא-דאטה (לא דורשות שינוי) ---

async function getAllActivities() {
    const sql = 'SELECT id, name, ticket_price, min_age, max_people_total FROM Activity';
    return await query(sql);
}

async function getAllPaymentTypes() {
    const sql = 'SELECT id, name FROM PaymentType';
    return await query(sql);
}

async function getAllPopulationTypes() {
    const sql = 'SELECT id, name FROM PopulationType';
    return await query(sql);
}

async function getAllRoles() {
    const sql = 'SELECT role_id, name, notes FROM role';
    return await query(sql);
}

async function getAllPermissions() {
    const sql = 'SELECT id, name, can_assign, can_change_status FROM Permission';
    return await query(sql);
}

async function getAllBoats() {
    const sql = 'SELECT id, name, is_active FROM Boat ORDER BY id';
    return await query(sql);
}

async function getAllBoatsToMataData() {
    const sql = 'SELECT id, name, max_passengers FROM Boat';
    return await query(sql);
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
    return await query(sql);
}


// --- פונקציות תהליך הזמנה (עם תמיכה בטרנזקציה) ---

async function getCustomerByPhoneNumber(phoneNumber, connection) {
    const sql = 'SELECT id, name, phone_number, email ,wants_whatsapp, notes FROM Customer WHERE phone_number = ?';
    const rows = await query(sql, [phoneNumber], connection); // שימוש ב-query המשודרג
    return rows.length > 0 ? rows[0] : null;
}

async function addCustomer(customerData, connection) {
    const sql = `
        INSERT INTO Customer (name, phone_number, wants_whatsapp, email, notes)
        VALUES (?, ?, ?, ?, ?)
    `;
    const values = [
        customerData.name,
        customerData.phone_number,
        customerData.wants_whatsapp,
        customerData.email,
        customerData.notes
    ];
    return await query(sql, values, connection); // שימוש ב-query המשודרג
}

async function findSailByDetails(sailDetails, connection) {
    const { date, startTime, populationTypeId } = sailDetails;
    const sql = 'SELECT id FROM Sail WHERE `date` = ? AND planned_start_time = ? AND population_type_id = ?';
    const results = await query(sql, [date, startTime, populationTypeId], connection); // שימוש ב-query המשודרג
    return (results && results.length > 0) ? results[0].id : null;
}

async function createNewSail(sailData, connection) {
    const {
        date,
        planned_start_time,
        population_type_id,
        is_private_group,
        boat_activity_id,
        requires_orca_escort
    } = sailData;

    const sql = `
        INSERT INTO Sail (
            \`date\`, planned_start_time, population_type_id, is_private_group, 
            boat_activity_id, requires_orca_escort
        ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
        date,
        planned_start_time,
        population_type_id,
        is_private_group || false,
        boat_activity_id,
        requires_orca_escort || false
    ];
    return await query(sql, params, connection); // שימוש ב-query המשודרג
}

async function insertNewBooking(bookingData, connection) {
    const {
        sail_id,
        customer_id,
        num_people_sail,
        num_people_activity,
        final_price,
        payment_type_id,
        is_phone_booking,
        notes,
        up_to_16_year
    } = bookingData;

    const sql = `
        INSERT INTO Booking (
            sail_id, customer_id, created_at, num_people_sail,
            num_people_activity, final_price, payment_type_id,
            is_phone_booking, notes, up_to_16_year
        ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        sail_id,
        customer_id,
        num_people_sail,
        num_people_activity,
        final_price,
        payment_type_id,
        is_phone_booking,
        notes,
        up_to_16_year
    ];
    return await query(sql, params, connection); // שימוש ב-query המשודרג
}

async function findBoatActivityId(boatId, activityId, connection) {
    const sql = 'SELECT id FROM BoatActivity WHERE boat_id = ? AND activity_id = ?';
    const params = [boatId, activityId];
    const result = await query(sql, params, connection);

    if (result && result.length > 0) {
        return result[0].id;
    }
    return null;
}


// --- פונקציית-על לניהול טרנזקציית יצירת הזמנה ---

// async function createOrderInTransaction(orderData) {
//     const connection = await pool.getConnection();
//     await connection.beginTransaction();

//     try {
//         const {
//             customer,
//             payment,
//             num_people_activity,
//             num_people_sail,
//             is_phone_booking,
//             up_to_16_year
//         } = orderData;


//         let sailId;
//         if ('cruiseId' in orderData) {
//             sailId = orderData.cruiseId;
//         } else {
//             const sailDetails = {
//                 date: orderData.sailDate,
//                 startTime: orderData.planned_start_time,
//                 populationTypeId: orderData.population_type_id
//             };
//             const existingSailId = await findSailByDetails(sailDetails, connection);
//             if (existingSailId) {
//                 sailId = existingSailId;
//             } else {
//                 const boatActivityId = await findBoatActivityId(orderData.boatId, orderData.activityId, connection);

//                 if (!boatActivityId) {
//                     const error = new Error('This boat cannot perform the selected activity.');
//                     error.code = 'INVALID_BOAT_ACTIVITY_COMBO';
//                     throw error;
//                 }
//                 const newSailData = {
//                     date: orderData.sailDate,
//                     planned_start_time: orderData.planned_start_time,
//                     population_type_id: orderData.population_type_id,
//                     is_private_group: orderData.is_private_group,
//                     requires_orca_escort: orderData.requires_orca_escort,
//                     boat_activity_id: boatActivityId
//                 };
//                 const newSailResult = await createNewSail(newSailData, connection);
//                 sailId = newSailResult.insertId;
//             }
//         }

//         await checkAvailabilityAndLock(sailId, num_people_activity, num_people_sail, connection);


//         // לוגיקת יצירת לקוח (אם נדרש)
//         let customerId;
//         const existingCustomer = await getCustomerByPhoneNumber(customer.phone_number, connection);
//         if (existingCustomer) {
//             customerId = existingCustomer.id;
//         } else {
//             const newCustomerResult = await addCustomer(customer, connection);
//             customerId = newCustomerResult.insertId;
//         }

//         // יצירת ההזמנה
//         const bookingToInsert = {
//             sail_id: sailId,
//             customer_id: customerId,
//             num_people_sail: num_people_sail || 0,
//             num_people_activity: num_people_activity || 0,
//             final_price: payment.final_price,
//             payment_type_id: payment.payment_type_id,
//             is_phone_booking: is_phone_booking || false,
//             notes: customer.notes || null,
//             up_to_16_year: up_to_16_year || false
//         };
//         const result = await insertNewBooking(bookingToInsert, connection);

//         await connection.commit();
//         return result;

//     } catch (error) {
//         await connection.rollback();
//         throw error;
//     } finally {
//         connection.release();
//     }
// }


async function createOrderInTransaction(orderData) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const {
            customer,
            payment,
            num_people_activity,
            num_people_sail,
            is_phone_booking,
            up_to_16_year
        } = orderData;

        let sailId;
        if ('cruiseId' in orderData) {
            // אם סופק מזהה שיוט, השתמש בו
            sailId = orderData.cruiseId;
        } else {
            // אם לא סופק מזהה, צור שיוט חדש ללא שאלות
            const boatActivityId = await findBoatActivityId(orderData.boatId, orderData.activityId, connection);

            if (!boatActivityId) {
                const error = new Error('This boat cannot perform the selected activity.');
                error.code = 'INVALID_BOAT_ACTIVITY_COMBO';
                throw error;
            }

            const newSailData = {
                date: orderData.sailDate,
                planned_start_time: orderData.planned_start_time,
                population_type_id: orderData.population_type_id,
                is_private_group: orderData.is_private_group,
                requires_orca_escort: orderData.requires_orca_escort,
                boat_activity_id: boatActivityId
            };

            const newSailResult = await createNewSail(newSailData, connection);
            sailId = newSailResult.insertId;
        }

        // מכאן והלאה, הקוד זהה ומניח שיש לנו sailId תקין
        await checkAvailabilityAndLock(sailId, num_people_activity, num_people_sail, connection);

        // let customerId;
        // const existingCustomer = await getCustomerByPhoneNumber(customer.phone_number, connection);
        // if (existingCustomer) {
        //     customerId = existingCustomer.id;
        // } else {
        //     const newCustomerResult = await addCustomer(customer, connection);
        //     customerId = newCustomerResult.insertId;
        // }

        let customerId;
        const existingCustomer = await getCustomerByPhoneNumber(customer.phone_number, connection);

        if (existingCustomer) {
            customerId = existingCustomer.id;

            // בדיקה אם הפרטים שהגיעו מהקליינט שונים מהפרטים ב-DB
            const detailsChanged =
                existingCustomer.name !== customer.name ||
                existingCustomer.email !== customer.email ||
                Boolean(existingCustomer.wants_whatsapp) !== customer.wants_whatsapp ||
                existingCustomer.notes !== customer.notes;

            if (detailsChanged) {
                // אם יש שינוי, בצע עדכון
                await updateCustomer(customerId, customer, connection);
            }
        } else {
            // אם הלקוח לא קיים, צור אותו
            const newCustomerResult = await addCustomer(customer, connection);
            customerId = newCustomerResult.insertId;
        }

        const bookingToInsert = {
            sail_id: sailId,
            customer_id: customerId,
            num_people_sail: num_people_sail || 0,
            num_people_activity: num_people_activity || 0,
            final_price: payment.final_price,
            payment_type_id: payment.payment_type_id,
            is_phone_booking: is_phone_booking || false,
            notes: customer.notes || null,
            up_to_16_year: up_to_16_year || false
        };
        const result = await insertNewBooking(bookingToInsert, connection);

        await connection.commit();
        return result;

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}
// SELECT 
//     b.max_passengers AS sail_capacity,
//     a.max_people_total AS activity_capacity,
//     COALESCE(SUM(bk.num_people_activity), 0) AS current_activity_occupancy,
//     COALESCE(SUM(bk.num_people_sail), 0) AS current_sail_occupancy
// FROM Sail s
// JOIN BoatActivity ba ON s.boat_activity_id = ba.id
// JOIN Activity a ON ba.activity_id = a.id
// JOIN Boat b ON ba.boat_id = b.id
// LEFT JOIN Booking bk ON s.id = bk.sail_id
// WHERE s.id = ?
// GROUP BY s.id, b.max_passengers, a.max_people_total
// FOR UPDATE; 
async function checkAvailabilityAndLock(sailId, numPeopleActivity, numPeopleSail, connection) {
    const sql = `
       
        SELECT 
            (b.max_passengers - IF(s.requires_orca_escort, 1, 0)) AS sail_capacity,
            a.max_people_total AS activity_capacity,
            COALESCE(SUM(bk.num_people_activity), 0) AS current_activity_occupancy,
            COALESCE(SUM(bk.num_people_sail), 0) AS current_sail_occupancy
        FROM Sail s
        JOIN BoatActivity ba ON s.boat_activity_id = ba.id
        JOIN Activity a ON ba.activity_id = a.id
        JOIN Boat b ON ba.boat_id = b.id
        LEFT JOIN Booking bk ON s.id = bk.sail_id
        WHERE s.id = ?
        GROUP BY s.id, b.max_passengers, a.max_people_total
        FOR UPDATE; 
            `;

    const [status] = await query(sql, [sailId], connection);

    if (!status) {
        const error = new Error('Sail not found. It may have been canceled.');
        error.code = 'SAIL_NOT_FOUND';
        throw error;
    }

    const availableActivitySeats = (status.activity_capacity ?? Infinity) - status.current_activity_occupancy;
    // const availableSailSeats = (status.sail_capacity ?? Infinity) - status.current_sail_occupancy;
    const totalCurrentOccupancy = status.current_sail_occupancy + status.current_activity_occupancy;
    const availableSailSeats = (status.sail_capacity ?? Infinity) - totalCurrentOccupancy;

    if (availableActivitySeats < numPeopleActivity || availableSailSeats < numPeopleSail) {
        const error = new Error('Not enough space available on this sail.');
        error.code = 'INSUFFICIENT_SEATS';
        error.details = {
            availableActivitySeats,
            requiredActivitySeats: numPeopleActivity,
            availableSailSeats,
            requiredSailSeats: numPeopleSail,
        };
        throw error;
    }

    return true;
}




async function getPaymentTypeId(methodName) {
    const sql = 'SELECT id FROM PaymentType WHERE name = ?';
    const types = await query(sql, [methodName]);
    return (types && types.length > 0) ? types[0].id : null;
}

async function getUserByEmail(email) {
    const sql = 'SELECT * FROM User WHERE email = ?';
    const rows = await query(sql, [email]);
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

//   SELECT 
//           b.id AS boat_id, s.id AS sail_id, TIMESTAMP(s.date, s.planned_start_time) AS planned_start_time,
//           s.actual_start_time, s.population_type_id, pt.name AS population_type_name, s.notes AS sail_notes,
//           s.requires_orca_escort, s.is_private_group, bk.id AS booking_id, c.id AS customer_id, c.name AS customer_name,
//           c.phone_number AS customer_phone_number, bk.num_people_sail, bk.num_people_activity, bk.is_phone_booking
//         FROM Boat b
//         INNER JOIN BoatActivity ba ON ba.boat_id = b.id
//         INNER JOIN Sail s ON s.boat_activity_id = ba.id
//         LEFT JOIN Booking bk ON bk.sail_id = s.id
//         LEFT JOIN Customer c ON c.id = bk.customer_id
//         LEFT JOIN PopulationType pt ON pt.id = s.population_type_id
//         WHERE 
//           TIMESTAMP(s.date, s.planned_start_time) >= ?
//           AND TIMESTAMP(s.date, s.planned_start_time) < ?
//          ORDER BY b.id, planned_start_time, bk.id;
async function getBoatsForDashboard() {
    const sql = 'SELECT id, name, is_active, gate_number FROM Boat ORDER BY id';
    return await query(sql);
}
async function getCustomerPhoneById(customerId) {
    const sql = 'SELECT phone_number FROM Customer WHERE id = ?';
    const result = await query(sql, [customerId]);
    if (result.length === 0) {
        return null; // או לזרוק שגיאה
    }
    return result[0].phone_number;
}

async function getUpcomingSailsData(startTime, endTime) {
    const sql = `
SELECT 
  b.id AS boat_id, 
  s.id AS sail_id, 
  CONCAT(s.date, 'T', s.planned_start_time, '+02:00') AS planned_start_time,
  s.actual_start_time, 
  s.population_type_id, 
  pt.name AS population_type_name, 
  s.notes AS sail_notes,
  s.requires_orca_escort, 
  s.is_private_group, 
  
  bk.id AS booking_id, 
  bk.notes AS booking_notes, 
  
  c.id AS customer_id, 
  c.name AS customer_name,
 
  
  bk.num_people_sail, 
  bk.num_people_activity, 
  
  a.name AS activity_name, 
  
  bk.is_phone_booking
  FROM Sail s
INNER JOIN BoatActivity ba ON s.boat_activity_id = ba.id
INNER JOIN Boat b ON ba.boat_id = b.id
INNER JOIN Activity a ON ba.activity_id = a.id
LEFT JOIN PopulationType pt ON s.population_type_id = pt.id
LEFT JOIN Booking bk ON bk.sail_id = s.id
LEFT JOIN Customer c ON c.id = bk.customer_id
WHERE 
  b.is_active = TRUE
  
  AND DATE_SUB(TIMESTAMP(s.date, s.planned_start_time), INTERVAL 2 HOUR) >= ?
  AND DATE_SUB(TIMESTAMP(s.date, s.planned_start_time), INTERVAL 2 HOUR) < ?
  
  


ORDER BY b.id, planned_start_time, bk.id;
    `;


    return await query(sql, [startTime, endTime]);
    
}
// AND TIMESTAMP(s.date, s.planned_start_time) >= ?
//     AND TIMESTAMP(s.date, s.planned_start_time) < ?

async function findSailsWithOccupancy(searchParams) {
    const { date, time, population_type_id, activity_id } = searchParams;
    const timeBefore = new Date(`${date}T${time}:00`).getTime() - 30 * 60000;
    const timeAfter = new Date(`${date}T${time}:00`).getTime() + 30 * 60000;
    const timeBeforeStr = new Date(timeBefore).toTimeString().slice(0, 8);
    const timeAfterStr = new Date(timeAfter).toTimeString().slice(0, 8);

    const sql = `
        SELECT 
            s.id AS sail_id, 
            s.planned_start_time,
           (b.max_passengers - IF(s.requires_orca_escort, 1, 0)) AS sail_capacity,
            a.max_people_total AS activity_capacity,
            a.name AS activity_name,
            pt.name AS population_type_name,
            COALESCE(SUM(bk.num_people_activity), 0) AS current_activity_occupancy,
            COALESCE(SUM(bk.num_people_sail), 0) AS current_sail_occupancy,
            ((b.max_passengers - IF(s.requires_orca_escort, 1, 0)) - (COALESCE(SUM(bk.num_people_sail), 0) + COALESCE(SUM(bk.num_people_activity), 0))) AS available_sail_seats,
            (IFNULL(a.max_people_total, 999) - COALESCE(SUM(bk.num_people_activity), 0)) AS available_activity_seats
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


    const [sailsFromDb] = await pool.query(sql, [date, population_type_id, activity_id, timeBeforeStr, timeAfterStr]);
    const sails = sailsFromDb.map(sail => ({
        ...sail,
        sail_capacity: parseInt(sail.sail_capacity, 10),
        activity_capacity: sail.activity_capacity ? parseInt(sail.activity_capacity, 10) : null,
        current_activity_occupancy: parseInt(sail.current_activity_occupancy, 10),
        current_sail_occupancy: parseInt(sail.current_sail_occupancy, 10),
        available_sail_seats: parseInt(sail.available_sail_seats, 10),
        available_activity_seats: parseInt(sail.available_activity_seats, 10)
    }));
    return sails;
}



// יש להוסיף את הפונקציות האלה לקובץ שלך

async function updateUserPassword(email, hashedPassword) {
    console.log('updateUserPassword called with:', { email, hashedPasswordLength: hashedPassword?.length });
    const sql = 'UPDATE User SET password = ? WHERE email = ?';
    const [result] = await pool.execute(sql, [hashedPassword, email]);
    console.log('Update result:', { affectedRows: result.affectedRows, changedRows: result.changedRows });
    return result.affectedRows > 0;
}

async function updateUserDetails(email, userData) {
    const sql = 'UPDATE User SET full_name = ?, phone = ? WHERE email = ?';
    const [result] = await pool.execute(sql, [userData.fullName, userData.phone, email]);
    return result.affectedRows > 0;
}

async function getSailById(sailId) {
    const sailQuery = `
        SELECT 
            s.id AS sail_id, s.date, s.planned_start_time, s.actual_start_time, s.end_time,
            s.is_private_group, s.requires_orca_escort, s.notes, pt.name AS population_type,
            a.name AS boat_activity, b.name AS boat, b.max_passengers AS boat_max_capacity
        FROM Sail s
        LEFT JOIN PopulationType pt ON pt.id = s.population_type_id
        LEFT JOIN BoatActivity ba ON ba.id = s.boat_activity_id
        LEFT JOIN Activity a ON a.id = ba.activity_id
        LEFT JOIN Boat b ON b.id = ba.boat_id
        WHERE s.id = ?
    `;
    const [sailResults] = await pool.execute(sailQuery, [sailId]);
    return sailResults.length > 0 ? sailResults[0] : null;
}

async function getBookingsBySailId(sailId) {
    const bookingsQuery = `
        SELECT 
            bk.id AS booking_id, c.name, c.phone_number AS phone, bk.num_people_activity,
            bk.num_people_sail, bk.final_price, bk.notes AS note, bk.up_to_16_year,
            pt_payment.name AS payment_type
        FROM Booking bk
        LEFT JOIN Customer c ON c.id = bk.customer_id
        LEFT JOIN PaymentType pt_payment ON pt_payment.id = bk.payment_type_id
        WHERE bk.sail_id = ?
        ORDER BY bk.id
    `;
    const [bookingsResults] = await pool.execute(bookingsQuery, [sailId]);
    return bookingsResults;
}
async function updateCustomer(customerId, customerData, connection) {
    const sql = `
        UPDATE Customer 
        SET name = ?, wants_whatsapp = ?, email = ?, notes = ? 
        WHERE id = ?
    `;
    const values = [
        customerData.name,
        customerData.wants_whatsapp,
        customerData.email,
        customerData.notes,
        customerId
    ];
    return await query(sql, values, connection);
}


// ====== פונקציית בדיקה זמנית ======
async function getRawSailById(sailId) {
    const sql = 'SELECT * FROM Sail WHERE id = ?';
    const results = await query(sql, [sailId]);
    return results.length > 0 ? results[0] : null;
}
// --- ייצוא כל הפונקציות ---

module.exports = {
    getRawSailById,
    // פונקציות בסיס
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
    getAllPaymentTypes,

    // משתמשים (שילוב של שתי הגרסאות)
    getUserByEmail,
    createUser,
    updateUserPassword,     // <<< חדש
    updateUserDetails,      // <<< חדש

    // הפלגות והזמנות
    getUpcomingSailsData,
    getBoatsForDashboard,
    getCustomerPhoneById,
    findSailsWithOccupancy,
    getSailById,            // <<< חדש
    getBookingsBySailId,    // <<< חדש

    // תהליך יצירת הזמנה (מהקובץ שלך)
    getCustomerByPhoneNumber,
    addCustomer,
    getPaymentTypeId,
    insertNewBooking,
    findSailByDetails,
    createNewSail,
    findBoatActivityId,
    createOrderInTransaction,
    checkAvailabilityAndLock,
    updateCustomer,

};