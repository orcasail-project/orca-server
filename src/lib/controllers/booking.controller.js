// 1. ייבוא של כל מה שאנחנו צריכים
const { checkAvailabilitySchema } = require('../schemas/booking.schema.js');
const { ZodError } = require('zod');
const { findSailsWithOccupancy } = require('../storage/sql');



function isSailAvailable(sail, newBooking) {
   
    const activity_capacity = sail.activity_capacity ?? Infinity;

    const sail_capacity = sail.sail_capacity ?? Infinity;

    const free_places_activity = activity_capacity - sail.current_activity_occupancy;
    const free_places_sail = sail_capacity - sail.current_sail_occupancy;
    
    console.log(`Checking sail ${sail.sail_id}: 
        Activity: ${activity_capacity} (capacity) - ${sail.current_activity_occupancy} (occupancy) >= ${newBooking.num_people_activity} (needed) -> ${free_places_activity >= newBooking.num_people_activity}
        Sail: ${sail_capacity} (capacity) - ${sail.current_sail_occupancy} (occupancy) >= ${newBooking.num_people_sail} (needed) -> ${free_places_sail >= newBooking.num_people_sail}`);

    return free_places_activity >= newBooking.num_people_activity && free_places_sail >= newBooking.num_people_sail;
}

const checkAvailability = async (req, res, next) => {
    try {
      
        const searchParams = checkAvailabilitySchema.parse(req.body);
        console.log("1. PARAMS VALIDATED:", searchParams);

        // שלב 1: קבלת כל השיוטים הפוטנציאליים מהמסד נתונים
        const potentialSails = await findSailsWithOccupancy(searchParams);
        console.log("2. POTENTIAL SAILS FROM DB:", JSON.stringify(potentialSails, null, 2));

        // שלב 2: סינון רק השיוטים שבאמת זמינים (שיש בהם מקום)
        const availableSails = potentialSails.filter(sail => 
            isSailAvailable(sail, searchParams)
        );
        console.log("3. FILTERED AVAILABLE SAILS:", JSON.stringify(availableSails, null, 2));
        
        // אם אין שום שיוט זמין אחרי סינון, תשובה ריקה
        if (availableSails.length === 0) {
            console.log("4. No available sails found after filtering. Exiting.");
            return res.status(200).json({ exactMatch: null, halfHourBefore: [], halfHourAfter: [] });
        }

        // שלב 3: יישום החוק העסקי - "התאמה מדויקת תחילה
        const exactMatchSail = availableSails.find(
            sail => sail.planned_start_time.slice(0, 5) === searchParams.time
        );
        console.log("5. EXACT MATCH CHECK:", exactMatchSail ? `Found match with ID ${exactMatchSail.sail_id}` : "No exact match found.");

        if (exactMatchSail) {
            console.log("6. Building response for an exact match.");
            const response = {
                exactMatch: {
                    cruiseId: exactMatchSail.sail_id,
                    time: exactMatchSail.planned_start_time.slice(0, 5),
                    activityType: exactMatchSail.activity_name,
                    populationType: exactMatchSail.population_type_name,
                },
                halfHourBefore: [],
                halfHourAfter: [],
            };
            return res.status(200).json(response);
        }

        // שלב 4: אם אין התאמה מדויקת, בנה את התשובה עם השכנים
        console.log("7. Building response with surrounding sails.");
        const beforeSails = availableSails
            .filter(sail => sail.planned_start_time.slice(0, 5) < searchParams.time)
            .map(sail => ({ 
                cruiseId: sail.sail_id, 
                time: sail.planned_start_time.slice(0, 5),
                activityType: sail.activity_name,
                populationType: sail.population_type_name,
            }));

        const afterSails = availableSails
            .filter(sail => sail.planned_start_time.slice(0, 5) > searchParams.time)
            .map(sail => ({ 
                cruiseId: sail.sail_id, 
                time: sail.planned_start_time.slice(0, 5),
                activityType: sail.activity_name,
                populationType: sail.population_type_name,
            }));
            
        const response = {
            exactMatch: null,
            halfHourBefore: beforeSails,
            halfHourAfter: afterSails,
        };

        res.status(200).json(response);

    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ errors: error.errors.map(err => err.message) });
        }
        console.error("GLOBAL CATCH BLOCK ERROR:", error);
        next(error);
    }
};

module.exports = {
    checkAvailability,
};