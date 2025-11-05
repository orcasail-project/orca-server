const sailsService = require('../storage/sql');
const dashboardConfig = require('../../../config/dashboardConfig.js');

/**
 * פונקציית עזר לחישוב סייקלים של חצי שעה לדשבורד - גרסה 4 (אמינה ופשוטה)
 */
// function getNextTimeCycles() {
//     const NUM_CYCLES = dashboardConfig.NUM_CYCLES || 5;
//     const CYCLE_DURATION_MS = (dashboardConfig.CYCLE_DURATION_MINUTES || 30) * 60 * 1000;
//     const timeZone = 'Asia/Jerusalem';
//     const cycles = [];

//     // 1. קח את הזמן הנוכחי. הוא תמיד אוניברסלי (UTC).
//     const now = new Date();

//     // 2. השתמש ב-Intl כדי לגלות מה הדקה הנוכחית *בשעון ישראל*.
//     const israelMinute = parseInt(
//         new Intl.DateTimeFormat('en-US', {
//             timeZone: timeZone,
//             minute: 'numeric',
//             hour12: false
//         }).format(now)
//     );

//     // 3. חשב כמה דקות עברו מאז חצי השעה העגולה האחרונה.
//     //    לדוגמה, אם השעה 18:13, התוצאה תהיה 13.
//     const minutesPastCycle = israelMinute % 30;

//     // 4. זמן ההתחלה של החלון שלנו הוא הזמן הנוכחי, פחות הדקות העודפות.
//     //    זה מחזיר אותנו אחורה בזמן בדיוק לחצי השעה העגולה, ושומר על הזמן כ-UTC נכון.
//     const startTime = new Date(now.getTime() - (minutesPastCycle * 60 * 1000));
//     startTime.setSeconds(0, 0); // אפס שניות ומילישניות לדיוק מירבי

//     // 5. צור את רשימת הסייקלים מה-startTime המדויק
//     const cycleFormatter = new Intl.DateTimeFormat('he-IL', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false });
//     for (let i = 0; i < NUM_CYCLES; i++) {
//         const cycleDate = new Date(startTime.getTime() + i * CYCLE_DURATION_MS);
//         cycles.push(cycleFormatter.format(cycleDate));
//     }

//     const endTime = new Date(startTime.getTime() + NUM_CYCLES * CYCLE_DURATION_MS);

//     return { cycles, startTime, endTime };
// }

function getNextTimeCycles() {
    const NUM_CYCLES = dashboardConfig.NUM_CYCLES || 5;
    const CYCLE_DURATION_MS = (dashboardConfig.CYCLE_DURATION_MINUTES || 30) * 60 * 1000;
    const timeZone = 'Asia/Jerusalem';
    const cycles = [];

    const now = new Date();

    const israelMinute = parseInt(
        new Intl.DateTimeFormat('en-US', {
            timeZone: timeZone,
            minute: 'numeric',
            hour12: false
        }).format(now)
    );

    const minutesPastCycle = israelMinute % 30;

    // const startTime = new Date(now.getTime() - (minutesPastCycle * 60 * 1000));
    const startTime = new Date(now.getTime() - (minutesPastCycle * 60 * 1000) - CYCLE_DURATION_MS);
    startTime.setSeconds(0, 0);

    // ================== הדפסות אבחון ==================
    console.log("--- DEBUG: Calculating Time Window ---");
    console.log(`Current Time (UTC): ${now.toISOString()}`);
    console.log(`Calculated Start Time (UTC): ${startTime.toISOString()}`);
    // ================================================

    const cycleFormatter = new Intl.DateTimeFormat('he-IL', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false });
    for (let i = 0; i < NUM_CYCLES; i++) {
        const cycleDate = new Date(startTime.getTime() + i * CYCLE_DURATION_MS);
        cycles.push(cycleFormatter.format(cycleDate));
    }

    const endTime = new Date(startTime.getTime() + NUM_CYCLES * CYCLE_DURATION_MS);

    return { cycles, startTime, endTime };
}

async function getCustomerPhone(req, res) {
    try {
        const customerId = req.params.id;
        const phoneNumber = await sailsService.getCustomerPhoneById(customerId);
        if (!phoneNumber) {
            return res.status(404).json({ message: "Customer not found" });
        }
        res.status(200).json({ phone_number: phoneNumber });
    } catch (error) {
        console.error("Error in getCustomerPhone:", error);
        res.status(500).json({ message: "Failed to fetch phone number" });
    }
}


/**
 * פונקציית עזר שממפה שעת שיוט ספציפית לסייקל החצי שעה המתאים לה.
 * לדוגמה: עבור שעה 11:14, תחזיר אובייקט Date של 11:00.
 * @param {string | Date} sailTime - זמן השיוט (כמחרוזת ISO או אובייקט Date)
 * @returns {Date} - אובייקט Date המייצג את תחילת הסייקל
 */
function mapSailTimeToCycleDate(sailTime) {
    const date = new Date(sailTime);
    const minutes = date.getMinutes();

    // מחשבים כמה דקות עברו מתחילת הסייקל (0 או 30)
    const minutesPastCycle = minutes % 30;

    // מחסירים את הדקות העודפות כדי "לעגל" את הזמן כלפי מטה
    date.setMinutes(minutes - minutesPastCycle);

    // מאפסים שניות ומילישניות לדיוק מירבי
    date.setSeconds(0, 0);

    return date;
}

/**
 * Handler ראשי לבניית דשבורד השיוטים.
 */
async function getSailsDashboard(req, res) {
    try {
        const { cycles, startTime, endTime } = getNextTimeCycles();

        const [allBoats, flatSailsData] = await Promise.all([
            sailsService.getBoatsForDashboard(),
            sailsService.getUpcomingSailsData(startTime, endTime)
        ]);

        const sailsMap = {};
        flatSailsData.forEach(row => {
            if (!sailsMap[row.sail_id]) {
                sailsMap[row.sail_id] = {
                    boat_id: row.boat_id, sail_id: row.sail_id,
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
                    booking_id: row.booking_id, customer_id: row.customer_id,
                    customer_name: row.customer_name,
                    // customer_phone_number: row.customer_phone_number,
                    num_people_sail: row.num_people_sail,
                    num_people_activity: row.num_people_activity,
                    is_phone_booking: !!row.is_phone_booking,
                    activity_name: row.activity_name,
                    booking_notes: row.booking_notes
                });
            }
        });

        Object.values(sailsMap).forEach(sail => {
            sail.total_people_on_sail = sail.bookings.reduce((sum, b) => sum + (b.num_people_sail || 0), 0);
            sail.total_people_on_activity = sail.bookings.reduce((sum, b) => sum + (b.num_people_activity || 0), 0);
        });

        // let nextSail = null;
        // Object.values(sailsMap).forEach(sail => {
        //     if (!sail.actual_start_time) {
        //         if (nextSail === null || new Date(sail.planned_start_time) < new Date(nextSail.planned_start_time)) {
        //             nextSail = sail;
        //         }
        //     }
        // });
        //שיפור בודק עבור כל סירה בנפרד:
        const nextSailPerBoat = {}; // אובייקט שיחזיק את השיוט הבא לכל סירה
        Object.values(sailsMap).forEach(sail => {
            // נתייחס רק לשיוטים שטרם יצאו
            if (!sail.actual_start_time) {
                const boatId = sail.boat_id;
                const currentNextForBoat = nextSailPerBoat[boatId];

                // אם עדיין לא מצאנו שיוט "הבא בתור" לסירה זו,
                // או אם השיוט הנוכחי מוקדם יותר מזה שמצאנו - נעדכן אותו
                if (!currentNextForBoat || new Date(sail.planned_start_time) < new Date(currentNextForBoat.planned_start_time)) {
                    nextSailPerBoat[boatId] = sail;
                }
            }
        });

        const LATE_THRESHOLD_MINUTES = dashboardConfig.LATE_THRESHOLD_MINUTES || 15;
        const now = new Date();

        Object.values(sailsMap).forEach(sail => {
            const sailTime = new Date(sail.planned_start_time);

            if (sail.actual_start_time) {
                sail.status = 'at-sea';
                return;
            }

            const hasPhoneBooking = sail.bookings.some(b => b.is_phone_booking);
            if (hasPhoneBooking) {
                const diffMinutes = (now.getTime() - sailTime.getTime()) / (1000 * 60);
                if (diffMinutes >= LATE_THRESHOLD_MINUTES) {
                    // sail.status = 'expired';
                    sail.status = 'late';
                    return;
                }
            }

            // if (nextSail && sail.sail_id === nextSail.sail_id) {
            //     sail.status = 'next';
            //     return;
            // }

            // sail.status = 'pending';

            const nextSailForThisBoat = nextSailPerBoat[sail.boat_id];
            if (nextSailForThisBoat && sail.sail_id === nextSailForThisBoat.sail_id) {
                sail.status = 'next';
                return; // עבור לשיוט הבא בלולאה
            }

            sail.status = 'pending';
        });

        const sails_data = {};
        allBoats.forEach(boat => {
            if (boat.is_active) {
                sails_data[boat.id] = {};
                cycles.forEach(cycleTime => {
                    sails_data[boat.id][cycleTime] = null;
                });
            }
        });

        const israelCycleFormatter = new Intl.DateTimeFormat('he-IL', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit', hour12: false });
        Object.values(sailsMap).forEach(sail => {
            const boatId = sail.boat_id;



 // ==========================================================
    //                     <<<  התיקון כאן  >>>
    // ==========================================================

    // שלב 1: קבל את אובייקט ה-Date המעוגל כלפי מטה
    const cycleDate = mapSailTimeToCycleDate(sail.planned_start_time);

    // שלב 2: פרמט את התאריך המעוגל למחרוזת שתואמת למפתחות השורות
    const cycleTime = israelCycleFormatter.format(cycleDate);

    // ==========================================================

            // const sailTimeUTC = new Date(sail.planned_start_time);
            // const cycleTime = israelCycleFormatter.format(sailTimeUTC);

            if (sails_data[boatId] && sails_data[boatId].hasOwnProperty(cycleTime)) {
                sails_data[boatId][cycleTime] = sail;
            }
        });

        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache', 'Expires': '0'
        });
        res.status(200).json({
            boats: allBoats,
            sails_data: sails_data
        });

    } catch (error) {
        console.error("Error in getSailsDashboardHandler:", error);
        res.status(500).json({ message: "Failed to fetch dashboard data", error: error.message });
    }
}

module.exports = {
    getSailsDashboard,
    getCustomerPhone
};