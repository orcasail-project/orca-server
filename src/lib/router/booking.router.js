const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth'); 

const { authorize } = require('../middleware/authorize'); 
const bookingController = require('../controllers/booking.controller.js');

module.exports = function (io) {
  router.get('/', (req, res) => {
    res.send('booking API Router');
  });

  router.post('/check-availability',
    authenticateToken,      
    authorize([1, 3]),
    bookingController.checkAvailability);

  router.get('/checkExistingCustomer',
    authenticateToken,      
    authorize([1, 3]),
    bookingController.checkExistingCustomer);

  router.post('/addCustomer',
    authenticateToken,      
    authorize([1, 3]),
    bookingController.addNewCustomer);

  router.post('/addOrder',
    authenticateToken,      
    authorize([1, 3]),
    bookingController.addNewOrder);

  return router;
};
