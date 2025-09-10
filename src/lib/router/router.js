const express = require('express');
const router = express.Router();


const createMetadataRouter = require('./metadata.router.js');
const createSailDetailsRouter = require('./sailDetailsRouter.js');
const createBookingRouter = require('./booking.router.js');
const createSailsRouter = require('./sails');
const createAuthRouter = require('./authRouter');

module.exports = function (io) {
  const metadataRouter = createMetadataRouter(io);
  const sailDetailsRouter = createSailDetailsRouter(io);
  const bookingRouter = createBookingRouter(io);
  const sailsRouter = createSailsRouter(io);
  const authRouter = createAuthRouter(io);


  router.use('/metadata', metadataRouter);
  router.use('/bookings', bookingRouter);
  router.use('/api/sails', sailsRouter);
  router.use('/auth', authRouter);
  router.use('/sails', sailDetailsRouter);



  // נתיב בסיסי לבדיקה
  router.get('/', (req, res) => {
    res.send('Main API Router is working!');
  });


  // נתיב דוגמה
  router.get('/helloworld', (req, res, next) => {
    try {
      const name = req.query.user || "";
      res.status(200).json({ message: "Hello IH world! " + name });
    } catch (err) {
      next(err);
    }
  });


  return router;
};