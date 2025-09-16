const moment = require('moment');

function calculateSailStatus(sail) {
  // אם הסטטוס כבר מוגדר ב-DB כ'completed', 'in_progress', 'cancelled', 'transferred_late', נשתמש בו
  if (sail.status === 'completed' || sail.status === 'in_progress' || sail.status === 'cancelled' || sail.status === 'transferred_late') {
    return sail.status;
  }

  const now = moment();
  const plannedStart = moment(sail.planned_start_time, 'HH:mm:ss');
  const twentyMinutesBeforeStart = moment(plannedStart).subtract(20, 'minutes');

  // לוגיקה לסטטוסים דינמיים
  if (sail.actual_start_time) return 'in_progress'; // כבר יצא לדרך
  if (sail.end_time) return 'completed'; // כבר חזר

  // אם הזמן עבר את זמן ההתחלה המתוכנן ב-15 דקות
  if (now.diff(plannedStart, 'minutes') >= 15 && now.isAfter(plannedStart)) {
    return 'delayed';
  }
  return 'pending';
}

function calculateBoatStatus(sails) {
  if (sails.length === 0) return 'idle';
  if (sails.some(s => s.status === 'in_progress')) return 'active';
  if (sails.some(s => s.status === 'delayed')) return 'delayed';
  // אם יש שיוטים שמועברים, הסירה יכולה להיות עדיין פעילה או idle
  if (sails.some(s => s.status === 'transferred_late')) {
      // אם יש שיוטים פעילים/מאוחרים אחרים, הסטטוס יקבע על ידם
      if (sails.some(s => s.status === 'active' || s.status === 'in_progress' || s.status === 'delayed')) return calculateBoatStatus(sails.filter(s => s.status !== 'transferred_late'));
      return 'idle'; // אם הכל הועבר, הסירה חופשית
  }
  return 'ready';
}

module.exports = {
  calculateSailStatus,
  calculateBoatStatus
};