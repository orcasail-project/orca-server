const express = require('express');
const router = express.Router();

const metadataRouter = require('./metadata.router.js');
const sailDetailsRouter = require('./sailDetailsRouter.js');

// router.use('/sails', sailDetailsRouter);
console.log('4. [ראוטר ראשי]: הקובץ נטען.');


router.get('/', (req, res) => {
    res.send('Main API Router');
});
router.use('/metadata', metadataRouter);

console.log('5. [ראוטר ראשי]: עומד לטעון את ראוטר השיוטים על נתיב /sails');
router.use('/sails', sailDetailsRouter);
console.log('6. [ראוטר ראשי]: ראוטר השיוטים נטען בהצלחה.');
// router.use('/sails', sailDetailsRouter);

// הגדרת קבוע לנתיב /helloworld
const HELLO_WORLD = "/helloworld";

// ניתוב לדוגמה שמחזיר הודעה בפורמט JSON עם סטטוס 200
router.route(HELLO_WORLD).get(async function helloWorld(req, res, next) {
  try {
    req.metricsId = "helloWorld";
    const name = req.query.user || "";
    res.status(200).json({ message: "Hello IH world! " + name });
  } catch (err) {
    next(err);
  }
});

module.exports = router;