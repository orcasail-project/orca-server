const express = require('express');
const router = express.Router();
const metadataController = require('../controllers/metadata.controller.js');
module.exports = function (io) {
    // שליפת כל המטאדאטה (כולל הכל)
    router.get('/', metadataController.getMetadata);

    return router;
};