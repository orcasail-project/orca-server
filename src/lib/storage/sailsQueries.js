const allBoatsQuery = `
  SELECT id, name FROM Boat WHERE is_active = TRUE ORDER BY name
`;

const sailsForBoatTodayQuery = `
  SELECT
      s.id AS sail_id, s.date, s.planned_start_time, s.actual_start_time, s.end_time,
      s.requires_orca_escort, s.population_type_id, s.boat_activity_id, s.status, s.transferred_to_sail_id,
      pt.name AS population_type_name, a.name AS activity_name
  FROM Sail s
  JOIN BoatActivity ba ON s.boat_activity_id = ba.id
  JOIN PopulationType pt ON s.population_type_id = pt.id
  JOIN Activity a ON ba.activity_id = a.id
  WHERE ba.boat_id = ? AND DATE(s.date) = ?
  ORDER BY s.planned_start_time ASC;
`;

const sailBookingsQuery = `
  SELECT c.name AS booker_name, c.phone_number, b.num_people_sail,
         b.num_people_activity, b.customer_arrived, b.id AS booking_id
  FROM Booking b
  JOIN Customer c ON b.customer_id = c.id
  WHERE b.sail_id = ?
  ORDER BY c.name
`;

const sailCheckQuery = `
  SELECT s.id, s.actual_start_time, s.end_time, ba.boat_id, s.status
  FROM Sail s
  JOIN BoatActivity ba ON s.boat_activity_id = ba.id
  WHERE s.id = ?
`;

const updateSailStartQuery = `
  UPDATE Sail SET actual_start_time = ?, status = 'in_progress' WHERE id = ?
`;

const updateSailEndQuery = `
  UPDATE Sail SET end_time = ?, status = 'completed' WHERE id = ?
`;

const updatedSailQuery = `
  SELECT
    s.id AS sail_id, s.date, s.planned_start_time, s.actual_start_time, s.end_time,
    s.requires_orca_escort, s.population_type_id, s.boat_activity_id, s.status, s.transferred_to_sail_id,
    pt.name AS population_type_name, a.name AS activity_name
  FROM Sail s
  JOIN PopulationType pt ON s.population_type_id = pt.id
  JOIN BoatActivity ba ON s.boat_activity_id = ba.id
  JOIN Activity a ON ba.activity_id = a.id
  WHERE s.id = ?
`;

const getNextSailQuery = `
  SELECT * FROM Sail
  WHERE date = CURDATE()
    AND boat_activity_id = (SELECT boat_activity_id FROM Sail WHERE id = ?)
    AND id <> ?
    AND planned_start_time > (SELECT planned_start_time FROM Sail WHERE id = ?)
  ORDER BY planned_start_time ASC
  LIMIT 1
`;

const getLatePhoneSailsQuery = `
  SELECT
      s.id AS sail_id, s.date, s.planned_start_time, s.status,
      ba.boat_id, boat.name AS boat_name
  FROM Sail s
  JOIN BoatActivity ba ON s.boat_activity_id = ba.id
  JOIN Boat boat ON ba.boat_id = boat.id
  JOIN Booking b ON s.id = b.sail_id
  WHERE
      s.date = CURDATE()
      AND s.actual_start_time IS NULL
      AND s.end_time IS NULL
      AND NOW() > TIMESTAMPADD(MINUTE, 15, CONCAT(s.date, ' ', s.planned_start_time))
      AND b.is_phone_booking = TRUE
      AND s.status NOT IN ('completed', 'cancelled', 'transferred_late')
  GROUP BY s.id
  ORDER BY s.planned_start_time ASC;
`;

const getSailByIdQuery = `
  SELECT
    s.id AS sail_id, s.date, s.planned_start_time, s.actual_start_time, s.end_time,
    s.requires_orca_escort, s.population_type_id, s.boat_activity_id, s.notes, s.status, s.transferred_to_sail_id,
    pt.name AS population_type_name, a.name AS activity_name,
    b.name AS boat_name, b.id AS boat_id
  FROM Sail s
  JOIN BoatActivity ba ON s.boat_activity_id = ba.id
  JOIN Activity a ON ba.activity_id = a.id
  JOIN PopulationType pt ON s.population_type_id = pt.id
  JOIN Boat b ON ba.boat_id = b.id
  WHERE s.id = ?
`;

const updateSailQuery = `
  UPDATE Sail SET status = ?, transferred_to_sail_id = ? WHERE id = ?
`;

const updateBookingSailIdQuery = `
  UPDATE Booking SET sail_id = ? WHERE id = ?
`;

module.exports = {
  allBoatsQuery,
  sailsForBoatTodayQuery,
  sailBookingsQuery,
  sailCheckQuery,
  updateSailStartQuery,
  updateSailEndQuery,
  updatedSailQuery,
  getNextSailQuery,
  getLatePhoneSailsQuery,
  getSailByIdQuery,
  updateSailQuery,
  updateBookingSailIdQuery,
};