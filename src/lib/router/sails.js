const express = require('express');
const router = express.Router();
const sailsService = require('../../services/sailsService');
const moment = require('moment');

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
    console.error('Error fetching current sails:', err);
    res.status(500).json({ error: 'Failed to fetch current sails' });
  }
});

router.put('/updateStatus/:sailId', async (req, res) => {
  const { sailId } = req.params;
  const { status } = req.body;
  const userId = req.user ? req.user.id : 1; // דוגמה

  console.log(`[SERVER] Received update request for sailId: ${sailId} with status: ${status} by userId: ${userId}`);

  if (typeof sailId === 'undefined' || typeof status === 'undefined') {
    return res.status(400).json({ error: 'Invalid parameters provided.' });
  }

  try {
    const result = await sailsService.updateSailStatus(sailId, status, userId);
    res.json(result);
  } catch (err) {
    console.error('[SERVER] Error from sailsService.updateSailStatus:', err);
    res.status(400).json({ error: err.message });
  }
});

router.get('/nextSail/:boatId', async (req, res) => {
  try {
    const { boatId } = req.params;
    const upcomingSails = await sailsService.getUpcomingSailsForBoat(boatId);
    res.status(200).json({ upcoming_sails: upcomingSails });
  } catch (err) {
    console.error(`Error in /nextSail/${req.params.boatId}:`, err.message);
    res.status(500).json({ error: 'Failed to fetch upcoming sails for the boat' });
  }
});

router.post('/handleLateSails', async (req, res) => {
  try {
    const handledSails = await sailsService.handleLatePhoneSailsAutomatically();
    res.status(200).json({ message: 'Late sails processed', handledSails });
  } catch (err) {
    console.error('Error handling late sails:', err);
    res.status(500).json({ error: 'Failed to handle late sails', details: err.message });
  }
});

router.post('/revertLateSail/:sailId', async (req, res) => {
  const { sailId } = req.params;
  const userId = req.user ? req.user.id : 1;

  try {
    const result = await sailsService.revertLateSail(parseInt(sailId, 10), userId);
    res.status(200).json(result);
  } catch (err) {
    console.error(`Error reverting late sail ${sailId}:`, err);
    res.status(400).json({ error: err.message });
  }
});

router.get('/latePhoneReservations', async (req, res) => {
  try {
    console.log('[SERVER] Received request for /latePhoneReservations');
    const lateReservations = await sailsService.getLatePhoneReservations();
    res.status(200).json(lateReservations);
  } catch (err) {
    console.error('Error fetching late phone reservations:', err);
    res.status(500).json({ error: 'Failed to fetch late phone reservations', details: err.message });
  }
});

module.exports = router;