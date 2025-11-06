const express = require('express');
const router = express.Router();

const DetailsController = require('../controllers/sailDetailsController');


module.exports = function (io) {
    // שליפת כל המטאדאטה (כולל הכל)
    router.get('/:id', DetailsController.getSailById);

    return router;
};
