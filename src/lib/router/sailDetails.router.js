const express = require('express');
const router = express.Router();

const DetailsController = require('../controllers/sailDetailsController');


module.exports = function (io) {
    
    router.get('/:id', DetailsController.getSailById);

    return router;
};
