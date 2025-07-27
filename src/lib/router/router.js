
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send('Main API Router');
});

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

const metadataRouter = require('./metadata.router');

router.use('/metadata', metadataRouter);


const authRouter = require('./authRouter');

router.use('/auth', authRouter);

module.exports = router;