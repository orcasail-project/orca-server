const express = require('express');
const { register, login, forgotPassword, changePassword, updateUser } = require('../controllers/authController');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/change-password', authenticateToken, changePassword);
router.put('/update-user', authenticateToken, updateUser);

module.exports = router;
