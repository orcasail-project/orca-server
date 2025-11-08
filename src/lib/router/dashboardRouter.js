const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth'); 

const { authorize } = require('../middleware/authorize'); 
const sailsController = require('../controllers/dashboardController');

module.exports = function (io) {
   
   
    router.get(
        '/', 
        authenticateToken,    
        authorize([1, 3]),     
        sailsController.getSailsDashboard
    );


    router.get(
        '/customers/:id/phone',
        authenticateToken,      
        authorize([1, 3]),     
        sailsController.getCustomerPhone
    );

    return router;
};