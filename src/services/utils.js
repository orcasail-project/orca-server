const moment = require('moment');

function calculateSailStatus(sail) {
  const now = moment();
  const plannedStart = moment(sail.planned_start_time, 'HH:mm:ss');

  if (sail.end_time) return 'completed';
  if (sail.actual_start_time) return 'in_progress';
  if (now.isAfter(plannedStart)) return 'delayed';
  return 'pending';
}

function calculateBoatStatus(sails) {
  if (sails.length === 0) return 'idle';
  if (sails.some(s => s.status === 'in_progress')) return 'active';
  if (sails.some(s => s.status === 'delayed')) return 'delayed';
  return 'ready';
}

module.exports = {
  calculateSailStatus,
  calculateBoatStatus
};
