// File: src/lib/controllers/metadata.controller.js
 
const { fetchMetadataFromDB } = require('../storage/sql');

const getMetadata = async (req, res) => {
    try {

        const metadata = await fetchMetadataFromDB();

        res.status(200).json(metadata);

    } catch (error) {

        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getMetadata
};