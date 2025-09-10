const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { authorizeSkipper } = require('../middleware/authorize');
const skipperController = require('../controllers/skipperController');
module.exports = function (io) {
    // Get current active sails for skipper dashboard
    router.get('/current', authenticateToken, authorizeSkipper(), skipperController.getCurrentSails);

    // Get next/upcoming sails for today
    router.get('/nextSail', authenticateToken, authorizeSkipper(), skipperController.getNextSails);

    return router;
};