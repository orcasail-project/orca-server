const sailsService = require('../storage/sql');



/**
/**
 * פונקציית עזר לחישוב 5 סייקלים של חצי שעה.
 * מתחילה מהסייקל הנוכחי או הקודם (מעוגל לחצי שעה הקרובה למטה).
 * @returns {{cycles: string[], startTime: Date, endTime: Date}}
 */
function getNextFiveCycles() {
    const cycles = [];
    const now = new Date();
    
    // מצא את חצי השעה הנוכחית או הקודמת (עיגול למטה)
    let minutes = now.getMinutes();
    if (minutes >= 30) {
        now.setMinutes(30, 0, 0); // אם אנחנו בין xx:30 ל-xx:59, עגל ל-xx:30
    } else {
        now.setMinutes(0, 0, 0);  // אם אנחנו בין xx:00 ל-xx:29, עגל ל-xx:00
    }

    // 'now' מכיל כעת את שעת ההתחלה המעוגלת של הסייקל הראשון
    const startTime = new Date(now.getTime());

    // חשב 5 סייקלים של חצי שעה החל משעת ההתחלה
    for (let i = 0; i < 5; i++) {
        const cycleTime = new Date(startTime.getTime() + i * 30 * 60 * 1000);
        // פורמט "HH:MM"
        const timeString = cycleTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
        cycles.push(timeString);
    }
    
    // שעת הסיום היא שעת ההתחלה של טווח השליפה + 5 סייקלים של 30 דקות
    // כלומר, שעתיים וחצי אחרי שעת ההתחלה
    const endTime = new Date(startTime.getTime() + 5 * 30 * 60 * 1000);

    return { cycles, startTime, endTime };
}

/**
 * Handler ראשי לבניית דשבורד השיוטים.
 */
async function getSailsDashboard(req, res) {
    let connection = null;
    try {
        // 1. חשב את טווח הזמן ורשימת הסייקלים (עמודות הדשבורד)
        const { cycles, startTime, endTime } = getNextFiveCycles();
 console.log('Fetching data for time range:', { startTime, endTime });
        // 2. שלוף את כל הנתונים הרלוונטיים מה-DB במקביל
        connection = await sailsService.connectToDatabase();
        const [allBoats, flatSailsData] = await Promise.all([
            sailsService.getAllBoats(connection),
            sailsService.getUpcomingSailsData(connection, startTime, endTime)
        ]);
        
        // 3. עבד את הנתונים למבנה הרצוי
        
        // אובייקט זמני לקיבוץ כל ההזמנות תחת כל שיוט
        // המפתח הוא sail_id
        const sailsMap = {};

        flatSailsData.forEach(row => {
            // אם זה השיוט הראשון שאנחנו פוגשים, נייצר לו אובייקט בסיסי
            if (!sailsMap[row.sail_id]) {
                sailsMap[row.sail_id] = {
                    boat_name: row.boat_name, // נשמור את שם הסירה לקישור קל יותר
                    sail_id: row.sail_id,
                    planned_start_time: new Date(row.planned_start_time).toISOString(),
                    actual_start_time: row.actual_start_time,
                    population_type_id: row.population_type_id,
                    population_type_name: row.population_type_name,
                    sail_notes: row.sail_notes,
                    require_orca_escort: !!row.requires_orca_escort,
                    is_private_group: !!row.is_private_group,
                    total_people_on_sail: 0, // יחושב בסוף
                    total_people_on_activity: 0, // יחושב בסוף
                    bookings: []
                };
            }

            // אם יש פרטי הזמנה בשורה הנוכחית, נוסיף אותה למערך ההזמנות של השיוט
            if (row.booking_id) {
                sailsMap[row.sail_id].bookings.push({
                    booking_id: row.booking_id,
                    customer_id: row.customer_id,
                    customer_name: row.customer_name,
                    customer_phone_number: row.customer_phone_number,
                    num_people_sail: row.num_people_sail,
                    num_people_activity: row.num_people_activity,
                    is_phone_booking: !!row.is_phone_booking
                });
            }
        });
        
        // 4. חשב את סך המשתתפים לכל שיוט
        Object.values(sailsMap).forEach(sail => {
            sail.total_people_on_sail = sail.bookings.reduce((sum, booking) => sum + (booking.num_people_sail || 0), 0);
            sail.total_people_on_activity = sail.bookings.reduce((sum, booking) => sum + (booking.num_people_activity || 0), 0);
        });

        // 5. בנה את מבנה ה-JSON הסופי בדיוק לפי האפיון
        const sails_data = {};

//         const activeBoats = allBoats.filter(boat => boat.is_active);

//         activeBoats.forEach(boat => {
//  sails_data[boat.name] = {}; 
//   cycles.forEach(cycleTime => {
//         sails_data[boat.name][cycleTime] = null;
//     });
// });

      allBoats.forEach(boat => {
            if (boat.is_active) {
                // אם הסירה פעילה, אתחל את השורה שלה עם סלוטים ריקים (אובייקט)
                sails_data[boat.name] = {}; 
                cycles.forEach(cycleTime => {
                    sails_data[boat.name][cycleTime] = null;
                });
            } else {
                // אם הסירה לא פעילה, רשום הודעה (מחרוזת) במקום אובייקט השיוטים
                sails_data[boat.name] = "סירה לא פעילה";
            }
        });

    
        // 6. מלא את הנתונים במבנה הסופי
        Object.values(sailsMap).forEach(sail => {
            const boatName = sail.boat_name;
            const cycleTime = new Date(sail.planned_start_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
            
            // ודא שהסירה קיימת במבנה ושהסייקל תואם לאחד מהסייקלים שחישבנו
            if (sails_data[boatName] && sails_data[boatName][cycleTime] !== undefined) {
                 delete sail.boat_name; // נמחק את המפתח הזמני לפני השליחה
                 sails_data[boatName][cycleTime] = sail;
            }
        });

        // 7. שלח את התגובה הסופית
        res.status(200).json({
            sails_data: sails_data
        });

    } catch (error) {
        console.error("Error in getSailsDashboardHandler:", error);
        res.status(500).json({ message: "Failed to fetch dashboard data", error: error.message });
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed.');
        }
    }
}

module.exports = {
    getSailsDashboard
};