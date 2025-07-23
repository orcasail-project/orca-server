// File: src/lib/controllers/metadata.controller.js

const { fetchMetadataFromDB } = require('../storage/sql');

/**
 * Endpoint to get all application metadata.
 * Fetches raw data from the DB and transforms it into a structured object for the client.
 */
const getMetadata = async (req, res) => {
    try {
        const rawData = await fetchMetadataFromDB();
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
    const { activities, boats, boatActivities, populationTypes, permissions } = rawData;

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

            //אם נדרש מלווה מוריד
            if (link.requires_escort) {
                capacity -= 1;
            }

            // מוצא את המינימום בין קיבולת הסירה (לאחר הורדות) וקיבולת הפעילות
            // אם לפעילות אין מגבלה משלה (activity_capacity is null), נתעלם ממנה.
            if (link.activity_capacity !== null) {
                capacity = Math.min(capacity, link.activity_capacity);
            }

            acc[key] = capacity;
            return acc;
        }, {})
    };


    return {
        activities,
        populationTypes,
        permissions,
        boats,
        metadata,
        computed
    };
}

module.exports = {
    getMetadata
};