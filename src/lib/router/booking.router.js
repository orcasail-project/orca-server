const express = require('express');
const router = express.Router();


const bookingController = require('../controllers/booking.controller.js');
const validate = require('../middleware/validateRequest.js');
const { checkAvailabilitySchema } = require('../schemas/booking.schema.js');

module.exports = function (io) {
router.get('/', (req, res) => {
  res.send('booking API Router');
});

router.post(
  '/check-availability',
  validate(checkAvailabilitySchema),
  bookingController.checkAvailability  
);

return router;
};