const express = require('express');
const router = express.Router();

// זהו ניתוב בסיסי שמחזיר מחרוזת פשוטה "hi" כדי לבדוק שהראוטר פועל
router.route("/").get((req, res) => {
  res.send("hi");
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

const sailsRouter = require('./sails');
router.use('/api/sails', sailsRouter);

router.get('/', (req, res) => res.send('hi'));



module.exports = router;
