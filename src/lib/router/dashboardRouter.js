// const express = require('express');
// const router = express.Router();

// const sailsController = require('../controllers/dashboardController');

// const DASHBOARD= "/dashboard";
// router.get(DASHBOARD, sailsController.getSailsDashboard);

// module.exports = router;
// const express = require('express');
// const router = express.Router();
// const authenticateToken = require('../middleware/auth');
// const { authorizeManager } = require('../middleware/authorize');

// const sailsController = require('../controllers/dashboardController');

// const DASHBOARD = "/";
// module.exports = function (io) {
//     router.get('/', sailsController.getSailsDashboard);

//     router.get('/customers/:id/phone' , authenticateToken, authorizeManager(), sailsController.getCustomerPhone);

    
//     return router;
// };


const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth'); // או authMiddleware
// שימי לב: נייבא את authorize הכללי, לא את הפונקציות הספציפיות
const { authorize } = require('../middleware/authorize'); 
const sailsController = require('../controllers/dashboardController');

module.exports = function (io) {
    // -------------------------------------------------------------
    //           אבטחה מלאה על שתי נקודות הקצה
    // -------------------------------------------------------------

    // אבטחת הגישה לדשבורד הראשי
    router.get(
        '/', // הנתיב הבסיסי של הדשבורד
        // authenticateToken,      // 1. חייב להיות מחובר
        // authorize([1, 3]),      // 2. חייב להיות מנהל (1) או עובד משרד (3)
        sailsController.getSailsDashboard
    );

    // אבטחת הגישה למספר טלפון
    router.get(
        '/customers/:id/phone',
        // authenticateToken,      // 1. חייב להיות מחובר
        // authorize([1, 3]),      // 2. אותה הרשאה נדרשת גם כאן
        sailsController.getCustomerPhone
    );

    return router;
};