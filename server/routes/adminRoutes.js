const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

router.get('/dashboard', authenticate, requireAdmin, adminController.dashboardStats);

module.exports = router;