const express = require('express');
const router = express.Router();

const DetailsController = require('../controllers/sailDetailsController');

console.log('7. [ראוטר שיוטים]: הקובץ נטען.');
module.exports = function (io) {
// const DETAILS= ":id";
// router.get(DETAILS, DetailsController.getSailById);
router.get('/:id', DetailsController.getSailById);
console.log('8. [ראוטר שיוטים]: הנתיב GET /:id הוגדר.');

return router;
};

// const express = require('express');
// const router = express.Router();
// const sailDetailsController = require('../controllers/sailDetailsController');
// const { AppError } = require('../appError');

// // Input validation middleware
// const validateSailId = (req, res, next) => {
//     const sailId = parseInt(req.params.id);
//     if (isNaN(sailId) || sailId <= 0) {
//         return next(new AppError('Invalid sail ID', 400));
//     }
//     req.sailId = sailId;
//     next();
// };

// // GET /api/sails/:id - Get sail details
// router.get('/:id', validateSailId, sailDetailsController.getSailDetails);

// module.exports = router;



