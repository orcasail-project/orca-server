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


async function getCurrentSails() {
  const today = moment().format('YYYY-MM-DD');
  console.log('Today:', today);

  const boats = await query(allBoatsQuery);
  console.log('Boats:', boats);

  const result = [];

  for (const boat of boats) {
    const sails = await query(sailsForBoatTodayQuery, [boat.id, today]);

    let added = false;

    for (let sail of sails) {
      sail.bookings = await query(sailBookingsQuery, [sail.sail_id]);
      sail.status = calculateSailStatus(sail);

      if (sail.status !== 'completed') {
        result.push({
          boat_id: boat.id,
          boat_name: boat.name,
          sail
        });
        added = true;
        break;
      }
    }

    // אם לא מצאנו שיוט לא-completed, נחזיר את האחרון
    if (!added && sails.length > 0) {
      const lastSail = sails[sails.length - 1];
      lastSail.bookings = await query(sailBookingsQuery, [lastSail.sail_id]);
      lastSail.status = calculateSailStatus(lastSail);

      result.push({
        boat_id: boat.id,
        boat_name: boat.name,
        sail: lastSail
      });
      added = true;
    }
    // אם לא הוספנו שום שיוט בסירה (או שאין שיוטים בכלל) - נחזיר את הסירה בלי שיוטים
    if (!added) {
      result.push({
        boat_id: boat.id,
        boat_name: boat.name,
        sail: {}
      });
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
      const bookings = await query(sailBookingsQuery, [sail.sail_id]);
      sail.bookings = bookings;
      sail.status = calculateSailStatus(sail);
    }

    // אם אין שיוטים, נכניס את הסירה עם סטטוס 'idle'
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

  console.log('Calculating status for sail:', sail.sail_id);
  console.log('planned_start_time:', sail.planned_start_time);
  console.log('actual_start_time:', sail.actual_start_time);
  console.log('end_time:', sail.end_time);
  console.log('Now:', now.format('HH:mm:ss'));

  if (sail.end_time) {
    console.log('Status: completed');
    return 'completed';
  } else if (sail.actual_start_time) {
    console.log('Status: in_progress');
    return 'in_progress';
  } else if (now.isAfter(plannedStart)) {
    console.log('Status: delayed');
    return 'delayed';
  } else {
    console.log('Status: pending');
    return 'pending';
  }
}

function calculateBoatStatus(sails) {
  if (sails.length === 0) return 'idle';
  if (sails.some(s => s.status === 'in_progress')) return 'active';
  if (sails.some(s => s.status === 'delayed')) return 'delayed';
  return 'ready';
}

module.exports = { getNextSailsForToday, getCurrentSails, updateSailStatus };
