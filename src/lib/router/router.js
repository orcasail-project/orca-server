const express = require('express');
const router = express.Router();


const metadataRouter = require('./metadata.router.js');
const bookingRouter = require('./booking.router.js');
const sailsRouter = require('./sails');
const authRouter = require('./authRouter');


router.use('/metadata', metadataRouter);
router.use('/bookings', bookingRouter);
router.use('/api/sails', sailsRouter);
router.use('/auth', authRouter);



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


module.exports = router;