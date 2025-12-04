const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Public routes
router.post('/login', authController.login);
router.post('/register', authController.register);

// Protected routes
router.get('/me', isAuthenticated, authController.getCurrentUser);
router.post('/logout', isAuthenticated, authController.logout);

// Admin routes
// Add admin-specific routes here if needed

module.exports = router;
