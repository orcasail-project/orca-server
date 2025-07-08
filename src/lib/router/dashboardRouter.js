const express = require('express');
const router = express.Router();

const sailsController = require('../controllers/dashboardController');

const DASHBOARD= "/dashboard";
router.get(DASHBOARD, sailsController.getSailsDashboard);

module.exports = router;