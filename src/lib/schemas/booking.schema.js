const { z } = require('zod');

const checkAvailabilitySchema = z.object({
  date: z.string({
      required_error: "The 'date' field is required.",
      invalid_type_error: "The 'date' field must be a string.",
    })
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "The 'date' field must be in YYYY-MM-DD format." }),

  time: z.string({
      required_error: "The 'time' field is required.",
      invalid_type_error: "The 'time' field must be a string.",
    })
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { message: "The 'time' field must be in HH:MM format." }),

  population_type_id: z.number({
      required_error: "The 'population_type_id' field is required.",
      invalid_type_error: "The 'population_type_id' must be a number.",
    })
    .int({ message: "The 'population_type_id' must be an integer." })
    .positive({ message: "The 'population_type_id' must be a positive number." }),

  activity_id: z.number({
      required_error: "The 'activity_id' field is required.",
      invalid_type_error: "The 'activity_id' must be a number."
    })
    .int({ message: "The 'activity_id' must be an integer." })
    .positive({ message: "The 'activity_id' must be a positive number." }),
    
  num_people_activity: z.number({
      required_error: "The 'num_people_activity' field is required.",
      invalid_type_error: "The 'num_people_activity' must be a number."
    })
    .int({ message: "The 'num_people_activity' must be an integer." })
    .min(0, { message: "The 'num_people_activity' cannot be negative." }),

  num_people_sail: z.number({
      invalid_type_error: "The 'num_people_sail' must be a number."
    })
    .int({ message: "The 'num_people_sail' must be an integer." })
    .min(0, { message: "The 'num_people_sail' cannot be negative." })
    .optional()
    .default(0),
});


module.exports = {
  checkAvailabilitySchema,
};