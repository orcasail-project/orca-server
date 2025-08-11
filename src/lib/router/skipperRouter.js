const express = require('express');
const router = express.Router();
const skipperController = require('../controllers/skipperController');

// Get current active sails for skipper dashboard
router.get('/current', skipperController.getCurrentSails);

// Get next/upcoming sails for today
router.get('/nextSail', skipperController.getNextSails);

module.exports = router;