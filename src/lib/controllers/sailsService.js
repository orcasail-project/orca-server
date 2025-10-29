const moment = require('moment');
const { query } = require('../storage/sql');
const {
  sailsForBoatTodayQuery,
  allBoatsQuery,
  sailBookingsQuery,
  sailCheckQuery,
  updateSailStartQuery,
  updateSailEndQuery,
  updatedSailQuery,
  getLatePhoneSailsQuery,
  getSailByIdQuery,
  updateSailQuery,
  updateBookingSailIdQuery,
} = require('../storage/sailsQueries');
const { calculateSailStatus, calculateBoatStatus } = require('../middleware/utils');
async function getCurrentSails() {
  const today = moment().format('YYYY-MM-DD');
  const boats = await query(allBoatsQuery);
  const result = [];

  for (const boat of boats) {
    // שלוף את כל השיוטים של הסירה להיום, ממוינים לפי שעה
    const allSailsForBoatToday = await query(sailsForBoatTodayQuery, [boat.id, today]);

    let sailToShow = null;
    // 1. חפש שיוט שנמצא כרגע בים (העדיפות הגבוהה ביותר)
    const inProgressSail = allSailsForBoatToday.find(s => calculateSailStatus(s) === 'in_progress');

    if (inProgressSail) {
      sailToShow = inProgressSail;
    } else {
      // 2. אם אין שיוט בים, חפש את השיוט התקף הראשון (מאוחר או עתידי)
      const firstValidSail = allSailsForBoatToday.find(s => {
        const status = calculateSailStatus(s);
        return status !== 'completed' && status !== 'cancelled' && status !== 'transferred_late';
      });

      if (firstValidSail) {
        sailToShow = firstValidSail;
      }
    }
    // אם מצאנו שיוט להצגה, שלוף את ההזמנות שלו
    if (sailToShow) {
      sailToShow.bookings = await query(sailBookingsQuery, [sailToShow.sail_id]);
      sailToShow.total_people_on_sail = sailToShow.bookings.reduce((sum, b) => sum + (b.num_people_sail || 0), 0);
      sailToShow.total_people_on_activity = sailToShow.bookings.reduce((sum, b) => sum + (b.num_people_activity || 0), 0);

      result.push({ boat_id: boat.id, boat_name: boat.name, sail: sailToShow });
    } else {
      // אם לא נמצא שום שיוט רלוונטי
      result.push({ boat_id: boat.id, boat_name: boat.name, sail: {} });
    }
  }

  return result;
}
async function getNextSailsForToday() {
  const today = moment().format('YYYY-MM-DD');
  const boats = await query(allBoatsQuery);
  const response = [];

  for (const boat of boats) {
    const sails = await query(sailsForBoatTodayQuery, [boat.id, today]);
    for (let sail of sails) {
      sail.bookings = await query(sailBookingsQuery, [sail.sail_id]);
      sail.status = calculateSailStatus(sail);
    }
    response.push({
      boat_id: boat.id,
      boat_name: boat.name,
      status: calculateBoatStatus(sails),
      upcoming_sails: sails,
    });
  }
  return response;
}


async function updateSailStatus(sailId, newStatus, userId, req) {
  const currentTime = moment().format('HH:mm:ss');
  const sailCheck = await query(sailCheckQuery, [sailId]);
  if (sailCheck.length === 0) throw new Error('Sail not found');
  const sail = sailCheck[0];

  if (newStatus === 'started' && sail.actual_start_time) throw new Error('Sail has already started');
  if (newStatus === 'ended' && !sail.actual_start_time) throw new Error('Cannot end sail that has not started');

  let updateQueryToUse, updateParams;
  if (newStatus === 'started') {
    updateQueryToUse = updateSailStartQuery;
    updateParams = [currentTime, sailId];
  } else if (newStatus === 'ended') {
    updateQueryToUse = updateSailEndQuery;
    updateParams = [currentTime, sailId];
  } else {
    throw new Error('Invalid status');
  }

  await query(updateQueryToUse, updateParams);
  const updatedSailResult = await query(updatedSailQuery, [sailId]);
  const updatedSail = updatedSailResult[0];
  updatedSail.status = calculateSailStatus(updatedSail);

  const upcomingSails = await getUpcomingSailsForBoat(sail.boat_id);
  const nextSail = upcomingSails.find(s => s.sail_id !== updatedSail.sail_id);

  if (req.io) {
    console.log('[Socket.io] Broadcasting "sails_updated" event after status update.');
    req.io.emit('sails_updated');
  }
  // broadcastSailsUpdate(); // <--- הוסף את השורה הזו כאן

  return {
    success: true,
    sail: updatedSail,
    message: `Sail ${newStatus} successfully`,
    next_sail: nextSail || null,
  };
}

async function getUpcomingSailsForBoat(boatId) {
  const today = moment().format('YYYY-MM-DD');
  const sails = await query(sailsForBoatTodayQuery, [boatId, today]);
  for (let sail of sails) {
    sail.bookings = await query(sailBookingsQuery, [sail.sail_id]);
    sail.status = calculateSailStatus(sail);
  }
  return sails.filter(s => s.status !== 'completed' && s.status !== 'cancelled');
}

async function getLatePhoneReservations() {
  const lateSailsRaw = await query(getLatePhoneSailsQuery);
  const lateSailsWithBookings = [];

  for (const lateSail of lateSailsRaw) {
    // יש לשלוף את ההזמנות בנפרד עבור כל שיוט מאוחר
    lateSail.bookings = await query(sailBookingsQuery, [lateSail.sail_id]);
    lateSailsWithBookings.push(lateSail);
  }
  return lateSailsWithBookings;
}


async function handleLatePhoneSailsAutomatically(req) {
  let changesWereMade = false;
  const lateSailsToProcess = await query(getLatePhoneSailsQuery);
  const handledSailIds = [];
  console.log(`[LateSailHandler] Found ${lateSailsToProcess.length} late sails to process via SQL query.`);

  for (const lateSail of lateSailsToProcess) {
    try {
      handledSailIds.push(lateSail.sail_id);
      changesWereMade = true;
      console.log(`[LateSailHandler] ==> Processing sail: ${lateSail.sail_id}`);
      const upcomingSails = await getUpcomingSailsForBoat(lateSail.boat_id);
      const nextSail = upcomingSails.find(s =>
        s.sail_id !== lateSail.sail_id &&
        s.status === 'pending' &&
        moment(s.planned_start_time, 'HH:mm:ss').isAfter(moment(lateSail.planned_start_time, 'HH:mm:ss'))
      );

      if (nextSail) {
        console.log(`[LateSailHandler] Found next sail: ${nextSail.sail_id}. Transferring bookings.`);
        const bookingsToTransfer = await query(sailBookingsQuery, [lateSail.sail_id]);
        for (const booking of bookingsToTransfer) {
          console.log(`[LateSailHandler] -> Transferring booking ${booking.booking_id} to sail ${nextSail.sail_id}`);
          await query(updateBookingSailIdQuery, [nextSail.sail_id, booking.booking_id]);
        }
        console.log(`[LateSailHandler] -> Updating status of original sail ${lateSail.sail_id} to 'transferred_late'`);
        await query(updateSailQuery, ['transferred_late', nextSail.sail_id, lateSail.sail_id]);
        handledSailIds.push(lateSail.sail_id);
      } else {
        console.log(`[LateSailHandler] No next sail for sail: ${lateSail.sail_id}. Marking as delayed.`);
        await query(updateSailQuery, ['delayed', null, lateSail.sail_id]);
        handledSailIds.push(lateSail.sail_id);
      }
    } catch (error) {
      console.error(`[LateSailHandler] !!! FAILED to process sail ${lateSail.sail_id} !!!`);
      console.error("[LateSailHandler] SQL Error:", error.message);
    }
  }
  // if (changesWereMade && io) {
  //   console.log('[Socket.io] Broadcasting "sails_updated" event after handling late sails.');
  //   io.emit('sails_updated');
  // }

  if (changesWereMade && req.io) {
    console.log('[Socket.io] Broadcasting "sails_updated" event after handling late sails.');
    req.io.emit('sails_updated');
  }
  return handledSailIds;
}

async function revertLateSail(originalLateSailId, userId, req) {
  const originalSailResults = await query(getSailByIdQuery, [originalLateSailId]);
  if (originalSailResults.length === 0) {
    throw new Error('Original late sail not found');
  }
  const originalSail = originalSailResults[0];

  if (originalSail.status !== 'transferred_late' || !originalSail.transferred_to_sail_id) {
    throw new Error('Sail is not in a transferable late state or has no transfer target');
  }

  const transferredToSailId = originalSail.transferred_to_sail_id;
  const transferredToSailResults = await query(getSailByIdQuery, [transferredToSailId]);
  if (transferredToSailResults.length === 0) {
    throw new Error('Transferred-to sail not found');
  }

  // העברת ההזמנות בחזרה מהשיוט שהועברו אליו אל השיוט המקורי
  const bookingsToRevert = await query(sailBookingsQuery, [transferredToSailId]);
  for (const booking of bookingsToRevert) {
    await query(updateBookingSailIdQuery, [originalLateSailId, booking.booking_id]);
  }

  // עדכון הסטטוס של השיוט המקורי חזרה ל'pending' וניקוי השדה transferred_to_sail_id
  await query(updateSailQuery, ['pending', null, originalLateSailId]);
  // broadcastSailsUpdate(); // <--- הוסף את השורה הזו כאן
  if (req.io) {
    console.log('[Socket.io] Broadcasting "sails_updated" event after reverting late sail.');
    req.io.emit('sails_updated');
  }
  return { success: true, message: `Sail ${originalLateSailId} reverted successfully` };
}
// function broadcastSailsUpdate() {
//   try {
//     const { io } = require('../../../server'); // נטען את io כאן
//     if (io) {
//       console.log('[Socket.io] Broadcasting "sails_updated" event to all clients.');
//       io.emit('sails_updated');
//     } else {
//       console.error('[Socket.io] Error: io object is not available.');
//     }
//   } catch (err) {
//     console.error('[Socket.io] Failed to broadcast update:', err);
//   }
// }

module.exports = {
  getCurrentSails,
  getNextSailsForToday,
  updateSailStatus,
  getUpcomingSailsForBoat,
  getLatePhoneReservations,
  handleLatePhoneSailsAutomatically,
  revertLateSail,
};