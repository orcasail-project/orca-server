// src/lib/router/sails.js - הגרסה המלאה והמאוחדת

const express = require('express');
const router = express.Router();

// ✨ מייבאים את שני הקונטרולרים שהראוטר הזה צריך
const sailsService = require('../controllers/sailsService');
const DetailsController = require('../controllers/sailDetailsController');

module.exports = function (io) {

  // --- נתיבים כלליים לקבלת מידע על הפלגות ---
  const attachIo = (req, res, next) => {
    req.io = io; // מוסיפים את io לאובייקט req
    next();
  };

  router.get('/nextSail', async (req, res) => {
    try {
      const sailsData = await sailsService.getNextSailsForToday();
      res.status(200).json(sailsData);
    } catch (err) {
      console.error('Error in /nextSail:', err.message);
      res.status(500).json({ error: 'Failed to fetch sails data', details: err.message });
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

  // --- נתיבים הקשורים להפלגות טלפוניות מאחרות ---

  router.get('/latePhoneReservations', async (req, res) => {
    try {
      const lateReservations = await sailsService.getLatePhoneReservations();
      res.status(200).json(lateReservations);
    } catch (err) {
      console.error('Error fetching late phone reservations:', err);
      res.status(500).json({ error: 'Failed to fetch late phone reservations', details: err.message });
    }
  });

  router.post('/handleLateSails',attachIo, async (req, res) => {
    try {
      const handledSails = await sailsService.handleLatePhoneSailsAutomatically(io);
      res.status(200).json({ message: 'Late sails processed', handledSails });
    } catch (err) {
      console.error('Error handling late sails:', err);
      res.status(500).json({ error: 'Failed to handle late sails', details: err.message });
    }
  });

  // --- נתיבים לביצוע פעולות על הפלגות ספציפיות ---

  router.put('/updateStatus/:sailId', attachIo, async (req, res) => {
    const { sailId } = req.params;
    const { status } = req.body;
    const userId = req.user ? req.user.id : 1;
    try {
      const result = await sailsService.updateSailStatus(sailId, status, userId);
      res.json(result);
    } catch (err) {
      console.error('[SERVER] Error from sailsService.updateSailStatus:', err);
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/revertLateSail/:sailId',attachIo, async (req, res) => {
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

  // ✨ --- הוספה ושילוב של הנתיב מ-sailDetailsRouter.js --- ✨
  // נתיב לקבלת פרטים של הפלגה ספציפית לפי ID
  // הנתיב המלא יהיה GET /api/sails/:id
  router.get('/:id', DetailsController.getSailById);


  return router;
};