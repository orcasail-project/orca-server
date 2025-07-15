const { query } = require('../lib/storage/sql');
const moment = require('moment');
const {
  sailsForBoatTodayQuery,
  allBoatsQuery,
  sailBookingsQuery,
  sailCheckQuery,
  updateSailStartQuery,
  updateSailEndQuery,
  updatedSailQuery
} = require('../lib/storage/sailsQueries');

async function getNextSailsForToday() {
  const today = moment().format('YYYY-MM-DD');
  const boats = await query(allBoatsQuery);
  const response = [];

  for (const boat of boats) {
    const sails = await query(sailsForBoatTodayQuery, [boat.id, today]);

    for (let sail of sails) {
      const bookings = await query(sailBookingsQuery, [sail.sail_id]);
      sail.bookings = bookings;
      sail.status = calculateSailStatus(sail);
    }

    response.push({
      boat_id: boat.id,
      boat_name: boat.name,
      status: calculateBoatStatus(sails),
      upcoming_sails: sails
    });
  }

  return response;
}

async function updateSailStatus(sailId, newStatus, userId) {
  const currentTime = moment().format('HH:mm:ss');

  const sailCheck = await query(sailCheckQuery, [sailId]);
  if (sailCheck.length === 0) throw new Error('Sail not found');
  const sail = sailCheck[0];

  let updateQuery, updateParams;
  switch (newStatus) {
    case 'started':
      if (sail.actual_start_time) throw new Error('Sail has already started');
      updateQuery = updateSailStartQuery;
      updateParams = [currentTime, sailId];
      break;
    case 'ended':
      if (!sail.actual_start_time) throw new Error('Cannot end sail that has not started');
      if (sail.end_time) throw new Error('Sail has already ended');
      updateQuery = updateSailEndQuery;
      updateParams = [currentTime, sailId];
      break;
    case 'cancelled':
      throw new Error('Cancel functionality not implemented yet');
    default:
      throw new Error('Invalid status');
  }

  await query(updateQuery, updateParams);
  const updatedSail = await query(updatedSailQuery, [sailId]);

  return {
    success: true,
    sail: updatedSail[0],
    message: `Sail ${newStatus} successfully`,
    timestamp: moment().toISOString()
  };
}

function calculateSailStatus(sail) {
  const now = moment();
  const plannedStart = moment(sail.planned_start_time, 'HH:mm:ss');
  if (sail.end_time) return 'completed';
  else if (sail.actual_start_time) return 'in_progress';
  else if (now.isAfter(plannedStart)) return 'delayed';
  else return 'pending';
}

function calculateBoatStatus(sails) {
  if (sails.length === 0) return 'idle';
  if (sails.some(s => s.status === 'in_progress')) return 'active';
  if (sails.some(s => s.status === 'delayed')) return 'delayed';
  return 'ready';
}

module.exports = { getNextSailsForToday, updateSailStatus };
