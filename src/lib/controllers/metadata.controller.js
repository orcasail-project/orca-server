// src/lib/controllers/metadata.controller.js
const { pool } = require('../storage/sql');

const getMetadata = async (req, res) => {
    try {
        
        const [
            [activities],
            [populationTypes],
            [permissions]

        ] = await Promise.all([
            pool.query('SELECT id, name, ticket_price, min_age, max_people_total FROM Activity'),
            pool.query('SELECT id, name FROM PopulationType'),
            pool.query('SELECT id, name, can_assign, can_change_status FROM Permission'),

        ]);

        const metadata = {
            activities,
            populationTypes,
            permissions,

        };

        res.status(200).json(metadata);

    } catch (error) {
        console.error("Failed to fetch metadata:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getMetadata
};