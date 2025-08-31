// File: src/lib/controllers/metadata.controller.js

// שלב 1: איחוד כל ה-imports הנחוצים משני הענפים
const {
    getAllBoatsToMataData, // מביא את הנתונים הנכונים לעיבוד (עם max_passengers)
    getAllActivities,
    getAllBoatActivities, // נתון חדש וחשוב מ-add-metadata
    getAllPermissions,
    getAllPopulationTypes,
    getAllRoles, // נתון חשוב שהיה ב-HEAD
} = require('../storage/sql');


/**
 * שלב 2: שימוש בפונקציית העזר מ-HEAD, אך עם כל הנתונים החדשים
 * Fetches all metadata required for application initialization.
 * This function uses smaller fetch functions and runs them in parallel.
 * @returns {Promise<Object>} An object containing all the raw data arrays.
 */
async function fetchAllRawData() {
    try {
        // Promise.all שיביא את כל המידע שצריך לעיבוד
        const [
            boats,
            activities,
            populationTypes,
            permissions,
            boatActivities,
            roles
        ] = await Promise.all([
            getAllBoatsToMataData(),
            getAllActivities(),
            getAllPopulationTypes(),
            getAllPermissions(),
            getAllBoatActivities(),
            getAllRoles()
        ]);

        return { boats, activities, populationTypes, permissions, boatActivities, roles };
    } catch (error) {
        console.error("Error fetching all raw data from DB:", error);
        throw error;
    }
}

/**
 * Endpoint to get all application metadata.
 * Fetches raw data from the DB, transforms it, and sends a structured object to the client.
 */
const getMetadata = async (req, res) => {
    try {

        const rawData = await fetchAllRawData();

        const finalPayload = transformRawDataToMetadata(rawData);

        res.status(200).json(finalPayload);

    } catch (error) {
        console.error("Error in getMetadata controller:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


/**
 * Transforms raw database arrays into a structured metadata object as required by the client specification.
 * @param {object} rawData - The raw data from the database.
 * @returns {object} The fully structured metadata payload.
 */
function transformRawDataToMetadata(rawData) {
    const { boats, activities, populationTypes, permissions, boatActivities, roles } = rawData;

    const metadata = {
        activity_prices: activities.reduce((acc, activity) => {
            acc[activity.name] = activity.ticket_price;
            return acc;
        }, {}),

        boat_capacity: boats.reduce((acc, boat) => {
            acc[boat.name] = boat.max_passengers;
            return acc;
        }, {}),

        activity_max_capacity: activities.reduce((acc, activity) => {
            if (activity.max_people_total !== null) {
                acc[activity.name] = activity.max_people_total;
            }
            return acc;
        }, {}),


        population_types: populationTypes.reduce((acc, type) => {
            const key = type.name.charAt(0);
            acc[key] = { name: type.name, description: type.notes || `קבוצת ${type.name}` };
            return acc;
        }, {}),


        requires_escort_2: activities.reduce((acc, activity) => {
            acc[activity.name] = (activity.name === 'אבובים' || activity.name === 'בננות');
            return acc;
        }, {}),


        boat_to_activities: boatActivities.reduce((acc, link) => {
            if (!acc[link.boat_name]) {
                acc[link.boat_name] = [];
            }
            acc[link.boat_name].push(link.activity_name);
            return acc;
        }, {})
    };


    const computed = {
        activity_to_boats: boatActivities.reduce((acc, link) => {
            if (!acc[link.activity_name]) {
                acc[link.activity_name] = [];
            }
            acc[link.activity_name].push(link.boat_name);
            return acc;
        }, {}),

        // קיבולת בפועל לכל שילוב סירה-פעילות 
        boat_activity_capacity: boatActivities.reduce((acc, link) => {
            const key = `${link.boat_name}_${link.activity_name}`;

            // הנהג
            let capacity = link.boat_capacity - 1;


            // // מוצא את המקסימום בין קיבולת הסירה (לאחר הורדות) וקיבולת הפעילות
            // // אם לפעילות אין מגבלה משלה (activity_capacity is null), נתעלם ממנה.
            // if (link.activity_capacity !== null) {
            //     capacity = Math.max(capacity, link.activity_capacity);
            // }



            acc[key] = capacity;
            return acc;
        }, {})
    };


    return {
        data: {
            activities,
            populationTypes,
            permissions,
            boats,
            roles
        },
        metadata,
        computed
    };
}

module.exports = {
    getMetadata,
};
