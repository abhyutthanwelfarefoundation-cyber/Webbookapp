const express = require('express');
const router = express.Router();
const { register, login, getMe, changePassword } = require('../controllers/authController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/register', protect, restrictTo('admin'), register);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

module.exports = router;