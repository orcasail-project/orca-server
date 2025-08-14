const moment = require('moment');
const { query } = require('../lib/storage/sql');
const {
  sailsForBoatTodayQuery,
  allBoatsQuery,
  sailBookingsQuery,
  sailCheckQuery,
  updateSailStartQuery,
  updateSailEndQuery,
  updatedSailQuery
} = require('../lib/storage/sailsQueries');
const { calculateSailStatus, calculateBoatStatus } = require('../services/utils');

async function getCurrentSails() {
  const today = moment().format('YYYY-MM-DD');
  const boats = await query(allBoatsQuery);
  const result = [];

  for (const boat of boats) {
    const sails = await query(sailsForBoatTodayQuery, [boat.id, today]);
    let added = false;

    for (let sail of sails) {
      sail.bookings = await query(sailBookingsQuery, [sail.sail_id]);
      sail.status = calculateSailStatus(sail);

      if (sail.status !== 'completed') {
        result.push({ boat_id: boat.id, boat_name: boat.name, sail });
        added = true;
        break;
      }
    }
// If no sails found for the boat, add an empty sail object
    if (!added) {
      result.push({ boat_id: boat.id, boat_name: boat.name, sail: {} });
    }
  }
  return result;
}
// Function to get the next sails for today
async function getNextSailsForToday() {
  const today = moment().format('YYYY-MM-DD');
  const boats = await query(allBoatsQuery);
  const response = [];
// Loop through each boat to get its sails for today
  for (const boat of boats) {
    const sails = await query(sailsForBoatTodayQuery, [boat.id, today]);

    for (let sail of sails) {
      const bookings = await query(sailBookingsQuery, [sail.sail_id]);
      sail.bookings = bookings;
      sail.status = calculateSailStatus(sail);
    }
// Filter out completed sails
    if (sails.length === 0) {
      response.push({
        boat_id: boat.id,
        boat_name: boat.name,
        status: 'idle',
        upcoming_sails: []
      });
    } else {
      response.push({
        boat_id: boat.id,
        boat_name: boat.name,
        status: calculateBoatStatus(sails),
        upcoming_sails: sails
      });
    }
  }

  return response;
}

const boatSailsQuery = sailsForBoatTodayQuery;

async function updateSailStatus(sailId, newStatus, userId) {
 
  const currentTime = moment().format('HH:mm:ss');
  const sailCheck = await query(sailCheckQuery, [sailId]);
  if (sailCheck.length === 0) throw new Error('Sail not found');
  const sail = sailCheck[0];
  const statusHandlers = new Map([
    ['started', () => {
      if (sail.actual_start_time) throw new Error('Sail has already started');
      return [updateSailStartQuery, [currentTime, sailId]];
    }],
    ['ended', () => {
      if (!sail.actual_start_time) throw new Error('Cannot end sail that has not started');
      if (sail.end_time) throw new Error('Sail has already ended');
      return [updateSailEndQuery, [currentTime, sailId]];
    }],
    ['cancelled', () => {
      throw new Error('Cancel functionality not implemented yet');
    }]
  ]);

  const handler = statusHandlers.get(newStatus);
  if (!handler) throw new Error('Invalid status');

  const [updateQuery, updateParams] = handler();
  await query(updateQuery, updateParams);

  const updatedSail = await query(updatedSailQuery, [sailId]);

  //  נוסיף כאן שליפת השיוט הבא של אותה סירה
  const today = moment().format('YYYY-MM-DD');
  const boatSails = await query(boatSailsQuery, [sail.boat_id, today]);

  let nextSail = null;
  for (let s of boatSails) {
    s.status = calculateSailStatus(s);

    // בדיקה מפורשת גם על id וגם על sail_id ליתר ביטחון
    const currentSailId = updatedSail[0].id || updatedSail[0].sail_id;
    const candidateSailId = s.id || s.sail_id;

    if (candidateSailId !== currentSailId && s.status !== 'completed') {
      s.bookings = await query(sailBookingsQuery, [candidateSailId]);
      nextSail = s;
      break;
    }
  }

  return {
    success: true,
    sail: updatedSail[0],
    message: `Sail ${newStatus} successfully`,
    timestamp: moment().toISOString(),
    next_sail: nextSail
  };
}
async function getUpcomingSailsForBoat(boatId) {
  const today = moment().format('YYYY-MM-DD');
  
  const sails = await query(sailsForBoatTodayQuery, [boatId, today]);

  // לוגיקה לחישוב סטטוס והוספת הזמנות
  for (let sail of sails) {
    sail.bookings = await query(sailBookingsQuery, [sail.sail_id]);
    sail.status = calculateSailStatus(sail);
  }

  // סינון כדי להחזיר רק הפלגות שטרם הושלמו
  const upcoming = sails.filter(s => s.status !== 'completed');

  return upcoming;
}


module.exports = {
  getCurrentSails,
  getNextSailsForToday,
  updateSailStatus,
  getUpcomingSailsForBoat,
};
