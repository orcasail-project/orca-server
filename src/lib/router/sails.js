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

router.put('/updateStatus/:sailId', async (req, res) => {
  const { sailId } = req.params;
  const { status } = req.body;

  // =================== קטע קוד קריטי ===================
  // אתה חייב להשיג את מזהה המשתמש מאיפשהו.
  // בדרך כלל, לאחר אימות, הוא נשמר ב-req.user.
  // אם אין לך מערכת אימות, אתה יכול להשתמש בערך זמני לצורך בדיקה,
  // אבל אסור להשאיר את זה ריק.
  const userId = req.user ? req.user.id : 1; // דוגמה: שימוש ב-1 אם אין משתמש מחובר
  // =======================================================
  
  // הדפסה ללוג כדי לוודא שאנחנו מקבלים את כל הנתונים
  console.log(`[SERVER] Received update request for sailId: ${sailId} with status: ${status} by userId: ${userId}`);

  // בדיקה ששום דבר לא undefined
  if (typeof sailId === 'undefined' || typeof status === 'undefined' || typeof userId === 'undefined') {
    console.error('[SERVER] Error: One of the parameters is undefined!', { sailId, status, userId });
    return res.status(400).json({ error: 'Invalid parameters provided to the server.' });
  }
  
  try {
    // ודא שאתה מעביר את כל שלושת הארגומנטים!
    const result = await sailsService.updateSailStatus(sailId, status, userId);
    res.json(result);
  } catch (err) {
    console.error('[SERVER] Error from sailsService.updateSailStatus:', err);
    res.status(400).json({ error: err.message });
  }
});


module.exports = router;