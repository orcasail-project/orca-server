const { checkAvailabilitySchema } = require('../schemas/booking.schema.js');
const { ZodError } = require('zod');
const { findAvailableSails } = require('../storage/sql');

const checkAvailability = async (req, res, next) => {
  try {
    const searchParams = checkAvailabilitySchema.parse(req.body);
    console.log("Validation passed. Searching for available sails with params:", searchParams);

    const availableSails = await findAvailableSails(searchParams);

    console.log(`Found ${availableSails.length} available sails.`);

    res.status(200).json(availableSails);

  } catch (error) {
    
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: error.errors.map(err => err.message) });
    }
      
    console.error("An unexpected error occurred in checkAvailability controller:", error);
    next(error);
  }
};

module.exports = {
  checkAvailability,
};