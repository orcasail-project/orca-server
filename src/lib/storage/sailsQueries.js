const allBoatsQuery = `
  SELECT id, name 
  FROM Boat 
  WHERE is_active = TRUE 
  ORDER BY name
`;

const sailsForBoatTodayQuery = `
  SELECT s.id AS sail_id, s.planned_start_time, s.actual_start_time, s.end_time,
         s.requires_orca_escort, s.population_type_id, s.boat_activity_id,
         COALESCE(SUM(b.num_people_sail), 0) AS total_people_on_sail,
         COALESCE(SUM(b.num_people_activity), 0) AS total_people_on_activity,
         pt.name AS population_type_name,
         a.name AS activity_name
  FROM Sail s
  JOIN BoatActivity ba ON s.boat_activity_id = ba.id
  JOIN PopulationType pt ON s.population_type_id = pt.id
  JOIN Activity a ON ba.activity_id = a.id
  LEFT JOIN Booking b ON s.id = b.sail_id
  WHERE ba.boat_id = ? AND s.date = ?
  GROUP BY s.id, s.planned_start_time, s.actual_start_time, s.end_time, 
           s.requires_orca_escort, s.population_type_id, s.boat_activity_id,
           pt.name, a.name
  ORDER BY s.planned_start_time ASC
`;

const sailBookingsQuery = `
  SELECT c.name AS booker_name, c.phone_number, b.num_people_sail, 
         b.num_people_activity, b.customer_arrived
  FROM Booking b
  JOIN Customer c ON b.customer_id = c.id
  WHERE b.sail_id = ?
  ORDER BY c.name
`;

const sailCheckQuery = `
  SELECT 
    s.id, s.actual_start_time, s.end_time,ba.boat_id   
  FROM Sail s
  JOIN BoatActivity ba ON s.boat_activity_id = ba.id
  WHERE s.id = ?
`;

const updateSailStartQuery = `
  UPDATE Sail SET actual_start_time = ? WHERE id = ?
`;

const updateSailEndQuery = `
  UPDATE Sail SET end_time = ? WHERE id = ?
`;

const updatedSailQuery = `
  SELECT 
    s.*, 
    pt.name AS population_type_name, 
    a.name AS activity_name,
    CASE
      WHEN s.end_time IS NOT NULL THEN 'completed'
      WHEN s.actual_start_time IS NOT NULL THEN 'in_progress'
      ELSE 'pending'
    END AS status
  FROM Sail s
  JOIN PopulationType pt ON s.population_type_id = pt.id
  JOIN BoatActivity ba ON s.boat_activity_id = ba.id
  JOIN Activity a ON ba.activity_id = a.id
  WHERE s.id = ?
`;


const updateSailStatusQuery = (field) => `
  UPDATE Sail 
  SET ${field} = ?, updated_at = NOW()
  WHERE id = ?
`;

const getSailTimingQuery = `
  SELECT planned_start_time, actual_start_time 
  FROM Sail 
  WHERE id = ?
`;

const getNextSailQuery = `
  SELECT * FROM Sail 
  WHERE date = CURDATE()
    AND boat_activity_id = (
      SELECT boat_activity_id FROM Sail WHERE id = ?
    )
    AND id > ?
  ORDER BY planned_start_time ASC
  LIMIT 1
`;




module.exports = {
  allBoatsQuery,
  sailsForBoatTodayQuery,
  sailBookingsQuery,
  sailCheckQuery,
  updateSailStartQuery,
  updateSailEndQuery,
  updatedSailQuery,
  updateSailStatusQuery,
  getSailTimingQuery,
  getNextSailQuery
};
