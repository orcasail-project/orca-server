// const express = require('express');
// const router = express.Router();


// const metadataRouter = require('./metadata.router.js');
// const bookingRouter = require('./booking.router.js');
// const sailsRouter = require('./sails');
// const authRouter = require('./authRouter');


// router.use('/metadata', metadataRouter);
// router.use('/booking', bookingRouter);
// router.use('/api/sails', sailsRouter);
// router.use('/auth', authRouter);



// // נתיב בסיסי לבדיקה
// router.get('/', (req, res) => {
//   res.send('Main API Router is working!');
// });

// // נתיב דוגמה
// router.get('/helloworld', (req, res, next) => {
//   try {
//     const name = req.query.user || "";
//     res.status(200).json({ message: "Hello IH world! " + name });
//   } catch (err) {
//     next(err);
//   }
// });


// module.exports = router;

const express = require('express');
const router = express.Router();




module.exports = function (io) {
  // const metadataRouter = createMetadataRouter(io);
  // const sailDetailsRouter = createSailDetailsRouter(io);
  // const bookingRouter = createBookingRouter(io);
  // const sailsRouter = createSailsRouter(io);
  // const authRouter = createAuthRouter(io);

  // const dashboardRouter = createDashboardRouter(io);
  // // const sailsRouter = createSailsRouter(io);
  // const skipperRouter = createSkipperRouter(io);

  // router.use('/metadata', metadataRouter);
  // router.use('/booking', bookingRouter);
  // router.use('/sails', sailsRouter);
  // router.use('/auth', authRouter);
  // router.use('/sails', sailDetailsRouter);

  // router.use('/dashboard', dashboardRouter);

  // router.use('/skipper', skipperRouter);


  const createAuthRouter = require('./authRouter');
  const createBookingRouter = require('./booking.router.js');
  const createDashboardRouter = require('./dashboardRouter');
  const createMetadataRouter = require('./metadata.router.js');
  const createSailsRouter = require('./sails');
  const createSkipperRouter = require('./skipperRouter');
  // את sailDetailsRouter נשלב בתוך sailsRouter כי הוא חלק ממנו

  const authRouter = createAuthRouter(io);
  const bookingRouter = createBookingRouter(io);
  const dashboardRouter = createDashboardRouter(io);
  const metadataRouter = createMetadataRouter(io);
  const sailsRouter = createSailsRouter(io);

  const skipperRouter = createSkipperRouter(io);

  // --- הגדרת נתיבי ה-API ---
  // כל מה שקשור לאימות משתמשים
  router.use('/auth', authRouter);

  // כל מה שקשור להזמנות
  router.use('/booking', bookingRouter);

  // כל מה שקשור לדשבורד הראשי (של המנהל/משרד)
  router.use('/dashboard', dashboardRouter);

  // מידע כללי כמו סוגי אוכלוסיה, פעילויות וכו'
  router.use('/metadata', metadataRouter);

  // כל מה שקשור להפלגות באופן כללי
  router.use('/sails', sailsRouter);

  // כל מה שקשור לדשבורד של הסקיפר
  router.use('/sails', skipperRouter);

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