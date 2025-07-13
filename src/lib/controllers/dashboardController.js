const sailsService = require('../storage/sql');
/**
 * פונקציית עזר לחישוב סייקלים של חצי שעה לדשבורד.
 * מתחילה מהסייקל הנוכחי או הקודם (מעוגל לחצי שעה הקרובה למטה).
 * @returns {{cycles: string[], startTime: Date, endTime: Date}}
 */
function getNextTimeCycles() {
    // שימוש בקבועים למניעת "מספרי קסם" ולתחזוקה קלה
    const NUM_CYCLES = 5;
    const CYCLE_DURATION_MINUTES = 30;

    const cycles = [];
    const now = new Date();

    // עיגול שעת ההתחלה לחצי השעה הקרובה (למטה)
    let minutes = now.getMinutes();
    if (minutes >= CYCLE_DURATION_MINUTES) {
        now.setMinutes(CYCLE_DURATION_MINUTES, 0, 0);
    } else {
        now.setMinutes(0, 0, 0);
    }
    const startTime = new Date(now.getTime());

    // יצירת רשימת הסייקלים (העמודות בדשבורד)
    for (let i = 0; i < NUM_CYCLES; i++) {
        const cycleTime = new Date(startTime.getTime() + i * CYCLE_DURATION_MINUTES * 60 * 1000);
        const timeString = cycleTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
        cycles.push(timeString);
    }

    // חישוב שעת הסיום לטווח השליפה מה-DB, מבוסס על אותם קבועים
    const endTime = new Date(startTime.getTime() + NUM_CYCLES * CYCLE_DURATION_MINUTES * 60 * 1000);

    return { cycles, startTime, endTime };
}

/**
 * Handler ראשי לבניית דשבורד השיוטים.
 */
async function getSailsDashboard(req, res) {
    try {
        // 1. חשב את טווח הזמן ורשימת הסייקלים (עמודות הדשבורד)
        const { cycles, startTime, endTime } = getNextTimeCycles();

        // console.log('Fetching data for time range:', { startTime, endTime });

        // 2. שלוף את כל הנתונים הרלוונטיים מה-DB במקביל.
        // הקונטרולר לא מנהל חיבורים, רק קורא לשירות.
        const [allBoats, flatSailsData] = await Promise.all([
            sailsService.getAllBoats(),
            sailsService.getUpcomingSailsData(startTime, endTime)
        ]);

        // 3. עבד את הנתונים השטוחים למבנה מקונן (קיבוץ לפי שיוט)
        const sailsMap = {};
        flatSailsData.forEach(row => {
            if (!sailsMap[row.sail_id]) {
                sailsMap[row.sail_id] = {
                    boat_name: row.boat_name,
                    sail_id: row.sail_id,
                    planned_start_time: new Date(row.planned_start_time).toISOString(),
                    actual_start_time: row.actual_start_time,
                    population_type_id: row.population_type_id,
                    population_type_name: row.population_type_name,
                    sail_notes: row.sail_notes,
                    require_orca_escort: !!row.requires_orca_escort,
                    is_private_group: !!row.is_private_group,
                    total_people_on_sail: 0,
                    total_people_on_activity: 0,
                    bookings: []
                };
            }
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

        // 5. בנה את מבנה ה-JSON הסופי
        const sails_data = {};

        // הקוד כאן נקי, ללא שורות מיותרות בהערה
        allBoats.forEach(boat => {
            if (boat.is_active) {
                sails_data[boat.name] = {};
                cycles.forEach(cycleTime => {
                    sails_data[boat.name][cycleTime] = null;
                });
            } else {
                sails_data[boat.name] = "סירה לא פעילה";
            }
        });

        // 6. מלא את הנתונים במבנה הסופי
        Object.values(sailsMap).forEach(sail => {
            const boatName = sail.boat_name;
            const cycleTime = new Date(sail.planned_start_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });

            if (sails_data[boatName] && sails_data[boatName][cycleTime] !== undefined) {
                delete sail.boat_name;
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
    }
    // אין יותר צורך ב-finally block כי הקונטרולר לא מנהל חיבורים.
}

module.exports = {
    getSailsDashboard
};