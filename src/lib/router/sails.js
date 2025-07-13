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

module.exports = router;