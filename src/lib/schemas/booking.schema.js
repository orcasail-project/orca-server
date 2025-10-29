const { z } = require('zod');

// סכמה לבדיקת זמינות 
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

// סכמת לקוח 
const customerDataSchema = z.object({
  name: z.string({
    required_error: 'Name is a required field.'
  }).min(2, { message: 'Name must be at least 2 characters long.' }),

  phone_number: z.string({
    required_error: 'Phone number is a required field.'
  }).regex(/^(?:\+972|0)(?:[23489]|5[0-9]|7[2-9])[0-9]{7}$/, "מספר הטלפון אינו תקין"),


  wants_whatsapp: z.boolean().optional().default(false),

  email: z.string()
    .email({ message: 'Invalid email address.' })
    .optional()
    .nullable()
    .default(null),

  notes: z.string()
    .optional()
    .nullable()
    .default(null)
});


const addCustomerSchema = z.object({
  body: customerDataSchema
});


const paymentSchema = z.object({
    payment_type_id: z.number().int().positive(),
    total: z.number().positive().optional(),
    final_price: z.number().positive()
});


// סכמה בסיסית שמשותפת לכל ההזמנות, עם שמות תואמי מסד נתונים
const baseOrderSchema = z.object({
    customer: customerDataSchema,
    payment: paymentSchema,
    num_people_activity: z.number().int().min(0),     
    num_people_sail: z.number().int().min(0),         
    is_phone_booking: z.boolean().optional().default(false), 
    up_to_16_year: z.boolean().optional().default(false)    
});



const existingCruiseOrderSchema = baseOrderSchema.extend({
    cruiseId: z.number().int().positive()
});

// סכמה עבור הזמנה עם יצירת הפלגה חדשה 
const newCruiseOrderSchema = baseOrderSchema.extend({
    sailDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    planned_start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/), 
    population_type_id: z.number().int().positive(),             
    activityId: z.number().int().positive(),
    boatId: z.number().int().positive(), 
    is_private_group: z.boolean().optional(),                    
    requires_orca_escort: z.boolean().optional()                  
});


const addOrderSchema = z.object({
    body: z.union([
        existingCruiseOrderSchema, 
        newCruiseOrderSchema
    ])
});

module.exports = {
  checkAvailabilitySchema,
  addCustomerSchema,
  addOrderSchema,
};