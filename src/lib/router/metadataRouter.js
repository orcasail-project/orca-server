// src/lib/router/router.js

const express = require('express');
const router = express.Router();

const metadataController = require('../controllers/metadata.controller');

router.get('/', metadataController.getMetadata);

module.exports = router;
