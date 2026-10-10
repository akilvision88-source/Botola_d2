/* =========================================================
   BOTOLA D2 — routes/index.js
   Central API router
   ========================================================= */

const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/matches', require('./matchRoutes'));
router.use('/teams', require('./teamRoutes'));
router.use('/stadiums', require('./stadiumRoutes'));
router.use('/replays', require('./replayRoutes'));
router.use('/standings', require('./standingRoutes'));
router.use('/subscriptions', require('./subscriptionRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/contact', require('./contactRoutes'));
router.use('/admin', require('./adminRoutes'));
router.use('/settings', require('./settingsRoutes'));

/* ✅ Home page routes */
router.use('/news', require('./newsRoutes'));
router.use('/home-sections', require('./homeSectionRoutes'));

/* ✅ Payments */
router.use('/payments', require('./paymentRoutes'));

/* ✅ Admin notifications */
router.use('/admin-notifications', require('./adminNotificationRoutes'));

module.exports = router;