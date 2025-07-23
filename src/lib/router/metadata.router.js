const express = require('express');
const router = express.Router();
const metadataController = require('../controllers/metadata.controller.js');

// שליפת כל המטאדאטה (כולל הכל)
router.get('/', metadataController.getMetadata);

// שליפות נפרדות לפי צורך
router.get('/roles', metadataController.getAllRolesHandler);
// router.get('/permissions', metadataController.getAllPermissions);
// router.get('/boats', metadataController.getAllBoats);
// router.get('/activities', metadataController.getAllActivities);
// router.get('/population-types', metadataController.getAllPopulationTypes);

module.exports = router;
