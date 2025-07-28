const express = require('express');
const router = express.Router();
const metadataController = require('../controllers/metadata.controller.js');

// שליפת כל המטאדאטה (כולל הכל)
router.get('/', metadataController.getMetadata);

module.exports = router;
