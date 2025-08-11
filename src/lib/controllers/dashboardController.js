const sailsService = require('../storage/sql');
const dashboardConfig = require('../../../config/dashboardConfig.js');

/**
 * פונקציית עזר לחישוב סייקלים של חצי שעה לדשבורד.
 */
function getNextTimeCycles() {
    const NUM_CYCLES = dashboardConfig.NUM_CYCLES || 5;
    const CYCLE_DURATION_MINUTES = dashboardConfig.CYCLE_DURATION_MINUTES || 30;
    const cycles = [];
    const now = new Date();
    let minutes = now.getMinutes();
    if (minutes >= CYCLE_DURATION_MINUTES) {
        now.setMinutes(CYCLE_DURATION_MINUTES, 0, 0);
    } else {
        now.setMinutes(0, 0, 0);
    }
    const startTime = new Date(now.getTime());
    for (let i = 0; i < NUM_CYCLES; i++) {
        const cycleTime = new Date(startTime.getTime() + i * CYCLE_DURATION_MINUTES * 60 * 1000);
        const timeString = cycleTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
        cycles.push(timeString);
    }
    const endTime = new Date(startTime.getTime() + NUM_CYCLES * CYCLE_DURATION_MINUTES * 60 * 1000);
    return { cycles, startTime, endTime };
}

/**
 * Handler ראשי לבניית דשבורד השיוטים.
 * השרת לא מתעסק בתרגום. הוא שולח מזהים (IDs) והקליינט אחראי לתצוגה.
 */
async function getSailsDashboard(req, res) {
    try {
        // 1. חשב את טווח הזמן ורשימת הסייקלים
        const { cycles, startTime, endTime } = getNextTimeCycles();

        // 2. שלוף את כל הנתונים הרלוונטיים
        let [allBoats, flatSailsData] = await Promise.all([
            sailsService.getAllBoats(),
            sailsService.getUpcomingSailsData(startTime, endTime)
        ]);

        // Mock data for testing when database is empty
        if (allBoats.length === 0) {
            console.log("No boats in database, using mock data for testing");
            allBoats = [
                { id: 1, name: 'טיל כחול', is_active: true, gate_number: 'א' },
                { id: 2, name: 'טייפון', is_active: true, gate_number: 'ב' },
                { id: 3, name: 'טורפדו', is_active: true, gate_number: 'ד' },
                { id: 4, name: 'לוי', is_active: false, gate_number: null },
                { id: 5, name: 'קמיקזה', is_active: true, gate_number: 'ג' }
            ];

            // Create mock sails for the first two time cycles
            const mockTime1 = new Date(startTime);
            const mockTime2 = new Date(startTime.getTime() + 30 * 60 * 1000);
            
            flatSailsData = [
                // Sail for boat 1 at first time slot
                {
                    boat_id: 1,
                    sail_id: 101,
                    planned_start_time: mockTime1,
                    actual_start_time: null,
                    population_type_id: 1,
                    population_type_name: 'משפחות',
                    sail_notes: 'שיוט בדיקה',
                    requires_orca_escort: 0,
                    is_private_group: 0,
                    booking_id: 201,
                    customer_id: 301,
                    customer_name: 'ישראל ישראלי',
                    customer_phone_number: '050-1234567',
                    num_people_sail: 8,
                    num_people_activity: 6,
                    is_phone_booking: 1
                },
                {
                    boat_id: 1,
                    sail_id: 101,
                    planned_start_time: mockTime1,
                    actual_start_time: null,
                    population_type_id: 1,
                    population_type_name: 'משפחות',
                    sail_notes: 'שיוט בדיקה',
                    requires_orca_escort: 0,
                    is_private_group: 0,
                    booking_id: 202,
                    customer_id: 302,
                    customer_name: 'דוד כהן',
                    customer_phone_number: '052-9876543',
                    num_people_sail: 4,
                    num_people_activity: 3,
                    is_phone_booking: 0
                },
                // Sail for boat 2 at second time slot
                {
                    boat_id: 2,
                    sail_id: 102,
                    planned_start_time: mockTime2,
                    actual_start_time: null,
                    population_type_id: 2,
                    population_type_name: 'נוער',
                    sail_notes: 'קבוצת נוער',
                    requires_orca_escort: 1,
                    is_private_group: 1,
                    booking_id: 203,
                    customer_id: 303,
                    customer_name: 'קבוצת נוער רמת גן',
                    customer_phone_number: '03-1234567',
                    num_people_sail: 25,
                    num_people_activity: 20,
                    is_phone_booking: 1
                }
            ];
        }

        // 3. עבד את הנתונים השטוחים למבנה מקונן (sailsMap)
        const sailsMap = {};
        flatSailsData.forEach(row => {
            if (!sailsMap[row.sail_id]) {
                sailsMap[row.sail_id] = {
                    boat_id: row.boat_id, // חשוב לשמור את ה-ID של הסירה
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

        // 4. חשב סך משתתפים והוסף סטטוסים (ללא שינוי)
        Object.values(sailsMap).forEach(sail => {
            sail.total_people_on_sail = sail.bookings.reduce((sum, booking) => sum + (booking.num_people_sail || 0), 0);
            sail.total_people_on_activity = sail.bookings.reduce((sum, booking) => sum + (booking.num_people_activity || 0), 0);
        });
        let nextSailTime = null;
        Object.values(sailsMap).forEach(sail => {
            if (!sail.actual_start_time) {
                const sailTime = new Date(sail.planned_start_time).getTime();
                if (nextSailTime === null || sailTime < nextSailTime) {
                    nextSailTime = sailTime;
                }
            }
        });
        const LATE_THRESHOLD_MINUTES = dashboardConfig.LATE_THRESHOLD_MINUTES || 15;
        const now = new Date().getTime();
        Object.values(sailsMap).forEach(sail => {
            const sailTime = new Date(sail.planned_start_time).getTime();
            sail.is_next_sail = (nextSailTime !== null && !sail.actual_start_time && sailTime === nextSailTime);
            if (sail.actual_start_time) { sail.status = 'at-sea'; return; }
            const hasPhoneBooking = sail.bookings.some(b => b.is_phone_booking);
            if (hasPhoneBooking) {
                const diffMinutes = (now - sailTime) / (1000 * 60);
                if (diffMinutes >= LATE_THRESHOLD_MINUTES) { sail.status = 'expired'; return; }
            }
            if (sail.is_next_sail) { sail.status = 'next'; return; }
            sail.status = 'pending';
        });

        // 5. בנה את מבנה ה-JSON הסופי
        const sails_data = {};

        // אתחול המבנה עם ה-ID של הסירה כמפתח
        allBoats.forEach(boat => {
            const boatId = boat.id; // המפתח הוא ה-ID של הסירה

            if (boat.is_active) {
                sails_data[boatId] = {};
                cycles.forEach(cycleTime => {
                    sails_data[boatId][cycleTime] = null;
                });
            } else {
                // שלח מזהה טקסטואלי שהקליינט ידע לפרש
                sails_data[boatId] = 'inactive'; 
            }
        });

        // 6. מלא את הנתונים במבנה הסופי
        Object.values(sailsMap).forEach(sail => {
            const boatId = sail.boat_id; // השתמש ב-ID של הסירה מהשיוט
            const cycleTime = new Date(sail.planned_start_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });

            // ודא שהסירה קיימת במבנה הנתונים
            if (sails_data[boatId] && sails_data[boatId][cycleTime] !== undefined) {
                sails_data[boatId][cycleTime] = sail;
            }
        });

        // 7. שלח את התגובה הסופית לקליינט
        res.status(200).json({
            sails_data: sails_data
        });

    } catch (error) {
        console.error("Error in getSailsDashboardHandler:", error);
        // שלח הודעת שגיאה גנרית, הקליינט יתרגם אותה
        res.status(500).json({ message: "Failed to fetch dashboard data", error: error.message });
    }
}

module.exports = {
    getSailsDashboard
};