const express = require('express');
const router = express.Router();
const metadataController = require('../controllers/metadata.controller.js');

 
module.exports = function (io) {
  
    router.get('/', metadataController.getMetadata);

    return router;
};
