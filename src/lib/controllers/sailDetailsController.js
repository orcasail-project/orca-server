// controllers/sailDetailsController.js
const sailsService = require('../storage/sql');

async function getSailById(req, res) {
    try {
        const sailId = parseInt(req.params.id);
        if (!sailId || isNaN(sailId)) {
            return res.status(400).json({ error: 'מזהה שיוט לא חוקי' });
        }

        // שליפת נתוני השיוט והזמנות במקביל
        const [sailData, bookingsData] = await Promise.all([
            sailsService.getSailById(sailId),
            sailsService.getBookingsBySailId(sailId)
        ]);

        if (!sailData) {
            return res.status(404).json({ error: 'שיוט לא נמצא' });
        }

        // --- התחלת לוגיקה עסקית ---

        let totalPeopleActivity = 0;
        let totalPeopleJustSailing = 0;
        let hasUnder16 = false;

        bookingsData.forEach(booking => {
            totalPeopleActivity += booking.num_people_activity || 0;
            totalPeopleJustSailing += booking.num_people_sail || 0;
            if (booking.up_to_16_year) {
                hasUnder16 = true;
            }
        });

        // 1. חישוב דרישה למלווה (Orca Escort)
        const requiresOrcaEscort = sailData.requires_orca_escort || hasUnder16;

        // 2. חישוב תפוסה כוללת בסירה
        // סך האנשים שהוזמנו (גם לפעילות וגם לשייט)
        const totalPeopleOnBoat = totalPeopleActivity + totalPeopleJustSailing;
        
        // 3. בניית התגובה הסופית לפי הפורמט המבוקש
        const response = {
            sail_id: sailData.sail_id,
            date: sailData.date,
            planned_start_time: sailData.planned_start_time,
            actual_start_time: sailData.actual_start_time || null,
            end_time: sailData.end_time || null,
            population_type: sailData.population_type,
            is_private_group: sailData.is_private_group,
            boat_activity: sailData.boat_activity,
            requires_orca_escort_2: requiresOrcaEscort, // שם השדה כפי שמופיע בדרישות
            notes: sailData.notes,
            boat: sailData.boat,
            
            // מיפוי ההזמנות לפורמט הנדרש
            bookings: bookingsData.map(booking => ({
                booking_id: booking.booking_id,
                name: booking.name,
                phone: booking.phone,
                num_people_activity: booking.num_people_activity || 0,
                num_people_sail: booking.num_people_sail || 0,
                final_price: booking.final_price,
                payment_type: booking.payment_type,
                note: booking.note
            })),

            // הוספת שדות התפוסה כפי שהוגדר
            capacity_activity: totalPeopleActivity, // סך האנשים בפעילות
            capacity_sail: totalPeopleOnBoat, // סך כל האנשים בסירה (לפי הדרישה "סה"כ האנשים בשיט מכל ההזמנות")

            // שדות בונוס לשימוש ב-frontend (אופציונלי אך מומלץ)
            boat_capacity_details: {
                max_capacity: sailData.boat_max_capacity,
                currently_occupied: totalPeopleOnBoat,
                orca_escort_takes_place: requiresOrcaEscort ? 1 : 0,
                available_places: Math.max(0, sailData.boat_max_capacity - totalPeopleOnBoat - (requiresOrcaEscort ? 1 : 0))
            }
        };

        res.status(200).json(response);

    } catch (error) {
        console.error(`Error in getSailById handler for sail ${req.params.id}:`, error);
        res.status(500).json({ error: 'שגיאה פנימית בשרת', details: error.message });
    }
}

// const sailsService = require('../storage/sql');

// /**
//  * Handler לבאת פרטי שיוט ספציפי לפי מזהה
//  * מחזיר מידע מקיף על השיוט כולל הזמנות ותפוסה
//  */
// async function getSailById(req, res) {
//     try {
//         // 1. שליפת מזהה השיוט מהפרמטרים
//         const sailId = parseInt(req.params.id);

//         // 2. ולידציה בסיסית
//         if (!sailId || isNaN(sailId)) {
//             return res.status(400).json({
//                 error: 'מזהה שיוט לא חוקי',
//                 message: 'Sail ID must be a valid number'
//             });
//         }

//         // 3. שליפת נתוני השיוט והזמנות מהמסד
//         const [sailData, bookingsData] = await Promise.all([
//             sailsService.getSailById(sailId),
//             sailsService.getBookingsBySailId(sailId)
//         ]);

//         // 4. בדיקה אם השיוט נמצא
//         if (!sailData) {
//             return res.status(404).json({
//                 error: 'שיוט לא נמצא',
//                 message: 'Sail not found',
//                 sail_id: sailId
//             });
//         }

//         // 5. חישוב תפוסה ולוגיקה עסקית
//         let totalSailCapacity = 0;
//         let totalActivityCapacity = 0;
//         let hasUnder16 = false;

//         bookingsData.forEach(booking => {
//             totalSailCapacity += booking.num_people_sail || 0;
//             totalActivityCapacity += booking.num_people_activity || 0;
//             if (booking.up_to_16_year) {
//                 hasUnder16 = true;
//             }
//         });

//         // חישוב האם נדרש מלווה אורקה
//         const requiresOrcaEscort = sailData.requires_orca_escort || hasUnder16;

//         // אם נדרש מלווה אורקה, הוא תופס מקום אחד
//         const availableActivityCapacity = sailData.activity_max_capacity - totalActivityCapacity - (requiresOrcaEscort ? 1 : 0);

//         // 6. בניית התגובה הסופית
//         const response = {
//             sail_id: sailData.sail_id,
//             date: sailData.date,
//             planned_start_time: sailData.planned_start_time,
//             actual_start_time: sailData.actual_start_time,
//             end_time: sailData.end_time,
//             population_type: sailData.population_type,
//             is_private_group: sailData.is_private_group,
//             boat_activity: sailData.boat_activity,
//             requires_orca_escort: requiresOrcaEscort,
//             notes: sailData.notes,
//             boat: sailData.boat,
//             bookings: bookingsData.map(booking => ({
//                 booking_id: booking.booking_id,
//                 name: booking.name,
//                 phone: booking.phone,
//                 num_people_activity: booking.num_people_activity,
//                 num_people_sail: booking.num_people_sail,
//                 final_price: booking.final_price,
//                 payment_type: booking.payment_type,
//                 note: booking.note
//             })),
//             capacity_activity: totalActivityCapacity,
//             capacity_sail: totalSailCapacity,
//             available_activity_capacity: Math.max(0, availableActivityCapacity),
//             activity_max_capacity: sailData.activity_max_capacity
//         };

//         // 7. שליחת התגובה המוצלחת
//         res.status(200).json(response);

//     } catch (error) {
//         console.error(`Error in getSailById handler for sail ${req.params.id}:`, error);

//         // שליחת הודעת שגיאה גנרית
//         res.status(500).json({
//             error: 'שגיאה בשרת',
//             message: 'Internal server error',
//             details: error.message
//         });
//     }
// }

module.exports = {
    getSailById
};