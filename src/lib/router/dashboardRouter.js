// const express = require('express');
// const router = express.Router();

// const sailsController = require('../controllers/dashboardController');

// const DASHBOARD= "/dashboard";
// router.get(DASHBOARD, sailsController.getSailsDashboard);

// module.exports = router;
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { authorizeManager } = require('../middleware/authorize');

const sailsController = require('../controllers/dashboardController');

const DASHBOARD = "/";
module.exports = function (io) {
    router.get(DASHBOARD, sailsController.getSailsDashboard);

    return router;
};
// , authenticateToken, authorizeManager()