const express = require('express');
const router = express.Router();
const sailsService = require('../../services/sailsService');

router.get('/nextSail', async (req, res) => {
  try {
    const sailsData = await sailsService.getNextSailsForToday();
    res.status(200).json(sailsData);
  } catch (err) {
    console.error('Error in /nextSail:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ 
      error: 'Failed to fetch sails data',
      details: err.message 
    });
  }
});

router.get('/current', async (req, res) => {
  try {
    const data = await sailsService.getCurrentSails();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch current sails' });
  }
});


module.exports = router;