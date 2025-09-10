const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { authorizeManager } = require('../middleware/authorize');

const sailsController = require('../controllers/dashboardController');

const DASHBOARD = "/dashboard";
module.exports = function (io) {
    router.get(DASHBOARD, authenticateToken, authorizeManager(), sailsController.getSailsDashboard);

    return router;
};