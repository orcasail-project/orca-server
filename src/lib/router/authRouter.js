const express = require('express');
const { register, login } = require('../controllers/authController');

const router = express.Router();

module.exports = function (io) {
    router.post('/register', register);
    router.post('/login', login);

    return router;
};