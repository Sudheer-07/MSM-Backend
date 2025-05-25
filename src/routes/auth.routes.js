const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { auth, authorize } = require('../middleware/auth.middleware');
const config = require('../config/config');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/profile', auth, authController.getProfile);
router.patch('/profile', auth, authController.updateProfile);

module.exports = router; 