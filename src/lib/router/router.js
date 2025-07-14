const express = require('express');
const router = express.Router();

const metadataRouter = require('./metadata.router.js');

router.use('/metadata', metadataRouter);

router.get('/', (req, res) => {
    res.send('Main API Router');
});

module.exports = router;