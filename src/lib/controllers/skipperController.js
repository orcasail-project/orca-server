const moment = require('moment');

// Mock data for testing - replace with actual database queries
const mockBoats = [
  { boat_id: 1, boat_name: 'טיל כחול', gate_number: 'א' },
  { boat_id: 2, boat_name: 'טייפון', gate_number: 'ב' },
  { boat_id: 3, boat_name: 'טורפדו', gate_number: 'ד' }
];

// Get current active sails
exports.getCurrentSails = async (req, res) => {
  try {
    // Mock data for current sails
    const currentSails = [
      {
        boat_id: 1,
        boat_name: 'טיל כחול',
        sail: {
          sail_id: 101,
          planned_start_time: '14:00',
          actual_start_time: '14:05',
          end_time: null,
          requires_orca_escort: 0,
          population_type_id: 1,
          boat_activity_id: 1,
          total_people_on_sail: '12',
          total_people_on_activity: '8',
          population_type_name: 'משפחות',
          activity_name: 'בננות',
          status: 'in_progress',
          bookings: [
            {
              booker_name: 'ישראל ישראלי',
              phone_number: '050-1234567',
              num_people_sail: 6,
              num_people_activity: 4,
              customer_arrived: 1
            },
            {
              booker_name: 'דוד כהן',
              phone_number: '052-9876543',
              num_people_sail: 6,
              num_people_activity: 4,
              customer_arrived: 1
            }
          ]
        }
      },
      {
        boat_id: 2,
        boat_name: 'טייפון',
        sail: {} // No current sail
      },
      {
        boat_id: 3,
        boat_name: 'טורפדו',
        sail: {
          sail_id: 102,
          planned_start_time: '15:30',
          actual_start_time: null,
          end_time: null,
          requires_orca_escort: 1,
          population_type_id: 2,
          boat_activity_id: 2,
          total_people_on_sail: '20',
          total_people_on_activity: '15',
          population_type_name: 'נוער',
          activity_name: 'קיאקים',
          status: 'pending',
          bookings: [
            {
              booker_name: 'קבוצת נוער רמת גן',
              phone_number: '03-1234567',
              num_people_sail: 20,
              num_people_activity: 15,
              customer_arrived: 0
            }
          ]
        }
      }
    ];

    // Set cache-control headers to prevent caching of real-time data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.json(currentSails);
  } catch (error) {
    console.error('Error fetching current sails:', error);
    res.status(500).json({ error: 'Failed to fetch current sails' });
  }
};

// Get next/upcoming sails for today
exports.getNextSails = async (req, res) => {
  try {
    // Mock data for next sails
    const nextSails = [
      {
        boat_id: 1,
        boat_name: 'טיל כחול',
        status: 'has_upcoming',
        upcoming_sails: [
          {
            sail_id: 103,
            planned_start_time: '16:00',
            actual_start_time: null,
            end_time: null,
            requires_orca_escort: 0,
            population_type_id: 1,
            boat_activity_id: 1,
            total_people_on_sail: '15',
            total_people_on_activity: '10',
            population_type_name: 'משפחות',
            activity_name: 'בננות',
            status: 'pending'
          }
        ]
      },
      {
        boat_id: 2,
        boat_name: 'טייפון',
        status: 'has_upcoming',
        upcoming_sails: [
          {
            sail_id: 104,
            planned_start_time: '14:30',
            actual_start_time: null,
            end_time: null,
            requires_orca_escort: 1,
            population_type_id: 3,
            boat_activity_id: 3,
            total_people_on_sail: '25',
            total_people_on_activity: '20',
            population_type_name: 'קבוצות',
            activity_name: 'אבובים',
            status: 'pending'
          },
          {
            sail_id: 105,
            planned_start_time: '17:00',
            actual_start_time: null,
            end_time: null,
            requires_orca_escort: 0,
            population_type_id: 1,
            boat_activity_id: 1,
            total_people_on_sail: '10',
            total_people_on_activity: '8',
            population_type_name: 'משפחות',
            activity_name: 'בננות',
            status: 'pending'
          }
        ]
      },
      {
        boat_id: 3,
        boat_name: 'טורפדו',
        status: 'no_upcoming',
        upcoming_sails: []
      }
    ];

    // Set cache-control headers to prevent caching of real-time data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.json(nextSails);
  } catch (error) {
    console.error('Error fetching next sails:', error);
    res.status(500).json({ error: 'Failed to fetch next sails' });
  }
};