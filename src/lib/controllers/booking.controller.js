const { checkAvailabilitySchema, addCustomerSchema, addOrderSchema } = require('../schemas/booking.schema.js');
const { ZodError } = require('zod');
const { findSailsWithOccupancy, getCustomerByPhoneNumber, addCustomer, insertNewBooking, findSailByDetails, createNewSail, createOrderInTransaction } = require('../storage/sql');




function isSailAvailable(sail, newBooking) {
    // ---- הגדרת משתנים ----
    const sail_capacity = sail.sail_capacity ?? Infinity;
    const activity_capacity = sail.activity_capacity ?? Infinity;

    const current_activity_occupancy = sail.current_activity_occupancy;
    const current_sail_occupancy = sail.current_sail_occupancy;
    const current_total_occupancy_on_boat = current_activity_occupancy + current_sail_occupancy;

    const requested_activity = newBooking.num_people_activity;
    const requested_sail = newBooking.num_people_sail;
    const total_requested = requested_activity + requested_sail;

    // ---- בדיקת התנאים ----

    // תנאי 1: האם התפוסה העתידית בפעילות חורגת מקיבולת הפעילות?
    const future_activity_occupancy = current_activity_occupancy + requested_activity;
    const is_activity_ok = future_activity_occupancy <= activity_capacity;

    // תנאי 2: האם התפוסה העתידית בסירה חורגת מקיבולת הסירה?
    const future_total_occupancy_on_boat = current_total_occupancy_on_boat + total_requested;
    const is_sail_ok = future_total_occupancy_on_boat <= sail_capacity;

    // הדפסה לדיבוג נשארת שימושית לבדיקות
    console.log(`Checking sail ${sail.sail_id}:
        - Activity Check: Future occupancy (${future_activity_occupancy}) <= Capacity (${activity_capacity}) -> ${is_activity_ok}
        - Boat Check: Future occupancy (${future_total_occupancy_on_boat}) <= Capacity (${sail_capacity}) -> ${is_sail_ok}`);

    // ההזמנה תקינה רק אם שני התנאים מתקיימים
    return is_activity_ok && is_sail_ok;
}

const checkAvailability = async (req, res, next) => {
    try {

        const searchParams = checkAvailabilitySchema.parse(req.body);

        // שלב 1: קבלת כל השיוטים הפוטנציאליים מהמסד נתונים
        const potentialSails = await findSailsWithOccupancy(searchParams);

        // שלב 2: סינון רק השיוטים שבאמת זמינים (שיש בהם מקום)
        const availableSails = potentialSails.filter(sail =>
            isSailAvailable(sail, searchParams)
        );

        // אם אין שום שיוט זמין אחרי סינון, תשובה ריקה
        if (availableSails.length === 0) {
            return res.status(200).json({ exactMatch: null, halfHourBefore: [], halfHourAfter: [] });
        }

        // שלב 3: חיפוש שיוטים שמתאימים בדיוק לשעה המבוקשת
        const exactMatchSail = availableSails.find(
            sail => sail.planned_start_time.slice(0, 5) === searchParams.time
        );

        const mapSailToResponse = (sail) => ({
            cruiseId: sail.sail_id,
            time: sail.planned_start_time.slice(0, 5),
            activityType: sail.activity_name,
            populationType: sail.population_type_name,
            available_sail_seats: sail.available_sail_seats,
            available_activity_seats: sail.available_activity_seats,
            current_sail_occupancy: sail.current_sail_occupancy,
            current_activity_occupancy: sail.current_activity_occupancy
        });

        // if (exactMatchSail) {
        //     const response = {
        //         exactMatch: mapSailToResponse(exactMatchSail),
        //         halfHourBefore: [],
        //         halfHourAfter: [],
        //     };
        //     return res.status(200).json(response);
        // }


        // const beforeSails = availableSails
        //     .filter(sail => sail.planned_start_time.slice(0, 5) < searchParams.time)
        //     .map(mapSailToResponse);

        // const afterSails = availableSails
        //     .filter(sail => sail.planned_start_time.slice(0, 5) > searchParams.time)
        //     .map(mapSailToResponse);

        // const response = {
        //     exactMatch: null,
        //     halfHourBefore: beforeSails,
        //     halfHourAfter: afterSails,
        // };
        // שלב 3: מצא את כל ההתאמות, לא רק אחת
        const exactMatches = availableSails
            .filter(sail => sail.planned_start_time.slice(0, 5) === searchParams.time)
            .map(mapSailToResponse);

        const beforeSails = availableSails
            .filter(sail => sail.planned_start_time.slice(0, 5) < searchParams.time)
            .map(mapSailToResponse);

        const afterSails = availableSails
            .filter(sail => sail.planned_start_time.slice(0, 5) > searchParams.time)
            .map(mapSailToResponse);

        // שינוי מבנה התשובה: exactMatch הוא עכשיו מערך
        const response = {
            exactMatch: exactMatches, // <-- שינוי קריטי
            halfHourBefore: beforeSails,
            halfHourAfter: afterSails,
        };

        res.status(200).json(response);

    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ errors: error.errors.map(err => err.message) });
        }
        next(error);
    }
};

const checkExistingCustomer = async (req, res) => {
    const { phoneNumber } = req.query;

    if (!phoneNumber) {
        return res.status(400).json({ message: "The 'phoneNumber' query parameter is required." });
    }

    try {
        const customer = await getCustomerByPhoneNumber(phoneNumber);

        if (customer) {
            const response = {
                customer_id: customer.id.toString(),
                name: customer.name,
                phone_number: customer.phone_number,
                email: customer.email,
                whatsApp: customer.wants_whatsapp == 0 ? false : true,
                notes: customer.notes
            };

            res.status(200).json(response);
        } else {
            res.status(404).json({ message: `Customer with phone number ${phoneNumber} not found.` });
        }
    } catch (error) {
        console.error("Error in checkExistingCustomer:", error);
        res.status(500).json({ message: "Internal Server Error." });
    }
}



const addNewCustomer = async (req, res) => {
    try {

        const { body: validatedData } = addCustomerSchema.parse({
            body: req.body
        });


        const result = await addCustomer(validatedData);

        return res.status(201).json({
            message: 'Customer added successfully',
            customerId: result.insertId
        });

    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                message: 'Invalid input data',
                errors: error.flatten().fieldErrors
            });
        }

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: `A customer with the provided phone number already exists.`
            });
        }

        console.error('Error in addCustomer controller:', error);
        return res.status(500).json({
            message: 'An internal server error occurred.'
        });
    }
};



const addNewOrder = async (req, res) => {
    try {

        const { body: validatedData } = addOrderSchema.parse({
            body: req.body
        });

        const result = await createOrderInTransaction(validatedData);

        return res.status(201).json({
            message: 'Order added successfully',
            orderId: result.insertId
        });

    } catch (error) {

        if (error instanceof ZodError) {
            return res.status(400).json({
                message: 'Invalid input data',
                errors: error.flatten().fieldErrors
            });
        }
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(404).json({
                message: 'Referenced entity not found (e.g., paymentTypeId is invalid).',
                errorDetails: error.sqlMessage
            });
        }

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'A customer with the provided phone number already exists.'
            });
        }

        if (error.code === 'INVALID_BOAT_ACTIVITY_COMBO') {
            return res.status(400).json({
                message: 'Invalid input data',
                errors: { _form: [error.message] }
            });
        }

        if (error.code === 'INSUFFICIENT_SEATS') {
            return res.status(409).json({
                message: error.message,
                details: error.details
            });
        }
        if (error.code === 'SAIL_NOT_FOUND') {
            return res.status(404).json({ message: error.message });
        }

        console.error('Error in addNewOrder controller:', error);
        return res.status(500).json({ message: 'An internal server error occurred.' });
    }
};
module.exports = {
    checkAvailability,
    checkExistingCustomer,
    addNewCustomer,
    addNewOrder
};